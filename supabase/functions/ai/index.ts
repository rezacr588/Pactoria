// Supabase Edge Function: ai
// Implements Groq Chat Completions for MVP endpoints with database-backed rate limiting and secure CORS

import { Hono } from 'https://deno.land/x/hono@v3.12.0/mod.ts'
import { cors } from 'https://deno.land/x/hono@v3.12.0/middleware/cors/index.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatOptions {
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

interface GenerateTemplateRequest {
  prompt?: string
  templateId?: string
}

interface AnalyzeRisksRequest {
  text?: string
}

interface RiskAnalysisResult {
  score: number
  flags: string[]
  suggestions: string[]
}

const app = new Hono()

// Initialize Supabase client for rate limiting
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Configure CORS with secure allowed origins from environment
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'http://localhost:3000').split(',')
app.use('*', cors({
  origin: (origin) => {
    // Deny requests without origin (except for same-origin)
    if (!origin) return false
    // Only allow whitelisted origins
    return allowedOrigins.includes(origin) ? origin : false
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
}))

// Configuration from environment with defaults
const RATE_LIMIT_REQUESTS = parseInt(Deno.env.get('RATE_LIMIT_REQUESTS') || '10')
const RATE_LIMIT_WINDOW = parseInt(Deno.env.get('RATE_LIMIT_WINDOW_MINUTES') || '1')

// Database-backed rate limiting
async function checkRateLimit(clientId: string, endpoint: string): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  try {
    // Call the database function to check rate limit
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_client_id: clientId,
      p_endpoint: endpoint,
      p_limit: RATE_LIMIT_REQUESTS,
      p_window_minutes: RATE_LIMIT_WINDOW
    })
    
    if (error) {
      console.error('Rate limit check error:', error)
      // Fail open on error (allow request but log it)
      return { allowed: true, remaining: RATE_LIMIT_REQUESTS, resetAt: new Date(Date.now() + RATE_LIMIT_WINDOW * 60000) }
    }
    
    // Calculate remaining requests
    const windowStart = new Date()
    windowStart.setSeconds(0, 0)
    const resetAt = new Date(windowStart.getTime() + RATE_LIMIT_WINDOW * 60000)
    const remaining = data ? RATE_LIMIT_REQUESTS - 1 : 0
    
    return { allowed: data === true, remaining, resetAt }
  } catch (err) {
    console.error('Rate limit error:', err)
    // Fail open on error
    return { allowed: true, remaining: RATE_LIMIT_REQUESTS, resetAt: new Date(Date.now() + RATE_LIMIT_WINDOW * 60000) }
  }
}

// Middleware for rate limiting
app.use('*', async (c, next) => {
  // Skip rate limiting for OPTIONS requests
  if (c.req.method === 'OPTIONS') {
    return next()
  }
  
  // Use IP or Authorization header as client identifier
  const authHeader = c.req.header('Authorization')
  const clientId = authHeader?.replace('Bearer ', '').substring(0, 32) || // Use first 32 chars of token
                   c.req.header('X-Forwarded-For')?.split(',')[0] || 
                   c.req.header('X-Real-IP') || 
                   c.req.header('CF-Connecting-IP') || // Cloudflare
                   'anonymous'
  
  const endpoint = `ai:${c.req.path}`
  const { allowed, remaining, resetAt } = await checkRateLimit(clientId, endpoint)
  
  // Set rate limit headers
  c.header('X-RateLimit-Limit', String(RATE_LIMIT_REQUESTS))
  c.header('X-RateLimit-Remaining', String(Math.max(0, remaining)))
  c.header('X-RateLimit-Reset', resetAt.toISOString())
  
  if (!allowed) {
    const retryAfter = Math.ceil((resetAt.getTime() - Date.now()) / 1000)
    return c.json(
      { 
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter,
        resetAt: resetAt.toISOString()
      },
      429,
      { 'Retry-After': String(retryAfter) }
    )
  }
  
  return next()
})

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = Deno.env.get('GROQ_MODEL') ?? 'llama3-70b-8192'
const REQUEST_TIMEOUT = parseInt(Deno.env.get('REQUEST_TIMEOUT_MS') || '30000') // 30 seconds default

app.get('/', (c) => c.json({ name: 'ai', status: 'ok', model: MODEL }))

async function groqChat(messages: ChatMessage[], opts?: ChatOptions): Promise<string | Response> {
  if (!GROQ_API_KEY) {
    throw new Error('Missing GROQ_API_KEY')
  }
  
  const stream = opts?.stream ?? false
  
  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  
  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: opts?.temperature ?? 0.2,
        max_tokens: opts?.max_tokens ?? 1024,
        stream: stream,
      }),
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    if (!res.ok) {
      const text = await res.text()
      // Don't expose internal API errors to clients
      if (res.status === 429) {
        throw new Error('AI service rate limit exceeded. Please try again later.')
      } else if (res.status >= 500) {
        throw new Error('AI service temporarily unavailable.')
      } else {
        throw new Error(`AI service error: ${res.status}`)
      }
    }
    
    if (stream) {
      return res
    } else {
      const data = await res.json() as {
        choices?: Array<{ message?: { content?: string } }>
      }
      const content = data?.choices?.[0]?.message?.content ?? ''
      return content
    }
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error('Request timeout - AI service took too long to respond')
    }
    throw err
  }
}

app.post('/generate-template', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({})) as GenerateTemplateRequest
    
    // Input validation
    if (!body.prompt && !body.templateId) {
      return c.json({ 
        error: 'Invalid request',
        details: 'Either prompt or templateId is required' 
      }, 400)
    }
    
    // Sanitize inputs
    const prompt = body.prompt?.substring(0, 2000) // Limit prompt length
    const templateId = body.templateId?.replace(/[^a-zA-Z0-9-_]/g, '') // Sanitize template ID
    
    const sys = 'You are a helpful legal contract drafting assistant. Generate a concise, well-structured contract template in Markdown based on the user request. Ensure the content is professional and legally sound.'
    const user = prompt ?? `Generate a contract template for templateId=${templateId}`
    
    const wantsStream = (c.req.query('stream') ?? '').toLowerCase() === 'true'
    if (wantsStream) {
      const res = await groqChat([
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ], { stream: true }) as Response
      // SSE headers
      c.header('Content-Type', 'text/event-stream')
      c.header('Cache-Control', 'no-cache')
      c.header('Connection', 'keep-alive')
      return c.newResponse(res.body, 200)
    } else {
      const content = await groqChat([
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ], { stream: false }) as string
      return c.json({ result: content })
    }
  } catch (e: unknown) {
    const error = e as Error
    return c.json({ error: error?.message ?? 'Internal server error' }, 500)
  }
})

app.post('/analyze-risks', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({})) as AnalyzeRisksRequest
    
    // Input validation
    if (!body.text || typeof body.text !== 'string') {
      return c.json({ 
        error: 'Invalid request',
        details: 'text field is required and must be a string' 
      }, 400)
    }
    
    // Limit text length to prevent abuse
    const text = body.text.substring(0, 10000) // 10k char limit
    
    const sys = 'You are a legal risk analysis assistant. Analyze the provided contract text and return a valid JSON object with exactly these fields: score (number between 0-1), flags (array of risk flag strings), suggestions (array of improvement suggestion strings). Ensure the response is valid JSON.'
    const user = `Analyze this contract text and return strict JSON only: ${text}`
    const raw = await groqChat([
      { role: 'system', content: sys },
      { role: 'user', content: user },
    ], { max_tokens: 800 }) as string
    
    // Try to parse JSON from model output with validation
    let parsed: RiskAnalysisResult
    try {
      const rawParsed = JSON.parse(raw)
      // Validate the structure
      parsed = {
        score: typeof rawParsed.score === 'number' ? 
          Math.min(1, Math.max(0, rawParsed.score)) : 0.5,
        flags: Array.isArray(rawParsed.flags) ? 
          rawParsed.flags.filter(f => typeof f === 'string').slice(0, 10) : [],
        suggestions: Array.isArray(rawParsed.suggestions) ? 
          rawParsed.suggestions.filter(s => typeof s === 'string').slice(0, 10) : []
      }
    } catch {
      // Attempt to extract JSON block from markdown or text
      const match = raw.match(/```json\s*([\s\S]*?)```|\{[\s\S]*\}/)
      if (match) {
        try {
          const extracted = match[1] || match[0]
          const rawParsed = JSON.parse(extracted)
          parsed = {
            score: typeof rawParsed.score === 'number' ? 
              Math.min(1, Math.max(0, rawParsed.score)) : 0.5,
            flags: Array.isArray(rawParsed.flags) ? 
              rawParsed.flags.filter(f => typeof f === 'string').slice(0, 10) : [],
            suggestions: Array.isArray(rawParsed.suggestions) ? 
              rawParsed.suggestions.filter(s => typeof s === 'string').slice(0, 10) : []
          }
        } catch {
          // Default fallback with error indication
          parsed = { 
            score: 0.5, 
            flags: ['Unable to analyze - parsing error'], 
            suggestions: ['Please review contract manually'] 
          }
        }
      } else {
        // Default fallback
        parsed = { 
          score: 0.5, 
          flags: ['Unable to analyze - invalid response'], 
          suggestions: ['Please review contract manually'] 
        }
      }
    }
    return c.json(parsed)
  } catch (e: unknown) {
    const error = e as Error
    console.error('AI analyze-risks error:', error)
    // Don't expose internal errors to clients
    return c.json({ 
      error: 'Failed to analyze risks',
      details: error?.message?.includes('timeout') ? 'Request timeout' : 'Please try again'
    }, 500)
  }
})

// Supabase invokes the function via Deno.serve
Deno.serve(app.fetch)

