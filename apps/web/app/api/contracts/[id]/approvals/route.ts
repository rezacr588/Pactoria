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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createRLSClient(authHeader)
    const contractId = params.id
    
    const { data, error } = await supabase
      .from('contract_approvals')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching approvals:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ approvals: data || [] })
    
  } catch (error) {
    console.error('Approvals API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createRLSClient(authHeader)
    const contractId = params.id
    const body = await request.json()
    
    if (!body.version_id || !body.approver_ids || !Array.isArray(body.approver_ids)) {
      return NextResponse.json(
        { error: 'version_id and approver_ids array are required' },
        { status: 400 }
      )
    }
    
    // Create approval requests for each approver
    const approvalRequests = body.approver_ids.map((approver_id: string) => ({
      contract_id: contractId,
      version_id: body.version_id,
      approver_id: approver_id,
      status: 'pending'
    }))
    
    const { data, error } = await supabase
      .from('contract_approvals')
      .insert(approvalRequests)
      .select('*')
    
    if (error) {
      console.error('Error creating approvals:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ approvals: data })
    
  } catch (error) {
    console.error('Create approvals API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
