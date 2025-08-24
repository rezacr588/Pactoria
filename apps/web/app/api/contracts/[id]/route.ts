import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  apiHandler, 
  requireAuth, 
  successResponse, 
  errorResponse,
  validateBody
} from '@/lib/api/utils'
import { updateContractSchema } from '@/lib/validations/schemas'
import { db } from '@/lib/db'
import { sanitizeApiInput } from '@/lib/security/input-sanitization'

// Contract ID validation schema
const contractIdSchema = z.string().uuid()

export const GET = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Check authentication
  const { userId, error: authError } = await requireAuth(request)
  if (authError) return authError
  
  // Validate contract ID
  const validation = contractIdSchema.safeParse(params.id)
  if (!validation.success) {
    return errorResponse('Invalid contract ID format', 400)
  }

  try {
    // Get contract with versions and approvals using Prisma
    const contract = await db.contracts.findFirst({
      where: {
        id: params.id,
        owner_id: userId!
      },
      include: {
        contract_versions: {
          orderBy: {
            version_number: 'desc'
          }
        },
        contract_approvals: {
          orderBy: {
            created_at: 'desc'
          }
        }
      }
    })
    
    if (!contract) {
      return errorResponse('Contract not found', 404)
    }

    return successResponse({
      contract,
      versions: contract.contract_versions || [],
      approvals: contract.contract_approvals || []
    })
  } catch (error: any) {
    console.error('Error fetching contract:', error)
    return errorResponse('Failed to fetch contract', 500)
  }
})

export const PATCH = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Check authentication
  const { userId, error: authError } = await requireAuth(request)
  if (authError) return authError

  // Validate request body
  const { data: body, error: validationError } = await validateBody(
    request,
    updateContractSchema
  )
  if (validationError) return validationError

  // Validate contract ID
  const validation = contractIdSchema.safeParse(params.id)
  if (!validation.success) {
    return errorResponse('Invalid contract ID format', 400)
  }

  // Sanitize input
  const sanitized: any = {}
  if (body!.title) sanitized.title = sanitizeApiInput({ title: body!.title }, { title: { context: 'text', maxLength: 200 } }).title
  if (body!.status) sanitized.status = sanitizeApiInput({ status: body!.status }, { status: { context: 'text', maxLength: 50 } }).status

  try {
    // Check if contract exists and user has permission to update
    const existingContract = await db.contracts.findFirst({
      where: {
        id: params.id,
        owner_id: userId!
      },
      select: {
        id: true,
        owner_id: true
      }
    })
    
    if (!existingContract) {
      return errorResponse('Contract not found', 404)
    }

    // Build update object
    const updates: any = {
      updated_at: new Date()
    }

    if (sanitized.title) {
      updates.title = sanitized.title
    }

    if (sanitized.status) {
      // Validate status
      const validStatuses = ['draft', 'in_review', 'approved', 'rejected', 'signed']
      if (!validStatuses.includes(sanitized.status)) {
        return errorResponse('Invalid status value', 400)
      }
      updates.status = sanitized.status
    }

    if (body!.metadata !== undefined) {
      updates.metadata = body!.metadata
    }

    // Check if there are any fields to update
    if (Object.keys(updates).length === 1) { // Only updated_at
      return errorResponse('No fields to update', 400)
    }

    // Update contract using Prisma
    const updatedContract = await db.contracts.update({
      where: {
        id: params.id
      },
      data: updates
    })

    return successResponse({ contract: updatedContract })
  } catch (error: any) {
    console.error('Error updating contract:', error)
    return errorResponse('Failed to update contract', 500)
  }
})

export const DELETE = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Check authentication
  const { userId, error: authError } = await requireAuth(request)
  if (authError) return authError
  
  try {
    // Check if contract exists and user has permission to delete
    const contract = await db.contracts.findFirst({
      where: {
        id: params.id,
        owner_id: userId!
      },
      select: {
        id: true
      }
    })
    
    if (!contract) {
      return errorResponse('Contract not found', 404)
    }

    // Delete contract using Prisma (cascade will handle related records)
    await db.contracts.delete({
      where: {
        id: params.id
      }
    })

    return successResponse({ success: true })
  } catch (error: any) {
    console.error('Error deleting contract:', error)
    return errorResponse('Failed to delete contract', 500)
  }
})

// Handle unsupported methods
export const POST = () => {
  return errorResponse('Method not allowed', 405)
}