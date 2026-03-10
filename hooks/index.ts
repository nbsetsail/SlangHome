/**
 * 通用状态管理Hooks
 * 解决组件间重复的状态管理逻辑
 */

import { useState, useEffect, useCallback } from 'react'
import { storageManager } from '@/lib/utils'

// 交互状态Hook（点赞、收藏、浏览等）
interface InteractionState {
  isLiked: boolean
  isFavorited: boolean
  views: number
  likes: number
  favorites: number
}

interface UseInteractionStateProps {
  initialLiked?: boolean
  initialFavorited?: boolean
  initialViews?: number
  initialLikes?: number
  initialFavorites?: number
}

export const useInteractionState = ({
  initialLiked = false,
  initialFavorited = false,
  initialViews = 0,
  initialLikes = 0,
  initialFavorites = 0
}: UseInteractionStateProps = {}) => {
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [isFavorited, setIsFavorited] = useState(initialFavorited)
  const [views, setViews] = useState(initialViews)
  const [likes, setLikes] = useState(initialLikes)
  const [favorites, setFavorites] = useState(initialFavorites)

  // 同步初始值变化
  useEffect(() => {
    setIsLiked(initialLiked)
  }, [initialLiked])

  useEffect(() => {
    setIsFavorited(initialFavorited)
  }, [initialFavorited])

  useEffect(() => {
    setViews(initialViews)
  }, [initialViews])

  useEffect(() => {
    setLikes(initialLikes)
  }, [initialLikes])

  useEffect(() => {
    setFavorites(initialFavorites)
  }, [initialFavorites])

  return {
    // 状态值
    isLiked,
    isFavorited,
    views,
    likes,
    favorites,
    
    // 状态设置函数
    setIsLiked,
    setIsFavorited,
    setViews,
    setLikes,
    setFavorites,
    
    // 便捷操作函数
    toggleLike: () => setIsLiked(prev => !prev),
    toggleFavorite: () => setIsFavorited(prev => !prev),
    incrementViews: () => setViews(prev => prev + 1),
    incrementLikes: () => setLikes(prev => prev + 1),
    decrementLikes: () => setLikes(prev => Math.max(0, prev - 1)),
    incrementFavorites: () => setFavorites(prev => prev + 1),
    decrementFavorites: () => setFavorites(prev => Math.max(0, prev - 1))
  }
}

// API调用状态Hook
interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export const useApiState = <T>(initialData: T | null = null) => {
  const [data, setData] = useState<T | null>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setData(initialData)
    setLoading(false)
    setError(null)
  }, [initialData])

  return {
    data,
    loading,
    error,
    setData,
    setLoading,
    setError,
    reset
  }
}

// 分页状态Hook
interface PaginationState {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
}

interface UsePaginationProps {
  initialPage?: number
  initialPageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

export const usePagination = ({
  initialPage = 1,
  initialPageSize = 10,
  onPageChange,
  onPageSizeChange
}: UsePaginationProps = {}) => {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // 当页码或页面大小改变时触发回调
  useEffect(() => {
    onPageChange?.(currentPage)
  }, [currentPage, onPageChange])

  useEffect(() => {
    onPageSizeChange?.(pageSize)
    // 页面大小改变时重置到第一页
    setCurrentPage(1)
  }, [pageSize, onPageSizeChange])

  // 更新分页信息
  const updatePagination = useCallback((items: number, total: number) => {
    setTotalItems(total)
    setTotalPages(Math.ceil(total / items))
  }, [])

  // 页码变更
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  // 下一页
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }, [currentPage, totalPages])

  // 上一页
  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }, [currentPage])

  // 改变页面大小
  const changePageSize = useCallback((size: number) => {
    setPageSize(size)
  }, [])

  return {
    // 状态值
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    
    // 操作函数
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
    updatePagination,
    
    // 重置函数
    reset: () => {
      setCurrentPage(initialPage)
      setPageSize(initialPageSize)
      setTotalItems(0)
      setTotalPages(1)
    }
  }
}

// 搜索状态Hook
interface UseSearchProps {
  initialSearch?: string
  initialFilters?: Record<string, any>
  onSearch?: (searchTerm: string, filters: Record<string, any>) => void
  debounceDelay?: number
}

export const useSearch = ({
  initialSearch = '',
  initialFilters = {},
  onSearch,
  debounceDelay = 300
}: UseSearchProps = {}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters)
  const [isSearching, setIsSearching] = useState(false)

  // 防抖搜索
  useEffect(() => {
    if (!onSearch) return

    const handler = setTimeout(() => {
      setIsSearching(true)
      onSearch(searchTerm, filters)
      setIsSearching(false)
    }, debounceDelay)

    return () => clearTimeout(handler)
  }, [searchTerm, filters, debounceDelay, onSearch])

  // 更新搜索词
  const updateSearch = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  // 更新过滤器
  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  // 批量更新过滤器
  const updateFilters = useCallback((newFilters: Record<string, any>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // 清除搜索
  const clearSearch = useCallback(() => {
    setSearchTerm('')
    setFilters({})
  }, [])

  // 重置为初始状态
  const reset = useCallback(() => {
    setSearchTerm(initialSearch)
    setFilters(initialFilters)
  }, [initialSearch, initialFilters])

  return {
    searchTerm,
    filters,
    isSearching,
    updateSearch,
    updateFilter,
    updateFilters,
    clearSearch,
    reset
  }
}

// 模态框状态Hook
interface UseModalProps {
  initialOpen?: boolean
  onClose?: () => void
}

export const useModal = ({ initialOpen = false, onClose }: UseModalProps = {}) => {
  const [isOpen, setIsOpen] = useState(initialOpen)

  const openModal = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    onClose?.()
  }, [onClose])

  const toggleModal = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  // 同步初始打开状态
  useEffect(() => {
    setIsOpen(initialOpen)
  }, [initialOpen])

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal
  }
}

// Toast通知状态Hook
interface ToastOptions {
  duration?: number
  type?: 'success' | 'error' | 'warning' | 'info'
}

export const useToast = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [type, setType] = useState<'success' | 'error' | 'warning' | 'info'>('info')

  const showToast = useCallback((msg: string, options: ToastOptions = {}) => {
    const { duration = 3000, type = 'info' } = options
    
    setMessage(msg)
    setType(type)
    setIsVisible(true)

    // 自动隐藏
    setTimeout(() => {
      setIsVisible(false)
    }, duration)
  }, [])

  const hideToast = useCallback(() => {
    setIsVisible(false)
  }, [])

  const showSuccess = useCallback((msg: string, duration?: number) => {
    showToast(msg, { type: 'success', duration })
  }, [showToast])

  const showError = useCallback((msg: string, duration?: number) => {
    showToast(msg, { type: 'error', duration })
  }, [showToast])

  const showWarning = useCallback((msg: string, duration?: number) => {
    showToast(msg, { type: 'warning', duration })
  }, [showToast])

  const showInfo = useCallback((msg: string, duration?: number) => {
    showToast(msg, { type: 'info', duration })
  }, [showToast])

  return {
    isVisible,
    message,
    type,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}

// 本地存储状态Hook
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    return storageManager.getItem(key, initialValue)
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      storageManager.setItem(key, valueToStore)
    } catch (error) {
      console.warn('Error setting localStorage value:', error)
    }
  }, [key, storedValue])

  return [storedValue, setValue] as const
}

// 导出页面专用Hooks
export { useSlangList } from './useSlangList'
export { useUrlFilters } from './useUrlFilters'
export { useSidebar } from './useSidebar'
export { useTranslation, getTranslation, TranslationProvider } from './useTranslation'
export { useLocale, LocaleProvider } from './useLocale'