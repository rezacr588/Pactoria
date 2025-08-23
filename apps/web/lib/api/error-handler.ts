import { NextResponse } from 'next/server'

/**
 * Custom API Error class with status code and error code support
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

/**
 * Standard error response format
 */
interface ErrorResponse {
  error: string
  code?: string
  details?: any
  timestamp: string
  requestId?: string
}

/**
 * Generate a request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`
}

/**
 * Log error with context (replace with your logging service)
 */
function logError(error: unknown, context?: any): void {
  const timestamp = new Date().toISOString()
  const errorDetails = {
    timestamp,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error,
    context
  }
  
  // In production, send to logging service (e.g., Sentry, DataDog)
  console.error('[API Error]', JSON.stringify(errorDetails, null, 2))
}

/**
 * Handle API errors consistently
 */
export function handleAPIError(
  error: unknown,
  context?: { 
    endpoint?: string
    userId?: string
    action?: string 
  }
): NextResponse<ErrorResponse> {
  const requestId = generateRequestId()
  const timestamp = new Date().toISOString()
  
  // Log the error with context
  logError(error, { ...context, requestId })
  
  // Handle known API errors
  if (error instanceof APIError) {
    return NextResponse.json<ErrorResponse>(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        timestamp,
        requestId
      },
      { 
        status: error.statusCode,
        headers: {
          'X-Request-Id': requestId
        }
      }
    )
  }
  
  // Handle Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as any
    
    // Map common Supabase error codes
    if (supabaseError.code === 'PGRST116') {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Resource not found',
          code: 'NOT_FOUND',
          timestamp,
          requestId
        },
        { 
          status: 404,
          headers: { 'X-Request-Id': requestId }
        }
      )
    }
    
    if (supabaseError.code === '23505') {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Resource already exists',
          code: 'DUPLICATE',
          timestamp,
          requestId
        },
        { 
          status: 409,
          headers: { 'X-Request-Id': requestId }
        }
      )
    }
    
    if (supabaseError.code === '42501') {
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Permission denied',
          code: 'FORBIDDEN',
          timestamp,
          requestId
        },
        { 
          status: 403,
          headers: { 'X-Request-Id': requestId }
        }
      )
    }
  }
  
  // Handle standard errors
  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    return NextResponse.json<ErrorResponse>(
      {
        error: isDevelopment ? error.message : 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
        details: isDevelopment ? { stack: error.stack } : undefined,
        timestamp,
        requestId
      },
      { 
        status: 500,
        headers: { 'X-Request-Id': requestId }
      }
    )
  }
  
  // Fallback for unknown errors
  return NextResponse.json<ErrorResponse>(
    {
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      timestamp,
      requestId
    },
    { 
      status: 500,
      headers: { 'X-Request-Id': requestId }
    }
  )
}

/**
 * Common error factories
 */
export const Errors = {
  BadRequest: (message = 'Bad request', details?: any) => 
    new APIError(message, 400, 'BAD_REQUEST', details),
    
  Unauthorized: (message = 'Unauthorized') => 
    new APIError(message, 401, 'UNAUTHORIZED'),
    
  Forbidden: (message = 'Forbidden') => 
    new APIError(message, 403, 'FORBIDDEN'),
    
  NotFound: (resource = 'Resource') => 
    new APIError(`${resource} not found`, 404, 'NOT_FOUND'),
    
  Conflict: (message = 'Resource conflict') => 
    new APIError(message, 409, 'CONFLICT'),
    
  ValidationError: (details: any) => 
    new APIError('Validation failed', 400, 'VALIDATION_ERROR', details),
    
  RateLimited: (retryAfter?: number) => 
    new APIError(
      'Too many requests', 
      429, 
      'RATE_LIMITED', 
      { retryAfter }
    ),
    
  InternalError: (message = 'Internal server error') => 
    new APIError(message, 500, 'INTERNAL_ERROR'),
    
  ServiceUnavailable: (service = 'Service') => 
    new APIError(`${service} temporarily unavailable`, 503, 'SERVICE_UNAVAILABLE')
}
