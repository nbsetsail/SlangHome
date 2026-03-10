'use client'

import React, { useContext, useMemo } from 'react'
import { getT } from '@/i18n/translate'

type TranslationFunction = ReturnType<typeof getT>

const TranslationContext = React.createContext<{
  locale: string
  t: TranslationFunction
} | null>(null)

export function TranslationProvider({ 
  children, 
  locale: propLocale 
}: { 
  children: React.ReactNode
  locale?: string 
}) {
  const locale = propLocale || 'en'
  const t = useMemo(() => getT(locale), [locale])
  
  const value = useMemo(() => ({
    locale,
    t
  }), [locale, t])
  
  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  
  if (!context) {
    const defaultT = getT('en')
    return { t: defaultT, locale: 'en' }
  }
  
  return { t: context.t, locale: context.locale }
}

export function getTranslation(locale: string = 'en') {
  const t = getT(locale)
  return { t, locale }
}

export default useTranslation
