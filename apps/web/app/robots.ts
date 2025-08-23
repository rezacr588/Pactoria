import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/contracts/',
          '/analytics/',
          '/settings/',
          '/_next/',
          '/admin/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/'],
        disallow: [
          '/api/',
          '/dashboard/',
          '/contracts/',
          '/analytics/',
          '/settings/',
        ],
      },
    ],
    sitemap: 'https://web-one-mauve-40.vercel.app/sitemap.xml',
  }
}