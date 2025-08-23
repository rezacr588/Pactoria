import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { 
  apiHandler, 
  requireAuth, 
  successResponse, 
  errorResponse,
  validateBody
} from '@/lib/api/utils'

// Environment validation
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required Supabase environment variables')
}

const EDGE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`

// Request validation schemas
const generateTemplateSchema = z.object({
  action: z.literal('generateTemplate'),
  prompt: z.string().min(1).max(2000).optional(),
  templateId: z.string().uuid().optional()
})

const analyzeRisksSchema = z.object({
  action: z.literal('analyzeRisks'),
  text: z.string().min(1).max(10000)
})

const aiRequestSchema = z.discriminatedUnion('action', [
  generateTemplateSchema,
  analyzeRisksSchema
]).refine(data => {
  if (data.action === 'generateTemplate') {
    return data.prompt || data.templateId
  }
  return true
}, {
  message: 'Either prompt or templateId must be provided for generateTemplate action'
})

export const POST = apiHandler(async (request: NextRequest) => {
  // Check authentication
  const { error: authError } = await requireAuth(request)
  if (authError) return authError

  // Validate request body
  const { data: body, error: validationError } = await validateBody(
    request,
    aiRequestSchema
  )
  if (validationError) return validationError

  const authHeader = request.headers.get('Authorization')!

  try {
    let endpoint = ''
    let payload = {}

    switch (body!.action) {
      case 'generateTemplate':
        endpoint = `${EDGE_FUNCTIONS_URL}/ai/generate-template`
        payload = {
          prompt: body!.prompt,
          templateId: body!.templateId
        }
        break

      case 'analyzeRisks':
        endpoint = `${EDGE_FUNCTIONS_URL}/ai/analyze-risks`
        payload = {
          text: body!.text
        }
        break

      default:
        return errorResponse('Invalid action', 400)
    }

    // Call Supabase Edge Function with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      let errorMessage = 'AI service error'
      try {
        const error = await response.json()
        errorMessage = error.error || errorMessage
      } catch {
        // Ignore JSON parsing errors, use default message
      }
      return errorResponse(errorMessage, response.status)
    }

    const data = await response.json()
    return successResponse(data)
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return errorResponse('Request timeout - AI service took too long to respond', 408)
    }
    console.error('AI API error:', error)
    return errorResponse('Internal server error', 500)
  }
})

// Support streaming for template generation
export async function GET(request: NextRequest) {
  // Check authentication
  const { error: authError } = await requireAuth(request)
  if (authError) return authError

  const searchParams = request.nextUrl.searchParams
  const prompt = searchParams.get('prompt')
  
  // Validate prompt parameter
  if (!prompt || prompt.length === 0) {
    return errorResponse('Prompt is required', 400)
  }
  
  if (prompt.length > 2000) {
    return errorResponse('Prompt too long (max 2000 characters)', 400)
  }

  const authHeader = request.headers.get('Authorization')!
  const endpoint = `${EDGE_FUNCTIONS_URL}/ai/generate-template?stream=true`
  
  try {
    // Stream response from Edge Function to client with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60s timeout for streaming

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({ prompt: prompt.trim() }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      let errorMessage = 'AI service error'
      try {
        const error = await response.json()
        errorMessage = error.error || errorMessage
      } catch {
        // Ignore JSON parsing errors for streaming responses
      }
      return errorResponse(errorMessage, response.status)
    }

    // Return streaming response with proper headers
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    })
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return errorResponse('Request timeout - AI streaming took too long', 408)
    }
    console.error('AI streaming error:', error)
    return errorResponse('Internal server error', 500)
  }
}
