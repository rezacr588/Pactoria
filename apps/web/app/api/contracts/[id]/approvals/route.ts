import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { 
  apiHandler, 
  createSupabaseClient, 
  requireAuth, 
  successResponse, 
  errorResponse,
  validateBody
} from '@/lib/api/utils'

// Request approval schemas
const requestApprovalSchema = z.object({
  version_id: z.string().uuid(),
  approver_email: z.string().email().optional(),
  approver_ids: z.array(z.string().uuid()).optional()
}).refine(data => data.approver_email || (data.approver_ids && data.approver_ids.length > 0), {
  message: 'Either approver_email or approver_ids must be provided'
})

export const GET = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Check authentication
  const { error: authError } = await requireAuth(request)
  if (authError) return authError

  const supabase = createSupabaseClient(request)
  const contractId = params.id

  try {
    // Get approvals for the contract with approver details
    const { data: approvals, error } = await supabase
      .from('contract_approvals')
      .select(`
        id,
        contract_id,
        version_id,
        approver_id,
        status,
        comment,
        created_at,
        decided_at
      `)
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching approvals:', error)
      return errorResponse(error.message, 500)
    }

    // Get approver details separately to avoid RLS issues
    const approverIds = [...new Set((approvals || []).map(a => a.approver_id))]
    let approvers: any[] = []
    
    if (approverIds.length > 0) {
      const { data: approverData } = await supabase.auth.admin.listUsers()
      approvers = approverData?.users?.filter(user => 
        approverIds.includes(user.id)
      ) || []
    }

    // Transform the data to include approver info
    const transformedApprovals = (approvals || []).map(approval => ({
      ...approval,
      approver: {
        id: approval.approver_id,
        email: approvers.find(u => u.id === approval.approver_id)?.email || 'unknown@example.com',
        name: approvers.find(u => u.id === approval.approver_id)?.user_metadata?.name
      }
    }))

    return successResponse({
      approvals: transformedApprovals
    })
  } catch (error: any) {
    console.error('Error fetching approvals:', error)
    return errorResponse(error.message, 500)
  }
})

export const POST = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Check authentication
  const { userId, error: authError } = await requireAuth(request)
  if (authError) return authError

  // Validate request body
  const { data: body, error: validationError } = await validateBody(
    request,
    requestApprovalSchema
  )
  if (validationError) return validationError

  const supabase = createSupabaseClient(request)
  const contractId = params.id

  try {
    // Check if contract exists and user has permission
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('id, owner_id')
      .eq('id', contractId)
      .single()
    
    if (contractError || !contract) {
      return errorResponse('Contract not found', 404)
    }

    if (contract.owner_id !== userId) {
      return errorResponse('Only the contract owner can request approvals', 403)
    }

    // Check if version exists
    const { data: version, error: versionError } = await supabase
      .from('contract_versions')
      .select('id')
      .eq('id', body!.version_id)
      .eq('contract_id', contractId)
      .single()
    
    if (versionError || !version) {
      return errorResponse('Version not found', 404)
    }

    let approverIds: string[] = []

    // Handle email-based approval request
    if (body!.approver_email) {
      const { data: userData } = await supabase.auth.admin.listUsers()
      const approver = userData?.users?.find(user => user.email === body!.approver_email)
      
      if (!approver) {
        return errorResponse('Approver not found. They must have an account first.', 404)
      }
      approverIds = [approver.id]
    }
    
    // Handle ID-based approval requests
    if (body!.approver_ids) {
      approverIds = body!.approver_ids
    }

    // Check for existing approvals to avoid duplicates
    const { data: existingApprovals } = await supabase
      .from('contract_approvals')
      .select('approver_id')
      .eq('contract_id', contractId)
      .eq('version_id', body!.version_id)
      .in('approver_id', approverIds)

    const existingApproverIds = new Set(existingApprovals?.map(a => a.approver_id) || [])
    const newApproverIds = approverIds.filter(id => !existingApproverIds.has(id))

    if (newApproverIds.length === 0) {
      return errorResponse('Approval requests already exist for all specified approvers', 409)
    }

    // Create approval requests
    const approvalRequests = newApproverIds.map(approver_id => ({
      contract_id: contractId,
      version_id: body!.version_id,
      approver_id,
      status: 'pending' as const
    }))

    const { data: approvals, error: insertError } = await supabase
      .from('contract_approvals')
      .insert(approvalRequests)
      .select('*')

    if (insertError) {
      console.error('Error creating approvals:', insertError)
      return errorResponse(insertError.message, 400)
    }

    return successResponse({ approvals })
  } catch (error: any) {
    console.error('Error creating approval:', error)
    return errorResponse(error.message, 500)
  }
})
