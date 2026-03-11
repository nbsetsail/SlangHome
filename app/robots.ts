import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://slanghome.com'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/discover',
          '/discover?category=',
          '/discover?tag=',
          '/slang/phrase/',
        ],
        disallow: [
          '/api/',
          '/mgr/',
          '/auth/',
          '/login',
          '/register',
          '/reset-password',
          '/forgot-password',
          '/privacy-settings',
          '/profile',
          '/slang/new',
          '/slang/submit',
          '/slang/*/history',
          '/slang/*/maintain',
          '/apply-moderator',
          '/pk',
          '/pk/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
