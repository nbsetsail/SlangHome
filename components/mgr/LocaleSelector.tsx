'use client'

import React from 'react'

const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  ru: 'Русский',
  ar: 'العربية',
  hi: 'हिन्दी',
  it: 'Italiano',
  nl: 'Nederlands',
  pl: 'Polski',
  tr: 'Türkçe',
  vi: 'Tiếng Việt',
  th: 'ไทย',
  id: 'Bahasa Indonesia',
  ms: 'Bahasa Melayu',
  tl: 'Filipino'
}

interface LocaleSelectorProps {
  value: string
  onChange: (locale: string) => void
  managedLocales?: string[]
  allLocales?: string[]
  isAdmin?: boolean
  className?: string
  showAll?: boolean
}

export default function LocaleSelector({
  value,
  onChange,
  managedLocales,
  allLocales,
  isAdmin = false,
  className = '',
  showAll = true
}: LocaleSelectorProps) {
  const availableLocales = isAdmin && allLocales 
    ? allLocales 
    : managedLocales || []

  if (availableLocales.length === 0) {
    return null
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      {showAll && (
        <option value="">All Locales</option>
      )}
      {availableLocales.map((locale) => (
        <option key={locale} value={locale}>
          {LOCALE_NAMES[locale] || locale}
        </option>
      ))}
    </select>
  )
}

export { LOCALE_NAMES }
