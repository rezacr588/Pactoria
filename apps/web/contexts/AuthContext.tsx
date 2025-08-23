'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import apiClient from '@/lib/api-client'
import { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true
    
    // Check for existing session on mount
    checkUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        
        console.log('Auth state change:', event)
        
        if (session) {
          setSession(session)
          setUser(session.user)
          setError(null)
          // Set the token for API client
          apiClient.setToken(session.access_token)
          
          // Store auth token in cookies for middleware
          document.cookie = `sb-access-token=${session.access_token}; path=/; secure; samesite=lax; max-age=${60 * 60 * 24 * 7}` // 7 days
        } else {
          setSession(null)
          setUser(null)
          apiClient.setToken(null)
          
          // Clear auth cookie
          document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
        setLoading(false)
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const checkUser = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Session check error:', error)
        setError(error.message)
        return
      }
      
      if (session) {
        setSession(session)
        setUser(session.user)
        setError(null)
        apiClient.setToken(session.access_token)
        
        // Store auth token in cookies for middleware
        document.cookie = `sb-access-token=${session.access_token}; path=/; secure; samesite=lax; max-age=${60 * 60 * 24 * 7}` // 7 days
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication error'
      console.error('Error checking user session:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      setError(null)
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        setError(error.message)
        throw error
      }
      
      if (session) {
        setSession(session)
        setUser(session.user)
        apiClient.setToken(session.access_token)
        
        // Update auth token in cookies
        document.cookie = `sb-access-token=${session.access_token}; path=/; secure; samesite=lax; max-age=${60 * 60 * 24 * 7}` // 7 days
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Session refresh failed'
      console.error('Session refresh failed:', err)
      setError(errorMessage)
      setUser(null)
      setSession(null)
      apiClient.setToken(null)
      
      // Clear auth cookie on refresh failure
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      })
      
      if (error) {
        setError(error.message)
        throw error
      }
      
      if (data.session) {
        setSession(data.session)
        setUser(data.user)
        apiClient.setToken(data.session.access_token)
        router.push('/contracts')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [router])

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
      })
      
      if (error) {
        setError(error.message)
        throw error
      }
      
      if (data.session) {
        setSession(data.session)
        setUser(data.user!)
        apiClient.setToken(data.session.access_token)
        router.push('/contracts')
      } else {
        // User needs to verify email
        router.push('/login?message=Check your email to confirm your account')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [router])

  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await supabase.auth.signOut()
      if (error) {
        setError(error.message)
        throw error
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed'
      console.error('Sign out error:', err)
      setError(errorMessage)
    } finally {
      setUser(null)
      setSession(null)
      apiClient.setToken(null)
      
      // Clear auth cookie
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      
      setLoading(false)
      router.push('/login')
    }
  }, [router])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        refreshSession,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
