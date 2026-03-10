'use client'
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CommentSection } from '@/components/Comment'
import EvolutionTimeline from '@/components/EvolutionTimeline'
import LoginModal from '@/components/LoginModal'
import ReportModal from '@/components/ReportModal'
import Header from '@/components/Header'
import AddSlangModal from '@/components/AddSlangModal'
import AdvertisementSlot from '@/components/AdvertisementSlot'
import SlangSeo from '@/components/SlangSeo'
import { PageLoader, ErrorMessage } from '@/components/ui'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks/useTranslation'

export default function SlangDetailPage() {
  const { phrase, locale } = useParams()
  const currentLocale = locale as string || 'en'
  const router = useRouter()
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
  const [showEvolution, setShowEvolution] = useState(false)
  const [isLoadingEvolution, setIsLoadingEvolution] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)

  const handleShowAddSlangModal = () => {
    setIsAddModalOpen(true)
  }

  const handleSubmitAddSlang = async (data: any) => {
    setAddLoading(true)

    try {
      const response = await fetch('/mgr/api/slang', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          locale: currentLocale
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setTimeout(() => {
          setIsAddModalOpen(false)
          fetchSlangDetails()
        }, 1500)
      }
    } catch (error) {
      console.error('Error adding slang:', error)
    } finally {
      setAddLoading(false)
    }
  }

  useEffect(() => {
    fetchSlangDetails()
  }, [phrase, session])

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  useEffect(() => {
    if (!loading && (error || !slang)) {
      const timer = setTimeout(() => {
        router.push(`/${currentLocale}`)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [loading, error, slang, router, currentLocale])

  const incrementViewCount = async (slangId: string) => {
    const lastViewTimeKey = `last_view_${slangId}`
    const lastViewTime = localStorage.getItem(lastViewTimeKey)
    const currentTime = Date.now()
    const thirtySeconds = 30 * 1000
    
    if (!lastViewTime || (currentTime - parseInt(lastViewTime)) > thirtySeconds) {
      try {
        const response = await fetch('/api/slang/views', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ slangId })
        })
        const data = await response.json()
        if (slang && data.views) {
          setSlang({
            ...slang,
            views: data.views
          })
        }
        localStorage.setItem(lastViewTimeKey, currentTime.toString())
      } catch (err) {
        console.error('Failed to increment view count:', err)
      }
    }
  }

  const fetchSlangDetails = async () => {
    setLoading(true)
    setError('')
    try {
      const userId = session?.user?.id || session?.user?.email
      
      const encodedPhrase = encodeURIComponent(phrase as string)
      let apiUrl = `/api/slang/phrase/${encodedPhrase}`
      
      if (userId) {
        apiUrl += `?userId=${encodeURIComponent(userId)}&locale=${currentLocale}`
      } else {
        apiUrl += `?locale=${currentLocale}`
      }
      
      const response = await fetch(apiUrl)
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        const urlParams = new URLSearchParams(window.location.search)
        const sharedUserId = urlParams.get('user_id')
        
        setIsLoadingComments(true)
        try {
          const commentsResponse = await fetch(`/api/slang/comments?slangId=${data.id}`)
          const commentsData = await commentsResponse.json()
          
          let finalData = data
          if (!commentsData.error) {
            finalData = {
              ...data,
              comments: commentsData.comments || []
            }
          }
          
          setSlang(finalData)
          setIsLiked(finalData.isLiked || false)
          setIsFavorited(finalData.isFavorited || false)
          incrementViewCount(data.id)
          
          const lastShareTimeKey = `last_share_${phrase}`
          const lastShareTime = localStorage.getItem(lastShareTimeKey)
          const currentTime = Date.now()
          const oneMinute = 60 * 1000
          
          if (!lastShareTime || (currentTime - parseInt(lastShareTime)) > oneMinute) {
            try {
              const shareResponse = await fetch('/api/slang/share', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ slangId: data.id, userId: sharedUserId })
              })
              const shareData = await shareResponse.json()
              if (shareData.shared && finalData) {
                setSlang({
                  ...finalData,
                  shares: finalData.shares + 1
                })
                localStorage.setItem(lastShareTimeKey, currentTime.toString())
              }
            } catch (shareErr) {
              console.error('Failed to increment share count:', shareErr)
            }
          }
        } catch (err) {
          console.error('Failed to load comments data:', err)
          setSlang(data)
          setIsLiked(data.isLiked || false)
          setIsFavorited(data.isFavorited || false)
          incrementViewCount(data.id)
        } finally {
          setIsLoadingComments(false)
        }
      }
    } catch (err) {
      setError('Failed to fetch slang details')
      console.error('Error fetching slang details:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!session) {
      setShowLoginModal(true)
      return
    }
    
    if (!slang) return
    
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
        body: JSON.stringify({ slangId: slang.id, userId })
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
    
    if (!slang) return
    
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
        body: JSON.stringify({ slangId: slang.id, userId })
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
    
    if (!slang) return
    
    try {
      const userId = session.user?.id || session.user?.email
      if (!userId) {
        setShowLoginModal(true)
        return
      }
      
      const shareLink = `${window.location.origin}/${currentLocale}/slang/phrase/${encodeURIComponent(phrase as string)}?user_id=${encodeURIComponent(userId)}`
      await navigator.clipboard.writeText(shareLink)
      setToastMessage(t('slang.shareLinkCopied'))
      setShowToast(true)
    } catch (err) {
      console.error('Failed to share slang:', err)
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

  const handleLoadSubReplies = async (commentId: number, page: number) => {
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
      console.error('Failed to load sub-replies:', err)
    }
  }

  const handleViewEvolution = async () => {
    if (!slang) return
    
    if (!showEvolution) {
      setIsLoadingEvolution(true)
      try {
        if (!slang.evolution || slang.evolution.length === 0) {
          const evolutionResponse = await fetch(`/api/slang/evolution?slangId=${slang.id}`)
          const evolutionData = await evolutionResponse.json()
          if (!evolutionData.error && evolutionData.evolution) {
            setSlang({
              ...slang,
              evolution: evolutionData.evolution
            })
          }
        }
      } catch (err) {
        console.error('Failed to load evolution data:', err)
      } finally {
        setIsLoadingEvolution(false)
      }
    }
    setShowEvolution(!showEvolution)
  }

  if (loading) {
    return <PageLoader text={t('slang.loadingSlangDetails')} />
  }

  if (error || !slang) {
    return (
      <div className={`min-h-screen ${cn.colors.bg.light} flex items-center justify-center p-4`}>
        <div className="max-w-md w-full">
          <ErrorMessage 
            message={error || t('slang.notFound')} 
            type="error" 
            className="mb-4"
          />
          <p className={`${cn.colors.text.muted} text-sm text-center mb-4`}>{t('slang.redirectingHome')}</p>
          <div className="text-center">
            <a href={`/${currentLocale}`} className={`${cn.primaryButton} py-2 px-4 rounded-md inline-block`}>
              {t('common.backToHome')}
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <SlangSeo 
        phrase={slang?.phrase}
        explanation={slang?.explanation}
        example={slang?.example}
        categories={slang?.categories}
        tags={slang?.tags}
      />
    <div className={`min-h-screen ${cn.colors.bg.light}`}>
      <Header showLoginModal={() => setShowLoginModal(true)} showAddSlangModal={handleShowAddSlangModal} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`${cn.colors.bg.card} rounded-lg shadow-md p-6 mb-6`}>
          <div className="flex justify-between items-start mb-4">
            <h2 className={`text-2xl font-bold ${cn.title}`}>{slang.phrase}</h2>
            <span className={`${cn.heat} text-xs font-medium px-2.5 py-0.5 rounded-full`}>
              {t('slang.heat')}: {slang.heat ? parseFloat(slang.heat).toFixed(1) : '0.0'}
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
                  <span 
                    key={index} 
                    className={`inline-block ${cn.tag} text-xs font-medium px-2.5 py-0.5 rounded-full cursor-pointer`}
                    onClick={() => {
                      const newUrl = new URL(window.location.origin)
                      newUrl.pathname = `/${currentLocale}`
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
            <div className="mb-4">
              <h3 className={`font-semibold ${cn.colors.text.muted} mb-2`}>{t('slang.tags')}</h3>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(slang.tags) ? slang.tags : slang.tags.split(',')).map((tag: string | any, index: number) => (
                  <span 
                    key={index} 
                    className={`inline-block ${cn.tag} text-xs font-medium px-2.5 py-0.5 rounded-full cursor-pointer`}
                    onClick={() => {
                      const newUrl = new URL(window.location.origin)
                      newUrl.pathname = `/${currentLocale}`
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
          
          <div className="flex justify-between items-center mb-6 pt-4 border-t">
            <div className="flex space-x-6">
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${cn.colors.text.muted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className={`absolute -top-2.5 -right-2.5 ${cn.colors.text.muted} text-[10px]`}>{slang.views}</span>
              </div>
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${cn.colors.text.muted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className={`absolute -top-2.5 -right-2.5 ${cn.colors.text.muted} text-[10px]`}>{slang.shares}</span>
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
              
              {slang.has_evolution && (
                <button
                  onClick={handleViewEvolution}
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
        </div>
        
        {showEvolution && slang.has_evolution && (
          <div className="mt-4">
            {isLoadingEvolution ? (
              <div className="flex justify-center items-center py-4">
                <div className={cn.loader}></div>
                <span className={`ml-2 text-sm ${cn.colors.text.muted}`}>{t('common.loadingEvolution')}</span>
              </div>
            ) : (
              slang.evolution && slang.evolution.length > 0 ? (
                <EvolutionTimeline 
                  evolution={slang.evolution} 
                />
              ) : (
                <div className={`${cn.colors.bg.light} p-4 rounded-md`}>
                  <p className={cn.colors.text.muted}>{t('slang.noEvolutionData')}</p>
                </div>
              )
            )}
          </div>
        )}
        
        <div className="mt-4">
          {isLoadingComments ? (
            <div className="flex justify-center items-center py-4">
              <div className={cn.loader}></div>
              <span className={`ml-2 text-sm ${cn.colors.text.muted}`}>{t('slang.loadingComments')}</span>
            </div>
          ) : (
            <>
              <AdvertisementSlot position="phrase_detail" className="w-full" wrapperClassName="my-6" />
              <CommentSection 
                slangId={slang.id}
                slangUserId={slang.user_id}
                slangPhrase={slang.phrase}
                comments={slang.comments || []}
                totalComments={slang.comments_count}
                onCommentAdded={(newCount) => {
                  if (newCount !== undefined) {
                    setSlang((prev: any) => {
                      if (!prev) return prev
                      return { ...prev, comments_count: newCount }
                    })
                  }
                }}
                onLikeComment={handleLikeComment}
                onLoadReplies={handleLoadReplies}
                onLoadSubReplies={handleLoadSubReplies}
                onLoadMore={() => {}}
                hasMore={false}
                isLoading={false}
              />
            </>
          )}
        </div>
      </main>
      
      <footer className={`${cn.colors.bg.card} shadow mt-8`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className={`text-center ${cn.colors.text.muted}`}>© 2026 Slang Master</p>
        </div>
      </footer>
      
      {showToast && (
        <div className={`fixed bottom-4 right-4 ${cn.successMessage} px-4 py-2 rounded-md shadow-lg flex items-center space-x-2 z-50`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

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
    </div>
    </>
  )
}
