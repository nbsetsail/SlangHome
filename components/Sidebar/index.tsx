'use client'

import React from 'react'
import { SidebarContent } from './SidebarContent'

interface SidebarProps {
  categories: { name: string; heat?: number }[]
  tags: { name: string; heat?: number }[]
  loading: boolean
  collapsed: boolean
  selectedCategory: string
  selectedTag: string
  currentSearch: string
  categoriesExpanded: boolean
  tagsExpanded: boolean
  isMobile: boolean
  onCategoryClick: (category: string) => void
  onTagClick: (tag: string) => void
  onToggleCategories: () => void
  onToggleTags: () => void
  onClose: () => void
}

export function Sidebar({
  categories,
  tags,
  loading,
  collapsed,
  selectedCategory,
  selectedTag,
  currentSearch,
  categoriesExpanded,
  tagsExpanded,
  isMobile,
  onCategoryClick,
  onTagClick,
  onToggleCategories,
  onToggleTags,
  onClose
}: SidebarProps) {
  if (collapsed) {
    return null
  }

  if (isMobile) {
    return (
      <>
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" 
          onClick={onClose}
        />
        <div className="fixed right-0 top-0 h-full w-72 bg-white dark:bg-gray-800 shadow-xl z-30 p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sidebar</h2>
            <button onClick={onClose} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <SidebarContent
            categories={categories}
            tags={tags}
            loading={loading}
            selectedCategory={selectedCategory}
            selectedTag={selectedTag}
            currentSearch={currentSearch}
            categoriesExpanded={categoriesExpanded}
            tagsExpanded={tagsExpanded}
            onCategoryClick={onCategoryClick}
            onTagClick={onTagClick}
            onToggleCategories={onToggleCategories}
            onToggleTags={onToggleTags}
          />
        </div>
      </>
    )
  }

  return (
    <div className="shrink-0 md:sticky md:top-24 self-start transition-all duration-300 md:w-80 lg:w-96">
      <div className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-md sidebar-content">
        <SidebarContent
          categories={categories}
          tags={tags}
          loading={loading}
          selectedCategory={selectedCategory}
          selectedTag={selectedTag}
          currentSearch={currentSearch}
          categoriesExpanded={categoriesExpanded}
          tagsExpanded={tagsExpanded}
          onCategoryClick={onCategoryClick}
          onTagClick={onTagClick}
          onToggleCategories={onToggleCategories}
          onToggleTags={onToggleTags}
        />
      </div>
    </div>
  )
}
