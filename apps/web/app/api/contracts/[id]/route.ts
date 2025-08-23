import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { 
  apiHandler, 
  createSupabaseClient, 
  requireAuth, 
  successResponse, 
  validateBody,
  checkPermission,
  Errors,
  handleAPIError
} from '@/lib/api/utils'

// Validation schemas
const updateContractSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  status: z.enum(['draft', 'in_review', 'approved', 'rejected', 'signed']).optional(),
  metadata: z.record(z.any()).optional(),
})

const createSnapshotSchema = z.object({
  content_json: z.any().optional(),
  content_md: z.string().optional(),
  ydoc_state: z.string().optional(), // Base64 encoded
})

export const GET = apiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  // Check authentication
  const { userId, error: authError } = await requireAuth(request)
  if (authError) return authError

  const supabase = createSupabaseClient(request)
  const contractId = params.id
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(contractId)) {
    return handleAPIError(Errors.BadRequest('Invalid contract ID format'))
  }
  
  // Use the optimized database function to get all related data in one call
  const { data, error } = await supabase.rpc('get_contract_details', {
    p_contract_id: contractId,
    p_user_id: userId
  })
  
  if (error) {
    if (error.message?.includes('Access denied')) {
      return handleAPIError(Errors.Forbidden('You do not have access to this contract'))
    }
    if (error.code === 'PGRST116') {
      return handleAPIError(Errors.NotFound('Contract'))
    }
    return handleAPIError(error)
  }
  
  // Parse the JSON response from the database function
  const result = typeof data === 'string' ? JSON.parse(data) : data
  
  return successResponse({
    contract: result.contract,
    versions: result.versions || [],
    approvals: result.approvals || [],
    collaborators: result.collaborators || []
  })
})

export const PATCH = apiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  // Check authentication
  const { userId, error: authError } = await requireAuth(request)
  if (authError) return authError

  // Validate request body
  const { data: body, error: validationError } = await validateBody(
    request,
    updateContractSchema
  )
  if (validationError) return validationError

  const supabase = createSupabaseClient(request)
  const contractId = params.id
  
  // Check permission to update
  const hasPermission = await checkPermission(
    supabase,
    userId!,
    `contract:${contractId}`,
    'update'
  )
  
  if (!hasPermission) {
    return handleAPIError(Errors.Forbidden('You cannot update this contract'))
  }
  
  // If status is being changed, validate the transition
  if (body.status) {
    // Get current status
    const { data: current } = await supabase
      .from('contracts')
      .select('status')
      .eq('id', contractId)
      .single()
    
    if (current) {
      const { data: isValid } = await supabase.rpc('validate_contract_status_transition', {
        p_contract_id: contractId,
        p_current_status: current.status,
        p_new_status: body.status,
        p_user_id: userId
      })
      
      if (!isValid) {
        return handleAPIError(
          Errors.BadRequest(`Invalid status transition from ${current.status} to ${body.status}`)
        )
      }
    }
  }
  
  // Prepare updates
  const updates: any = {}
  if (body.title) updates.title = body.title
  if (body.status) updates.status = body.status
  if (body.metadata) updates.metadata = body.metadata
  
  if (Object.keys(updates).length === 0) {
    return handleAPIError(Errors.BadRequest('No fields to update'))
  }
  
  // Update the contract
  const { data, error } = await supabase
    .from('contracts')
    .update(updates)
    .eq('id', contractId)
    .select('*')
    .single()
  
  if (error) {
    return handleAPIError(error)
  }
  
  return successResponse({ contract: data })
})

export const DELETE = apiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  // Check authentication
  const { userId, error: authError } = await requireAuth(request)
  if (authError) return authError

  const supabase = createSupabaseClient(request)
  const contractId = params.id
  
  // Check if user is the owner (only owners can delete)
  const { data: contract } = await supabase
    .from('contracts')
    .select('owner_id')
    .eq('id', contractId)
    .single()
  
  if (!contract) {
    return handleAPIError(Errors.NotFound('Contract'))
  }
  
  if (contract.owner_id !== userId) {
    return handleAPIError(Errors.Forbidden('Only the contract owner can delete it'))
  }
  
  // Delete the contract (cascades to related records)
  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', contractId)
  
  if (error) {
    return handleAPIError(error)
  }
  
  return successResponse({ success: true, message: 'Contract deleted successfully' })
})

// POST endpoint for creating contract snapshots
export const POST = apiHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  // Check if this is a snapshot creation request
  const url = new URL(request.url)
  if (!url.pathname.endsWith('/snapshot')) {
    return handleAPIError(Errors.NotFound('Endpoint'))
  }
  
  // Check authentication
  const { userId, error: authError } = await requireAuth(request)
  if (authError) return authError

  // Validate request body
  const { data: body, error: validationError } = await validateBody(
    request,
    createSnapshotSchema
  )
  if (validationError) return validationError

  const supabase = createSupabaseClient(request)
  const contractId = params.id
  
  // Use the atomic database function to create snapshot
  const { data, error } = await supabase.rpc('create_contract_snapshot', {
    p_contract_id: contractId,
    p_content_json: body.content_json || null,
    p_content_md: body.content_md || null,
    p_ydoc_state: body.ydoc_state ? Buffer.from(body.ydoc_state, 'base64') : null,
    p_user_id: userId
  })
  
  if (error) {
    if (error.message?.includes('Access denied')) {
      return handleAPIError(Errors.Forbidden('You do not have access to this contract'))
    }
    return handleAPIError(error)
  }
  
  return successResponse({ version: data }, 201)
})
