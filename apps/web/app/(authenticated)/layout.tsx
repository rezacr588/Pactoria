'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/Header'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user, loading } = useAuth()

  // Show loading state while authentication is being checked
  // Note: The middleware handles redirects, so we can focus on loading states
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If no user but not loading, the middleware should have redirected
  // This is a fallback state
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-600 mb-4">We're sorry, but something unexpected happened. Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Refresh Page
          </button>
        </div>
      </div>
    }>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </ErrorBoundary>
  )
}
