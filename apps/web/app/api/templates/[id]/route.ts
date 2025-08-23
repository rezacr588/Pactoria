import { NextRequest } from 'next/server'
import { 
  apiHandler, 
  createSupabaseClient, 
  requireAuth, 
  successResponse, 
  errorResponse 
} from '@/lib/api/utils'

export const GET = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Check authentication
  const { error: authError } = await requireAuth(request)
  if (authError) return authError

  const supabase = createSupabaseClient(request)
  const { id } = params
  
  try {
    // Get template with full content
    const { data: template, error } = await supabase
      .from('templates')
      .select(`
        id,
        title,
        category,
        description,
        content_md,
        content_json,
        variables,
        rating,
        usage_count,
        reviews_count,
        is_featured,
        tier_required,
        thumbnail_url,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .eq('published', true)
      .eq('is_public', true)
      .single()
    
    if (error) {
      console.error('Error fetching template:', error)
      return errorResponse(error.message === 'Row not found' ? 'Template not found' : error.message, error.message === 'Row not found' ? 404 : 400)
    }

    // Increment usage count
    await supabase
      .rpc('increment_template_usage', { template_id: id })

    return successResponse({ template })
  } catch (error) {
    console.error('Error fetching template:', error)
    return errorResponse('Failed to fetch template', 500)
  }
})