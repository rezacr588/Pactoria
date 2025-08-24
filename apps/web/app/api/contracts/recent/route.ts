import { NextRequest } from 'next/server'
import { 
  apiHandler, 
  requireAuth, 
  successResponse, 
  errorResponse 
} from '@/lib/api/utils'
import { db } from '@/lib/db'

function calculateProgress(status: string): number {
  const progressMap: Record<string, number> = {
    'draft': 25,
    'in_review': 45,
    'approved': 75,
    'rejected': 25,
    'signed': 100,
  }
  return progressMap[status] || 0
}

export const GET = apiHandler(async (request: NextRequest) => {
  // Check authentication
  const { user, error: authError } = await requireAuth(request)
  if (authError) return authError
  
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '5')
  
  try {
    // Get recent contracts with related data using Prisma
    const contracts = await db.contracts.findMany({
      where: {
        owner_id: user.id
      },
      include: {
        contract_parties: {
          select: {
            party_name: true,
            party_email: true
          }
        },
        contract_metadata: {
          select: {
            key: true,
            value: true
          }
        }
      },
      orderBy: {
        updated_at: 'desc'
      },
      take: limit
    })

    // Transform contracts to include computed fields
    const contractsWithDetails = contracts.map((contract: any) => {
      // Extract metadata values
      const metadataMap = contract.contract_metadata?.reduce((acc: any, meta: any) => {
        acc[meta.key] = meta.value
        return acc
      }, {}) || {}

      return {
        ...contract,
        progress: calculateProgress(contract.status),
        parties: contract.contract_parties?.map((p: any) => p.party_name) || [],
        value: metadataMap.value || null,
        priority: metadataMap.priority || 'medium',
      }
    })

    return successResponse({ contracts: contractsWithDetails })
  } catch (error) {
    console.error('Error fetching recent contracts:', error)
    return errorResponse('Failed to fetch recent contracts', 500)
  }
})