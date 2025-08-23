/* eslint-disable no-console */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

interface LogContext {
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: Error
  stack?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isTest = process.env.NODE_ENV === 'test'
  private logLevel: LogLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 'info'
  
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isTest && level !== 'error' && level !== 'fatal') {
      return false
    }
    return this.levels[level] >= this.levels[this.logLevel]
  }

  private formatLog(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Pretty format for development
      const color = this.getColor(entry.level)
      const reset = '\x1b[0m'
      const timestamp = new Date(entry.timestamp).toLocaleTimeString()
      
      let log = `${color}[${timestamp}] ${entry.level.toUpperCase()}${reset}: ${entry.message}`
      
      if (entry.context) {
        log += `\n${JSON.stringify(entry.context, null, 2)}`
      }
      
      if (entry.stack) {
        log += `\n${entry.stack}`
      }
      
      return log
    }
    
    // JSON format for production
    return JSON.stringify(entry)
  }

  private getColor(level: LogLevel): string {
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
      fatal: '\x1b[35m', // Magenta
    }
    return colors[level]
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } as Error
      entry.stack = error.stack
    }

    const formatted = this.formatLog(entry)

    switch (level) {
      case 'debug':
        console.debug(formatted)
        break
      case 'info':
        console.info(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'error':
        console.error(formatted)
        break
      case 'fatal':
        console.error(formatted)
        // In production, you might want to send this to an error tracking service
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
          // Example: Sentry.captureException(error)
        }
        break
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context)
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const err = error instanceof Error ? error : new Error(String(error))
    this.log('error', message, context, err)
  }

  fatal(message: string, error?: Error | unknown, context?: LogContext): void {
    const err = error instanceof Error ? error : new Error(String(error))
    this.log('fatal', message, context, err)
  }

  // Helper method for API requests
  logRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${path}`, context)
  }

  // Helper method for API responses
  logResponse(method: string, path: string, status: number, duration?: number): void {
    const context: LogContext = { status }
    if (duration) {
      context.duration = `${duration}ms`
    }
    
    if (status >= 400) {
      this.error(`API Response: ${method} ${path}`, undefined, context)
    } else {
      this.info(`API Response: ${method} ${path}`, context)
    }
  }

  // Helper method for database queries
  logQuery(query: string, params?: unknown[], duration?: number): void {
    const context: LogContext = { query }
    if (params) {
      context.params = params
    }
    if (duration) {
      context.duration = `${duration}ms`
    }
    
    this.debug('Database Query', context)
  }

  // Helper method for performance tracking
  logPerformance(operation: string, duration: number, context?: LogContext): void {
    this.info(`Performance: ${operation}`, {
      ...context,
      duration: `${duration}ms`,
    })
  }

  // Create a child logger with additional context
  child(context: LogContext): LoggerWithContext {
    return new LoggerWithContext(this, context)
  }
}

// Child logger that includes additional context in all logs
class LoggerWithContext {
  constructor(
    private parent: Logger,
    private context: LogContext
  ) {}

  private mergeContext(additionalContext?: LogContext): LogContext {
    return { ...this.context, ...additionalContext }
  }

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, this.mergeContext(context))
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(message, this.mergeContext(context))
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(message, this.mergeContext(context))
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    this.parent.error(message, error, this.mergeContext(context))
  }

  fatal(message: string, error?: Error | unknown, context?: LogContext): void {
    this.parent.fatal(message, error, this.mergeContext(context))
  }
}

// Export singleton instance
export const logger = new Logger()

// Export for testing
export { Logger, LoggerWithContext }

// Usage examples:
// logger.info('User logged in', { userId: '123', email: 'user@example.com' })
// logger.error('Failed to save contract', error, { contractId: '456' })
// logger.logRequest('POST', '/api/contracts', { body: { title: 'New Contract' } })
// logger.logResponse('POST', '/api/contracts', 201, 150)
// 
// const requestLogger = logger.child({ requestId: 'abc-123', userId: 'user-456' })
// requestLogger.info('Processing request') // Will include requestId and userId in context
