import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pactoria - AI-Powered Contract Management',
    short_name: 'Pactoria',
    description: 'Transform your contract management with AI. Create, collaborate, and close deals 70% faster.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '32x32',
        type: 'image/x-icon',
      },
      {
        src: '/icon-180.svg',
        sizes: '180x180',
        type: 'image/svg+xml',
      },
    ],
    categories: ['business', 'productivity', 'utilities'],
    lang: 'en',
    dir: 'ltr',
    orientation: 'portrait-primary',
    screenshots: [
      {
        src: '/screenshot-desktop.png',
        sizes: '1280x720',
        type: 'image/png',
      },
      {
        src: '/screenshot-mobile.png',
        sizes: '750x1334',
        type: 'image/png',
      },
    ],
  }
}