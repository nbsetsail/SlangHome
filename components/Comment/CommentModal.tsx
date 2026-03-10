'use client'
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import LoginModal from '../LoginModal'
import { ContentLoader } from '@/components/ui'
import CommentSection from './CommentSection'

interface CommentModalProps {
  isOpen: boolean
  onClose: () => void
  onCommentAdded?: (newCount?: number) => void
  slangId: number
  commentsCount: number
  phrase: string
  slangUserId?: string
}

interface Comment {
  id: number
  slang_id: number
  parent_id: number | null
  user_id: number
  username?: string
  displayName?: string
  avatar?: string
  content: string
  images?: string
  likes: number
  created_at: string
  is_liked?: boolean
  reply_count?: number
}

export default function CommentModal({ isOpen, onClose, onCommentAdded, slangId, commentsCount, phrase, slangUserId }: CommentModalProps) {
  const [commentsData, setCommentsData] = useState<Comment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  
  const { data: session } = useSession()

  useEffect(() => {
    if (isOpen) {
      loadComments(1)
    }
  }, [isOpen, slangId])

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  const loadComments = async (pageNum: number) => {
    if (pageNum === 1) {
      setIsLoadingComments(true)
    } else {
      setIsLoadingMore(true)
    }
    
    try {
      const response = await fetch(`/api/slang/comments?slangId=${slangId}&page=${pageNum}&pageSize=10`)
      if (response.ok) {
        const data = await response.json()
        const comments = data.comments || []
        
        if (pageNum === 1) {
          setCommentsData(comments)
        } else {
          setCommentsData(prev => [...prev, ...comments])
        }
        
        setHasMore(data.pagination?.hasMore || false)
        setPage(pageNum)
      }
    } catch (error) {
      console.error('Failed to load comments data:', error)
    } finally {
      setIsLoadingComments(false)
      setIsLoadingMore(false)
    }
  }

  const handleLikeComment = async (commentId: number) => {
    if (!session) {
      setShowLoginModal(true)
      return
    }

    try {
      const userId = session.user?.id || session.user?.email
      
      const response = await fetch('/api/comment/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ commentId, userId })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCommentsData(prev => prev.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                likes: data.likeCount,
                is_liked: data.isLiked
              }
            }
            return comment
          }))
        }
      }
    } catch (error) {
      console.error('Failed to like comment:', error)
    }
  }

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadComments(page + 1)
    }
  }

  const handleLoadReplies = async (commentId: number, page: number) => {
    try {
      const userId = session?.user?.id || session?.user?.email || null
      const response = await fetch(`/api/comment/replies?commentId=${commentId}&page=${page}&pageSize=20&userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        const replies = data.replies || []
        setCommentsData(prev => {
          const existingIds = new Set(prev.map(c => c.id))
          const newReplies = replies.filter((r: Comment) => !existingIds.has(r.id))
          return [...prev, ...newReplies]
        })
      }
    } catch (error) {
      console.error('Failed to load replies:', error)
    }
  }

  const handleLoadSubReplies = async (commentId: number, page: number) => {
    return handleLoadReplies(commentId, page)
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-md w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <h2 className="text-xl font-bold">Comments</h2>
            <span className="text-gray-600 text-sm italic flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis">
              on "{phrase}"
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoadingComments ? (
            <ContentLoader text="Loading comments..." minHeight="py-12" />
          ) : (
            <CommentSection
              slangId={slangId}
              slangUserId={slangUserId}
              slangPhrase={phrase}
              comments={commentsData}
              totalComments={commentsCount}
              onCommentAdded={onCommentAdded}
              onLikeComment={handleLikeComment}
              onLoadMore={handleLoadMore}
              onLoadReplies={handleLoadReplies}
              onLoadSubReplies={handleLoadSubReplies}
              hasMore={hasMore}
              isLoading={isLoadingMore}
            />
          )}
        </div>

        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
          onLoginSuccess={() => {
            if (onCommentAdded) {
              onCommentAdded()
            }
          }}
        />

        {showToast && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  )
}