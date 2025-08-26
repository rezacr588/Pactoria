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

const createCommentSchema = z.object({
  version_id: z.string().uuid().optional(),
  thread_id: z.string().optional(),
  parent_comment_id: z.string().uuid().optional(),
  content: z.string().min(1),
  comment_type: z.enum(['general', 'suggestion', 'question', 'approval']).default('general'),
  is_internal: z.boolean().default(false),
  selection_start: z.number().optional(),
  selection_end: z.number().optional(),
  selection_text: z.string().optional(),
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
  const threadId = url.searchParams.get('thread_id')
  const includeResolved = url.searchParams.get('include_resolved') === 'true'

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

    if (threadId) {
      where.thread_id = threadId
    }

    if (!includeResolved) {
      where.is_resolved = false
    }

    // Get comments with nested replies
    const comments = await db.contract_comments.findMany({
      where,
      orderBy: { created_at: 'asc' },
      include: {
        replies: {
          orderBy: { created_at: 'asc' },
          include: {
            replies: true // Include nested replies
          }
        }
      }
    })

    // Filter out parent comments that are replies themselves
    const rootComments = comments.filter(comment => !comment.parent_comment_id)

    return successResponse({ comments: rootComments })

  } catch (error: any) {
    console.error('Error fetching contract comments:', error)
    return errorResponse('Failed to fetch contract comments', 500)
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
    createCommentSchema
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

    // Generate thread_id if not provided and this is not a reply
    const threadId = body!.thread_id || (!body!.parent_comment_id ? `thread-${Date.now()}` : undefined)

    // Create comment
    const commentData = {
      contract_id: params.id,
      author_id: userId!,
      thread_id: threadId ?? null,
      content: body!.content,
      version_id: body!.version_id ?? null,
      parent_comment_id: body!.parent_comment_id ?? null,
      comment_type: body!.comment_type ?? 'general',
      selection_start: body!.selection_start ?? null,
      selection_end: body!.selection_end ?? null,
      selection_text: body!.selection_text ?? null,
    }
    
    const comment = await db.contract_comments.create({
      data: commentData,
      include: {
        replies: true
      }
    })

    return successResponse({ comment }, 201)

  } catch (error: any) {
    console.error('Error creating contract comment:', error)
    return errorResponse('Failed to create contract comment', 500)
  }
})