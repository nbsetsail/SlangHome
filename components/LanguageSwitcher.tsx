'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { locales, localeNames, localeColors } from '@/i18n/config'

interface LocaleInfo {
  code: string
  name: string
  native_name: string
  bg_color: string
  is_default: boolean
}

const STATIC_LOCALES: LocaleInfo[] = locales.map(code => ({
  code,
  name: localeNames[code] || code,
  native_name: localeNames[code] || code,
  bg_color: localeColors[code] || '#3B82F6',
  is_default: code === 'en'
}))

let cachedLocales: LocaleInfo[] | null = null

export function LanguageSwitcher() {
  const [activeLocales, setActiveLocales] = useState<LocaleInfo[]>(cachedLocales || STATIC_LOCALES)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const hasFetched = useRef(false)
  
  useEffect(() => {
    if (hasFetched.current || cachedLocales) {
      return
    }
    hasFetched.current = true
    
    fetch('/api/locales')
      .then(res => res.json())
      .then(data => {
        if (data.locales && data.locales.length > 0) {
          cachedLocales = data.locales
          setActiveLocales(data.locales)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])
  
  const currentLocale = pathname.split('/')[1] || 'en'
  
  const switchLanguage = (code: string) => {
    document.cookie = `preferred_locale=${code};path=/;max-age=31536000;SameSite=Lax`
    
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '') || '/'
    const newPath = `/${code}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`
    
    router.push(newPath || `/${code}`)
    setIsOpen(false)
  }
  
  const currentLocaleInfo = activeLocales.find(l => l.code === currentLocale)
  
  return (
    <div 
      className="relative" 
      ref={dropdownRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <span 
          className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: currentLocaleInfo?.bg_color || localeColors[currentLocale] || '#3B82F6' }}
        >
          {currentLocale?.toUpperCase()}
        </span>
        <span className="text-sm hidden sm:inline">{currentLocaleInfo?.native_name || localeNames[currentLocale] || currentLocale}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full pt-2 z-50">
          <div className="w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
          {activeLocales.map(locale => (
            <button
              key={locale.code}
              onClick={() => switchLanguage(locale.code)}
              className={`w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                locale.code === currentLocale ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <span 
                className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: locale.bg_color }}
              >
                {locale.code.toUpperCase()}
              </span>
              <span className="text-sm">{locale.native_name}</span>
            </button>
          ))}
          </div>
        </div>
      )}
    </div>
  )
}
