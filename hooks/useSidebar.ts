'use client'

import { useState, useEffect, useCallback } from 'react'

interface Category {
  name: string
  heat?: number
}

interface Tag {
  name: string
  heat?: number
}

interface UseSidebarReturn {
  categories: Category[]
  tags: Tag[]
  sidebarLoading: boolean
  sidebarCollapsed: boolean
  categoriesExpanded: boolean
  tagsExpanded: boolean
  visibleCategories: Category[]
  visibleTags: Tag[]
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleCategoriesExpanded: () => void
  toggleTagsExpanded: () => void
  trackCategoryClick: (name: string) => Promise<void>
  trackTagClick: (name: string) => Promise<void>
}

const MIN_CATEGORIES = 5
const MIN_TAGS = 10

export function useSidebar(locale: string = 'en'): UseSidebarReturn {
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [sidebarLoading, setSidebarLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [categoriesExpanded, setCategoriesExpanded] = useState(false)
  const [tagsExpanded, setTagsExpanded] = useState(false)
  const [windowHeight, setWindowHeight] = useState(0)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && !isClient) {
      setIsClient(true)
    }
  }, [])

  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        setSidebarLoading(true)
        
        const [categoriesResponse, tagsResponse] = await Promise.all([
          fetch(`/api/categories?locale=${locale}`),
          fetch(`/api/tags?locale=${locale}`)
        ])
        
        const categoriesData = await categoriesResponse.json()
        const tagsData = await tagsResponse.json()
        
        if (categoriesData.categories) {
          setCategories(categoriesData.categories)
        }
        
        if (tagsData.tags) {
          setTags(tagsData.tags)
        }
      } catch (error) {
        console.error('Error fetching sidebar data:', error)
      } finally {
        setSidebarLoading(false)
      }
    }
    
    fetchSidebarData()
  }, [locale])

  useEffect(() => {
    if (!isClient) return

    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true)
      } else {
        setSidebarCollapsed(false)
      }
      setWindowHeight(window.innerHeight)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isClient])

  useEffect(() => {
    if (!isClient) return

    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.querySelector('.sidebar-content')
      const toggleButton = document.querySelector('.sidebar-toggle')
      
      if (
        sidebar && 
        toggleButton && 
        !sidebar.contains(event.target as Node) && 
        !toggleButton.contains(event.target as Node)
      ) {
        setSidebarCollapsed(true)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isClient])

  const visibleCategories = categoriesExpanded 
    ? categories 
    : categories.slice(0, MIN_CATEGORIES)
  
  const visibleTags = tagsExpanded 
    ? tags 
    : tags.slice(0, MIN_TAGS)

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev)
  }, [])

  const toggleCategoriesExpanded = useCallback(() => {
    setCategoriesExpanded(prev => !prev)
  }, [])

  const toggleTagsExpanded = useCallback(() => {
    setTagsExpanded(prev => !prev)
  }, [])

  const trackCategoryClick = useCallback(async (name: string) => {
    try {
      await fetch('/api/category/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
    } catch (err) {
      console.error('Error tracking category click:', err)
    }
  }, [])

  const trackTagClick = useCallback(async (name: string) => {
    try {
      await fetch('/api/tag/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
    } catch (err) {
      console.error('Error tracking tag click:', err)
    }
  }, [])

  return {
    categories,
    tags,
    sidebarLoading,
    sidebarCollapsed,
    categoriesExpanded,
    tagsExpanded,
    visibleCategories,
    visibleTags,
    toggleSidebar,
    setSidebarCollapsed,
    toggleCategoriesExpanded,
    toggleTagsExpanded,
    trackCategoryClick,
    trackTagClick
  }
}
