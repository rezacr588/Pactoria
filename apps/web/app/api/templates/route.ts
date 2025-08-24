import { NextRequest } from 'next/server'
import { 
  apiHandler, 
  createSupabaseClient, 
  requireAuth, 
  successResponse, 
  errorResponse,
  validateBody
} from '@/lib/api/utils'
import { z } from 'zod'

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
  // Templates are public - auth is optional
  const supabase = createSupabaseClient(request)
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const featured = searchParams.get('featured') === 'true'
  const limit = parseInt(searchParams.get('limit') || '20')
  
  try {
    let query = supabase
      .from('templates')
      .select(`
        id,
        title,
        category,
        description,
        rating,
        usage_count,
        reviews_count,
        is_featured,
        thumbnail_url,
        variables,
        tier_required,
        content_json,
        content_md,
        tags,
        price,
        currency,
        created_by,
        created_at
      `)
      .eq('published', true)
      .eq('is_public', true)
      .order('is_featured', { ascending: false })
      .order('usage_count', { ascending: false })
      .limit(limit)

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (featured) {
      query = query.eq('is_featured', true)
    }

    const { data: templates, error } = await query
    
    if (error) {
      console.error('Error fetching templates:', error)
      // Return empty array instead of error for missing columns
      return successResponse({ 
        templates: [],
        categories: ['all', 'nda', 'service', 'employment', 'sales', 'partnership', 'licensing', 'other']
      })
    }

    return successResponse({ 
      templates: templates || [],
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

  const supabase = createSupabaseClient(request)
  
  try {
    const templateData = {
      title: body!.title,
      description: body!.description,
      category: body!.category,
      content_md: body!.content_md,
      content_json: body!.content_json || null,
      tags: body!.tags || [],
      is_public: body!.is_public ?? false,
      price: body!.price || 0,
      variables: body!.variables || [],
      created_by: user!.id,
      published: false, // New templates start as drafts
      rating: 0,
      reviews_count: 0,
      usage_count: 0,
      is_featured: false
    }

    const { data: template, error } = await supabase
      .from('templates')
      .insert(templateData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating template:', error)
      return errorResponse('Failed to create template', 500)
    }

    return successResponse({ template })
  } catch (error) {
    console.error('Error creating template:', error)
    return errorResponse('Failed to create template', 500)
  }
})