import { NextRequest, NextResponse } from 'next/server'
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
const createClauseSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  content: z.string().min(1),
  content_html: z.string().optional().nullable(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  risk_level: z.enum(['low', 'medium', 'high']).optional(),
  jurisdiction: z.string().default('General'),
  is_public: z.boolean().default(false),
})

const searchParamsSchema = z.object({
  category: z.string().optional(),
  jurisdiction: z.string().optional(),
  risk_level: z.string().optional(),
  tags: z.string().optional(),
  search: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
})

export const GET = apiHandler(async (request: NextRequest) => {
  // Check authentication
  const { userId, error: authError } = await requireAuth(request)
  if (authError) return authError

  const url = new URL(request.url)
  const searchParams = Object.fromEntries(url.searchParams)
  
  // Validate search parameters
  const validation = searchParamsSchema.safeParse(searchParams)
  if (!validation.success) {
    return errorResponse('Invalid search parameters', 400)
  }

  const {
    category,
    jurisdiction,
    risk_level,
    tags,
    search,
    limit: limitStr,
    offset: offsetStr
  } = validation.data

  const limit = limitStr ? parseInt(limitStr) : 50
  const offset = offsetStr ? parseInt(offsetStr) : 0

  try {
    // Build where clause
    const where: any = {
      OR: [
        { is_public: true },
        { created_by: userId },
      ]
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' }
    }

    if (jurisdiction) {
      where.jurisdiction = jurisdiction
    }

    if (risk_level) {
      where.risk_level = risk_level
    }

    if (tags) {
      const tagsArray = tags.split(',')
      where.tags = {
        hasSome: tagsArray
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get clauses with pagination
    const [clauses, total] = await Promise.all([
      db.clause_library.findMany({
        where,
        orderBy: [
          { is_official: 'desc' },
          { usage_count: 'desc' },
          { created_at: 'desc' }
        ],
        take: limit,
        skip: offset,
        include: {
          user_favorites: {
            where: { user_id: userId! },
            select: { id: true }
          },
          _count: {
            select: { clause_usage: true }
          }
        }
      }),
      db.clause_library.count({ where })
    ])

    // Add favorite status to each clause
    const clausesWithFavorites = clauses.map(clause => ({
      ...clause,
      is_favorite: clause.user_favorites.length > 0,
      user_favorites: undefined, // Remove the actual array
    }))

    return successResponse({
      clauses: clausesWithFavorites,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total
      }
    })

  } catch (error: any) {
    console.error('Error fetching clauses:', error)
    return errorResponse('Failed to fetch clauses', 500)
  }
})

export const POST = apiHandler(async (request: NextRequest) => {
  // Check authentication
  const { userId, error: authError } = await requireAuth(request)
  if (authError) return authError

  // Validate request body
  const { data: body, error: validationError } = await validateBody(
    request,
    createClauseSchema
  )
  if (validationError) return validationError

  try {
    // Create new clause
    const clauseData = {
      title: body!.title,
      category: body!.category,
      content: body!.content,
      content_html: body!.content_html ?? null,
      description: body!.description ?? null,
      tags: body!.tags || [],
      risk_level: body!.risk_level ?? null,
      jurisdiction: body!.jurisdiction ?? 'General',
      is_public: body!.is_public ?? false,
      created_by: userId!,
    }
    const clause = await db.clause_library.create({
      data: clauseData
    })

    return successResponse({ clause }, 201)

  } catch (error: any) {
    console.error('Error creating clause:', error)
    return errorResponse('Failed to create clause', 500)
  }
})