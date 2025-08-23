import './globals.css'
import React from 'react'
import { Inter, IBM_Plex_Mono } from 'next/font/google'
import { QueryProvider } from '../components/providers/query-provider'
import { AuthProvider } from '../contexts/AuthContext'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { Toaster } from 'sonner'

// Configure Inter font with font subsetting and optimization
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

// Configure IBM Plex Mono for code/monospace text
const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-ibm-plex-mono',
})

export const metadata = {
  title: 'Pactoria - AI-Powered Contract Management',
  description: 'Smart Contract Lifecycle Management for UK SMEs',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} ${ibmPlexMono.variable} font-sans min-h-full bg-gray-50 text-slate-900 antialiased`}>
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              {children}
              <Toaster 
                position="top-center" 
                toastOptions={{
                  className: 'bg-white border-slate-200 text-slate-900',
                }}
              />
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
