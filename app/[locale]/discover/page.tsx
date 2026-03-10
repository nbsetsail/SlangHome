'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import LoginModal from '@/components/LoginModal'
import AddSlangModal from '@/components/AddSlangModal'
import SortByComponent from '@/components/SortByComponent'
import AdvertisementSlot from '@/components/AdvertisementSlot'
import JsonLd, { websiteJsonLd, organizationJsonLd, dictionaryAppJsonLd } from '@/components/JsonLd'
import { Sidebar } from '@/components/Sidebar'
import { SlangList } from '@/components/SlangList'
import { FilterInfo } from '@/components/FilterInfo'
import { useLocalStorage, useSlangList, useUrlFilters, useSidebar, useLocale } from '@/hooks'
import { useTheme } from '@/contexts/ThemeContext'

function DiscoverPageContent() {
  const locale = useLocale()
  const { data: session, status } = useSession({ required: false })
  const { cn } = useTheme()
  
  const [sortBy, setSortBy] = useLocalStorage('sortBy', 'heat')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const {
    currentCategory,
    currentTag,
    currentSearch,
    setCategory,
    setTag,
    setSearch,
    clearFilters,
    clearCategory,
    clearTag
  } = useUrlFilters()

  const {
    slangList,
    loading,
    isLoadingMore,
    error,
    hasMore,
    fetchSlang,
    resetList
  } = useSlangList({
    sortBy,
    userId: session?.user?.id,
    category: currentCategory,
    tag: currentTag,
    search: currentSearch,
    sessionStatus: status,
    locale
  })

  const {
    categories,
    tags,
    sidebarLoading,
    sidebarCollapsed,
    categoriesExpanded,
    tagsExpanded,
    toggleSidebar,
    setSidebarCollapsed,
    toggleCategoriesExpanded,
    toggleTagsExpanded,
    trackCategoryClick,
    trackTagClick
  } = useSidebar(locale)

  useEffect(() => {
    const handleSearchEvent = (event: CustomEvent) => {
      const searchQuery = event.detail?.search
      const category = event.detail?.category || ''
      const tag = event.detail?.tag || ''
      
      if (searchQuery !== undefined) {
        setSearch(searchQuery)
        setCategory(category)
        setTag(tag)
        resetList()
      }
    }

    const handleCategoryEvent = (event: CustomEvent) => {
      const category = event.detail?.category
      if (category) {
        setCategory(category)
        resetList()
      }
    }

    const handleTagEvent = (event: CustomEvent) => {
      const tag = event.detail?.tag
      if (tag) {
        setTag(tag)
        resetList()
      }
    }

    window.addEventListener('search', handleSearchEvent as EventListener)
    window.addEventListener('category', handleCategoryEvent as EventListener)
    window.addEventListener('tag', handleTagEvent as EventListener)

    return () => {
      window.removeEventListener('search', handleSearchEvent as EventListener)
      window.removeEventListener('category', handleCategoryEvent as EventListener)
      window.removeEventListener('tag', handleTagEvent as EventListener)
    }
  }, [setSearch, setCategory, setTag, resetList])

  const handleCategoryClick = useCallback((category: string) => {
    setCategory(category)
    trackCategoryClick(category)
    resetList()
  }, [setCategory, trackCategoryClick, resetList])

  const handleTagClick = useCallback((tag: string) => {
    setTag(tag)
    trackTagClick(tag)
    resetList()
  }, [setTag, trackTagClick, resetList])

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true)
  }

  const handleSubmitAddSlang = async (data: any) => {
    setAddLoading(true)

    try {
      const response = await fetch('/api/slang/contribute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...data, locale })
      })

      const result = await response.json()
      
      if (result.success) {
        setTimeout(() => {
          setIsAddModalOpen(false)
          resetList()
          fetchSlang(1)
        }, 1500)
      }
    } catch (error) {
      console.error('Error adding slang:', error)
    } finally {
      setAddLoading(false)
    }
  }

  const handleClearFilters = () => {
    clearFilters()
    resetList()
  }

  return (
    <>
      <JsonLd data={websiteJsonLd} />
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={dictionaryAppJsonLd} />
      
      <div className="min-h-screen bg-gray-100">
        <Header 
          showLoginModal={() => setShowLoginModal(true)} 
          showAddSlangModal={handleOpenAddModal}
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdvertisementSlot position="home_banner" className="w-full" wrapperClassName="py-2" />
        </div>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 min-w-[300px] max-w-3xl">
              <SortByComponent 
                sortBy={sortBy} 
                onSortChange={setSortBy} 
                sidebarCollapsed={sidebarCollapsed} 
                onSidebarToggle={toggleSidebar}
                infoMessage={
                  (currentSearch || currentCategory || currentTag) ? (
                    <FilterInfo
                      currentSearch={currentSearch}
                      currentCategory={currentCategory}
                      currentTag={currentTag}
                      onClearCategory={clearCategory}
                      onClearTag={clearTag}
                      onClearAll={handleClearFilters}
                    />
                  ) : null
                }
                onCloseInfo={handleClearFilters}
              />
              
              <SlangList
                slangList={slangList}
                loading={loading}
                isLoadingMore={isLoadingMore}
                error={error}
                hasMore={hasMore}
                loaderClassName={cn.loader.replace('h-6 w-6', 'h-8 w-8')}
              />
            </div>
            
            <Sidebar
              categories={categories}
              tags={tags}
              loading={sidebarLoading}
              collapsed={sidebarCollapsed}
              selectedCategory={currentCategory}
              selectedTag={currentTag}
              currentSearch={currentSearch}
              categoriesExpanded={categoriesExpanded}
              tagsExpanded={tagsExpanded}
              isMobile={isMobile}
              onCategoryClick={handleCategoryClick}
              onTagClick={handleTagClick}
              onToggleCategories={toggleCategoriesExpanded}
              onToggleTags={toggleTagsExpanded}
              onClose={() => setSidebarCollapsed(true)}
            />
          </div>
        </main>

        <AddSlangModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleSubmitAddSlang}
          loading={addLoading}
          session={session}
        />

        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
          onLoginSuccess={() => {}}
        />
      </div>
    </>
  )
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>}>
      <DiscoverPageContent />
    </Suspense>
  )
}
