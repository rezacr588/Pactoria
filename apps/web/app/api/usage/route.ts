import { NextRequest } from 'next/server'
import { z } from 'zod'
import { 
  apiHandler, 
  createSupabaseClient, 
  requireAuth, 
  successResponse, 
  errorResponse,
  validateBody
} from '@/lib/api/utils'

const trackUsageSchema = z.object({
  resource_type: z.string().min(1),
  resource_id: z.string().optional(),
  count: z.number().min(1).optional().default(1)
})

export const GET = apiHandler(async (request: NextRequest) => {
  // Require authentication
  const { error: authError, user } = await requireAuth(request)
  if (authError) return authError

  const supabase = createSupabaseClient(request)
  const { searchParams } = new URL(request.url)
  
  const resource_type = searchParams.get('resource_type')
  const date_from = searchParams.get('date_from')
  const date_to = searchParams.get('date_to')
  const limit = parseInt(searchParams.get('limit') || '50')
  
  try {
    let query = supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: false })
      .limit(limit)

    if (resource_type) {
      query = query.eq('resource_type', resource_type)
    }

    if (date_from) {
      query = query.gte('date', date_from)
    }

    if (date_to) {
      query = query.lte('date', date_to)
    }

    const { data: usage, error } = await query
    
    if (error) {
      console.error('Error fetching usage:', error)
      return errorResponse('Failed to fetch usage data', 500)
    }

    // Calculate usage summary
    const summary = usage?.reduce((acc, record) => {
      const type = record.resource_type
      acc[type] = (acc[type] || 0) + record.count
      return acc
    }, {} as Record<string, number>) || {}

    return successResponse({ 
      usage,
      summary,
      total_records: usage?.length || 0
    })
  } catch (error) {
    console.error('Error fetching usage:', error)
    return errorResponse('Failed to fetch usage data', 500)
  }
})

export const POST = apiHandler(async (request: NextRequest) => {
  // Require authentication
  const { error: authError, user } = await requireAuth(request)
  if (authError) return authError

  // Validate request body
  const { data: body, error: validationError } = await validateBody(
    request,
    trackUsageSchema
  )
  if (validationError) return validationError

  const supabase = createSupabaseClient(request)
  
  try {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    
    // Try to increment existing usage record for today
    const { data: existingUsage, error: fetchError } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', user!.id)
      .eq('resource_type', body!.resource_type)
      .eq('resource_id', body!.resource_id || '')
      .eq('date', today)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing usage:', fetchError)
      return errorResponse('Failed to track usage', 500)
    }

    let usageRecord
    
    if (existingUsage) {
      // Update existing record
      const { data, error } = await supabase
        .from('usage_tracking')
        .update({ 
          count: existingUsage.count + (body!.count || 1)
        })
        .eq('id', existingUsage.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating usage:', error)
        return errorResponse('Failed to track usage', 500)
      }
      usageRecord = data
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('usage_tracking')
        .insert({
          user_id: user!.id,
          resource_type: body!.resource_type,
          resource_id: body!.resource_id || null,
          count: body!.count || 1,
          date: today
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating usage record:', error)
        return errorResponse('Failed to track usage', 500)
      }
      usageRecord = data
    }

    return successResponse({ usage: usageRecord })
  } catch (error) {
    console.error('Error tracking usage:', error)
    return errorResponse('Failed to track usage', 500)
  }
})