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

const updateNotificationSchema = z.object({
  status: z.enum(['pending', 'sent', 'failed', 'retry']).optional(),
  error_message: z.string().optional(),
  retry_count: z.number().min(0).optional()
})

export const GET = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Require authentication
  const { error: authError } = await requireAuth(request)
  if (authError) return authError

  const supabase = createSupabaseClient(request)
  const notificationId = params.id
  
  try {
    const { data: notification, error } = await supabase
      .from('email_notifications')
      .select('*')
      .eq('id', notificationId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Notification not found', 404)
      }
      return errorResponse('Failed to fetch notification', 500)
    }

    return successResponse({ notification })
  } catch (error) {
    console.error('Error fetching notification:', error)
    return errorResponse('Failed to fetch notification', 500)
  }
})

export const PATCH = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Require authentication
  const { error: authError } = await requireAuth(request)
  if (authError) return authError

  // Validate request body
  const { data: body, error: validationError } = await validateBody(
    request,
    updateNotificationSchema
  )
  if (validationError) return validationError

  const supabase = createSupabaseClient(request)
  const notificationId = params.id
  
  try {
    const updateData: any = {}

    if (body!.status !== undefined) {
      updateData.status = body!.status
    }
    if (body!.error_message !== undefined) {
      updateData.error_message = body!.error_message
    }
    if (body!.retry_count !== undefined) {
      updateData.retry_count = body!.retry_count
    }

    // Set sent_at timestamp when marking as sent
    if (body!.status === 'sent') {
      updateData.sent_at = new Date().toISOString()
    }

    const { data: notification, error } = await supabase
      .from('email_notifications')
      .update(updateData)
      .eq('id', notificationId)
      .select()
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Notification not found', 404)
      }
      return errorResponse('Failed to update notification', 500)
    }

    return successResponse({ notification })
  } catch (error) {
    console.error('Error updating notification:', error)
    return errorResponse('Failed to update notification', 500)
  }
})