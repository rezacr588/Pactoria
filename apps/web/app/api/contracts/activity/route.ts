import { NextRequest } from 'next/server'
import { 
  apiHandler, 
  createSupabaseClient, 
  requireAuth, 
  successResponse, 
  errorResponse 
} from '@/lib/api/utils'

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  
  return date.toLocaleDateString()
}

export const GET = apiHandler(async (request: NextRequest) => {
  // Check authentication
  const { error: authError } = await requireAuth(request)
  if (authError) return authError

  const supabase = createSupabaseClient(request)
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '10')
  
  try {
    // Get recent activity with related data
    const { data: activities, error } = await supabase
      .from('contract_activity')
      .select(`
        *,
        contracts (
          title
        ),
        profiles (
          email,
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Error fetching contract activity:', error)
      return errorResponse(error.message, 400)
    }

    // Transform activities for frontend
    const transformedActivities = (activities || []).map((activity: any) => ({
      id: activity.id,
      user: activity.profiles?.full_name || activity.profiles?.email?.split('@')[0] || 'Unknown User',
      userEmail: activity.profiles?.email || '',
      action: activity.action,
      contractTitle: activity.contracts?.title || 'Untitled Contract',
      contractId: activity.contract_id,
      timestamp: formatTimestamp(activity.created_at),
      avatar: activity.profiles?.avatar_url || null,
    }))

    return successResponse({ activities: transformedActivities })
  } catch (error) {
    console.error('Error fetching contract activity:', error)
    return errorResponse('Failed to fetch contract activity', 500)
  }
})