'use client'

import React, { useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { NotificationProvider } from '@/components/ui/Notifications'
import { TranslationProvider, LocaleProvider } from '@/hooks'
import GlobalApiHandler from '@/components/GlobalApiHandler'
import { rtlLocales } from '@/i18n/config'

interface ProvidersProps {
  children: React.ReactNode
  locale?: string
}

export default function Providers({ children, locale }: ProvidersProps) {
  const currentLocale = locale || 'en'
  
  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('lang', currentLocale)
    html.setAttribute('dir', rtlLocales.includes(currentLocale) ? 'rtl' : 'ltr')
  }, [currentLocale])
  
  return (
    <SessionProvider 
      refetchOnWindowFocus={false}
      refetchInterval={3600}
      refetchWhenOffline={false}
    >
      <ThemeProvider>
        <NotificationProvider>
          <GlobalApiHandler>
            <LocaleProvider locale={currentLocale}>
              <TranslationProvider locale={currentLocale}>
                {children}
              </TranslationProvider>
            </LocaleProvider>
          </GlobalApiHandler>
        </NotificationProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}