'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { timeFormatter } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks'
import CommentInput from './CommentInput'

interface Comment {
  id: number
  slang_id: number
  parent_id: number | null
  user_id: number | string
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

interface CommentItemProps {
  comment: Comment
  level?: number
  replies?: Comment[]
  hasMoreReplies?: boolean
  isLoadingReplies?: boolean
  onLike: (commentId: number) => void
  onReply: (content: string, images?: string) => Promise<void>
  onLoadReplies?: () => Promise<void>
  onLoadMoreReplies?: () => Promise<void>
  onReport: (comment: Comment) => void
  isUploading?: boolean
  uploadError?: string | null
  setUploadError?: (error: string | null) => void
}

export default function CommentItem({
  comment,
  level = 0,
  replies = [],
  hasMoreReplies = false,
  isLoadingReplies = false,
  onLike,
  onReply,
  onLoadReplies,
  onLoadMoreReplies,
  onReport,
  isUploading = false,
  uploadError,
  setUploadError
}: CommentItemProps) {
  const { data: session } = useSession()
  const { cn } = useTheme()
  const { t } = useTranslation()
  
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showReplies, setShowReplies] = useState(false)

  const getAvatarUrl = (avatar?: string) => {
    if (avatar) {
      return avatar.startsWith('/') ? avatar : `/${avatar}`
    }
    return null
  }

  const renderAvatar = (avatar?: string, size: number = 32) => {
    const avatarUrl = getAvatarUrl(avatar)
    if (avatarUrl) {
      return (
        <Image 
          src={avatarUrl} 
          alt="Avatar" 
          width={size}
          height={size}
          className="rounded-full object-cover"
        />
      )
    }
    return (
      <div 
        className="rounded-full bg-gray-200 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="text-gray-500" style={{ width: size * 0.6, height: size * 0.6 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    )
  }

  const renderCommentImages = (imagesJson?: string) => {
    if (!imagesJson) return null
    
    try {
      const images: string[] = JSON.parse(imagesJson)
      if (!images || images.length === 0) return null
      
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          {images.map((img, index) => (
            <div key={index} className="relative">
              <Image
                src={img}
                alt={`Comment image ${index + 1}`}
                width={level === 0 ? 200 : 150}
                height={level === 0 ? 200 : 150}
                className="rounded-lg object-cover max-w-[200px] max-h-[200px]"
              />
            </div>
          ))}
        </div>
      )
    } catch {
      return null
    }
  }

  const handleToggleReplies = async () => {
    if (!showReplies && onLoadReplies) {
      await onLoadReplies()
    }
    setShowReplies(!showReplies)
  }

  const handleReply = async (content: string, images?: string) => {
    await onReply(content, images)
    setShowReplyForm(false)
    if (!showReplies) {
      setShowReplies(true)
    }
  }

  const avatarSize = level === 0 ? 40 : level === 1 ? 28 : 22
  const textClass = level === 0 ? 'text-sm' : level === 1 ? 'text-sm' : 'text-xs'
  const nameClass = level === 0 ? 'font-medium text-gray-800' : level === 1 ? 'font-medium text-gray-700 text-sm' : 'font-medium text-gray-700 text-xs'
  const timeClass = level === 0 ? 'text-xs' : level === 1 ? 'text-xs' : 'text-[10px]'
  const buttonClass = level === 0 ? 'text-sm' : level === 1 ? 'text-xs' : 'text-[10px]'
  const iconSize = level === 0 ? 'h-4 w-4' : level === 1 ? 'h-3.5 w-3.5' : 'h-3 w-3'

  return (
    <div className={`${level > 0 ? 'py-2' : ''}`}>
      <div className="flex items-start gap-2">
        {renderAvatar(comment.avatar, avatarSize)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-1.5">
              <span className={nameClass}>{comment.displayName || comment.username || t('comments.anonymous')}</span>
              {comment.username && (
                <span className={`${timeClass} text-gray-400`}>@{comment.username}</span>
              )}
            </div>
            <span className={`${timeClass} text-gray-400 flex-shrink-0`}>{timeFormatter.comment(comment.created_at)}</span>
          </div>
          <p className={`text-gray-600 ${textClass} mb-2 break-words`}>{comment.content}</p>
          {renderCommentImages(comment.images)}
          <div className="flex items-center gap-3">
            <button 
              className={`flex items-center gap-1 ${buttonClass} transition-colors ${
                comment.is_liked ? 'text-red-500' : 'text-gray-500 hover:text-red-400'
              }`}
              onClick={() => onLike(comment.id)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={iconSize} fill={comment.is_liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{comment.likes || 0}</span>
            </button>
            
            {(comment.reply_count || 0) > 0 && (
              <button 
                className={`flex items-center gap-1 ${buttonClass} text-gray-500 hover:text-blue-500 transition-colors`}
                onClick={handleToggleReplies}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{comment.reply_count || 0}</span>
              </button>
            )}
            
            <button 
              className={`${buttonClass} text-gray-500 hover:text-gray-700 transition-colors`}
              onClick={() => setShowReplyForm(!showReplyForm)}
            >
              {t('comments.reply')}
            </button>
            
            {session?.user && comment.user_id !== Number(session.user.id) && (
              <button 
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => onReport(comment)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={iconSize} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {showReplyForm && (
        <div className={`mt-2 ${level === 0 ? 'ml-12' : 'ml-8'}`}>
          <CommentInput
            onSubmit={handleReply}
            placeholder={t('comments.writeReply')}
            compact
            isUploading={isUploading}
            uploadError={uploadError}
            setUploadError={setUploadError}
          />
        </div>
      )}

      {showReplies && (comment.reply_count || 0) > 0 && (
        <div className={`mt-2 ${level === 0 ? 'ml-12 border-l-2 border-gray-200 pl-4' : 'ml-8 border-l-2 border-gray-200 pl-3'} space-y-2`}>
          {isLoadingReplies ? (
            <p className="text-gray-400 text-xs text-center py-2">{t('common.loading')}</p>
          ) : replies.length > 0 ? (
            <>
              {replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  level={level + 1}
                  onLike={onLike}
                  onReply={onReply}
                  onReport={onReport}
                  isUploading={isUploading}
                  uploadError={uploadError}
                  setUploadError={setUploadError}
                />
              ))}
              {hasMoreReplies && (
                <div className="text-center">
                  <button
                    onClick={onLoadMoreReplies}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    {t('comments.showMoreReplies')}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-400 text-xs text-center py-2">{t('comments.noReplies')}</p>
          )}
        </div>
      )}
    </div>
  )
}
