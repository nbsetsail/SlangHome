import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#3b82f6',
}

export const metadata: Metadata = {
  title: {
    default: 'Slang Home - Your Ultimate Slang Dictionary',
    template: '%s | Slang Home'
  },
  description: 'Discover and learn the latest slang words and phrases. Slang Home is your comprehensive dictionary for modern slang, internet slang, and colloquial expressions.',
  keywords: ['slang', 'dictionary', 'slang words', 'internet slang', 'modern slang', 'colloquial expressions', 'urban dictionary', 'slang phrases'],
  authors: [{ name: 'Slang Home Team' }],
  creator: 'Slang Home',
  publisher: 'Slang Home',
  icons: {
    icon: '/icon.svg',
    apple: [
      { url: '/icon.svg', sizes: '180x180', type: 'image/svg+xml' }
    ],
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://slanghome.com',
    siteName: 'Slang Home',
    title: 'Slang Home - Your Ultimate Slang Dictionary',
    description: 'Discover and learn the latest slang words and phrases. Your comprehensive dictionary for modern slang.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Slang Home - Your Ultimate Slang Dictionary',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Slang Home - Your Ultimate Slang Dictionary',
    description: 'Discover and learn the latest slang words and phrases.',
    images: ['/og-image.png'],
    creator: '@slanghome',
  },
  alternates: {
    canonical: 'https://slanghome.com',
  },
  manifest: '/manifest.json',
  verification: {
    google: 'your-google-verification-code',
  },
  category: 'education',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('slang-theme-preference');
                  if (theme && ['neutral', 'blue', 'green', 'purple', 'orange', 'teal', 'rose'].includes(theme)) {
                    document.documentElement.setAttribute('data-theme', theme);
                  }
                  
                  if (!document.documentElement.classList.contains('theme-transition')) {
                    document.documentElement.classList.add('theme-transition');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
