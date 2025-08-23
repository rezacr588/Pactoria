import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create Supabase client with RLS
function createRLSClient(authHeader?: string) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {}
      }
    }
  )
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createRLSClient(authHeader)
    const approvalId = params.id
    const body = await request.json()
    
    // Validate status
    if (!body.status || !['approved', 'rejected'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Status must be either "approved" or "rejected"' },
        { status: 400 }
      )
    }
    
    // Get current user to verify they are the approver
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Update approval decision
    const { data, error } = await supabase
      .from('contract_approvals')
      .update({
        status: body.status,
        comment: body.comment || null,
        decided_at: new Date().toISOString()
      })
      .eq('id', approvalId)
      .eq('approver_id', user.id) // Ensure user is the approver
      .select('*')
      .single()
    
    if (error) {
      console.error('Error updating approval:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'Approval not found or you are not the approver' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ approval: data })
    
  } catch (error) {
    console.error('Approval decision API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
