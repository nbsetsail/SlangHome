'use client'

import React, { useContext } from 'react'
import { useParams } from 'next/navigation'

const LocaleContext = React.createContext<string | null>(null)

export function LocaleProvider({ 
  children, 
  locale 
}: { 
  children: React.ReactNode
  locale: string 
}) {
  return (
    <LocaleContext.Provider value={locale}>
      {children}
    </LocaleContext.Provider>
  )
}

/**
 * 安全获取当前 locale
 */
export function useLocale(): string {
  const context = useContext(LocaleContext)
  
  if (context) {
    return context
  }
  
  const params = useParams()
  const locale = params?.locale
  
  if (locale && typeof locale === 'string') {
    return locale
  }
  
  return 'en'
}

export default useLocale
