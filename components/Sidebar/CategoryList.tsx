'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks'

interface CategoryListProps {
  categories: { name: string; heat?: number }[]
  loading: boolean
  selectedCategory: string
  currentSearch: string
  expanded: boolean
  onCategoryClick: (category: string) => void
  onToggleExpand: () => void
}

export function CategoryList({
  categories,
  loading,
  selectedCategory,
  currentSearch,
  expanded,
  onCategoryClick,
  onToggleExpand
}: CategoryListProps) {
  const { cn } = useTheme()
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [maxHeight, setMaxHeight] = useState<number>(120)

  useEffect(() => {
    const calculateMaxHeight = () => {
      const windowHeight = window.innerHeight
      const availableHeight = windowHeight - 300
      const categoryMaxHeight = Math.floor(availableHeight * 0.25)
      setMaxHeight(Math.max(50, Math.min(100, categoryMaxHeight)))
    }

    calculateMaxHeight()
    window.addEventListener('resize', calculateMaxHeight)
    return () => window.removeEventListener('resize', calculateMaxHeight)
  }, [])

  if (loading) {
    return (
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2 text-gray-500">{t('slang.categories')}</h2>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-3/4"></div>
          ))}
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2 text-gray-500">{t('slang.categories')}</h2>
        <p className="text-gray-500 text-sm">{t('common.noResults')}</p>
      </div>
    )
  }

  const hasMore = categories.length > 5

  return (
    <div className="mb-4 py-3 border-t border-b border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('slang.categories')}
        </h3>
        {hasMore && (
          <button
            onClick={onToggleExpand}
            className={`${cn.colors.text.muted} ${cn.colors.text.mutedHover} ${cn.colors.bg.light} ${cn.colors.bg.lightHover} px-4 py-1 rounded-md text-[10px] transition-colors`}
          >
            {expanded ? t('common.showLess') : t('common.showMore')}
          </button>
        )}
      </div>
      <div 
        ref={containerRef}
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: expanded ? 'none' : `${maxHeight}px` }}
      >
        <div className="flex flex-wrap gap-1">
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => onCategoryClick(category.name)}
              className={`${cn.link} py-1 text-sm min-w-[30%] text-left ${
                selectedCategory === category.name ? 'font-bold' : ''
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
