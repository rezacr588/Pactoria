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

// Decision schema
const decisionSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  comment: z.string().optional()
})

export const POST = apiHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Check authentication
  const { userId, error: authError } = await requireAuth(request)
  if (authError) return authError

  // Validate request body
  const { data: body, error: validationError } = await validateBody(
    request,
    decisionSchema
  )
  if (validationError) return validationError

  const supabase = createSupabaseClient(request)
  const approvalId = params.id

  try {
    // Get the approval and verify user can decide
    const { data: approval, error: fetchError } = await supabase
      .from('contract_approvals')
      .select('id, approver_id, status, contract_id')
      .eq('id', approvalId)
      .single()
    
    if (fetchError || !approval) {
      return errorResponse('Approval not found', 404)
    }

    // Check if user is the approver
    if (approval.approver_id !== userId) {
      return errorResponse('You can only decide on approvals assigned to you', 403)
    }

    // Check if already decided
    if (approval.status !== 'pending') {
      return errorResponse('This approval has already been decided', 409)
    }

    // Update the approval
    const { data: updatedApproval, error: updateError } = await supabase
      .from('contract_approvals')
      .update({
        status: body!.status,
        comment: body!.comment || null,
        decided_at: new Date().toISOString()
      })
      .eq('id', approvalId)
      .select('*')
      .single()
    
    if (updateError) {
      console.error('Error updating approval:', updateError)
      return errorResponse(updateError.message, 400)
    }

    return successResponse({ approval: updatedApproval })
  } catch (error: any) {
    console.error('Error processing approval decision:', error)
    return errorResponse(error.message, 500)
  }
})