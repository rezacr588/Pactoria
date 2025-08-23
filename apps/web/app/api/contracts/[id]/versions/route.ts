import { NextRequest, NextResponse } from 'next/server'
import { 
  apiHandler, 
  createSupabaseClient, 
  requireAuth, 
  successResponse, 
  errorResponse
} from '@/lib/api/utils'

export const GET = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Check authentication
  const { error: authError } = await requireAuth(request)
  if (authError) return authError

  const supabase = createSupabaseClient(request)
  const contractId = params.id

  try {
    // Get versions for the contract
    const { data: versions, error } = await supabase
      .from('contract_versions')
      .select(`
        id,
        contract_id,
        version_number,
        content_md,
        content_json,
        ydoc_state,
        created_by,
        created_at
      `)
      .eq('contract_id', contractId)
      .order('version_number', { ascending: false })
    
    if (error) {
      console.error('Error fetching versions:', error)
      return errorResponse(error.message, 500)
    }

    // Get creator details for each version
    const creatorIds = [...new Set((versions || []).map(v => v.created_by).filter(Boolean))]
    let creators: any[] = []
    
    if (creatorIds.length > 0) {
      const { data: userData } = await supabase.auth.admin.listUsers()
      creators = userData?.users?.filter(user => 
        creatorIds.includes(user.id)
      ) || []
    }

    // Transform the data to include creator info
    const transformedVersions = (versions || []).map(version => ({
      ...version,
      creator: version.created_by ? {
        id: version.created_by,
        email: creators.find(u => u.id === version.created_by)?.email || 'unknown@example.com',
        name: creators.find(u => u.id === version.created_by)?.user_metadata?.name
      } : null
    }))

    return successResponse({
      versions: transformedVersions
    })
  } catch (error: any) {
    console.error('Error fetching versions:', error)
    return errorResponse(error.message, 500)
  }
})