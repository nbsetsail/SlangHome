import { NextResponse } from 'next/server'
import { getRepliesByCommentId, getRepliesCountByCommentId } from '@/lib/db-adapter'

export async function GET(request) {
  const url = new URL(request.url)
  const commentId = url.searchParams.get('commentId')
  const page = parseInt(url.searchParams.get('page') || '1')
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
  let userId = url.searchParams.get('userId')
  
  if (!userId || userId === '') {
    userId = null
  }

  if (!commentId) {
    return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 })
  }

  try {
    const replies = await getRepliesByCommentId(commentId, userId, page, pageSize)
    const total = await getRepliesCountByCommentId(commentId)
    
    return NextResponse.json({ 
      replies, 
      pagination: {
        page,
        pageSize,
        total,
        hasMore: page * pageSize < total
      }
    })
  } catch (error) {
    console.error('Error fetching replies:', error)
    return NextResponse.json({ error: 'Failed to fetch replies data' }, { status: 500 })
  }
}
