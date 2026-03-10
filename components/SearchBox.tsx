'use client'
import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks'

interface SearchBoxProps {
  placeholder?: string
  className?: string
  inputClassName?: string
  buttonClassName?: string
  onSearch?: (query: string) => void
  redirectToHome?: boolean
}

export default function SearchBox({ 
  placeholder, 
  className = '',
  inputClassName = '',
  buttonClassName = '',
  onSearch,
  redirectToHome = false
}: SearchBoxProps) {
  const { cn } = useTheme()
  const { t } = useTranslation()
  const params = useParams()
  const locale = params?.locale as string || 'en'
  const pathname = usePathname()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdvancedOption, setShowAdvancedOption] = useState(false)
  const router = useRouter()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery.trim())
      } else {
        const isDiscoverPage = pathname.includes('/discover')
        const searchUrl = `/${locale}/discover?search=${encodeURIComponent(searchQuery.trim())}`
        
        if (isDiscoverPage) {
          router.replace(searchUrl)
        } else {
          router.push(searchUrl)
        }
      }
      setSearchQuery('')
      setShowAdvancedOption(false)
    }
  }

  const handleAdvancedSearch = () => {
    const params = new URLSearchParams()
    if (searchQuery.trim()) {
      params.set('keyword', searchQuery.trim())
    }
    router.push(`/${locale}/search?${params.toString()}`)
    setSearchQuery('')
    setShowAdvancedOption(false)
  }

  return (
    <form 
      onSubmit={handleSearch} 
      className={`relative ${className}`}
      onFocus={() => setShowAdvancedOption(true)}
    >
      <input 
        type="text" 
        placeholder={placeholder || t('searchBox.placeholder')} 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setShowAdvancedOption(true)}
        onBlur={() => setTimeout(() => setShowAdvancedOption(false), 200)}
        maxLength={20}
        className={`w-full px-3 py-2 pr-10 border rounded-md ${cn.input} ${inputClassName}`}
      />
      <button 
        type="submit"
        className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${cn.colors.bg.light} ${cn.colors.text.primary} p-1 rounded-md ${cn.colors.bg.lightHover} ${buttonClassName}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
      
      {showAdvancedOption && (
        <div className="absolute top-full left-0 mt-2 bg-white border rounded-md shadow-lg w-64 z-50">
          <button
            type="button"
            onClick={handleAdvancedSearch}
            className={`w-full text-left px-4 py-2 text-sm ${cn.link} ${cn.colors.bg.lightHover} flex items-center gap-2 rounded-t-md`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('searchBox.advancedSearch')}
          </button>
        </div>
      )}
    </form>
  )
}
