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

const createNotificationSchema = z.object({
  recipient_email: z.string().email(),
  subject: z.string().min(1).max(200),
  body: z.string(),
  template_id: z.string().optional(),
  template_data: z.any().optional()
})

export const GET = apiHandler(async (request: NextRequest) => {
  // Require authentication
  const { error: authError } = await requireAuth(request)
  if (authError) return authError

  const supabase = createSupabaseClient(request)
  const { searchParams } = new URL(request.url)
  
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status')
  
  try {
    let query = supabase
      .from('email_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: notifications, error } = await query
    
    if (error) {
      console.error('Error fetching notifications:', error)
      return errorResponse('Failed to fetch notifications', 500)
    }

    return successResponse({ notifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return errorResponse('Failed to fetch notifications', 500)
  }
})

export const POST = apiHandler(async (request: NextRequest) => {
  // Require authentication
  const { error: authError } = await requireAuth(request)
  if (authError) return authError

  // Validate request body
  const { data: body, error: validationError } = await validateBody(
    request,
    createNotificationSchema
  )
  if (validationError) return validationError

  const supabase = createSupabaseClient(request)
  
  try {
    const notificationData = {
      recipient_email: body!.recipient_email,
      subject: body!.subject,
      body: body!.body,
      template_id: body!.template_id || null,
      template_data: body!.template_data || null,
      status: 'pending'
    }

    const { data: notification, error } = await supabase
      .from('email_notifications')
      .insert(notificationData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating notification:', error)
      return errorResponse('Failed to create notification', 500)
    }

    // TODO: Trigger actual email sending here
    // For now, just mark as sent immediately
    await supabase
      .from('email_notifications')
      .update({ 
        status: 'sent', 
        sent_at: new Date().toISOString() 
      })
      .eq('id', notification.id)

    return successResponse({ notification })
  } catch (error) {
    console.error('Error creating notification:', error)
    return errorResponse('Failed to create notification', 500)
  }
})