import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface UseCommentActionsOptions {
  slangId: number | string
  slangUserId?: string
  slangPhrase?: string
  onCommentAdded?: (newCount?: number) => void
}

export function useCommentActions({
  slangId,
  slangUserId,
  slangPhrase,
  onCommentAdded
}: UseCommentActionsOptions) {
  const { data: session } = useSession()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const submitComment = useCallback(async (
    content: string,
    parentId?: number,
    images?: string,
    parentUserId?: string
  ): Promise<{ success: boolean; commentId?: number; commentsCount?: number; error?: string }> => {
    if (!session) {
      return { success: false, error: 'Not authenticated' }
    }

    const userId = session.user?.id || session.user?.email
    if (!userId) {
      return { success: false, error: 'User ID not found' }
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      const response = await fetch('/api/comment/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          slangId,
          userId,
          content,
          parentId,
          images,
          slangUserId,
          slangPhrase,
          parentUserId
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit comment')
      }

      if (onCommentAdded) {
        onCommentAdded(data.commentsCount)
      }

      return {
        success: true,
        commentId: data.commentId,
        commentsCount: data.commentsCount
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit comment'
      setUploadError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsUploading(false)
    }
  }, [session, slangId, slangUserId, slangPhrase, onCommentAdded])

  const likeComment = useCallback(async (commentId: number): Promise<{ success: boolean; likeCount?: number; isLiked?: boolean }> => {
    if (!session) {
      return { success: false }
    }

    const userId = session.user?.id || session.user?.email
    if (!userId) {
      return { success: false }
    }

    try {
      const response = await fetch('/api/comment/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ commentId, userId })
      })

      const data = await response.json()
      return {
        success: data.success,
        likeCount: data.likeCount,
        isLiked: data.isLiked
      }
    } catch (error) {
      console.error('Failed to like comment:', error)
      return { success: false }
    }
  }, [session])

  const buildOptimisticComment = useCallback((
    commentId: number,
    content: string,
    parentId?: number,
    images?: string
  ) => {
    return {
      id: commentId,
      slang_id: typeof slangId === 'string' ? parseInt(slangId) : slangId,
      parent_id: parentId || null,
      user_id: session?.user?.id || session?.user?.email || '',
      username: session?.user?.username || session?.user?.name || 'Anonymous',
      content,
      images,
      likes: 0,
      created_at: new Date().toISOString(),
      is_liked: false,
      reply_count: 0
    }
  }, [session, slangId])

  return {
    submitComment,
    likeComment,
    buildOptimisticComment,
    isUploading,
    uploadError,
    setUploadError
  }
}
