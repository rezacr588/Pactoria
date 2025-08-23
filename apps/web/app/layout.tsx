import './globals.css'
import React from 'react'
import { Inter, IBM_Plex_Mono } from 'next/font/google'
import { QueryProvider } from '../components/providers/query-provider'
import { AuthProvider } from '../contexts/AuthContext'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

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
  title: {
    template: '%s | Pactoria - AI-Powered Contract Management',
    default: 'Pactoria - AI-Powered Contract Management Platform'
  },
  description: 'Transform your contract management with AI. Create, collaborate, and close deals 70% faster. Trusted by 10,000+ teams worldwide. Start your free trial today.',
  keywords: [
    'contract management software',
    'AI contract generation',
    'legal document automation',
    'contract lifecycle management',
    'collaborative contract editing',
    'contract analytics',
    'digital contract signing',
    'legal tech platform',
    'contract templates',
    'business contract software'
  ],
  authors: [{ name: 'Pactoria Team' }],
  creator: 'Pactoria',
  publisher: 'Pactoria',
  metadataBase: new URL('https://web-one-mauve-40.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://web-one-mauve-40.vercel.app',
    siteName: 'Pactoria',
    title: 'Pactoria - AI-Powered Contract Management Platform',
    description: 'Transform your contract management with AI. Create, collaborate, and close deals 70% faster. Trusted by 10,000+ teams worldwide.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Pactoria - AI-Powered Contract Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@Pactoria',
    creator: '@Pactoria',
    title: 'Pactoria - AI-Powered Contract Management Platform',
    description: 'Transform your contract management with AI. Create, collaborate, and close deals 70% faster.',
    images: ['/twitter-card.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Pactoria" />
        <meta name="application-name" content="Pactoria" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
