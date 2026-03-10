import Link from 'next/link'
import { headers } from 'next/headers'
import { locales, defaultLocale } from '@/i18n/config'

import '@/styles/globals.css'

const translations: Record<string, { title: string; desc: string; backHome: string; search: string }> = {
  en: { title: 'Page Not Found', desc: 'The page you are looking for does not exist or has been moved.', backHome: 'Back to Home', search: 'Search' },
  zh: { title: '页面未找到', desc: '您访问的页面不存在或已被移动。', backHome: '返回首页', search: '搜索' },
  ar: { title: 'الصفحة غير موجودة', desc: 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها.', backHome: 'العودة للصفحة الرئيسية', search: 'بحث' },
  es: { title: 'Página no encontrada', desc: 'La página que buscas no existe o ha sido movida.', backHome: 'Volver al inicio', search: 'Buscar' }
}

export default async function NotFound() {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  
  let locale = defaultLocale
  if (pathname) {
    const pathLocale = pathname.split('/')[1]
    if (pathLocale && locales.includes(pathLocale)) {
      locale = pathLocale
    }
  }
  
  const t = translations[locale] || translations.en

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center px-4 py-20">
          <div className="text-center">
            <h1 className="text-9xl font-bold text-gray-300 dark:text-gray-700">404</h1>
            <h2 className="text-2xl font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
              {t.title}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              {t.desc}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/${locale}`}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                {t.backHome}
              </Link>
              <Link
                href={`/${locale}/search`}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                {t.search}
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
