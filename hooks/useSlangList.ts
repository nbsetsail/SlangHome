'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { SlangItem } from '@/types'
import { listCache } from '@/lib/client-cache'

interface UseSlangListProps {
  sortBy: string
  userId?: string
  category?: string
  tag?: string
  search?: string
  sessionStatus?: 'authenticated' | 'unauthenticated' | 'loading'
  locale?: string
}

interface UseSlangListReturn {
  slangList: SlangItem[]
  loading: boolean
  isLoadingMore: boolean
  error: string
  hasMore: boolean
  page: number
  fetchSlang: (pageNum: number) => Promise<void>
  loadMore: () => void
  resetList: () => void
}

const CACHE_DURATION = 5 * 60 * 1000

function getCacheKey(params: {
  sortBy: string
  userId?: string
  category?: string
  tag?: string
  search?: string
  locale?: string
  page: number
}): string {
  const { sortBy, userId, category, tag, search, locale, page } = params
  const parts = [sortBy, locale || 'en', page]
  if (userId) parts.push(`u:${userId}`)
  if (category) parts.push(`c:${category}`)
  if (tag) parts.push(`t:${tag}`)
  if (search) parts.push(`s:${search}`)
  return parts.join('_')
}

export function useSlangList({
  sortBy,
  userId,
  category,
  tag,
  search,
  sessionStatus,
  locale = 'en'
}: UseSlangListProps): UseSlangListReturn {
  const [slangList, setSlangList] = useState<SlangItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const isFetchingRef = useRef(false)
  const prevFiltersRef = useRef<string>('')

  const fetchSlang = useCallback(async (pageNum: number) => {
    if (isFetchingRef.current) return

    isFetchingRef.current = true
    const currentLoading = pageNum === 1 ? setLoading : setIsLoadingMore
    currentLoading(true)
    setError('')

    const cacheKey = getCacheKey({ sortBy, userId, category, tag, search, locale, page: pageNum })
    const cached = listCache.get<{ slangs: SlangItem[]; hasMore: boolean }>(cacheKey)

    if (cached.data && !cached.isEmpty && pageNum === 1) {
      setSlangList(cached.data.slangs)
      setHasMore(cached.data.hasMore)
      if (!cached.expired) {
        currentLoading(false)
        isFetchingRef.current = false
        return
      }
    }

    try {
      const params = new URLSearchParams({
        sort: sortBy,
        limit: '10',
        page: pageNum.toString()
      })

      if (userId) {
        params.append('userId', userId)
      }

      if (category) {
        params.append('category', category)
      }

      if (tag) {
        params.append('tag', tag)
      }

      if (search) {
        params.append('search', search)
      }

      if (locale) {
        params.append('locale', locale)
      }

      const url = `/api/slang?${params.toString()}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.error) {
        console.error('API error:', data.error)
        if (pageNum === 1) {
          if (cached.data) {
            setSlangList(cached.data.slangs)
            setHasMore(cached.data.hasMore)
            console.warn('Using stale cache due to API error')
          } else {
            setSlangList([])
            setHasMore(false)
          }
        }
      } else {
        const newSlangs = data.slang || []
        const newHasMore = newSlangs.length === 10

        if (pageNum === 1) {
          setSlangList(newSlangs)
          listCache.set(cacheKey, { slangs: newSlangs, hasMore: newHasMore }, CACHE_DURATION)
        } else {
          setSlangList(prev => {
            const existingIds = new Set(prev.map(item => item.id))
            const filteredItems = newSlangs.filter((item: SlangItem) => !existingIds.has(item.id))
            return [...prev, ...filteredItems]
          })
        }

        setHasMore(newHasMore)
      }
    } catch (err) {
      console.error('Network error:', err)
      if (pageNum === 1) {
        if (cached.data) {
          setSlangList(cached.data.slangs)
          setHasMore(cached.data.hasMore)
          console.warn('Using stale cache due to network error')
        } else {
          setSlangList([])
          setHasMore(false)
        }
      }
    } finally {
      currentLoading(false)
      isFetchingRef.current = false
    }
  }, [sortBy, userId, category, tag, search, locale])

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchSlang(nextPage)
    }
  }, [isLoadingMore, hasMore, page, fetchSlang])

  const resetList = useCallback(() => {
    setPage(1)
    setSlangList([])
    setHasMore(true)
    setError('')
  }, [])

  useEffect(() => {
    const currentFilters = JSON.stringify({ sortBy, userId, category, tag, search, locale })

    if (sessionStatus === 'authenticated' || sessionStatus === 'unauthenticated') {
      if (prevFiltersRef.current !== currentFilters) {
        prevFiltersRef.current = currentFilters
        resetList()
        setTimeout(() => {
          fetchSlang(1)
        }, 0)
      } else if (page === 1 && slangList.length === 0 && !loading) {
        fetchSlang(1)
      }
    }
  }, [sortBy, userId, category, tag, search, sessionStatus, locale])

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000 &&
        !isLoadingMore &&
        hasMore
      ) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isLoadingMore, hasMore, loadMore])

  return {
    slangList,
    loading,
    isLoadingMore,
    error,
    hasMore,
    page,
    fetchSlang,
    loadMore,
    resetList
  }
}
