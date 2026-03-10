import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { redirect } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import Providers from '@/components/Providers'
import CookieConsent from '@/components/CookieConsent'
import { locales, rtlLocales, localeNames, defaultLocale } from '@/i18n/config'
import '../../styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#3b82f6',
}

export function generateStaticParams() {
  return locales.map(locale => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const localeName = localeNames[locale] || 'English'
  
  return {
    title: {
      default: `Slang Home - ${localeName}`,
      template: `%s | Slang Home ${localeName}`
    },
    description: 'Discover and learn the latest slang words and phrases. Slang Home is your comprehensive dictionary for modern slang, internet slang, and colloquial expressions.',
    keywords: ['slang', 'dictionary', 'slang words', 'internet slang', 'modern slang', 'colloquial expressions', 'urban dictionary', 'slang phrases'],
    authors: [{ name: 'Slang Home Team' }],
    creator: 'Slang Home',
    publisher: 'Slang Home',
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
    openGraph: {
      type: 'website',
      locale: locale === 'zh' ? 'zh_CN' : locale === 'es' ? 'es_ES' : locale === 'ar' ? 'ar_SA' : 'en_US',
      url: `https://slanghome.com/${locale}`,
      siteName: 'Slang Home',
      title: `Slang Home - ${localeName}`,
      description: 'Discover and learn the latest slang words and phrases.',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Slang Home',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Slang Home - ${localeName}`,
      description: 'Discover and learn the latest slang words and phrases.',
      images: ['/og-image.png'],
      creator: '@slanghome',
    },
    alternates: {
      canonical: `https://slanghome.com/${locale}`,
      languages: Object.fromEntries(
        locales.map(l => [l, `https://slanghome.com/${l}`])
      )
    },
    manifest: '/manifest.json',
    category: 'education',
  }
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  if (!locales.includes(locale)) {
    redirect(`/${defaultLocale}`)
  }
  
  setRequestLocale(locale)
  
  const messages = await getMessages()
  const isRTL = rtlLocales.includes(locale)
  
  return (
    <NextIntlClientProvider messages={messages}>
      <Providers locale={locale}>
        {children}
        <CookieConsent />
      </Providers>
    </NextIntlClientProvider>
  )
}
