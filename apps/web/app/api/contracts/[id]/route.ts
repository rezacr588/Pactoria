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
import { updateContractSchema } from '@/lib/validations/schemas'

// Contract ID validation schema
const contractIdSchema = z.string().uuid()

export const GET = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Check authentication
  const { error: authError } = await requireAuth(request)
  if (authError) return authError

  const supabase = createSupabaseClient(request)
  
  // Validate contract ID
  const validation = contractIdSchema.safeParse(params.id)
  if (!validation.success) {
    return errorResponse('Invalid contract ID format', 400)
  }

  try {
    // Get contract with versions and approvals
    const { data: contract, error } = await supabase
      .from('contracts')
      .select(`
        *,
        contract_versions (
          id,
          version_number,
          content_md,
          content_json,
          created_by,
          created_at
        ),
        contract_approvals (
          id,
          version_id,
          approver_id,
          status,
          comment,
          created_at,
          decided_at
        )
      `)
      .eq('id', params.id)
      .single()
    
    if (error) {
      if (error.message.includes('Row not found')) {
        return errorResponse('Contract not found', 404)
      }
      return errorResponse(error.message, 500)
    }

    return successResponse({
      contract,
      versions: contract.contract_versions || [],
      approvals: contract.contract_approvals || []
    })
  } catch (error: any) {
    console.error('Error fetching contract:', error)
    return errorResponse(error.message, 500)
  }
})

export const PATCH = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
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
  
  // Validate contract ID
  const validation = contractIdSchema.safeParse(params.id)
  if (!validation.success) {
    return errorResponse('Invalid contract ID format', 400)
  }

  try {
    // Check if contract exists and user has permission to update
    const { data: existingContract, error: fetchError } = await supabase
      .from('contracts')
      .select('id, owner_id')
      .eq('id', params.id)
      .single()
    
    if (fetchError || !existingContract) {
      return errorResponse('Contract not found', 404)
    }

    if (existingContract.owner_id !== userId) {
      return errorResponse('You cannot update this contract', 403)
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString()
    }

    if (body!.title !== undefined) {
      updates.title = body!.title
    }

    if (body!.status !== undefined) {
      // Validate status
      const validStatuses = ['draft', 'in_review', 'approved', 'rejected', 'signed']
      if (!validStatuses.includes(body!.status)) {
        return errorResponse('Invalid status value', 400)
      }
      updates.status = body!.status
    }

    if (body!.metadata !== undefined) {
      updates.metadata = body!.metadata
    }

    // Check if there are any fields to update
    if (Object.keys(updates).length === 1) { // Only updated_at
      return errorResponse('No fields to update', 400)
    }

    // Update contract
    const { data: updatedContract, error: updateError } = await supabase
      .from('contracts')
      .update(updates)
      .eq('id', params.id)
      .select('*')
      .single()
    
    if (updateError) {
      console.error('Error updating contract:', updateError)
      return errorResponse(updateError.message, 400)
    }

    return successResponse({ contract: updatedContract })
  } catch (error: any) {
    console.error('Error updating contract:', error)
    return errorResponse(error.message, 500)
  }
})

export const DELETE = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Check authentication
  const { userId, error: authError } = await requireAuth(request)
  if (authError) return authError

  const supabase = createSupabaseClient(request)
  
  try {
    // Check if contract exists and user has permission to delete
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('id, owner_id')
      .eq('id', params.id)
      .single()
    
    if (fetchError || !contract) {
      return errorResponse('Contract not found', 404)
    }

    if (contract.owner_id !== userId) {
      return errorResponse('Only the contract owner can delete it', 403)
    }

    // Delete contract (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('contracts')
      .delete()
      .eq('id', params.id)
    
    if (deleteError) {
      console.error('Error deleting contract:', deleteError)
      return errorResponse(deleteError.message, 400)
    }

    return successResponse({ success: true })
  } catch (error: any) {
    console.error('Error deleting contract:', error)
    return errorResponse(error.message, 500)
  }
})

// Handle unsupported methods
export const POST = () => {
  return errorResponse('Method not allowed', 405)
}