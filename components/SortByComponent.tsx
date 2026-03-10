'use client'
import React, { isValidElement, Children } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks/useTranslation'

interface SortByComponentProps {
  sortBy: string
  onSortChange: (value: string) => void
  sidebarCollapsed: boolean
  onSidebarToggle: () => void
  infoMessage?: React.ReactNode
  onCloseInfo?: () => void
}

function hasContent(node: React.ReactNode): boolean {
  if (node === null || node === undefined || node === false) {
    return false
  }
  
  if (typeof node === 'string' || typeof node === 'number') {
    return node.toString().trim().length > 0
  }
  
  if (Array.isArray(node)) {
    return node.some(child => hasContent(child))
  }
  
  if (isValidElement(node)) {
    const children = (node.props as any)?.children
    if (children !== undefined) {
      return hasContent(children)
    }
  }
  
  return true
}

export default function SortByComponent({ sortBy, onSortChange, sidebarCollapsed, onSidebarToggle, infoMessage, onCloseInfo }: SortByComponentProps) {
  const { cn } = useTheme()
  const { t } = useTranslation()
  const showInfo = hasContent(infoMessage)
  
  const sortOptions = [
    { value: 'heat', label: t('search.heatFirst') },
    { value: 'newest', label: t('search.newestFirst') },
    { value: 'views', label: t('search.mostViewed') },
    { value: 'likes', label: t('search.mostLiked') },
    { value: 'favorites', label: t('search.mostFavorited') },
    { value: 'comments', label: t('search.mostCommented') },
    { value: 'shares', label: t('search.mostShared') }
  ]
  
  return (
    <div className={`sticky top-20 ${cn.colors.bg.card} p-4 rounded-md shadow-sm mb-4 z-10`}>
      {showInfo && (
        <div className={`mb-3 p-2 ${cn.colors.bg.light} border ${cn.colors.info.border} rounded-md flex justify-between items-center`} style={{ maxHeight: '48px' }}>
          <div className={`${cn.colors.text.secondary} text-sm flex-1 break-words`}>
            {infoMessage}
          </div>
          {onCloseInfo && (
            <button 
              onClick={onCloseInfo}
              className={`${cn.colors.text.primary} ${cn.link} ml-2 flex-shrink-0 transition-all duration-200`}
              aria-label={t('common.close')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <span className={`mr-2 text-sm ${cn.colors.text.muted}`}>{t('search.sortByLabel')}</span>
          <select 
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className={`border rounded-md px-2 py-1 text-sm ${cn.input}`}
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={onSidebarToggle}
          className={`p-2 rounded-md transition-all duration-200 ${sidebarCollapsed ? `${cn.colors.bg.medium} ${cn.colors.text.primary}` : `${cn.colors.bg.light} ${cn.colors.text.muted}`} ${cn.colors.bg.lightHover}`}
          aria-label={sidebarCollapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {sidebarCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12l-6-6-6 6m12 0l-6 6-6-6" />
            )}
          </svg>
        </button>
      </div>
    </div>
  )
}
