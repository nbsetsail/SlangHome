'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks'

interface Option {
  name: string
  count?: number
}

interface AsyncSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  fetchUrl: string
  className?: string
  locale?: string
  allOptionText?: string
}

export default function AsyncSelect({ 
  value, 
  onChange, 
  placeholder, 
  fetchUrl,
  className = '',
  locale = 'en',
  allOptionText
}: AsyncSelectProps) {
  const { cn } = useTheme()
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingSearch, setPendingSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const pageSize = 20

  const displayPlaceholder = placeholder || t('common.typeToFilter')

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
        setPendingSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchOptions(1, searchQuery)
    }
  }, [isOpen])

  const fetchOptions = async (pageNum: number, search: string) => {
    if (loading) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: pageSize.toString(),
        search: search,
        locale: locale
      })
      const response = await fetch(`${fetchUrl}?${params.toString()}`)
      const data = await response.json()
      
      const items = data.categories || data.tags || []
      
      if (pageNum === 1) {
        setOptions(items)
      } else {
        setOptions(prev => [...prev, ...items])
      }
      
      setHasMore(items.length === pageSize)
      setPage(pageNum)
    } catch (err) {
      console.error('Error fetching options:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const { scrollTop, scrollHeight, clientHeight } = target
    
    if (scrollHeight - scrollTop - clientHeight < 50 && hasMore && !loading) {
      fetchOptions(page + 1, searchQuery)
    }
  }

  const handleSearch = () => {
    setSearchQuery(pendingSearch)
    setOptions([])
    setHasMore(true)
    fetchOptions(1, pendingSearch)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchQuery('')
    setPendingSearch('')
  }

  const selectedOption = options.find(opt => opt.name === value)

  const displayValue = value || ''
  const showPlaceholder = !displayValue

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-md text-left flex items-center justify-between bg-white dark:bg-gray-700 hover:border-gray-400 ${cn.focusRing} ${displayValue ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}
      >
        <span className="truncate">
          {showPlaceholder ? placeholder : displayValue}
        </span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className={`absolute z-50 mt-1 w-full ${cn.colors.bg.card} border ${cn.colors.border.default} rounded-md shadow-lg`}>
          <div className={`p-2 border-b ${cn.colors.border.default} flex items-center gap-2`}>
            <input
              type="text"
              value={pendingSearch}
              onChange={(e) => setPendingSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={displayPlaceholder}
              className={`flex-1 px-2 py-1 text-sm border rounded ${cn.input}`}
            />
            <button
              type="button"
              onClick={handleSearch}
              className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 ${cn.link}`}
              title="Filter"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            </button>
          </div>

          <div
            ref={listRef}
            onScroll={handleScroll}
            className="max-h-60 overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 ${!value ? cn.selected : 'text-gray-500 dark:text-gray-400'}`}
            >
              {placeholder}
            </button>
            
            {options.map((option, index) => (
              <button
                key={`${option.name}-${index}`}
                type="button"
                onClick={() => handleSelect(option.name)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex justify-between items-center ${
                  value === option.name ? cn.selected : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <span className="truncate">{option.name}</span>
                {option.count !== undefined && (
                  <span className="text-xs text-gray-400 ml-2">{option.count}</span>
                )}
              </button>
            ))}

            {loading && (
              <div className="px-3 py-2 text-center text-gray-500 dark:text-gray-400 text-sm">
                {t('common.loading')}
              </div>
            )}

            {!loading && !hasMore && options.length > 0 && (
              <div className="px-3 py-2 text-center text-gray-400 text-xs">
                {t('slang.noMore')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
