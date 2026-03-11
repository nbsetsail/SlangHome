import { MetadataRoute } from 'next'
import { locales } from '@/i18n/config'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://slanghome.com'
  
  const staticPages = [
    { path: '', priority: 1, changeFrequency: 'daily' as const },
    { path: '/discover', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/search', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/activities', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/subscribe', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/contribute', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/feedback', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/about', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/help', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/community-guidelines', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/privacy-policy', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/terms-of-service', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/cookie-policy', priority: 0.3, changeFrequency: 'yearly' as const },
  ]
  
  const sitemapEntries: MetadataRoute.Sitemap = []
  
  for (const locale of locales) {
    for (const { path, priority, changeFrequency } of staticPages) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
        alternates: {
          languages: Object.fromEntries(
            locales.map(l => [l, `${baseUrl}/${l}${path}`])
          )
        }
      })
    }
  }
  
  return sitemapEntries
}
