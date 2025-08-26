import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  apiHandler, 
  requireAuth, 
  successResponse, 
  errorResponse
} from '@/lib/api/utils'
import { db } from '@/lib/db'

const clauseIdSchema = z.string().uuid()

export const POST = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Check authentication
  const { userId, error: authError } = await requireAuth(request)
  if (authError) return authError

  // Validate clause ID
  const validation = clauseIdSchema.safeParse(params.id)
  if (!validation.success) {
    return errorResponse('Invalid clause ID format', 400)
  }

  try {
    // Check if clause exists
    const clause = await db.clause_library.findUnique({
      where: { id: params.id },
      select: { id: true }
    })

    if (!clause) {
      return errorResponse('Clause not found', 404)
    }

    // Add to favorites (upsert to handle duplicates)
    const favorite = await db.user_clause_favorites.upsert({
      where: {
        user_id_clause_id: {
          user_id: userId!,
          clause_id: params.id
        }
      },
      update: {},
      create: {
        user_id: userId!,
        clause_id: params.id
      }
    })

    return successResponse({ favorite })

  } catch (error: any) {
    console.error('Error adding clause to favorites:', error)
    return errorResponse('Failed to add clause to favorites', 500)
  }
})

export const DELETE = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Check authentication
  const { userId, error: authError } = await requireAuth(request)
  if (authError) return authError

  // Validate clause ID
  const validation = clauseIdSchema.safeParse(params.id)
  if (!validation.success) {
    return errorResponse('Invalid clause ID format', 400)
  }

  try {
    // Remove from favorites
    await db.user_clause_favorites.deleteMany({
      where: {
        user_id: userId!,
        clause_id: params.id
      }
    })

    return successResponse({ success: true })

  } catch (error: any) {
    console.error('Error removing clause from favorites:', error)
    return errorResponse('Failed to remove clause from favorites', 500)
  }
})