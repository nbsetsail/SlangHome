'use client'
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import LoginModal from './LoginModal'
import { LoadingIndicator, ContentLoader } from '@/components/ui'
import EvolutionTimeline from './EvolutionTimeline'
import CommentSection from './Comment/CommentSection'
import AdvertisementSlot from './AdvertisementSlot'
import { EvolutionItem, CommentItem } from '../types'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks/useTranslation'

interface SlangDetailModalProps {
  isOpen: boolean
  onClose: () => void
  slangId: string
}

export default function SlangDetailModal({ isOpen, onClose, slangId }: SlangDetailModalProps) {
  const { cn } = useTheme()
  const { t } = useTranslation()
  const params = useParams()
  const locale = params?.locale as string || 'en'
  const [slang, setSlang] = useState<any>(null)
  const [evolutionData, setEvolutionData] = useState<EvolutionItem[]>([])
  const [commentsCount, setCommentsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showEvolution, setShowEvolution] = useState(false)
  const [isLoadingEvolution, setIsLoadingEvolution] = useState(false)
  const [currentViews, setCurrentViews] = useState(0)
  const [currentLikes, setCurrentLikes] = useState(0)
  const [currentFavorites, setCurrentFavorites] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const { data: session } = useSession()

  // Fetch slang details when modal opens, slangId changes, or session changes
  useEffect(() => {
    if (isOpen && slangId) {
      fetchSlangDetails()
    }
  }, [isOpen, slangId, session])

  const fetchSlangDetails = async () => {
    setIsLoading(true)
    try {
      // Use /api/slang/[id] route
      let url = `/api/slang/${slangId}`
      // Add userId as query parameter if user is logged in
      if (session?.user?.id) {
        url += `?userId=${session.user.id}`
      }
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        // Ensure has_evolution is a boolean
        let processedData = {
          ...data,
          has_evolution: !!data.has_evolution
        }
        
        // Fetch comments data
        try {
          const commentsResponse = await fetch(`/api/slang/comments?slangId=${slangId}`)
          const commentsData = await commentsResponse.json()
          if (!commentsData.error) {
            processedData = {
              ...processedData,
              comments: commentsData.comments || []
            }
          }
        } catch (error) {
          console.error('Error fetching comments:', error)
        }
        
        setSlang(processedData)
        setCurrentViews(data.views || 0)
        setCurrentLikes(data.likes || 0)
        setCurrentFavorites(data.favorites || 0)
        setCommentsCount(data.comments_count || 0)
        setIsLiked(data.isLiked || false)
        setIsFavorited(data.isFavorited || false)
      } else {
        console.error('Failed to fetch slang details')
      }
    } catch (error) {
      console.error('Error fetching slang details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewEvolution = async () => {
    if (!showEvolution && slang?.has_evolution) {
      setIsLoadingEvolution(true)
      try {
        const response = await fetch(`/api/slang/evolution?slangId=${slangId}`)
        if (response.ok) {
          const data = await response.json()
          setEvolutionData(data.evolution || [])
        }
      } catch (error) {
        console.error('Failed to load evolution data:', error)
      } finally {
        setIsLoadingEvolution(false)
      }
    }
    setShowEvolution(!showEvolution)
  }

  const handleLike = async () => {
    if (!session || !session.user?.id) {
      setShowLoginModal(true)
      return
    }
    
    const userId = session.user.id
    
    const optimisticResult = !isLiked
    setIsLiked(optimisticResult)
    setCurrentLikes(prev => optimisticResult ? prev + 1 : Math.max(0, prev - 1))
    
    try {
      const response = await fetch('/api/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ slangId, userId })
      })
      
      if (!response.ok) {
        console.error('Failed to toggle like')
        setIsLiked(!optimisticResult)
        setCurrentLikes(prev => optimisticResult ? Math.max(0, prev - 1) : prev + 1)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      setIsLiked(!optimisticResult)
      setCurrentLikes(prev => optimisticResult ? Math.max(0, prev - 1) : prev + 1)
    }
  }

  const handleFavorite = async () => {
    if (!session || !session.user?.id) {
      setShowLoginModal(true)
      return
    }
    
    const userId = session.user.id
    
    const optimisticResult = !isFavorited
    setIsFavorited(optimisticResult)
    setCurrentFavorites(prev => optimisticResult ? prev + 1 : Math.max(0, prev - 1))
    
    try {
      const response = await fetch('/api/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ slangId, userId })
      })
      
      if (!response.ok) {
        console.error('Failed to toggle favorite')
        setIsFavorited(!optimisticResult)
        setCurrentFavorites(prev => optimisticResult ? Math.max(0, prev - 1) : prev + 1)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      setIsFavorited(!optimisticResult)
      setCurrentFavorites(prev => optimisticResult ? Math.max(0, prev - 1) : prev + 1)
    }
  }

  const handleShare = async () => {
    try {
      await fetch('/api/slang/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ slangId })
      })
    } catch (error) {
      console.error('Error incrementing share count:', error)
    }
    
    const shareLink = `${window.location.origin}/slang/phrase/${encodeURIComponent(slang?.phrase || '')}`
    navigator.clipboard.writeText(shareLink).then(() => {
      setToastMessage(t('slang.shareLinkCopied'))
      setShowToast(true)
    }).catch(() => {
      setToastMessage(t('slang.shareLink', { url: shareLink }))
      setShowToast(true)
    })
  }

  const handleLoadReplies = async (commentId: number, page: number) => {
    try {
      const userId = session?.user?.id || session?.user?.email || null
      const response = await fetch(`/api/comment/replies?commentId=${commentId}&page=${page}&pageSize=20&userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        const replies = data.replies || []
        if (slang) {
          setSlang((prev: any) => ({
            ...prev,
            comments: [...(prev.comments || []), ...replies]
          }))
        }
      }
    } catch (error) {
      console.error('Failed to load replies:', error)
    }
  }

  const handleLoadSubReplies = async (commentId: number, page: number) => {
    try {
      const userId = session?.user?.id || session?.user?.email || null
      const response = await fetch(`/api/comment/replies?commentId=${commentId}&page=${page}&pageSize=20&userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        const replies = data.replies || []
        if (slang) {
          setSlang((prev: any) => ({
            ...prev,
            comments: [...(prev.comments || []), ...replies]
          }))
        }
      }
    } catch (error) {
      console.error('Failed to load sub-replies:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className={`fixed inset-x-0 inset-y-0 z-30 flex items-start justify-center pt-24 ${cn.modalOverlay}`}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div className="w-full max-w-4xl max-h-[calc(100vh-6rem)] overflow-hidden flex flex-col">
        <div 
          className={`${cn.modalBg} rounded-t-lg shadow-xl p-8 border`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-2">
            <h2 className={`text-2xl font-bold ${cn.title}`}>{slang?.phrase || t('slang.details')}</h2>
            <div className="flex items-center space-x-2">
              <span className={`${cn.heat} text-xs font-medium px-2.5 py-0.5 rounded-full`}>
                {t('slang.heat')}: {slang?.heat ? parseFloat(slang.heat).toFixed(1) : '0.0'}
              </span>
              <button
                onClick={onClose}
                className={`p-1.5 rounded-full ${cn.colors.text.muted} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div 
          className={`${cn.modalBg} rounded-b-lg shadow-xl p-8 border overflow-y-auto flex-grow`}
          onClick={(e) => e.stopPropagation()}
        >
          {isLoading ? (
            <ContentLoader text={t('common.loadingContent')} minHeight="py-10" />
          ) : slang ? (
            <div>
              
              <div className="mb-6">
                <h3 className={`font-semibold ${cn.colors.text.muted} mb-2`}>{t('slang.explanation')}</h3>
                <p className={cn.colors.text.muted}>{slang.explanation}</p>
              </div>
              
              {slang.example && (
                <div className="mb-6">
                  <h3 className={`font-semibold ${cn.colors.text.muted} mb-2`}>{t('slang.example')}</h3>
                  <p className={`${cn.colors.text.muted} italic`}>{slang.example}</p>
                </div>
              )}
              
              {slang.origin && (
                <div className="mb-6">
                  <h3 className={`font-semibold ${cn.colors.text.muted} mb-2`}>{t('slang.origin')}</h3>
                  <p className={cn.colors.text.muted}>{slang.origin}</p>
                </div>
              )}
              
              {slang.categories && (
                <div className="mb-6">
                  <h3 className={`font-semibold ${cn.colors.text.muted} mb-2`}>{t('slang.categories')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(slang.categories) ? slang.categories : slang.categories.split(',')).map((category: string | any, index: number) => (
                      <span 
                        key={index} 
                        className={`inline-block ${cn.tag} text-xs font-medium px-2.5 py-0.5 rounded-full cursor-pointer`}
                        onClick={() => {
                          const newUrl = new URL(window.location.origin)
                          newUrl.search = `?category=${encodeURIComponent(typeof category === 'string' ? category.trim() : category)}`
                          window.location.href = newUrl.toString()
                        }}
                      >
                        {typeof category === 'string' ? category.trim() : category}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {slang.tags && (
                <div className="mb-6">
                  <h3 className={`font-semibold ${cn.colors.text.muted} mb-2`}>{t('slang.tags')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(slang.tags) ? slang.tags : slang.tags.split(',')).map((tag: string | any, index: number) => (
                      <span 
                        key={index} 
                        className={`inline-block ${cn.tag} text-xs font-medium px-2.5 py-0.5 rounded-full cursor-pointer`}
                        onClick={() => {
                          const newUrl = new URL(window.location.origin)
                          newUrl.search = `?tag=${encodeURIComponent(typeof tag === 'string' ? tag.trim() : tag)}`
                          window.location.href = newUrl.toString()
                        }}
                      >
                        {typeof tag === 'string' ? tag.trim() : tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center mb-8 pt-4 border-t">
                <div className="flex space-x-6">
                  <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${cn.colors.text.muted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className={`absolute -top-2.5 -right-2.5 ${cn.colors.text.muted} text-[10px]`}>{currentViews}</span>
                  </div>
                  <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${cn.colors.text.muted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span className={`absolute -top-2.5 -right-2.5 ${cn.colors.text.muted} text-[10px]`}>{slang.shares || 0}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={handleLike}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm ${cn.likeButton(isLiked)}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{currentLikes}</span>
                  </button>
                  
                  <button
                    onClick={handleFavorite}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm ${cn.favoriteButton(isFavorited)}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={isFavorited ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <span>{currentFavorites}</span>
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
                    onClick={() => {
                      window.location.href = `/${locale}/slang/${slangId}/maintain`
                    }}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm ${cn.detailsButton}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>{t('slang.maintain')}</span>
                  </button>
                  {slang.has_evolution && (
                    <button
                      onClick={() => handleViewEvolution()}
                      disabled={isLoadingEvolution}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm w-36 ${isLoadingEvolution ? cn.disabledButton : cn.evolutionButton}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      <span className="truncate">{isLoadingEvolution ? t('common.loading') : (showEvolution ? t('slang.hideEvolution') : t('slang.viewEvolution'))}</span>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Evolution Timeline */}
              {showEvolution && slang.has_evolution && (
                <div className="mt-4">
                  {isLoadingEvolution ? (
                    <div className="flex justify-center items-center py-4">
                      <LoadingIndicator 
                        text={t('common.loadingEvolution')} 
                        size="sm"
                        color="blue"
                        textClassName={`text-sm ${cn.colors.text.muted}`}
                      />
                    </div>
                  ) : (
                    evolutionData && evolutionData.length > 0 ? (
                      <EvolutionTimeline 
                        evolution={evolutionData} 
                        onClose={() => setShowEvolution(false)} 
                      />
                    ) : (
                      <div className={`${cn.colors.bg.light} p-4 rounded-md`}>
                        <p className={cn.colors.text.muted}>{t('slang.noEvolutionData')}</p>
                      </div>
                    )
                  )}
                </div>
              )}
              
              {/* Detail Modal Advertisement - Above Comments */}
              <AdvertisementSlot position="detail_modal" className="w-full" wrapperClassName="my-6" />

              {/* Comment Section */}
              <div className="mt-4">
                <CommentSection 
                  slangId={slang.id}
                  slangUserId={slang.user_id ? String(slang.user_id) : undefined}
                  slangPhrase={slang.phrase}
                  comments={slang.comments || []} 
                  totalComments={slang.comments_count}
                  onCommentAdded={(newCount) => {
                    if (newCount !== undefined) {
                      setSlang((prev: any) => {
                        if (!prev) return prev
                        return {
                          ...prev,
                          comments_count: newCount
                        }
                      })
                    }
                    setToastMessage(t('comments.postSuccess') || 'Comment posted successfully!')
                    setShowToast(true)
                  }}
                  onLikeComment={async (commentId: number) => {
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
                  }}
                  onLoadReplies={handleLoadReplies}
                  onLoadSubReplies={handleLoadSubReplies}
                  onLoadMore={() => {}}
                  hasMore={false}
                  isLoading={false}
                />
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center py-10">
              <p className={cn.colors.text.muted}>{t('errors.generic')}</p>
            </div>
          )}

          <LoginModal 
            isOpen={showLoginModal} 
            onClose={() => setShowLoginModal(false)} 
            onLoginSuccess={() => {
              // Refresh session and update state
              fetchSlangDetails()
            }}
          />

          {showToast && (
            <div className={`fixed bottom-4 right-4 ${cn.successMessage} px-4 py-2 rounded-md shadow-lg flex items-center space-x-2 z-50`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{toastMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
