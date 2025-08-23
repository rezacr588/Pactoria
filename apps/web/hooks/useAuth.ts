import { useEffect, useState, useCallback } from 'react'
import { User, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

interface AuthResult {
  data?: any
  error?: AuthError | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    let isMounted = true

    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (isMounted) {
          setAuthState({
            user: session?.user ?? null,
            loading: false,
            error: error?.message ?? null
          })
        }
      } catch (err) {
        if (isMounted) {
          setAuthState({
            user: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Authentication error'
          })
        }
      }
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        // Clear error on successful auth changes
        setAuthState(prev => ({
          ...prev,
          user: session?.user ?? null,
          loading: false,
          error: event === 'SIGNED_OUT' ? null : prev.error
        }))
        
        // Store auth token in cookies for middleware
        if (session?.access_token) {
          document.cookie = `sb-access-token=${session.access_token}; path=/; secure; samesite=lax; max-age=${60 * 60 * 24 * 7}` // 7 days
        } else {
          document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      })
      
      if (error) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }))
      }
      
      return { data, error }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed'
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      return { error: { message: errorMessage } as AuthError }
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
      })
      
      if (error) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }))
      }
      
      return { data, error }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed'
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      return { error: { message: errorMessage } as AuthError }
    }
  }, [])

  const signOut = useCallback(async (): Promise<AuthResult> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const { error } = await supabase.auth.signOut()
      
      // Clear auth cookie
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      
      if (error) {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }))
      }
      
      return { error }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed'
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
      return { error: { message: errorMessage } as AuthError }
    }
  }, [])

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signIn,
    signUp,
    signOut,
    clearError,
  }
}
