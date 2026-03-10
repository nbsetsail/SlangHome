'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks'

interface TagListProps {
  tags: { name: string; heat?: number }[]
  loading: boolean
  selectedTag: string
  currentSearch: string
  expanded: boolean
  onTagClick: (tag: string) => void
  onToggleExpand: () => void
}

export function TagList({
  tags,
  loading,
  selectedTag,
  currentSearch,
  expanded,
  onTagClick,
  onToggleExpand
}: TagListProps) {
  const { cn } = useTheme()
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [maxHeight, setMaxHeight] = useState<number>(100)

  useEffect(() => {
    const calculateMaxHeight = () => {
      const windowHeight = window.innerHeight
      const availableHeight = windowHeight - 300
      const tagMaxHeight = Math.floor(availableHeight * 0.2)
      setMaxHeight(Math.max(40, Math.min(80, tagMaxHeight)))
    }

    calculateMaxHeight()
    window.addEventListener('resize', calculateMaxHeight)
    return () => window.removeEventListener('resize', calculateMaxHeight)
  }, [])

  if (loading) {
    return (
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2 text-gray-500">{t('slang.tags')}</h2>
        <div className="animate-pulse flex flex-wrap gap-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-6 bg-gray-200 rounded-full px-3"></div>
          ))}
        </div>
      </div>
    )
  }

  if (tags.length === 0) {
    return (
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2 text-gray-500">{t('slang.tags')}</h2>
        <p className="text-gray-500 text-sm">{t('common.noResults')}</p>
      </div>
    )
  }

  const hasMore = tags.length > 10

  return (
    <div className="mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('slang.tags')}
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
          {tags.map((tag) => (
            <button
              key={tag.name}
              onClick={() => onTagClick(tag.name)}
              className={`${cn.tag} px-2 py-1 rounded-full text-xs cursor-pointer ${
                selectedTag === tag.name ? 'ring-2 ring-offset-1' : ''
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
