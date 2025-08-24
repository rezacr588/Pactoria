import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  apiHandler, 
  requireAuth, 
  successResponse, 
  errorResponse,
  validateBody
} from '@/lib/api/utils'
import { db } from '@/lib/db'

// Snapshot schema
const snapshotSchema = z.object({
  content_json: z.any().optional(),
  content_md: z.string().optional(),
  ydoc_state: z.string().optional() // Base64 encoded
}).refine(data => data.content_json || data.content_md || data.ydoc_state, {
  message: 'At least one content type is required'
})

export const POST = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Check authentication
  const { userId, error: authError } = await requireAuth(request)
  if (authError) return authError

  // Validate request body
  const { data: body, error: validationError } = await validateBody(
    request,
    snapshotSchema
  )
  if (validationError) return validationError

  const contractId = params.id

  try {
    // Use Prisma transaction to create snapshot atomically
    const result = await db.$transaction(async (tx) => {
      // First verify the user owns this contract
      const contract = await tx.contracts.findFirst({
        where: {
          id: contractId,
          owner_id: userId!
        },
        select: {
          id: true,
          latest_version_number: true
        }
      })

      if (!contract) {
        throw new Error('Contract not found')
      }

      // Get the next version number
      const nextVersionNumber = (contract.latest_version_number || 0) + 1

      // Create the new version
      const version = await tx.contract_versions.create({
        data: {
          contract_id: contractId,
          version_number: nextVersionNumber,
          content_json: body!.content_json || null,
          content_md: body!.content_md || null,
          ydoc_state: body!.ydoc_state ? Buffer.from(body!.ydoc_state, 'base64') : null,
          created_by: userId!
        }
      })

      // Update the contract's latest version number
      await tx.contracts.update({
        where: { id: contractId },
        data: { latest_version_number: nextVersionNumber }
      })

      return version
    })
    
    return successResponse({ version: result })
    
  } catch (error: any) {
    console.error('Snapshot API error:', error)
    return errorResponse(error.message || 'Failed to create snapshot', 500)
  }
})
