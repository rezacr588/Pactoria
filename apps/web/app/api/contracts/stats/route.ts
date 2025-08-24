import { NextRequest } from 'next/server'
import { 
  apiHandler, 
  requireAuth, 
  successResponse, 
  errorResponse 
} from '@/lib/api/utils'
import { db } from '@/lib/db'

export const GET = apiHandler(async (request: NextRequest) => {
  // Check authentication
  const { userId, error: authError } = await requireAuth(request)
  if (authError) return authError

  try {
    // Get contracts for the authenticated user using Prisma
    const contracts = await db.contracts.findMany({
      where: {
        owner_id: userId!
      },
      select: {
        status: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    // Current week contracts
    const currentWeekContracts = contracts.filter(c => 
      new Date(c.created_at) >= weekAgo
    )

    // Previous week contracts
    const previousWeekContracts = contracts.filter(c => 
      new Date(c.created_at) >= twoWeeksAgo && 
      new Date(c.created_at) < weekAgo
    )

    // Status counts
    const statusCounts = contracts.reduce((acc, contract) => {
      acc[contract.status] = (acc[contract.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate stats
    const totalContracts = contracts.length
    const activeNegotiations = statusCounts['in_review'] || 0
    const pendingReview = statusCounts['draft'] || 0
    const signed = statusCounts['signed'] || 0
    const completionRate = totalContracts > 0 ? (signed / totalContracts) * 100 : 0

    // Calculate changes
    const contractsChange = previousWeekContracts.length > 0
      ? ((currentWeekContracts.length - previousWeekContracts.length) / previousWeekContracts.length) * 100
      : currentWeekContracts.length > 0 ? 100 : 0

    // Calculate real changes for negotiations and reviews
    const currentNegotiations = currentWeekContracts.filter(c => c.status === 'in_review').length
    const previousNegotiations = previousWeekContracts.filter(c => c.status === 'in_review').length
    const negotiationsChange = previousNegotiations > 0
      ? ((currentNegotiations - previousNegotiations) / previousNegotiations) * 100
      : currentNegotiations > 0 ? 100 : 0

    const currentReviews = currentWeekContracts.filter(c => c.status === 'draft').length
    const previousReviews = previousWeekContracts.filter(c => c.status === 'draft').length
    const reviewChange = previousReviews > 0
      ? ((currentReviews - previousReviews) / previousReviews) * 100
      : currentReviews > 0 ? 100 : 0

    const currentSigned = currentWeekContracts.filter(c => c.status === 'signed').length
    const previousSigned = previousWeekContracts.filter(c => c.status === 'signed').length
    const completionChange = previousSigned > 0
      ? ((currentSigned - previousSigned) / previousSigned) * 100
      : currentSigned > 0 ? 100 : 0

    return successResponse({
      totalContracts,
      activeNegotiations,
      pendingReview,
      completionRate: Math.round(completionRate),
      contractsChange: Math.round(contractsChange),
      negotiationsChange: Math.round(negotiationsChange),
      reviewChange: Math.round(reviewChange),
      completionChange: Math.round(completionChange),
    })
  } catch (error) {
    console.error('Error calculating contract stats:', error)
    return errorResponse('Failed to calculate contract statistics', 500)
  }
})