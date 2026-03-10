'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Header from '@/components/Header'
import LoginModal from '@/components/LoginModal'
import { useLocale, useTranslation } from '@/hooks'
import { useTheme } from '@/contexts/ThemeContext'
import { formatShortDate } from '@/lib/date-utils'

interface Activity {
  id: number
  title: string
  description: string
  status: 'ongoing' | 'upcoming' | 'ended'
  start_date: string
  end_date: string
  cover_image: string | null
  participants_count: number
  rewards: string | null
}

export default function ActivitiesPage() {
  const locale = useLocale()
  const { t } = useTranslation()
  const { cn } = useTheme()
  
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const PAGE_SIZE = 10

  const fetchActivities = useCallback(async (isLoadMore = false) => {
    try {
      const currentOffset = isLoadMore ? offset : 0
      const response = await fetch(`/api/activities?locale=${locale}&limit=${PAGE_SIZE}&offset=${currentOffset}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const newActivities = data.data.activities || []
          if (isLoadMore) {
            setActivities(prev => [...prev, ...newActivities])
          } else {
            setActivities(newActivities)
          }
          setHasMore(data.data.hasMore)
          setOffset(currentOffset + newActivities.length)
        }
      }
    } catch (err) {
      console.error('Error fetching activities:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [locale, offset])

  useEffect(() => {
    setLoading(true)
    setOffset(0)
    setActivities([])
    fetchActivities(false)
  }, [locale])

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 200 &&
        hasMore &&
        !loadingMore &&
        !loading
      ) {
        setLoadingMore(true)
        fetchActivities(true)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMore, loadingMore, loading, fetchActivities])

  const ongoingActivities = activities.filter(a => a.status === 'ongoing')
  const upcomingActivities = activities.filter(a => a.status === 'upcoming')
  const pastActivities = activities.filter(a => a.status === 'ended')

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    return formatShortDate(dateStr, locale)
  }

  const renderActivityCard = (activity: Activity) => (
    <div 
      key={activity.id}
      className={`${cn.colors.bg.card} rounded-lg border ${cn.colors.border.default} overflow-hidden hover:shadow-md transition-shadow duration-200`}
    >
      {activity.cover_image && (
        <div className="h-40 bg-gray-200 relative">
          <img 
            src={activity.cover_image} 
            alt={activity.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {activity.status === 'ongoing' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
              {t('activities.ongoing')}
            </span>
          )}
          {activity.status === 'upcoming' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              {t('activities.upcoming')}
            </span>
          )}
          {activity.status === 'ended' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22,4 12,14.01 9,11.01"/>
              </svg>
              {t('activities.past')}
            </span>
          )}
        </div>
        
        <h3 className={`font-semibold ${cn.colors.text.primary} mb-2`}>
          {activity.title}
        </h3>
        
        <p className={`text-sm ${cn.colors.text.secondary} mb-3 line-clamp-2`}>
          {activity.description}
        </p>
        
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
          {activity.status === 'ongoing' && (
            <>
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('activities.deadline')}: {formatDate(activity.end_date)}
              </span>
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {activity.participants_count} {t('activities.participants')}
              </span>
            </>
          )}
          {activity.status === 'upcoming' && (
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t('activities.startDate')}: {formatDate(activity.start_date)}
            </span>
          )}
          {activity.status === 'ended' && (
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(activity.start_date)} - {formatDate(activity.end_date)}
            </span>
          )}
        </div>
        
        {activity.rewards && (
          <div className="text-xs text-yellow-600 dark:text-yellow-400 mb-3">
            {activity.rewards}
          </div>
        )}
        
        <button 
          className={`w-full py-2 rounded-lg text-sm font-medium ${
            activity.status === 'ended' 
              ? `${cn.colors.bg.light} ${cn.colors.text.secondary}`
              : cn.primaryButton
          } transition-all duration-200`}
        >
          {activity.status === 'ended' ? t('activities.viewRecap') : t('activities.viewDetails')}
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <Header showLoginModal={() => setShowLoginModal(true)} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className={`text-2xl md:text-3xl font-bold ${cn.colors.text.primary} flex items-center gap-2`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <circle cx="12" cy="15" r="1"/>
              </svg>
              {t('activities.title')}
            </h1>
          </div>

          {loading ? (
            <div className="space-y-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className={`h-6 ${cn.colors.bg.card} rounded w-32 mb-4`}></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(j => (
                      <div key={j} className={`${cn.colors.bg.card} rounded-lg p-4`}>
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {ongoingActivities.length > 0 && (
                <section>
                  <h2 className={`text-xl font-semibold ${cn.colors.text.primary} mb-4 flex items-center gap-2`}>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    {t('activities.ongoing')}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ongoingActivities.map(renderActivityCard)}
                  </div>
                </section>
              )}

              {upcomingActivities.length > 0 && (
                <section>
                  <h2 className={`text-xl font-semibold ${cn.colors.text.primary} mb-4 flex items-center gap-2`}>
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    {t('activities.upcoming')}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingActivities.map(renderActivityCard)}
                  </div>
                </section>
              )}

              {pastActivities.length > 0 && (
                <section>
                  <h2 className={`text-xl font-semibold ${cn.colors.text.primary} mb-4 flex items-center gap-2`}>
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    {t('activities.past')}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pastActivities.map(renderActivityCard)}
                  </div>
                </section>
              )}

              {activities.length === 0 && (
                <div className={`${cn.colors.bg.card} rounded-lg p-12 text-center border ${cn.colors.border.default}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <p className={cn.colors.text.secondary}>
                    {t('activities.noOngoing')}
                  </p>
                </div>
              )}

              {loadingMore && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}

              {!hasMore && activities.length > 0 && (
                <div className="text-center py-8">
                  <p className={cn.colors.text.secondary}>{t('activities.noMore')}</p>
                </div>
              )}
            </div>
          )}
        </main>

        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
          onLoginSuccess={() => {}}
        />
      </div>
    </>
  )
}
