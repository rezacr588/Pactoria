import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Routes that require authentication
const protectedRoutes = ['/contracts', '/analytics', '/dashboard']
// Routes that should redirect to dashboard if already authenticated
const publicRoutes = ['/login', '/register', '/']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  try {
    // Get auth token from cookies or Authorization header
    const token = request.cookies.get('sb-access-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '')

    let isAuthenticated = false
    
    if (token) {
      // Create Supabase client to verify token
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      })

      const { data: { user }, error } = await supabase.auth.getUser(token)
      isAuthenticated = !error && !!user
    }

    // Handle protected routes
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      if (!isAuthenticated) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
    }

    // Handle public routes when already authenticated
    if (publicRoutes.includes(pathname) && isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
  } catch (error) {
    // On error, allow the request to continue but log the error
    console.error('Middleware authentication error:', error)
    
    // For protected routes, redirect to login on error
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}