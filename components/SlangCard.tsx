'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import LoginModal from './LoginModal'
import EvolutionTimeline from './EvolutionTimeline'
import { CommentModal } from './Comment'
import ReportModal from './ReportModal'
import SlangDetailModal from './SlangDetailModal'
import { EvolutionItem, CommentItem, SlangItem } from '../types'
import { storageManager, timeFormatter } from '@/lib/utils'
import { LoadingIndicator } from '@/components/ui'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks'


interface SlangCardProps extends SlangItem {
  highlighted?: {
    phrase?: string
    explanation?: string
    example?: string
    evolution_periods?: string
    evolution_phases?: string
    evolution_explanations?: string
    evolution_examples?: string
    evolution_origins?: string
    evolution_stories?: string
  }
}

function HighlightedText({ text, highlighted }: { text: string; highlighted?: string }) {
  if (!highlighted) {
    return <>{text}</>
  }
  
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  const markRegex = /<mark>(.*?)<\/mark>/g
  let match
  let key = 0
  
  while ((match = markRegex.exec(highlighted)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{highlighted.slice(lastIndex, match.index)}</span>)
    }
    parts.push(
      <mark key={key++} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
        {match[1]}
      </mark>
    )
    lastIndex = match.index + match[0].length
  }
  
  if (lastIndex < highlighted.length) {
    parts.push(<span key={key++}>{highlighted.slice(lastIndex)}</span>)
  }
  
  return <>{parts}</>
}

function hasEvolutionHighlight(highlighted?: SlangCardProps['highlighted']): boolean {
  if (!highlighted) return false
  const evolutionFields = [
    'evolution_periods',
    'evolution_phases', 
    'evolution_explanations',
    'evolution_examples',
    'evolution_origins',
    'evolution_stories'
  ] as const
  
  return evolutionFields.some(field => 
    highlighted[field] && highlighted[field]!.includes('<mark>')
  )
}

export default function SlangCard({ 
  id, 
  phrase, 
  explanation, 
  example, 
  origin, 
  has_evolution: propHasEvolution,
  evolution = [],
  views, 
  likes, 
  comments_count, 
  favorites, 
  shares, 
  heat, 
  categories, 
  tags, 
  user_id,
  created_at,
  isLiked: initialIsLiked,
  isFavorited: initialIsFavorited,
  highlighted
}: SlangCardProps) {
  const { cn } = useTheme()
  const { t } = useTranslation()
  const params = useParams()
  const locale = params?.locale as string || 'en'
  // Ensure has_evolution is always a boolean
  const has_evolution = !!propHasEvolution
  const [isExpanded, setIsExpanded] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isLiked, setIsLiked] = useState(initialIsLiked || false)
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited || false)
  const [showEvolution, setShowEvolution] = useState(false)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [commentsCount, setCommentsCount] = useState(comments_count)
  const [evolutionData, setEvolutionData] = useState<EvolutionItem[]>([])
  const [isLoadingEvolution, setIsLoadingEvolution] = useState(false)
  const [currentViews, setCurrentViews] = useState(views)
  const [currentLikes, setCurrentLikes] = useState(likes)
  const [currentFavorites, setCurrentFavorites] = useState(favorites)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [isHovered, setIsHovered] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuExpanded) {
        const menuButton = document.querySelector('.menu-toggle-btn')
        const menuDropdown = document.querySelector('.menu-dropdown')
        
        if (menuDropdown && menuButton && 
            !menuDropdown.contains(event.target as Node) && 
            !menuButton.contains(event.target as Node)) {
          setIsMenuExpanded(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuExpanded])

  // Update currentViews when views prop changes (e.g., on page refresh)
  useEffect(() => {
    setCurrentViews(views)
  }, [views])

  // Update currentLikes and currentFavorites when props change (e.g., on page refresh)
  useEffect(() => {
    setCurrentLikes(likes)
    setCurrentFavorites(favorites)
  }, [likes, favorites])

  // Update isLiked and isFavorited when props change (e.g., on page refresh)
  useEffect(() => {
    setIsLiked(initialIsLiked || false)
    setIsFavorited(initialIsFavorited || false)
  }, [initialIsLiked, initialIsFavorited])

  // Handle toast display
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  const router = useRouter()
  const { data: session } = useSession()

  // View counting is now handled when user interacts with the card
  // useEffect(() => {
  //   // Record view when component mounts
  //   incrementViews(id)
  // }, [id])

  const handleViewDetails = async () => {
    // Only increment view count when user expands evolution
    if (!showEvolution) {
      // Check if we should increment view count (only once per 30 seconds per slang)
      const lastViewTimeKey = `last_view_${id}`
      if (storageManager.shouldExecute(lastViewTimeKey, 30)) {
        // Update currentViews optimistically
        setCurrentViews(prevViews => prevViews + 1)
        
        // Call API to increment view count on server
        try {
          const response = await fetch('/api/slang/views', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ slangId: id })
          })
          
          if (!response.ok) {
            console.error('Failed to increment view count:', await response.text())
            // Revert if API call fails
            setCurrentViews(prevViews => prevViews - 1)
          }
        } catch (error) {
          console.error('Error incrementing view count:', error)
          // Revert if API call fails
          setCurrentViews(prevViews => prevViews - 1)
        }
      }
      
      if (has_evolution) {
        // Load evolution data from API when expanding
        setIsLoadingEvolution(true)
        try {
          const response = await fetch(`/api/slang/evolution?slangId=${id}`)
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
    }
    setShowEvolution(!showEvolution)
    setShowCommentModal(false)
  }

  const handleLike = async () => {
    if (!session || !session.user?.id) {
      setShowLoginModal(true)
      return
    }
    
    // Get user ID
    const userId = session.user.id
    
    // Optimistically update UI
    const optimisticResult = !isLiked
    setIsLiked(optimisticResult)
    // Optimistically update like count
    setCurrentLikes(prev => optimisticResult ? prev + 1 : Math.max(0, prev - 1))
    
    // Call API to toggle like on server
    try {
      const response = await fetch('/api/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ slangId: id, userId })
      })
      
      if (!response.ok) {
        console.error('Failed to toggle like:', await response.text())
        // Revert if API call fails
        setIsLiked(!optimisticResult)
        setCurrentLikes(prev => optimisticResult ? Math.max(0, prev - 1) : prev + 1)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      // Revert if API call fails
      setIsLiked(!optimisticResult)
      setCurrentLikes(prev => optimisticResult ? Math.max(0, prev - 1) : prev + 1)
    }
  }

  const handleFavorite = async () => {
    if (!session || !session.user?.id) {
      setShowLoginModal(true)
      return
    }
    
    // Get user ID
    const userId = session.user.id
    
    // Optimistically update UI
    const optimisticResult = !isFavorited
    setIsFavorited(optimisticResult)
    // Optimistically update favorite count
    setCurrentFavorites(prev => optimisticResult ? prev + 1 : Math.max(0, prev - 1))
    
    // Call API to toggle favorite on server
    try {
      const response = await fetch('/api/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ slangId: id, userId })
      })
      
      if (!response.ok) {
        console.error('Failed to toggle favorite:', await response.text())
        // Revert if API call fails
        setIsFavorited(!optimisticResult)
        setCurrentFavorites(prev => optimisticResult ? Math.max(0, prev - 1) : prev + 1)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      // Revert if API call fails
      setIsFavorited(!optimisticResult)
      setCurrentFavorites(prev => optimisticResult ? Math.max(0, prev - 1) : prev + 1)
    }
  }

  const handleComment = async () => {
    // Open comment modal
    setShowCommentModal(true)
    setShowEvolution(false)
  }

  const handleShare = async () => {
    // Call API to increment share count on server
      try {
        await fetch('/api/slang/share', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ slangId: id })
        })
      } catch (error) {
        console.error('Error incrementing share count:', error)
      }
    
    // Generate external access link using phrase-based URL with locale
    const shareLink = `${window.location.origin}/${locale}/slang/phrase/${encodeURIComponent(phrase)}`
    navigator.clipboard.writeText(shareLink).then(() => {
      setToastMessage(t('slang.shareLinkCopied'))
      setShowToast(true)
    }).catch(() => {
      setToastMessage(t('slang.shareLink', { url: shareLink }))
      setShowToast(true)
    })
  }

  const incrementViewCount = async () => {
    // Check if we should increment view count (only once per 30 seconds per slang)
    const lastViewTimeKey = `last_view_${id}`
    if (storageManager.shouldExecute(lastViewTimeKey, 30)) {
      // Update currentViews optimistically
      setCurrentViews(prevViews => prevViews + 1)
      
      // Call API to increment view count on server
      try {
        const response = await fetch('/api/slang/views', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ slangId: id })
        })
        
        if (!response.ok) {
          console.error('Failed to increment view count:', await response.text())
          // Revert if API call fails
          setCurrentViews(prevViews => prevViews - 1)
        }
      } catch (error) {
        console.error('Error incrementing view count:', error)
        // Revert if API call fails
        setCurrentViews(prevViews => prevViews - 1)
      }
    }
  }

  const handleViewFullDetails = async () => {
    // Increment view count when showing details
    await incrementViewCount()
    // Show detail modal instead of navigating
    setShowDetailModal(true)
  }

  return (
    <div 
      className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200 relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={async (e) => {
        // Check if any modal is open
        if (showReportModal || showDetailModal || showCommentModal || showLoginModal || isMenuExpanded) {
          return;
        }
        
        // Check if the click target is within the stats section or any button
        const target = e.target as HTMLElement;
        
        // Check if the target is within the stats section
        const statsSection = target.closest('.border-t.pt-3');
        
        // Check if the target is a button
        const isButton = target.tagName === 'BUTTON' || target.closest('button');
        
        // Only increment view count and show detail modal if not clicking in stats section or button
        if (!statsSection && !isButton) {
          // Increment view count when clicking card
          await incrementViewCount()
          setShowDetailModal(true)
        }
      }}
    >
      <div className="flex justify-between items-start mb-2 relative">
        <h3 className={`font-bold text-lg ${cn.title}`}>
          <HighlightedText text={phrase} highlighted={highlighted?.phrase} />
        </h3>
        <div className="flex items-center space-x-2">
          <span className={`${cn.heat} text-xs font-medium px-2.5 py-0.5 rounded-full`}>
            {t('slang.heat')}: {typeof heat === 'number' ? heat.toFixed(1) : parseFloat(String(heat)).toFixed(1)}
          </span>
        </div>
      </div>

      <p className={`${cn.colors.text.muted} mb-3 line-clamp-2`}>
        <HighlightedText text={explanation} highlighted={highlighted?.explanation} />
      </p>

      {isExpanded && (
            <div className="mb-3">
              {example && (
                <p className={`${cn.colors.text.muted} mb-2`}><strong>{t('slang.example')}:</strong> <HighlightedText text={example} highlighted={highlighted?.example} /></p>
              )}
              {origin && (
                <p className={`${cn.colors.text.muted} mb-2`}><strong>{t('slang.origin')}:</strong> {origin}</p>
              )}
              {categories && (
                <p className={`${cn.colors.text.muted} mb-1`}>
                  <strong>{t('slang.categories')}:</strong> 
                  {(Array.isArray(categories) ? categories : categories.split(',')).map((category) => (
                    <span 
                      key={typeof category === 'string' ? category.trim() : category}
                      className={`inline-block ${cn.tag} px-2 py-0.5 rounded-full text-xs ml-1 cursor-pointer`}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent bubbling to parent div
                        const trimmedCategory = typeof category === 'string' ? category.trim() : category;
                        // Update URL without page scroll using encodeURIComponent
                        const newUrl = new URL(window.location.href);
                        newUrl.searchParams.set('category', trimmedCategory);
                        // If no search, clear tag (only one filter allowed without search)
                        if (!newUrl.searchParams.get('search')) {
                          newUrl.searchParams.delete('tag');
                        }
                        window.history.pushState({}, '', newUrl.toString().replace(/\+/g, '%20'));
                        
                        // Trigger custom event to refresh data
                        window.dispatchEvent(new CustomEvent('category', { 
                          detail: { 
                            category: trimmedCategory
                          } 
                        }));
                        
                        // Track category click
                        fetch('/api/category/click', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ name: trimmedCategory })
                        }).catch(err => console.error('Error tracking category click:', err));
                      }}
                    >
                      {typeof category === 'string' ? category.trim() : category}
                    </span>
                  ))}
                </p>
              )}
              {tags && (
                <p className={`${cn.colors.text.muted} mb-1`}>
                  <strong>{t('slang.tags')}:</strong> 
                  {(Array.isArray(tags) ? tags : tags.split(',')).map((tag) => (
                    <span 
                      key={typeof tag === 'string' ? tag.trim() : tag}
                      className={`inline-block ${cn.tag} px-2 py-0.5 rounded-full text-xs ml-1 cursor-pointer`}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent bubbling to parent div
                        const trimmedTag = typeof tag === 'string' ? tag.trim() : tag;
                        // Update URL without page scroll using encodeURIComponent
                        const newUrl = new URL(window.location.href);
                        newUrl.searchParams.set('tag', trimmedTag);
                        // If no search, clear category (only one filter allowed without search)
                        if (!newUrl.searchParams.get('search')) {
                          newUrl.searchParams.delete('category');
                        }
                        window.history.pushState({}, '', newUrl.toString().replace(/\+/g, '%20'));
                        
                        // Trigger custom event to refresh data
                        window.dispatchEvent(new CustomEvent('tag', { 
                          detail: { 
                            tag: trimmedTag
                          } 
                        }));
                        
                        // Track tag click
                        fetch('/api/tag/click', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ name: trimmedTag })
                        }).catch(err => console.error('Error tracking tag click:', err));
                      }}
                    >
                      {typeof tag === 'string' ? tag.trim() : tag}
                    </span>
                  ))}
                </p>
              )}
            </div>
          )}

      {/* Only show "Show more" button if there are additional details */}
      {example || origin || categories || tags ? (
        <div className="flex justify-center mb-3">
          <button 
            onClick={async (e) => {
              e.stopPropagation(); // Prevent bubbling to parent div
              const wasExpanded = isExpanded
              setIsExpanded(!isExpanded)
              // Only increment view count when user expands details
              if (!wasExpanded) {
                // Check if we should increment view count (only once per 30 seconds per slang)
                const lastViewTimeKey = `last_view_${id}`
                const lastViewTime = localStorage.getItem(lastViewTimeKey)
                const currentTime = Date.now()
                const thirtySeconds = 30 * 1000
                
                if (!lastViewTime || (currentTime - parseInt(lastViewTime)) > thirtySeconds) {
                  // Update currentViews optimistically
                  setCurrentViews(prevViews => prevViews + 1)
                  
                  // Call API to increment view count on server
                  try {
                    const response = await fetch('/api/slang/views', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ slangId: id })
                    })
                    
                    if (!response.ok) {
                      console.error('Failed to increment view count:', await response.text())
                      // Revert if API call fails
                      setCurrentViews(prevViews => prevViews - 1)
                    } else {
                      // Store last view time
                      localStorage.setItem(lastViewTimeKey, currentTime.toString())
                    }
                  } catch (error) {
                    console.error('Error incrementing view count:', error)
                    // Revert if API call fails
                    setCurrentViews(prevViews => prevViews - 1)
                  }
                }
              }
            }}
            className={`${cn.colors.text.muted} ${cn.colors.text.mutedHover} ${cn.colors.bg.light} ${cn.colors.bg.lightHover} px-4 py-1 rounded-md text-[10px] transition-colors`}
          >
            {isExpanded ? t('common.showLess') : t('common.showMore')}
          </button>
        </div>
      ) : null}

      <div className="flex justify-between items-center border-t pt-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center space-x-4">
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
            <span className={`absolute -top-2.5 -right-2.5 ${cn.colors.text.muted} text-[10px]`}>{shares}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent bubbling to parent div
              handleLike();
            }}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm ${cn.likeButton(isLiked)}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{currentLikes}</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent bubbling to parent div
              handleFavorite();
            }}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm ${cn.favoriteButton(isFavorited)}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={isFavorited ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span>{currentFavorites}</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent bubbling to parent div
              handleComment();
            }}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm ${cn.shareButton}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{comments_count}</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent bubbling to parent div
              handleShare();
            }}
            className={`hidden xl:flex items-center space-x-1 px-3 py-1 rounded-md text-sm ${cn.shareButton}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>{t('slang.share')}</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowReportModal(true);
            }}
            className={`hidden xl:flex items-center space-x-1 px-3 py-1 rounded-md text-sm ${cn.reportButton}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            <span>{t('slang.report')}</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/${locale}/slang/${id}/maintain`);
            }}
            className={`hidden xl:flex items-center space-x-1 px-3 py-1 rounded-md text-sm ${cn.detailsButton}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>{t('slang.maintain')}</span>
          </button>
          
          {has_evolution && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent bubbling to parent div
                handleViewDetails();
              }}
              disabled={isLoadingEvolution}
              className={`hidden xl:flex items-center space-x-1 px-3 py-1 rounded-md text-sm w-36 ${isLoadingEvolution ? cn.disabledButton : cn.evolutionButton}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="truncate">{isLoadingEvolution ? t('common.loading') : (showEvolution ? t('slang.hideEvolution') : t('slang.viewEvolution'))}</span>
              {hasEvolutionHighlight(highlighted) && !showEvolution && (
                <span className="ml-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" title={t('slang.keywordMatchedEvolution')}></span>
              )}
            </button>
          )}

          {/* Collapsible menu for mobile */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuExpanded(!isMenuExpanded);
              }}
              className={`menu-toggle-btn flex xl:hidden items-center justify-center w-8 h-8 rounded-md ${cn.shareButton}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {isMenuExpanded && (
              <div className="menu-dropdown absolute right-0 bottom-full mb-1 bg-white border rounded-md shadow-lg py-1 z-10 min-w-[140px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare();
                    setIsMenuExpanded(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-3 py-2 text-sm ${cn.colors.menu.item} ${cn.colors.menu.itemHover}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span>{t('slang.share')}</span>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReportModal(true);
                    setIsMenuExpanded(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-3 py-2 text-sm ${cn.colors.menu.item} ${cn.colors.menu.itemHover}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                  <span>{t('slang.report')}</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/${locale}/slang/${id}/maintain`);
                    setIsMenuExpanded(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-3 py-2 text-sm ${cn.menuItem}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>{t('slang.maintain')}</span>
                </button>
                
                {has_evolution && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails();
                      setIsMenuExpanded(false);
                    }}
                    disabled={isLoadingEvolution}
                    className={`w-full flex items-center space-x-2 px-3 py-2 text-sm ${isLoadingEvolution ? 'text-gray-400' : `${cn.colors.text.secondary} hover:bg-gray-100`}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    <span className="flex items-center">
                      {isLoadingEvolution ? t('common.loading') : (showEvolution ? t('slang.hideEvolution') : t('slang.viewEvolution'))}
                      {hasEvolutionHighlight(highlighted) && !showEvolution && (
                        <span className="ml-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                      )}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showEvolution && has_evolution && (
        <div className={`mt-4 pl-4 border-l-2 ${cn.colors.border.primary}`}>
          {hasEvolutionHighlight(highlighted) && (
            <div className="mb-2 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t('slang.keywordMatchedEvolution')}</span>
            </div>
          )}
          {isLoadingEvolution ? (
            <div className="flex justify-center items-center py-4">
              <LoadingIndicator 
                text={t('common.loadingEvolution')} 
                size="sm"
                color="blue"
                textClassName="text-sm text-gray-600"
              />
            </div>
          ) : (
            <EvolutionTimeline evolution={evolutionData} />
          )}
        </div>
      )}

      <CommentModal 
        isOpen={showCommentModal} 
        onClose={() => setShowCommentModal(false)} 
        onCommentAdded={(newCount) => {
          if (newCount !== undefined) {
            setCommentsCount(newCount)
          } else {
            setCommentsCount(prev => prev + 1)
          }
        }} 
        slangId={id} 
        commentsCount={commentsCount} 
        phrase={phrase} 
        slangUserId={user_id ? String(user_id) : undefined}
      />

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed bottom-4 right-4 ${cn.successMessage} px-4 py-2 rounded-md shadow-lg flex items-center space-x-2 z-50`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Slang Detail Modal */}
      <SlangDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        slangId={id.toString()}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="slang"
        targetId={id}
      />
    </div>
  )
}