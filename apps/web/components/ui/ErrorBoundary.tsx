'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    })

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // In production, you might want to log to an error reporting service
    // Example: logErrorToService(error, errorInfo)
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 border border-red-200">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  Something went wrong
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
                </p>
                
                {/* Show error details in development */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                      Error details (development only)
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded text-xs">
                      <p className="font-mono text-red-600">
                        {this.state.error.toString()}
                      </p>
                      {this.state.errorInfo && (
                        <pre className="mt-2 text-gray-600 overflow-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-primary-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Refresh page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for using error boundary in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return setError
}

// Wrapper component for common use cases
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback} {...(onError ? { onError } : {})}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
