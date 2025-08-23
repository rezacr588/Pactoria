import { NextRequest } from 'next/server'
import { 
  apiHandler, 
  createSupabaseClient, 
  requireAuth, 
  successResponse, 
  errorResponse 
} from '@/lib/api/utils'

export const GET = apiHandler(async (request: NextRequest) => {
  // Check authentication - templates are public but we need auth for personalization
  const { error: authError } = await requireAuth(request)
  if (authError) return authError

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
        tier_required
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
      return errorResponse(error.message, 400)
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