'use client'

import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks/useTranslation'

interface FilterInfoProps {
  currentSearch: string
  currentCategory: string
  currentTag: string
  onClearCategory: () => void
  onClearTag: () => void
  onClearAll: () => void
}

export function FilterInfo({
  currentSearch,
  currentCategory,
  currentTag,
  onClearCategory,
  onClearTag,
  onClearAll
}: FilterInfoProps) {
  const { cn } = useTheme()
  const { t } = useTranslation()

  if (!currentSearch && !currentCategory && !currentTag) {
    return null
  }

  if (currentSearch) {
    return (
      <div className="grid grid-cols-[1fr_auto] gap-2 w-full items-center">
        <div className="overflow-hidden">
          <div className="line-clamp-2 text-sm sm:text-xs" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}>
            {t('search.searchResultsFor', { keyword: currentSearch })}
          </div>
        </div>
        <div className="min-w-[160px]">
          <div className="flex flex-wrap items-center gap-2 justify-end">
            {currentCategory && (
              <div 
                className={`${cn.colors.bg.light} ${cn.colors.text.secondary} px-2 py-0.5 rounded text-[10px] flex flex-col relative group`} 
                style={{ lineHeight: '1.1', maxWidth: '120px' }}
              >
                <div className="font-semibold">{t('search.category')}</div>
                <div className="mt-0.5 truncate pr-3">{currentCategory}</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onClearCategory()
                  }}
                  className={`absolute top-0 right-0 ${cn.link} opacity-0 group-hover:opacity-100 transition-opacity`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            {currentTag && (
              <div 
                className={`${cn.tag} px-2 py-0.5 rounded text-[10px] flex flex-col relative group`} 
                style={{ lineHeight: '1.1', maxWidth: '120px' }}
              >
                <div className="font-semibold">{t('search.tag')}</div>
                <div className="mt-0.5 truncate pr-3">{currentTag}</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onClearTag()
                  }}
                  className="absolute top-0 right-0 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 w-full">
      {currentCategory && (
        <span className="text-sm">
          {t('search.showResultsForCategory', { category: currentCategory })}
          <button
            onClick={onClearCategory}
            className="ml-2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </span>
      )}
      {currentTag && (
        <span className="text-sm">
          {t('search.showResultsForTag', { tag: currentTag })}
          <button
            onClick={onClearTag}
            className="ml-2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </span>
      )}
    </div>
  )
}
