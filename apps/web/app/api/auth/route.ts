import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Ensure this route is not statically pre-rendered
export const dynamic = 'force-dynamic';

// SECURITY: Never use service role key in API routes accessible from client
// Use anon key with proper Authorization headers for RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

// Create client with anon key for safe RLS operations
const supabaseClient = supabaseUrl && supabaseAnonKey ? createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) : null;

// Initialize Supabase client for RLS operations
function createRLSClient(authHeader?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(
    url,
    key,
    {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {}
      }
    }
  )
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseClient) {
      return NextResponse.json(
        { error: 'Supabase client not initialized' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'signIn': {
        const { email, password } = body
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        })
        
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 401 })
        }
        
        return NextResponse.json({ 
          user: data.user,
          session: data.session 
        })
      }

      case 'signUp': {
        const { email, password } = body
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password
        })
        
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        
        return NextResponse.json({ 
          user: data.user,
          session: data.session 
        })
      }

      case 'signOut': {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader) {
          return NextResponse.json({ error: 'No auth token' }, { status: 401 })
        }
        
        // Create client with auth header for proper RLS context
        const authenticatedClient = createRLSClient(authHeader)
        const { error } = await authenticatedClient.auth.signOut()
        
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        
        return NextResponse.json({ success: true })
      }

      case 'getSession': {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader) {
          return NextResponse.json({ error: 'No auth token' }, { status: 401 })
        }
        
        // Create client with auth header for proper RLS context
        const authenticatedClient = createRLSClient(authHeader)
        const { data: { user }, error } = await authenticatedClient.auth.getUser()
        
        if (error || !user) {
          return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
        }
        
        return NextResponse.json({ user })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Auth API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
