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
    
    // Validate input
    if (!body.content_json && !body.content_md && !body.ydoc_state_base64) {
      return NextResponse.json(
        { error: 'At least one content type is required' },
        { status: 400 }
      )
    }
    
    // Call the RPC function to create snapshot
    const { data, error } = await supabase.rpc('take_snapshot', {
      p_contract_id: contractId,
      p_content_json: body.content_json || null,
      p_content_md: body.content_md || null,
      p_ydoc_state_base64: body.ydoc_state_base64 || null
    })
    
    if (error) {
      console.error('Error creating snapshot:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ version: data })
    
  } catch (error) {
    console.error('Snapshot API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
