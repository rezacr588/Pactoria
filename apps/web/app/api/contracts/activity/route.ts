import { NextRequest } from 'next/server'
import { 
  apiHandler, 
  requireAuth, 
  successResponse, 
  errorResponse 
} from '@/lib/api/utils'
import { db } from '@/lib/db'

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
  const { user, error: authError } = await requireAuth(request)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '10')
  
  try {
    // Get recent activity with related data using Prisma
    const activities = await db.contract_activity.findMany({
      where: {
        contracts: {
          owner_id: user.id
        }
      },
      include: {
        contracts: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: limit
    })

    // Get user profiles for the activities
    const userIds = activities.map(a => a.user_id).filter(Boolean) as string[]
    const profiles = userIds.length > 0 ? await db.profiles.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        avatar_url: true
      }
    }) : []

    // Create a lookup map for profiles
    const profilesMap = new Map(profiles.map(p => [p.id, p]))

    // Transform activities for frontend
    const transformedActivities = activities.map((activity: any) => {
      const profile = activity.user_id ? profilesMap.get(activity.user_id) : null
      return {
        id: activity.id,
        user: profile?.full_name || profile?.email?.split('@')[0] || 'Unknown User',
        userEmail: profile?.email || '',
        action: activity.action,
        contractTitle: activity.contracts?.title || 'Untitled Contract',
        contractId: activity.contract_id,
        timestamp: formatTimestamp(activity.created_at),
        avatar: profile?.avatar_url || null,
      }
    })

    return successResponse({ activities: transformedActivities })
  } catch (error) {
    console.error('Error fetching contract activity:', error)
    return errorResponse('Failed to fetch contract activity', 500)
  }
})