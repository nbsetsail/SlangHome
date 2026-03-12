'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CommentSection } from '@/components/Comment'
import EvolutionTimeline from '@/components/EvolutionTimeline'
import LoginModal from '@/components/LoginModal'
import ReportModal from '@/components/ReportModal'
import Header from '@/components/Header'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks/useTranslation'
import { slangCache } from '@/lib/client-cache'

const CACHE_DURATION = 24 * 60 * 60 * 1000

export default function SlangDetailPage() {
  const params = useParams()
  const id = params.id as string
  const locale = params?.locale ? (params.locale as string) : 'en'
  const { data: session } = useSession()
  const { cn } = useTheme()
  const { t } = useTranslation()
  const [slang, setSlang] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isLiked, setIsLiked] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const cacheKey = `detail_${id}_${locale}`

  useEffect(() => {
    fetchSlangDetails()
    incrementViewCount()
  }, [id])

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  const incrementViewCount = async () => {
    try {
      const response = await fetch('/api/views', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ slangId: id })
      })
      const data = await response.json()
      if (slang && data.views) {
        setSlang((prev: any) => ({
          ...prev,
          views: data.views
        }))
      }
    } catch (err) {
      console.error('Failed to increment view count:', err)
    }
  }

  const fetchSlangDetails = useCallback(async () => {
    setLoading(true)
    setError('')

    const cached = slangCache.get<any>(cacheKey)
    if (cached.data && !cached.isEmpty) {
      setSlang(cached.data)
      setIsLiked(cached.data.is_liked || false)
      setIsFavorited(cached.data.is_favorited || false)
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/slang/${id}?locale=${locale}`)
      const data = await response.json()
      if (data.error) {
        setError(data.error)
        setSlang(null)
      } else {
        setSlang(data)
        setIsLiked(data.is_liked || false)
        setIsFavorited(data.is_favorited || false)
        slangCache.set(cacheKey, data, CACHE_DURATION)
      }
    } catch (err) {
      setError('Failed to fetch slang details')
      setSlang(null)
    } finally {
      setLoading(false)
    }
  }, [id, locale, cacheKey])

  const handleLike = async () => {
    if (!session) {
      setShowLoginModal(true)
      return
    }
    
    try {
      const userId = session.user?.id || session.user?.email
      if (!userId) {
        setShowLoginModal(true)
        return
      }
      
      const optimisticResult = !isLiked
      setIsLiked(optimisticResult)
      if (slang) {
        setSlang({
          ...slang,
          likes: optimisticResult ? slang.likes + 1 : Math.max(0, slang.likes - 1)
        })
      }
      
      const response = await fetch('/api/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ slangId: id, userId })
      })
      const data = await response.json()
      if (!data.error) {
        setIsLiked(data.isLiked)
      } else {
        setIsLiked(!optimisticResult)
        if (slang) {
          setSlang({
            ...slang,
            likes: optimisticResult ? Math.max(0, slang.likes - 1) : slang.likes + 1
          })
        }
      }
    } catch (err) {
      console.error('Failed to like slang:', err)
      setIsLiked(!isLiked)
      if (slang) {
        setSlang({
          ...slang,
          likes: isLiked ? slang.likes + 1 : Math.max(0, slang.likes - 1)
        })
      }
    }
  }

  const handleFavorite = async () => {
    if (!session) {
      setShowLoginModal(true)
      return
    }
    
    try {
      const userId = session.user?.id || session.user?.email
      if (!userId) {
        setShowLoginModal(true)
        return
      }
      
      const optimisticResult = !isFavorited
      setIsFavorited(optimisticResult)
      if (slang) {
        setSlang({
          ...slang,
          favorites: optimisticResult ? slang.favorites + 1 : Math.max(0, slang.favorites - 1)
        })
      }
      
      const response = await fetch('/api/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ slangId: id, userId })
      })
      const data = await response.json()
      if (!data.error) {
        setIsFavorited(data.isFavorited)
      } else {
        setIsFavorited(!optimisticResult)
        if (slang) {
          setSlang({
            ...slang,
            favorites: optimisticResult ? Math.max(0, slang.favorites - 1) : slang.favorites + 1
          })
        }
      }
    } catch (err) {
      console.error('Failed to favorite slang:', err)
      setIsFavorited(!isFavorited)
      if (slang) {
        setSlang({
          ...slang,
          favorites: isFavorited ? slang.favorites + 1 : Math.max(0, slang.favorites - 1)
        })
      }
    }
  }

  const handleShare = async () => {
    if (!session) {
      setShowLoginModal(true)
      return
    }
    
    try {
      const userId = session.user?.id || session.user?.email
      if (!userId) {
        setShowLoginModal(true)
        return
      }
      
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ slangId: id, userId })
      })
      const data = await response.json()
      if (data.shared && slang) {
        setSlang({
          ...slang,
          shares: slang.shares + 1
        })
      }
      const shareLink = `${window.location.origin}/${locale}/slang/${id}?user_id=${encodeURIComponent(userId)}`
      await navigator.clipboard.writeText(shareLink)
      setToastMessage(t('slang.shareLinkCopied'))
      setShowToast(true)
    } catch (err) {
      console.error('Failed to share slang:', err)
    }
  }

  const handleLoadReplies = async (commentId: number, page: number) => {
    try {
      const userId = session?.user?.id || session?.user?.email || null
      const params = new URLSearchParams({
        commentId: String(commentId),
        page: String(page),
        userId: userId || ''
      })
      const response = await fetch(`/api/comment/replies?${params.toString()}`)
      const data = await response.json()
      if (data.replies) {
        setSlang((prev: any) => {
          if (!prev) return prev
          return {
            ...prev,
            comments: [...(prev.comments || []), ...data.replies]
          }
        })
      }
    } catch (err) {
      console.error('Failed to load replies:', err)
    }
  }

  const handleLikeComment = async (commentId: number) => {
    if (!session) {
      setShowLoginModal(true)
      return
    }
    
    try {
      const userId = session.user?.id || session.user?.email
      if (!userId) {
        setShowLoginModal(true)
        return
      }
      
      const response = await fetch('/api/comment/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ commentId, userId })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && slang) {
          setSlang({
            ...slang,
            comments: (slang.comments || []).map((comment: any) => {
              if (comment.id === commentId) {
                return {
                  ...comment,
                  likes: data.likeCount,
                  is_liked: data.isLiked
                }
              }
              return comment
            })
          })
        }
      }
    } catch (error) {
      console.error('Failed to like comment:', error)
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${cn.colors.bg.light} flex items-center justify-center`}>
        <div className={cn.loader.replace('h-6 w-6', 'h-12 w-12')}></div>
      </div>
    )
  }

  if (error || !slang) {
    return (
      <div className={`min-h-screen ${cn.colors.bg.light} flex items-center justify-center`}>
        <div className={`${cn.colors.bg.card} p-6 rounded-lg shadow-md max-w-md`}>
          <h2 className={`text-xl font-semibold ${cn.colors.text.error} mb-2`}>{t('common.error')}</h2>
          <p className={`${cn.colors.text.muted} mb-4`}>{error || t('slang.notFound')}</p>
          <a href={`/${locale}`} className={`${cn.primaryButton} py-2 px-4 rounded-md`}>
            {t('common.backToHome')}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${cn.colors.bg.light}`}>
      <Header showLoginModal={() => setShowLoginModal(true)} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`${cn.colors.bg.card} rounded-lg shadow-md p-6 mb-6`}>
          <div className="flex justify-between items-start mb-4">
            <h2 className={`text-2xl font-bold ${cn.title}`}>{slang.phrase}</h2>
            <span className={`${cn.heat} text-xs font-medium px-2.5 py-0.5 rounded-full`}>
              {t('slang.heat')}: {parseFloat(slang.heat).toFixed(1)}
            </span>
          </div>
          
          <div className="mb-4">
            <h3 className={`font-semibold ${cn.colors.text.muted} mb-2`}>{t('slang.explanation')}</h3>
            <p className={cn.colors.text.muted}>{slang.explanation}</p>
          </div>
          
          {slang.example && (
            <div className="mb-4">
              <h3 className={`font-semibold ${cn.colors.text.muted} mb-2`}>{t('slang.example')}</h3>
              <p className={`${cn.colors.text.muted} italic`}>{slang.example}</p>
            </div>
          )}
          
          {slang.origin && (
            <div className="mb-4">
              <h3 className={`font-semibold ${cn.colors.text.muted} mb-2`}>{t('slang.origin')}</h3>
              <p className={cn.colors.text.muted}>{slang.origin}</p>
            </div>
          )}
          
          {slang.categories && (
            <div className="mb-4">
              <h3 className={`font-semibold ${cn.colors.text.muted} mb-2`}>{t('slang.categories')}</h3>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(slang.categories) ? slang.categories : slang.categories.split(',')).map((category: string | any, index: number) => (
                  <span key={index} className={`${cn.tag} text-xs font-medium px-2.5 py-0.5 rounded-full`}>
                    {typeof category === 'string' ? category.trim() : category}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {slang.tags && (
            <div className="mb-4">
              <h3 className={`font-semibold ${cn.colors.text.muted} mb-2`}>{t('slang.tags')}</h3>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(slang.tags) ? slang.tags : slang.tags.split(',')).map((tag: string | any, index: number) => (
                  <span key={index} className={`${cn.tag} text-xs font-medium px-2.5 py-0.5 rounded-full`}>
                    {typeof tag === 'string' ? tag.trim() : tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center mb-6 pt-4 border-t">
            <div className="flex space-x-4">
              <span className={`flex items-center space-x-1 ${cn.colors.text.muted}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{slang.views}</span>
              </span>
              <span className={`flex items-center space-x-1 ${cn.colors.text.muted}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{slang.comments_count}</span>
              </span>
              <span className={`flex items-center space-x-1 ${cn.colors.text.muted}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>{slang.shares}</span>
              </span>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm ${cn.likeButton(isLiked)}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{slang.likes}</span>
              </button>
              
              <button
                onClick={handleFavorite}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm ${cn.favoriteButton(isFavorited)}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={isFavorited ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span>{slang.favorites}</span>
              </button>
              
              <button
                onClick={handleShare}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm ${cn.shareButton}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>{t('slang.share')}</span>
              </button>
              
              <button
                onClick={() => setShowReportModal(true)}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm ${cn.reportButton}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                <span>{t('slang.report')}</span>
              </button>
            </div>
          </div>
        </div>
        
        {slang.has_evolution && slang.evolution && slang.evolution.length > 0 && (
          <EvolutionTimeline evolution={slang.evolution} />
        )}
        
        <CommentSection 
          slangId={id}
          slangUserId={slang?.user_id}
          slangPhrase={slang?.phrase}
          comments={slang.comments || []}
          totalComments={slang.comments_count}
          onCommentAdded={(newCount) => {
            if (slang && newCount !== undefined) {
              setSlang((prev: any) => {
                if (!prev) return prev
                return { ...prev, comments_count: newCount }
              })
            }
          }}
          onLikeComment={handleLikeComment}
          onLoadReplies={handleLoadReplies}
          onLoadSubReplies={handleLoadReplies}
          onLoadMore={() => {}}
          hasMore={false}
          isLoading={false}
        />
      </main>
      
      <footer className={`${cn.colors.bg.card} shadow mt-8`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className={`text-center ${cn.colors.text.muted}`}>© 2026 Slang Home</p>
        </div>
      </footer>
      
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        onLoginSuccess={() => {
          window.location.reload()
        }}
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="slang"
        targetId={slang?.id}
      />

      {showToast && (
        <div className={`fixed bottom-4 right-4 ${cn.successMessage} px-4 py-2 rounded-md shadow-lg z-50`}>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
