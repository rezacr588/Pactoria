import { NextRequest } from 'next/server'
import { 
  apiHandler, 
  createSupabaseClient, 
  requireAuth, 
  successResponse, 
  errorResponse 
} from '@/lib/api/utils'

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
  const { error: authError } = await requireAuth(request)
  if (authError) return authError

  const supabase = createSupabaseClient(request)
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '5')
  
  try {
    // Get recent contracts with related data
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select(`
        *,
        contract_parties (
          party_name,
          party_email
        ),
        contract_metadata (
          key,
          value
        )
      `)
      .order('updated_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Error fetching recent contracts:', error)
      return errorResponse(error.message, 400)
    }

    // Transform contracts to include computed fields
    const contractsWithDetails = (contracts || []).map((contract: any) => {
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