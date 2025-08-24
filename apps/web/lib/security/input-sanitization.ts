import validator from 'validator'

// Lazy load DOMPurify to handle serverless environment
let DOMPurify: any = null

function getDOMPurify() {
  if (!DOMPurify) {
    try {
      const createDOMPurify = require('isomorphic-dompurify')
      DOMPurify = createDOMPurify()
    } catch (error) {
      console.error('Failed to initialize DOMPurify:', error)
      // Fallback: create a mock DOMPurify with basic HTML stripping
      DOMPurify = {
        sanitize: (input: string, config?: any) => {
          if (!input) return input
          // Basic HTML tag removal as fallback
          let cleaned = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
          if (config?.ALLOWED_TAGS && config.ALLOWED_TAGS.length === 0) {
            // If no tags allowed, strip all HTML
            cleaned = cleaned.replace(/<[^>]*>/g, '')
          }
          return cleaned
        }
      }
    }
  }
  return DOMPurify
}

// Configure DOMPurify for different contexts
const CONFIG = {
  // For general HTML content
  HTML: {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'],
    ALLOWED_ATTR: ['class'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur'],
  },
  // For plain text (no HTML)
  TEXT: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    FORBID_TAGS: [],
    FORBID_ATTR: [],
    KEEP_CONTENT: true,
  },
  // For contract content (more permissive but still safe)
  CONTRACT: {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: ['class', 'id'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur', 'onsubmit', 'onchange'],
  }
}

export interface SanitizationOptions {
  maxLength?: number
  allowEmpty?: boolean
  context?: 'html' | 'text' | 'contract'
  customConfig?: any
}

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export function sanitizeHTML(input: string, options: SanitizationOptions = {}): string {
  if (!input) {
    return options.allowEmpty ? '' : ''
  }

  const {
    maxLength = 50000,
    context = 'html',
    customConfig
  } = options

  // Truncate if too long
  let sanitized = input.length > maxLength ? input.substring(0, maxLength) : input

  // Choose configuration based on context
  let config = CONFIG.HTML
  if (context === 'text') config = CONFIG.TEXT
  if (context === 'contract') config = CONFIG.CONTRACT
  if (customConfig) config = { ...config, ...customConfig }

  // Sanitize with DOMPurify
  const domPurify = getDOMPurify()
  sanitized = domPurify.sanitize(sanitized, config)

  return sanitized.trim()
}

/**
 * Sanitizes plain text input
 */
export function sanitizeText(input: string, options: SanitizationOptions = {}): string {
  if (!input) {
    return options.allowEmpty ? '' : ''
  }

  const { maxLength = 10000 } = options

  // Remove HTML tags completely
  let sanitized = DOMPurify.sanitize(input, CONFIG.TEXT)
  
  // Trim whitespace
  sanitized = sanitized.trim()
  
  // Truncate if needed
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength).trim()
  }

  return sanitized
}

/**
 * Sanitizes email addresses
 */
export function sanitizeEmail(email: string): string | null {
  if (!email || typeof email !== 'string') {
    return null
  }

  const sanitized = sanitizeText(email, { maxLength: 254 })
  
  if (!validator.isEmail(sanitized)) {
    return null
  }

  return sanitized.toLowerCase()
}

/**
 * Sanitizes URLs
 */
export function sanitizeURL(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null
  }

  const sanitized = sanitizeText(url, { maxLength: 2048 })
  
  if (!validator.isURL(sanitized, { protocols: ['http', 'https'] })) {
    return null
  }

  return sanitized
}

/**
 * Sanitizes contract content (JSON from TipTap editor)
 */
export function sanitizeContractContent(content: any): any {
  if (!content || typeof content !== 'object') {
    return null
  }

  try {
    // Convert to string and back to ensure no malicious functions
    const jsonString = JSON.stringify(content)
    
    // Limit JSON size
    if (jsonString.length > 100000) {
      throw new Error('Contract content too large')
    }
    
    const parsed = JSON.parse(jsonString)
    
    // Recursively sanitize text content in the JSON structure
    return sanitizeContentRecursive(parsed)
  } catch (error) {
    console.error('Error sanitizing contract content:', error)
    return null
  }
}

/**
 * Recursively sanitizes content in nested objects/arrays
 */
function sanitizeContentRecursive(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'string') {
    return sanitizeText(obj, { maxLength: 10000 })
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeContentRecursive)
  }

  if (typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize the key as well
      const cleanKey = sanitizeText(key, { maxLength: 100 })
      if (cleanKey) {
        sanitized[cleanKey] = sanitizeContentRecursive(value)
      }
    }
    return sanitized
  }

  return obj
}

/**
 * Validates and sanitizes UUID
 */
export function sanitizeUUID(uuid: string): string | null {
  if (!uuid || typeof uuid !== 'string') {
    return null
  }

  const cleaned = uuid.trim()
  
  if (!validator.isUUID(cleaned, 4)) {
    return null
  }

  return cleaned
}

/**
 * Sanitizes search queries
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return ''
  }

  // Remove HTML and limit length
  let sanitized = sanitizeText(query, { maxLength: 200 })
  
  // Remove special SQL/NoSQL characters that could be used for injection
  sanitized = sanitized.replace(/['"\\;{}[\]()]/g, '')
  
  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim()
  
  return sanitized
}

/**
 * Sanitizes contract template variables
 */
export function sanitizeTemplateVariables(variables: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {}
  
  for (const [key, value] of Object.entries(variables || {})) {
    const cleanKey = sanitizeText(key, { maxLength: 100 })
    const cleanValue = sanitizeText(value, { maxLength: 1000 })
    
    if (cleanKey && cleanValue) {
      sanitized[cleanKey] = cleanValue
    }
  }
  
  return sanitized
}

/**
 * Comprehensive input sanitizer for API endpoints
 */
export function sanitizeApiInput<T extends Record<string, any>>(input: T, schema: Record<keyof T, SanitizationOptions>): T {
  const sanitized = {} as T

  for (const [key, value] of Object.entries(input)) {
    const options = schema[key] || { context: 'text', maxLength: 1000 }
    
    if (value === null || value === undefined) {
      sanitized[key as keyof T] = value
      continue
    }

    if (typeof value === 'string') {
      if (options.context === 'html' || options.context === 'contract') {
        sanitized[key as keyof T] = sanitizeHTML(value, options) as any
      } else {
        sanitized[key as keyof T] = sanitizeText(value, options) as any
      }
    } else if (typeof value === 'object') {
      // For objects like JSON content
      sanitized[key as keyof T] = sanitizeContractContent(value) as any
    } else {
      // For other types (numbers, booleans), keep as is
      sanitized[key as keyof T] = value
    }
  }

  return sanitized
}

// Export validation helpers
export const validators = {
  isValidEmail: (email: string): boolean => {
    const sanitized = sanitizeEmail(email)
    return sanitized !== null
  },
  
  isValidURL: (url: string): boolean => {
    const sanitized = sanitizeURL(url)
    return sanitized !== null
  },
  
  isValidUUID: (uuid: string): boolean => {
    const sanitized = sanitizeUUID(uuid)
    return sanitized !== null
  },
  
  isValidLength: (text: string, min: number = 0, max: number = 10000): boolean => {
    return Boolean(text && text.length >= min && text.length <= max)
  }
}