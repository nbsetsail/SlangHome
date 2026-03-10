import { MetadataRoute } from 'next'
import { locales, defaultLocale } from '@/i18n/config'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://slanghome.com'
  
  const staticPages = [
    '',
    '/search',
    '/pk',
    '/pk/leaderboard',
    '/pk/history',
    '/pk/achievements',
    '/profile',
  ]
  
  const sitemapEntries: MetadataRoute.Sitemap = []
  
  for (const locale of locales) {
    for (const page of staticPages) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'daily' : 'weekly',
        priority: page === '' ? 1 : 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map(l => [l, `${baseUrl}/${l}${page}`])
          )
        }
      })
    }
  }
  
  return sitemapEntries
}
