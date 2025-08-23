import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { APIError, handleAPIError, Errors } from './error-handler'

// Environment validation
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required Supabase environment variables')
}

/**
 * Create a Supabase client with the request's auth token
 */
export function createSupabaseClient(request: NextRequest): SupabaseClient {
  const authHeader = request.headers.get('Authorization')
  
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {}
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Standard error response using error handler
 */
export function errorResponse(
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  return handleAPIError(
    new APIError(message, status, undefined, details)
  )
}

/**
 * Standard success response with consistent format
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  headers?: HeadersInit
): NextResponse<T> {
  return NextResponse.json(data, { 
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

/**
 * Validate request body with Zod schema and detailed errors
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ data?: T; error?: NextResponse }> {
  try {
    let body: any
    
    // Parse JSON with error handling
    try {
      body = await request.json()
    } catch (jsonError) {
      return {
        error: handleAPIError(
          Errors.BadRequest('Invalid JSON in request body')
        )
      }
    }
    
    const result = schema.safeParse(body)
    
    if (!result.success) {
      // Format Zod errors for better readability
      const formattedErrors = result.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }))
      
      return {
        error: handleAPIError(
          Errors.ValidationError(formattedErrors)
        )
      }
    }
    
    return { data: result.data }
  } catch (e) {
    return {
      error: handleAPIError(e)
    }
  }
}

/**
 * Check if user is authenticated with improved error handling
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ userId?: string; user?: any; error?: NextResponse }> {
  try {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        error: handleAPIError(Errors.Unauthorized('Missing or invalid authorization header'))
      }
    }
    
    const supabase = createSupabaseClient(request)
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return {
        error: handleAPIError(
          Errors.Unauthorized(error?.message || 'Invalid or expired token')
        )
      }
    }
    
    return { 
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
      }
    }
  } catch (error) {
    return {
      error: handleAPIError(error)
    }
  }
}

/**
 * Standard API handler wrapper with comprehensive error handling and logging
 */
export function apiHandler<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now()
    const endpoint = new URL(request.url).pathname
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    try {
      // Log request in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] ${request.method} ${endpoint} - Request ID: ${requestId}`)
      }
      
      // Execute handler
      const response = await handler(request, context)
      
      // Add common headers
      response.headers.set('X-Request-Id', requestId)
      response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`)
      
      // Log response in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] ${request.method} ${endpoint} - Status: ${response.status} - Time: ${Date.now() - startTime}ms`)
      }
      
      return response
    } catch (error) {
      return handleAPIError(error, {
        endpoint,
        action: request.method,
      })
    }
  }
}

/**
 * CORS headers for API routes
 */
export function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}

/**
 * Handle OPTIONS requests for CORS
 */
export function handleOptions(): NextResponse {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders()
  })
}

/**
 * Check if user has permission for a resource
 */
export async function checkPermission(
  supabase: SupabaseClient,
  userId: string,
  resource: string,
  _action: string
): Promise<boolean> {
  try {
    // For contracts, use the has_contract_access function
    if (resource.startsWith('contract:')) {
      const contractId = resource.replace('contract:', '')
      const { data } = await supabase.rpc('has_contract_access', {
        u: userId,
        c: contractId
      })
      return data === true
    }
    
    // Default: check if user exists
    const { data: user } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()
    
    return !!user
  } catch (error) {
    console.error('Permission check failed:', error)
    return false
  }
}

// Export error utilities
export { APIError, Errors } from './error-handler'
