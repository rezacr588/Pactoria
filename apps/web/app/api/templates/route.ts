import { NextRequest } from 'next/server'
import { 
  apiHandler, 
  requireAuth, 
  successResponse, 
  errorResponse,
  validateBody
} from '@/lib/api/utils'
import { z } from 'zod'
import { db } from '@/lib/db'
import { sanitizeApiInput } from '@/lib/security/input-sanitization'

const createTemplateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.enum(['nda', 'service', 'employment', 'sales', 'partnership', 'licensing', 'other']),
  content_md: z.string(),
  content_json: z.any().optional(),
  tags: z.array(z.string()).optional(),
  is_public: z.boolean().optional(),
  price: z.number().optional(),
  variables: z.any().optional()
})

export const GET = apiHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const featured = searchParams.get('featured') === 'true'
  const limit = parseInt(searchParams.get('limit') || '20')
  
  try {
    const whereConditions: any = {
      is_public: true
    }

    if (category && category !== 'all') {
      whereConditions.category = category
    }

    if (featured) {
      whereConditions.is_official = true
    }

    const templates = await db.templates.findMany({
      where: whereConditions,
      orderBy: {
        usage_count: 'desc'
      },
      take: limit,
      select: {
        id: true,
        title: true,
        category: true,
        description: true,
        usage_count: true,
        content_md: true,
        tags: true,
        is_public: true,
        is_official: true,
        created_by_user_id: true,
        created_at: true,
        updated_at: true
      }
    })

    return successResponse({ 
      templates,
      categories: ['all', 'nda', 'service', 'employment', 'sales', 'partnership', 'licensing', 'other']
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return errorResponse('Failed to fetch templates', 500)
  }
})

export const POST = apiHandler(async (request: NextRequest) => {
  // Check authentication for template creation
  const { error: authError, user } = await requireAuth(request)
  if (authError) return authError

  // Validate request body
  const { data: body, error: validationError } = await validateBody(
    request,
    createTemplateSchema
  )
  if (validationError) return validationError

  // Sanitize input
  const sanitized = {
    title: sanitizeApiInput({ title: body!.title }, { title: { context: 'text', maxLength: 200 } }).title,
    description: body!.description ? sanitizeApiInput({ description: body!.description }, { description: { context: 'text', maxLength: 1000 } }).description : undefined,
    content_md: sanitizeApiInput({ content_md: body!.content_md }, { content_md: { context: 'contract', maxLength: 50000 } }).content_md,
    category: sanitizeApiInput({ category: body!.category }, { category: { context: 'text', maxLength: 50 } }).category
  }
  
  try {
    const template = await db.templates.create({
      data: {
        title: sanitized.title,
        description: sanitized.description || null,
        category: sanitized.category as any,
        content_md: sanitized.content_md,
        tags: body!.tags || [],
        is_public: body!.is_public ?? false,
        is_official: false,
        usage_count: 0,
        created_by_user_id: user!.id
      }
    })

    return successResponse({ template })
  } catch (error) {
    console.error('Error creating template:', error)
    return errorResponse('Failed to create template', 500)
  }
})