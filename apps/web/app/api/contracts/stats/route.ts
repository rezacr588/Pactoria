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
    // Validate that we have a userId
    if (!userId) {
      return errorResponse('User ID is required', 400)
    }

    // Get contracts for the authenticated user using Prisma
    console.log('Fetching contracts for user:', userId)
    
    let contracts: Array<{ status: string; created_at: Date }> = []
    
    try {
      contracts = await db.contracts.findMany({
        where: {
          owner_id: userId
        },
        select: {
          status: true,
          created_at: true
        },
        orderBy: {
          created_at: 'desc'
        }
      })
      console.log('Found contracts:', contracts.length)
    } catch (dbError) {
      console.error('Database query failed:', dbError)
      
      // Return default stats if database fails
      return successResponse({
        totalContracts: 0,
        activeNegotiations: 0,
        pendingReview: 0,
        completionRate: 0,
        contractsChange: 0,
        negotiationsChange: 0,
        reviewChange: 0,
        completionChange: 0,
      })
    }

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

    // Calculate changes with safe math operations
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

    // Ensure all values are finite numbers
    const safeRound = (value: number) => {
      return isFinite(value) ? Math.round(value) : 0
    }

    const response = {
      totalContracts,
      activeNegotiations,
      pendingReview,
      completionRate: safeRound(completionRate),
      contractsChange: safeRound(contractsChange),
      negotiationsChange: safeRound(negotiationsChange),
      reviewChange: safeRound(reviewChange),
      completionChange: safeRound(completionChange),
    }

    console.log('Returning stats:', response)
    return successResponse(response)
  } catch (error) {
    console.error('Error calculating contract stats:', error)
    
    // Provide more specific error information
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      
      // Handle specific Prisma errors
      if (error.message.includes('connect') || error.message.includes('connection')) {
        return errorResponse('Database connection failed', 503)
      }
      
      if (error.message.includes('timeout')) {
        return errorResponse('Database query timeout', 504)
      }
    }
    
    return errorResponse('Failed to calculate contract statistics', 500)
  }
})