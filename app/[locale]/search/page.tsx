'use client'
import React, { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import SlangCard from '@/components/SlangCard'
import Header from '@/components/Header'
import LoginModal from '@/components/LoginModal'
import AddSlangModal from '@/components/AddSlangModal'
import AdvertisementSlot from '@/components/AdvertisementSlot'
import AsyncSelect from '@/components/AsyncSelect'
import { ContentLoader, ErrorMessage } from '@/components/ui'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks'

const truncateKeyword = (text: string, maxLength: number = 30) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function SearchPageContent() {
  const params = useParams()
  const locale = params?.locale ? (params.locale as string) : 'en'
  const { data: session, status } = useSession({ required: false })
  const searchParams = useSearchParams()
  const router = useRouter()
  const { cn } = useTheme()
  const { t } = useTranslation()
  
  const sortOptions = [
    { value: 'heat', label: t('search.heatFirst') },
    { value: 'newest', label: t('search.newestFirst') },
    { value: 'views', label: t('search.mostViewed') },
    { value: 'likes', label: t('search.mostLiked') },
    { value: 'favorites', label: t('search.mostFavorited') },
    { value: 'comments', label: t('search.mostCommented') },
    { value: 'shares', label: t('search.mostShared') },
    { value: 'oldest', label: t('search.oldestFirst') }
  ]

  const dateRangeOptions = [
    { value: 'all', label: t('search.allTime') },
    { value: 'today', label: t('search.today') },
    { value: 'week', label: t('search.thisWeek') },
    { value: 'month', label: t('search.thisMonth') },
    { value: 'year', label: t('search.thisYear') }
  ]
  
  const [slangList, setSlangList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('')
  const [tag, setTag] = useState('')
  const [sortBy, setSortBy] = useState('heat')
  const [dateRange, setDateRange] = useState('all')
  const [includeEvolution, setIncludeEvolution] = useState(true)
  
  const [tempKeyword, setTempKeyword] = useState('')
  const [tempCategory, setTempCategory] = useState('')
  const [tempTag, setTempTag] = useState('')
  const [tempSortBy, setTempSortBy] = useState('heat')
  const [tempDateRange, setTempDateRange] = useState('all')
  const [tempIncludeEvolution, setTempIncludeEvolution] = useState(true)
  
  const [showAdvanced, setShowAdvanced] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    const searchKeyword = searchParams.get('keyword') || ''
    const searchCategory = searchParams.get('category') || ''
    const searchTag = searchParams.get('tag') || ''
    const searchSort = searchParams.get('sortBy') || 'heat'
    const searchDate = searchParams.get('dateRange') || 'all'
    const searchEvolution = searchParams.get('includeEvolution')
    const includeEvolutionParam = searchEvolution === null ? true : searchEvolution === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    
    setKeyword(searchKeyword)
    setCategory(searchCategory)
    setTag(searchTag)
    setSortBy(searchSort)
    setDateRange(searchDate)
    setIncludeEvolution(includeEvolutionParam)
    setTempKeyword(searchKeyword)
    setTempCategory(searchCategory)
    setTempTag(searchTag)
    setTempSortBy(searchSort)
    setTempDateRange(searchDate)
    setTempIncludeEvolution(includeEvolutionParam)
    setCurrentPage(page)
    
    if (searchKeyword || searchCategory || searchTag) {
      fetchSearchResults(searchKeyword, searchCategory, searchTag, searchSort, searchDate, includeEvolutionParam, page)
    }
  }, [searchParams])

  const fetchSearchResults = async (kw: string, cat: string, tg: string, sort: string, date: string, evolution: boolean, page: number) => {
    setLoading(true)
    setError('')
    setHasSearched(true)
    try {
      const userId = session?.user?.id
      const params = new URLSearchParams()
      if (kw) params.set('keyword', kw)
      if (cat) params.set('category', cat)
      if (tg) params.set('tag', tg)
      params.set('sortBy', sort)
      params.set('dateRange', date)
      params.set('includeEvolution', evolution.toString())
      params.set('page', page.toString())
      params.set('limit', '20')
      params.set('locale', locale)
      if (userId) params.set('userId', userId)
      
      const response = await fetch(`/api/search?${params.toString()}`)
      const data = await response.json()
      
      if (data.error) {
        console.error('Search API error:', data.error)
        setError(t('errors.searchFailed'))
        setSlangList([])
      } else {
        setSlangList(data.slang || [])
        setTotalPages(data.pagination?.totalPages || 0)
        setTotalItems(data.pagination?.totalItems || 0)
      }
    } catch (err) {
      console.error('Network error:', err)
      setError(t('errors.searchFailed'))
      setSlangList([])
    } finally {
      setLoading(false)
    }
  }

  const resetFilters = () => {
    setTempKeyword('')
    setTempCategory('')
    setTempTag('')
    setTempSortBy('heat')
    setTempDateRange('all')
    setTempIncludeEvolution(true)
    setHasSearched(false)
    setSlangList([])
  }

  const handleFilterChange = () => {
    setHasSearched(false)
    setSlangList([])
  }

  const applyFilters = () => {
    setKeyword(tempKeyword)
    setCategory(tempCategory)
    setTag(tempTag)
    setSortBy(tempSortBy)
    setDateRange(tempDateRange)
    setIncludeEvolution(tempIncludeEvolution)
    
    const params = new URLSearchParams()
    if (tempKeyword) params.set('keyword', tempKeyword)
    if (tempCategory) params.set('category', tempCategory)
    if (tempTag) params.set('tag', tempTag)
    params.set('sortBy', tempSortBy)
    params.set('dateRange', tempDateRange)
    params.set('includeEvolution', tempIncludeEvolution.toString())
    params.set('page', '1')
    
    router.push(`/${locale}/search?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    router.push(`/${locale}/search?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header showLoginModal={() => setShowLoginModal(true)} showAddSlangModal={() => setIsAddModalOpen(true)} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('search.title')}</h2>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`text-sm ${cn.link} self-start sm:self-auto hidden sm:block`}
              >
                {showAdvanced ? t('search.hideFilters') : t('search.showFilters')}
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="w-full max-w-lg">
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('search.keyword')}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempKeyword}
                    onChange={(e) => {
                      setTempKeyword(e.target.value)
                      handleFilterChange()
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        applyFilters()
                      }
                    }}
                    placeholder={t('search.enterKeyword')}
                    maxLength={50}
                    className={`flex-1 px-3 py-2 border rounded-md min-w-0 ${cn.input}`}
                  />
                  <button
                    onClick={applyFilters}
                    className={`px-4 py-2 ${cn.colors.button.primary} rounded-md shrink-0`}
                  >
                    {t('common.search')}
                  </button>
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 shrink-0"
                  >
                    {t('common.reset')}
                  </button>
                </div>
              </div>
              
              {showAdvanced && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('search.sortBy')}</label>
                      <select
                        value={tempSortBy}
                        onChange={(e) => {
                          setTempSortBy(e.target.value)
                          handleFilterChange()
                        }}
                        className={`w-full px-3 py-2 border rounded-md ${cn.input}`}
                      >
                        {sortOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('search.timePeriod')}</label>
                      <select
                        value={tempDateRange}
                        onChange={(e) => {
                          setTempDateRange(e.target.value)
                          handleFilterChange()
                        }}
                        className={`w-full px-3 py-2 border rounded-md ${cn.input}`}
                      >
                        {dateRangeOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('search.category')}</label>
                      <AsyncSelect
                        value={tempCategory}
                        onChange={(value) => {
                          setTempCategory(value)
                          handleFilterChange()
                        }}
                        placeholder={t('search.allCategories')}
                        fetchUrl="/api/categories"
                        locale={locale}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('search.tag')}</label>
                      <AsyncSelect
                        value={tempTag}
                        onChange={(value) => {
                          setTempTag(value)
                          handleFilterChange()
                        }}
                        placeholder={t('search.allTags')}
                        fetchUrl="/api/tags"
                        locale={locale}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="includeEvolution"
                      checked={tempIncludeEvolution}
                      onChange={(e) => {
                        setTempIncludeEvolution(e.target.checked)
                        handleFilterChange()
                      }}
                      className={`w-4 h-4 ${cn.colors.text.primary} border-gray-300 rounded ${cn.colors.border.ring}`}
                    />
                    <label htmlFor="includeEvolution" className="text-sm text-gray-600 dark:text-gray-400">
                      {t('search.includeEvolution')}
                    </label>
                  </div>
                </>
              )}
              
              <div className="flex sm:hidden justify-center mt-2">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`text-sm ${cn.link}`}
                >
                  {showAdvanced ? t('search.hideFilters') : t('search.showFilters')}
                </button>
              </div>
            </div>
          </div>

          <AdvertisementSlot position="advanced_search" className="w-full" wrapperClassName="py-4" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 min-w-0">
            <div className="flex-1">
              <h1 className="text-2xl font-bold break-words text-gray-900 dark:text-white">
                {hasSearched ? (
                  <>
                    {keyword ? t('search.resultsFor', { keyword: truncateKeyword(keyword) }) : t('search.searchResults')}
                    {category && <span className="text-base font-normal text-gray-600 dark:text-gray-400"> {t('search.inCategory', { category })}</span>}
                    {tag && <span className="text-base font-normal text-gray-600 dark:text-gray-400"> {t('search.withTag', { tag })}</span>}
                  </>
                ) : (
                  t('common.readyToSearch')
                )}
              </h1>
              {!hasSearched && (tempKeyword || tempCategory || tempTag) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tempKeyword && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {t('search.keyword')}: {tempKeyword}
                    </span>
                  )}
                  {tempCategory && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {t('search.category')}: {tempCategory}
                    </span>
                  )}
                  {tempTag && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {t('search.tag')}: {tempTag}
                    </span>
                  )}
                </div>
              )}
            </div>
            {hasSearched && !loading && totalItems > 0 && (
              <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap shrink-0">
                {t('common.resultsFound', { count: totalItems })}
              </span>
            )}
          </div>
          
          {loading ? (
            <ContentLoader text={t('common.searching')} minHeight="py-12" />
          ) : !hasSearched ? (
            <div className={`${cn.colors.info.bg} ${cn.colors.info.text} border ${cn.colors.info.border} p-4 rounded-md`}>
              {t('common.configureFilters')}
            </div>
          ) : error ? (
            <ErrorMessage message={error} type="error" className="mb-4 rounded-md" />
          ) : slangList.length === 0 ? (
            <div className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 p-4 rounded-md mb-4">
              {keyword ? t('search.noResultsFor', { keyword }) : t('common.noResults')}
            </div>
          ) : (
            <div className="space-y-4">
              {slangList.map(slang => (
                <SlangCard
                  key={slang.id}
                  {...slang}
                  evolution={slang.evolution || []}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 border rounded-md disabled:opacity-50 ${cn.input}`}
              >
                {t('common.previous')}
              </button>
              <span className="px-4 py-2 text-gray-900 dark:text-white">
                {t('common.pageOf', { current: currentPage, total: totalPages })}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 border rounded-md disabled:opacity-50 ${cn.input}`}
              >
                {t('common.next')}
              </button>
            </div>
          )}
        </div>
      </main>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        onLoginSuccess={() => {}}
      />

      <AddSlangModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={async (data) => {
          setAddLoading(true)
          try {
            const response = await fetch('/mgr/api/slang', {
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
              }, 1500)
            }
          } catch (error) {
            console.error('Error adding slang:', error)
          } finally {
            setAddLoading(false)
          }
        }}
        loading={addLoading}
        session={session}
      />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>}>
      <SearchPageContent />
    </Suspense>
  )
}
