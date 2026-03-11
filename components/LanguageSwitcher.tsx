'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { localeNames, localeColors } from '@/i18n/config'

interface LocaleInfo {
  code: string
  name: string
  native_name: string
  bg_color: string
  rtl: boolean
  priority: number
  is_default: boolean
  status: string
}

const TIER_1_LOCALES = ['en', 'zh', 'es', 'ar']
const TIER_2_LOCALES = ['ja', 'ru', 'fr', 'de', 'ko', 'hi', 'pt', 'tr']
const TIER_3_LOCALES = ['it', 'vi', 'th', 'id', 'ms', 'pl', 'nl', 'sv']

const STATIC_LOCALES: LocaleInfo[] = [
  { code: 'en', name: 'English', native_name: 'English', bg_color: '#3B82F6', rtl: false, priority: 100, is_default: true, status: 'active' },
  { code: 'zh', name: 'Chinese', native_name: '中文', bg_color: '#DE2910', rtl: false, priority: 99, is_default: false, status: 'active' },
  { code: 'es', name: 'Spanish', native_name: 'Español', bg_color: '#FFC300', rtl: false, priority: 98, is_default: false, status: 'active' },
  { code: 'ar', name: 'Arabic', native_name: 'العربية', bg_color: '#006C35', rtl: true, priority: 97, is_default: false, status: 'active' },
  { code: 'ja', name: 'Japanese', native_name: '日本語', bg_color: '#BC002D', rtl: false, priority: 90, is_default: false, status: 'inactive' },
  { code: 'ru', name: 'Russian', native_name: 'Русский', bg_color: '#8B5CF6', rtl: false, priority: 89, is_default: false, status: 'inactive' },
  { code: 'fr', name: 'French', native_name: 'Français', bg_color: '#0055A4', rtl: false, priority: 88, is_default: false, status: 'inactive' },
  { code: 'de', name: 'German', native_name: 'Deutsch', bg_color: '#FBBF24', rtl: false, priority: 87, is_default: false, status: 'inactive' },
  { code: 'ko', name: 'Korean', native_name: '한국어', bg_color: '#C60C30', rtl: false, priority: 86, is_default: false, status: 'inactive' },
  { code: 'hi', name: 'Hindi', native_name: 'हिन्दी', bg_color: '#FF9933', rtl: false, priority: 85, is_default: false, status: 'inactive' },
  { code: 'pt', name: 'Portuguese', native_name: 'Português', bg_color: '#009739', rtl: false, priority: 84, is_default: false, status: 'inactive' },
  { code: 'tr', name: 'Turkish', native_name: 'Türkçe', bg_color: '#E30A17', rtl: false, priority: 83, is_default: false, status: 'inactive' },
  { code: 'it', name: 'Italian', native_name: 'Italiano', bg_color: '#009246', rtl: false, priority: 70, is_default: false, status: 'inactive' },
  { code: 'vi', name: 'Vietnamese', native_name: 'Tiếng Việt', bg_color: '#DA251D', rtl: false, priority: 69, is_default: false, status: 'inactive' },
  { code: 'th', name: 'Thai', native_name: 'ไทย', bg_color: '#00247D', rtl: false, priority: 68, is_default: false, status: 'inactive' },
  { code: 'id', name: 'Indonesian', native_name: 'Bahasa Indonesia', bg_color: '#FF0000', rtl: false, priority: 67, is_default: false, status: 'inactive' },
  { code: 'ms', name: 'Malay', native_name: 'Bahasa Melayu', bg_color: '#010066', rtl: false, priority: 66, is_default: false, status: 'inactive' },
  { code: 'pl', name: 'Polish', native_name: 'Polski', bg_color: '#DC143C', rtl: false, priority: 65, is_default: false, status: 'inactive' },
  { code: 'nl', name: 'Dutch', native_name: 'Nederlands', bg_color: '#FF6600', rtl: false, priority: 64, is_default: false, status: 'inactive' },
  { code: 'sv', name: 'Swedish', native_name: 'Svenska', bg_color: '#006AA7', rtl: false, priority: 63, is_default: false, status: 'inactive' }
]

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
  
  const getLocalesByTier = (tierCodes: string[]) => {
    return tierCodes
      .map(code => activeLocales.find(l => l.code === code))
      .filter((l): l is LocaleInfo => l !== undefined && l.status === 'active')
  }

  const tier1 = getLocalesByTier(TIER_1_LOCALES)
  const tier2 = getLocalesByTier(TIER_2_LOCALES)
  const tier3 = getLocalesByTier(TIER_3_LOCALES)

  const LocaleButton = ({ locale, isCurrent }: { locale: LocaleInfo; isCurrent: boolean }) => (
    <button
      onClick={() => switchLanguage(locale.code)}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full ${
        isCurrent ? 'bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-300 dark:ring-blue-700' : ''
      }`}
      title={locale.name}
    >
      <span 
        className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
        style={{ backgroundColor: locale.bg_color }}
      >
        {locale.code.toUpperCase()}
      </span>
      <span className="text-xs truncate">{locale.native_name}</span>
    </button>
  )

  return (
    <div 
      className="relative" 
      ref={dropdownRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
            <div className="grid grid-cols-3 gap-3 min-w-[320px] sm:min-w-[400px] md:min-w-[480px]">
              <div className="space-y-1">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 px-2">More</div>
                {tier3.map(locale => (
                  <LocaleButton 
                    key={locale.code} 
                    locale={locale} 
                    isCurrent={locale.code === currentLocale} 
                  />
                ))}
              </div>
              
              <div className="space-y-1">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 px-2">Common</div>
                {tier2.map(locale => (
                  <LocaleButton 
                    key={locale.code} 
                    locale={locale} 
                    isCurrent={locale.code === currentLocale} 
                  />
                ))}
              </div>
              
              <div className="space-y-1">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 px-2">Top</div>
                {tier1.map(locale => (
                  <LocaleButton 
                    key={locale.code} 
                    locale={locale} 
                    isCurrent={locale.code === currentLocale} 
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
