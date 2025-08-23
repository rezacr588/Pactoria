'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { FileText, Home, BarChart3, LogOut, User } from 'lucide-react'

export function Header() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  // Don't show header on auth pages
  if (pathname === '/login' || pathname === '/signup') {
    return null
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">Pactoria</span>
            </Link>
            
            {user && (
              <nav className="ml-10 flex items-center space-x-4">
                <Link
                  href="/"
                  className={`flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium ${
                    pathname === '/'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
                <Link
                  href="/contracts"
                  className={`flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium ${
                    pathname.startsWith('/contracts')
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Contracts</span>
                </Link>
                <Link
                  href="/analytics"
                  className={`flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium ${
                    pathname === '/analytics'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Analytics</span>
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <User className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center space-x-1 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
