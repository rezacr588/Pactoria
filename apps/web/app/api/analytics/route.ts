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

const logEventSchema = z.object({
  event_type: z.string().min(1),
  event_data: z.any().optional(),
  user_agent: z.string().optional(),
  ip_address: z.string().optional()
})

export const GET = apiHandler(async (request: NextRequest) => {
  // Require authentication
  const { error: authError, user } = await requireAuth(request)
  if (authError) return authError

  const supabase = createSupabaseClient(request)
  const { searchParams } = new URL(request.url)
  
  const event_type = searchParams.get('event_type')
  const date_from = searchParams.get('date_from')
  const date_to = searchParams.get('date_to')
  const limit = parseInt(searchParams.get('limit') || '100')
  
  try {
    let query = supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (event_type) {
      query = query.eq('event_type', event_type)
    }

    if (date_from) {
      query = query.gte('created_at', date_from)
    }

    if (date_to) {
      query = query.lte('created_at', date_to)
    }

    const { data: events, error } = await query
    
    if (error) {
      console.error('Error fetching analytics events:', error)
      return errorResponse('Failed to fetch analytics events', 500)
    }

    // Calculate event summary
    const summary = events?.reduce((acc, event) => {
      const type = event.event_type
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return successResponse({ 
      events,
      summary,
      total_events: events?.length || 0
    })
  } catch (error) {
    console.error('Error fetching analytics events:', error)
    return errorResponse('Failed to fetch analytics events', 500)
  }
})

export const POST = apiHandler(async (request: NextRequest) => {
  // Require authentication
  const { error: authError, user } = await requireAuth(request)
  if (authError) return authError

  // Validate request body
  const { data: body, error: validationError } = await validateBody(
    request,
    logEventSchema
  )
  if (validationError) return validationError

  const supabase = createSupabaseClient(request)
  
  try {
    // Extract headers for additional context
    const userAgent = request.headers.get('user-agent') || body!.user_agent
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ipAddress = body!.ip_address || forwardedFor?.split(',')[0] || realIp

    const eventData = {
      user_id: user!.id,
      event_type: body!.event_type,
      event_data: body!.event_data || null,
      user_agent: userAgent,
      ip_address: ipAddress,
      session_id: request.headers.get('x-session-id') // If you have session tracking
    }

    const { data: event, error } = await supabase
      .from('analytics_events')
      .insert(eventData)
      .select()
      .single()
    
    if (error) {
      console.error('Error logging analytics event:', error)
      return errorResponse('Failed to log event', 500)
    }

    return successResponse({ event })
  } catch (error) {
    console.error('Error logging analytics event:', error)
    return errorResponse('Failed to log event', 500)
  }
})