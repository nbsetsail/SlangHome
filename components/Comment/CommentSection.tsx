'use client'
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ContentLoader } from '@/components/ui'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks'
import { useCommentActions } from '@/hooks/useCommentActions'
import CommentInput from './CommentInput'
import CommentItem from './CommentItem'
import ReportModal from '../ReportModal'

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

interface CommentSectionProps {
  slangId: number | string
  slangUserId?: string
  slangPhrase?: string
  comments: Comment[]
  totalComments?: number
  onCommentAdded?: (newCount?: number) => void
  onLikeComment: (commentId: number) => void
  onLoadMore: () => void
  onLoadReplies: (commentId: number, page: number) => Promise<void>
  onLoadSubReplies: (commentId: number, page: number) => Promise<void>
  hasMore: boolean
  isLoading: boolean
}

export default function CommentSection({
  slangId,
  slangUserId,
  slangPhrase,
  comments: externalComments,
  totalComments,
  onCommentAdded,
  onLikeComment,
  onLoadMore,
  onLoadReplies,
  onLoadSubReplies,
  hasMore,
  isLoading
}: CommentSectionProps) {
  const { data: session } = useSession()
  const { cn } = useTheme()
  const { t } = useTranslation()
  
  const [comments, setComments] = useState<Comment[]>(externalComments)
  const [replyPages, setReplyPages] = useState<{ [key: number]: number }>({})
  const [subReplyPages, setSubReplyPages] = useState<{ [key: number]: number }>({})
  const [isLoadingReplies, setIsLoadingReplies] = useState<{ [key: number]: boolean }>({})
  const [isLoadingSubReplies, setIsLoadingSubReplies] = useState<{ [key: number]: boolean }>({})
  const [repliesHasMore, setRepliesHasMore] = useState<{ [key: number]: boolean }>({})
  const [subRepliesHasMore, setSubRepliesHasMore] = useState<{ [key: number]: boolean }>({})
  const [reportComment, setReportComment] = useState<Comment | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  
  const { submitComment, buildOptimisticComment, isUploading } = useCommentActions({
    slangId,
    slangUserId,
    slangPhrase,
    onCommentAdded
  })
  
  useEffect(() => {
    setComments(externalComments)
  }, [externalComments])

  const handleAddComment = async (content: string, images?: string) => {
    const result = await submitComment(content, undefined, images)
    if (result.success && result.commentId) {
      const newComment = buildOptimisticComment(result.commentId, content, undefined, images)
      setComments(prev => [newComment, ...prev])
    }
  }

  const handleAddReply = (parentId: number, parentUserId?: string) => async (content: string, images?: string) => {
    const result = await submitComment(content, parentId, images, parentUserId)
    if (result.success && result.commentId) {
      const newComment = buildOptimisticComment(result.commentId, content, parentId, images)
      setComments(prev => {
        const updated = [newComment, ...prev]
        return updated.map(c => {
          if (c.id === parentId) {
            return { ...c, reply_count: (c.reply_count || 0) + 1 }
          }
          return c
        })
      })
    }
  }

  const handleLoadReplies = (commentId: number) => async () => {
    if (!replyPages[commentId]) {
      setReplyPages(prev => ({ ...prev, [commentId]: 1 }))
      setIsLoadingReplies(prev => ({ ...prev, [commentId]: true }))
      try {
        await onLoadReplies(commentId, 1)
      } finally {
        setIsLoadingReplies(prev => ({ ...prev, [commentId]: false }))
      }
    }
  }

  const handleLoadSubReplies = (commentId: number) => async () => {
    if (!subReplyPages[commentId]) {
      setSubReplyPages(prev => ({ ...prev, [commentId]: 1 }))
      setIsLoadingSubReplies(prev => ({ ...prev, [commentId]: true }))
      try {
        await onLoadSubReplies(commentId, 1)
      } finally {
        setIsLoadingSubReplies(prev => ({ ...prev, [commentId]: false }))
      }
    }
  }

  const handleLoadMoreReplies = (commentId: number) => async () => {
    if (!isLoadingReplies[commentId] && repliesHasMore[commentId]) {
      const nextPage = (replyPages[commentId] || 0) + 1
      setIsLoadingReplies(prev => ({ ...prev, [commentId]: true }))
      try {
        await onLoadReplies(commentId, nextPage)
        setReplyPages(prev => ({ ...prev, [commentId]: nextPage }))
      } finally {
        setIsLoadingReplies(prev => ({ ...prev, [commentId]: false }))
      }
    }
  }

  const handleLoadMoreSubReplies = (commentId: number) => async () => {
    if (!isLoadingSubReplies[commentId] && subRepliesHasMore[commentId]) {
      const nextPage = (subReplyPages[commentId] || 0) + 1
      setIsLoadingSubReplies(prev => ({ ...prev, [commentId]: true }))
      try {
        await onLoadSubReplies(commentId, nextPage)
        setSubReplyPages(prev => ({ ...prev, [commentId]: nextPage }))
      } finally {
        setIsLoadingSubReplies(prev => ({ ...prev, [commentId]: false }))
      }
    }
  }

  const topLevelComments = comments.filter(comment => !comment.parent_id)
  const repliesByParent = comments.reduce((acc, comment) => {
    if (comment.parent_id) {
      if (!acc[comment.parent_id]) {
        acc[comment.parent_id] = []
      }
      acc[comment.parent_id].push(comment)
    }
    return acc
  }, {} as { [key: number]: Comment[] })

  return (
    <div className="mt-6">
      <div className="mb-6 pb-2 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">
          {t('comments.title')} ({totalComments || comments.length})
        </h3>
      </div>

      <CommentInput
        onSubmit={handleAddComment}
        isUploading={isUploading}
        uploadError={uploadError}
        setUploadError={setUploadError}
      />

      <div className="space-y-4 mt-4">
        {topLevelComments.map(comment => (
          <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
            <CommentItem
              comment={comment}
              level={0}
              replies={repliesByParent[comment.id] || []}
              hasMoreReplies={repliesHasMore[comment.id]}
              isLoadingReplies={isLoadingReplies[comment.id]}
              onLike={onLikeComment}
              onReply={handleAddReply(comment.id, comment.user_id?.toString())}
              onLoadReplies={handleLoadReplies(comment.id)}
              onLoadMoreReplies={handleLoadMoreReplies(comment.id)}
              onReport={setReportComment}
              isUploading={isUploading}
              uploadError={uploadError}
              setUploadError={setUploadError}
            />
          </div>
        ))}

        {topLevelComments.length === 0 && (
          <p className="text-gray-500 text-center py-8">{t('comments.noComments')}</p>
        )}

        {hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={onLoadMore}
              className="text-sm text-gray-500 hover:text-gray-700"
              disabled={isLoading}
            >
              {isLoading ? t('common.loading') : t('comments.loadMoreComments')}
            </button>
          </div>
        )}
      </div>

      <ReportModal
        isOpen={!!reportComment}
        onClose={() => setReportComment(null)}
        targetType="comment"
        targetId={reportComment?.id}
      />
    </div>
  )
}
