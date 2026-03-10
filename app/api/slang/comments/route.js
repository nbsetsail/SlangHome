import { NextResponse } from 'next/server';
import { getCommentsBySlangId, getCommentsCountBySlangId, getTopLevelCommentsCountBySlangId } from '@/lib/db-adapter';
import { auth } from '@/lib/auth';
import { 
  cacheGet, 
  cacheSet, 
  cacheDelPattern,
  cacheKeys, 
  cacheTTLs 
} from '@/lib/cache';

export async function GET(request) {
  const url = new URL(request.url)
  const slangId = url.searchParams.get('slangId')
  const page = parseInt(url.searchParams.get('page') || '1')
  const pageSize = parseInt(url.searchParams.get('pageSize') || '10')

  if (!slangId) {
    return NextResponse.json({ error: 'Slang ID is required' }, { status: 400 })
  }

  try {
    const session = await auth()
    const userId = session?.user?.id || null

    const cacheKey = cacheKeys.slang.comments(slangId, page, pageSize)
    
    if (!userId) {
      const cachedData = await cacheGet(cacheKey)
      if (cachedData) {
        return NextResponse.json(cachedData)
      }
    }

    const comments = await getCommentsBySlangId(slangId, page, pageSize, userId)
    const topLevelTotal = await getTopLevelCommentsCountBySlangId(slangId)
    
    const responseData = { 
      comments, 
      pagination: {
        page,
        pageSize,
        total: topLevelTotal,
        hasMore: page * pageSize < topLevelTotal
      }
    }

    if (!userId) {
      await cacheSet(cacheKey, responseData, cacheTTLs.hot())
    }
    
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments data' }, { status: 500 })
  }
}
