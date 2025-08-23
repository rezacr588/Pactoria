import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string // Function to generate unique key
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  message?: string
  statusCode?: number
  headers?: boolean // Include rate limit headers in response
  storage?: 'memory' | 'supabase' // Storage backend
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory storage for rate limiting
class MemoryStore {
  private store: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.store.entries()) {
        if (entry.resetTime < now) {
          this.store.delete(key)
        }
      }
    }, 60000)
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    
    // Check if entry has expired
    if (entry.resetTime < Date.now()) {
      this.store.delete(key)
      return null
    }
    
    return entry
  }

  async set(key: string, entry: RateLimitEntry): Promise<void> {
    this.store.set(key, entry)
  }

  async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
    const now = Date.now()
    const entry = await this.get(key)
    
    if (entry) {
      entry.count++
      await this.set(key, entry)
      return entry
    } else {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs
      }
      await this.set(key, newEntry)
      return newEntry
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

// Supabase storage for distributed rate limiting
class SupabaseStore {
  async get(key: string): Promise<RateLimitEntry | null> {
    try {
      const { data, error } = await supabase
        .from('rate_limits')
        .select('count, reset_time')
        .eq('key', key)
        .single()

      if (error || !data) return null

      // Check if entry has expired
      if (new Date(data.reset_time).getTime() < Date.now()) {
        await supabase
          .from('rate_limits')
          .delete()
          .eq('key', key)
        return null
      }

      return {
        count: data.count,
        resetTime: new Date(data.reset_time).getTime()
      }
    } catch (error) {
      console.error('Error getting rate limit from Supabase:', error)
      return null
    }
  }

  async set(key: string, entry: RateLimitEntry): Promise<void> {
    try {
      await supabase
        .from('rate_limits')
        .upsert({
          key,
          count: entry.count,
          reset_time: new Date(entry.resetTime).toISOString()
        })
    } catch (error) {
      console.error('Error setting rate limit in Supabase:', error)
    }
  }

  async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
    const now = Date.now()
    const entry = await this.get(key)
    
    if (entry) {
      entry.count++
      await this.set(key, entry)
      return entry
    } else {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs
      }
      await this.set(key, newEntry)
      return newEntry
    }
  }
}

// Rate limiter class
export class RateLimiter {
  private config: Required<RateLimitConfig>
  private store: MemoryStore | SupabaseStore

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator,
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false,
      message: config.message || 'Too many requests, please try again later.',
      statusCode: config.statusCode || 429,
      headers: config.headers !== false,
      storage: config.storage || 'memory'
    }

    this.store = this.config.storage === 'supabase' 
      ? new SupabaseStore()
      : new MemoryStore()
  }

  private defaultKeyGenerator(req: NextRequest): string {
    // Use IP address as default key
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    return `rate-limit:${ip}`
  }

  async middleware(req: NextRequest): Promise<NextResponse | null> {
    const key = this.config.keyGenerator(req)
    const entry = await this.store.increment(key, this.config.windowMs)
    
    // Calculate remaining requests
    const remaining = Math.max(0, this.config.maxRequests - entry.count)
    const resetDate = new Date(entry.resetTime)
    
    // Check if limit exceeded
    if (entry.count > this.config.maxRequests) {
      const response = NextResponse.json(
        { 
          error: this.config.message,
          retryAfter: Math.ceil((entry.resetTime - Date.now()) / 1000)
        },
        { status: this.config.statusCode }
      )
      
      if (this.config.headers) {
        response.headers.set('X-RateLimit-Limit', this.config.maxRequests.toString())
        response.headers.set('X-RateLimit-Remaining', remaining.toString())
        response.headers.set('X-RateLimit-Reset', resetDate.toISOString())
        response.headers.set('Retry-After', Math.ceil((entry.resetTime - Date.now()) / 1000).toString())
      }
      
      return response
    }
    
    // Request is within limits, return null to continue
    if (this.config.headers) {
      // These headers will be added to the successful response
      return null
    }
    
    return null
  }

  // Get rate limit info for a key
  async getInfo(key: string): Promise<{
    limit: number
    remaining: number
    resetTime: Date
  } | null> {
    const entry = await this.store.get(key)
    
    if (!entry) {
      return {
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: new Date(Date.now() + this.config.windowMs)
      }
    }
    
    return {
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: new Date(entry.resetTime)
    }
  }

  // Reset rate limit for a key
  async reset(key: string): Promise<void> {
    if (this.store instanceof MemoryStore) {
      await this.store.set(key, {
        count: 0,
        resetTime: Date.now() + this.config.windowMs
      })
    } else {
      await supabase
        .from('rate_limits')
        .delete()
        .eq('key', key)
    }
  }

  destroy() {
    if (this.store instanceof MemoryStore) {
      this.store.destroy()
    }
  }
}

// Factory function to create rate limiters with different configurations
export function createRateLimiter(type: 'api' | 'auth' | 'upload' | 'search'): RateLimiter {
  const configs: Record<'api' | 'auth' | 'upload' | 'search', RateLimitConfig> = {
    api: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
      message: 'API rate limit exceeded. Please try again in a minute.'
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      message: 'Too many authentication attempts. Please try again later.',
      keyGenerator: (req) => {
        // Use IP for auth rate limiting since we can't access parsed body in middleware
        const forwarded = req.headers.get('x-forwarded-for')
        const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown'
        return `auth:${ip}`
      }
    },
    upload: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 50,
      message: 'Upload limit exceeded. Please try again later.'
    },
    search: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30,
      message: 'Search rate limit exceeded. Please slow down your searches.'
    }
  }
  
  return new RateLimiter(configs[type])
}

// Middleware helper for Next.js API routes
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: RateLimitConfig
) {
  const limiter = new RateLimiter(config || {
    windowMs: 60 * 1000,
    maxRequests: 60
  })
  
  return async (req: NextRequest): Promise<NextResponse> => {
    const rateLimitResponse = await limiter.middleware(req)
    
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    
    // Continue with the original handler
    const response = await handler(req)
    
    // Add rate limit headers to successful response
    if (config?.headers !== false) {
      const key = config?.keyGenerator?.(req) || limiter['defaultKeyGenerator'](req)
      const info = await limiter.getInfo(key)
      
      if (info) {
        response.headers.set('X-RateLimit-Limit', info.limit.toString())
        response.headers.set('X-RateLimit-Remaining', info.remaining.toString())
        response.headers.set('X-RateLimit-Reset', info.resetTime.toISOString())
      }
    }
    
    return response
  }
}

// React hook for client-side rate limiting awareness
export function useRateLimit() {
  const checkRateLimit = useCallback(async (endpoint: string): Promise<{
    limited: boolean
    remaining: number
    resetTime: Date
  }> => {
    try {
      const response = await fetch(`/api/rate-limit/check?endpoint=${endpoint}`)
      const data = await response.json()
      
      return {
        limited: data.remaining === 0,
        remaining: data.remaining,
        resetTime: new Date(data.resetTime)
      }
    } catch (error) {
      console.error('Error checking rate limit:', error)
      return {
        limited: false,
        remaining: 100,
        resetTime: new Date(Date.now() + 60000)
      }
    }
  }, [])
  
  return { checkRateLimit }
}

import { useCallback } from 'react'
