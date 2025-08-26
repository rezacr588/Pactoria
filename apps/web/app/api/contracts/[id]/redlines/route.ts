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

// Validation schemas
const contractIdSchema = z.string().uuid()

const createRedlineSchema = z.object({
  version_id: z.string().uuid(),
  redline_type: z.enum(['addition', 'deletion', 'modification']),
  content_before: z.string().optional(),
  content_after: z.string().optional(),
  selection_start: z.number(),
  selection_end: z.number(),
  comment: z.string().optional(),
})


export const GET = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Check authentication
  const { userId, error: authError } = await requireAuth(request)
  if (authError) return authError

  // Validate contract ID
  const validation = contractIdSchema.safeParse(params.id)
  if (!validation.success) {
    return errorResponse('Invalid contract ID format', 400)
  }

  const url = new URL(request.url)
  const versionId = url.searchParams.get('version_id')
  const status = url.searchParams.get('status')

  try {
    // Check if user has access to contract
    const contract = await db.contracts.findFirst({
      where: {
        id: params.id,
        OR: [
          { owner_id: userId! },
          {
            contract_collaborators: {
              some: { user_id: userId! }
            }
          }
        ]
      },
      select: { id: true }
    })

    if (!contract) {
      return errorResponse('Contract not found', 404)
    }

    // Build where clause
    const where: any = {
      contract_id: params.id
    }

    if (versionId) {
      where.version_id = versionId
    }

    if (status) {
      where.status = status
    }

    // Get redlines
    const redlines = await db.contract_redlines.findMany({
      where,
      orderBy: { created_at: 'desc' }
    })

    return successResponse({ redlines })

  } catch (error: any) {
    console.error('Error fetching contract redlines:', error)
    return errorResponse('Failed to fetch contract redlines', 500)
  }
})

export const POST = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Check authentication
  const { userId, error: authError } = await requireAuth(request)
  if (authError) return authError

  // Validate contract ID
  const contractValidation = contractIdSchema.safeParse(params.id)
  if (!contractValidation.success) {
    return errorResponse('Invalid contract ID format', 400)
  }

  // Validate request body
  const { data: body, error: validationError } = await validateBody(
    request,
    createRedlineSchema
  )
  if (validationError) return validationError

  try {
    // Check if user has access to contract
    const contract = await db.contracts.findFirst({
      where: {
        id: params.id,
        OR: [
          { owner_id: userId! },
          {
            contract_collaborators: {
              some: { user_id: userId! }
            }
          }
        ]
      },
      select: { id: true }
    })

    if (!contract) {
      return errorResponse('Contract not found', 404)
    }

    // Verify version exists
    const version = await db.contract_versions.findFirst({
      where: {
        id: body!.version_id,
        contract_id: params.id
      },
      select: { id: true }
    })

    if (!version) {
      return errorResponse('Version not found', 404)
    }

    // Create redline
    const redlineData = {
      contract_id: params.id,
      author_id: userId!,
      version_id: body!.version_id,
      redline_type: body!.redline_type,
      content_before: body!.content_before ?? null,
      content_after: body!.content_after ?? null,
      selection_start: body!.selection_start,
      selection_end: body!.selection_end,
      comment: body!.comment ?? null,
    }
    
    const redline = await db.contract_redlines.create({
      data: redlineData
    })

    return successResponse({ redline }, 201)

  } catch (error: any) {
    console.error('Error creating contract redline:', error)
    return errorResponse('Failed to create contract redline', 500)
  }
})