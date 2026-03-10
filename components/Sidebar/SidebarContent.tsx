'use client'

import React from 'react'
import { CategoryList } from './CategoryList'
import { TagList } from './TagList'
import { SidebarFooter } from './SidebarFooter'
import SearchBox from '@/components/SearchBox'

interface SidebarContentProps {
  categories: { name: string; heat?: number }[]
  tags: { name: string; heat?: number }[]
  loading: boolean
  selectedCategory: string
  selectedTag: string
  currentSearch: string
  categoriesExpanded: boolean
  tagsExpanded: boolean
  onCategoryClick: (category: string) => void
  onTagClick: (tag: string) => void
  onToggleCategories: () => void
  onToggleTags: () => void
}

export function SidebarContent({
  categories,
  tags,
  loading,
  selectedCategory,
  selectedTag,
  currentSearch,
  categoriesExpanded,
  tagsExpanded,
  onCategoryClick,
  onTagClick,
  onToggleCategories,
  onToggleTags
}: SidebarContentProps) {
  return (
    <div>
      <div className="mb-3">
        <SearchBox 
          inputClassName="w-full"
          className="w-full"
        />
      </div>
      
      <CategoryList
        categories={categories}
        loading={loading}
        selectedCategory={selectedCategory}
        currentSearch={currentSearch}
        expanded={categoriesExpanded}
        onCategoryClick={onCategoryClick}
        onToggleExpand={onToggleCategories}
      />
      
      <TagList
        tags={tags}
        loading={loading}
        selectedTag={selectedTag}
        currentSearch={currentSearch}
        expanded={tagsExpanded}
        onTagClick={onTagClick}
        onToggleExpand={onToggleTags}
      />
      
      <SidebarFooter />
    </div>
  )
}
