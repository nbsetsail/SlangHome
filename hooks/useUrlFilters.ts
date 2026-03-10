'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

interface UseUrlFiltersReturn {
  currentCategory: string
  currentTag: string
  currentSearch: string
  setCategory: (category: string) => void
  setTag: (tag: string) => void
  setSearch: (search: string) => void
  clearFilters: () => void
  clearCategory: () => void
  clearTag: () => void
}

export function useUrlFilters(
  onFilterChange?: () => void
): UseUrlFiltersReturn {
  const [currentCategory, setCurrentCategory] = useState('')
  const [currentTag, setCurrentTag] = useState('')
  const [currentSearch, setCurrentSearch] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const category = searchParams.get('category') || ''
    const tag = searchParams.get('tag') || ''
    const search = searchParams.get('search') || ''

    setCurrentCategory(category)
    setCurrentTag(tag)
    setCurrentSearch(search)
  }, [searchParams])

  const updateUrl = useCallback((params: { category?: string; tag?: string; search?: string }) => {
    if (typeof window === 'undefined') return

    const newUrl = new URL(window.location.href)
    
    if (params.category !== undefined) {
      if (params.category) {
        newUrl.searchParams.set('category', params.category)
      } else {
        newUrl.searchParams.delete('category')
      }
    }
    
    if (params.tag !== undefined) {
      if (params.tag) {
        newUrl.searchParams.set('tag', params.tag)
      } else {
        newUrl.searchParams.delete('tag')
      }
    }
    
    if (params.search !== undefined) {
      if (params.search) {
        newUrl.searchParams.set('search', params.search)
      } else {
        newUrl.searchParams.delete('search')
      }
    }

    window.history.pushState({}, '', newUrl.toString().replace(/\+/g, '%20'))
  }, [])

  const setCategory = useCallback((category: string) => {
    setCurrentCategory(category)
    updateUrl({ category, tag: undefined })
    onFilterChange?.()
  }, [updateUrl, onFilterChange])

  const setTag = useCallback((tag: string) => {
    setCurrentTag(tag)
    updateUrl({ tag, category: undefined })
    onFilterChange?.()
  }, [updateUrl, onFilterChange])

  const setSearch = useCallback((search: string) => {
    setCurrentSearch(search)
    updateUrl({ search })
    onFilterChange?.()
  }, [updateUrl, onFilterChange])

  const clearFilters = useCallback(() => {
    setCurrentCategory('')
    setCurrentTag('')
    setCurrentSearch('')
    updateUrl({ category: '', tag: '', search: '' })
    onFilterChange?.()
  }, [updateUrl, onFilterChange])

  const clearCategory = useCallback(() => {
    setCurrentCategory('')
    updateUrl({ category: '' })
    onFilterChange?.()
  }, [updateUrl, onFilterChange])

  const clearTag = useCallback(() => {
    setCurrentTag('')
    updateUrl({ tag: '' })
    onFilterChange?.()
  }, [updateUrl, onFilterChange])

  return {
    currentCategory,
    currentTag,
    currentSearch,
    setCategory,
    setTag,
    setSearch,
    clearFilters,
    clearCategory,
    clearTag
  }
}
