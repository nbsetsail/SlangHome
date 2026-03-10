import { NextResponse } from 'next/server';
import { getWriteDb, releaseDb, smartInsert } from '@/lib/db-adapter';
import { cacheDelPattern, cacheDel, heatCounters, userStateCache, cacheKeys } from '@/lib/cache';
import { likeSchema, validateSchema } from '@/lib/validators'

export async function POST(request) {
  let connection = null
  try {
    const data = await request.json()

    const validationResult = validateSchema(likeSchema, data)
    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 })
    }

    const { slangId, userId } = validationResult.data

    connection = await getWriteDb()

    const existingResult = await connection.query(
      'SELECT * FROM likes WHERE user_id = $1 AND slang_id = $2',
      [userId, slangId]
    )
    const isLiked = existingResult.rows.length > 0

    const slangResult = await connection.query(
      'SELECT * FROM slang WHERE id = $1',
      [slangId]
    )
    const slang = slangResult.rows.length > 0 ? slangResult.rows[0] : null

    if (!slang) {
      return NextResponse.json({ error: 'Slang not found' }, { status: 404 })
    }

    if (!isLiked) {
      await smartInsert('likes', {
        user_id: userId,
        slang_id: slangId
      }, connection)

      if (slang.user_id && slang.user_id !== userId) {
        const userResult = await connection.query(
          'SELECT username FROM users WHERE id = $1',
          [userId]
        )
        const likerName = userResult.rows.length > 0 ? userResult.rows[0].username : 'Someone'
        await smartInsert('notifications', {
          user_id: slang.user_id,
          type: 'like',
          title: 'New Like!',
          content: `${likerName} liked your slang "${slang.phrase}"`,
          link: `/slang/phrase/${encodeURIComponent(slang.phrase)}`,
          is_read: false
        }, connection)
      }
      
      await heatCounters.incrSlangLikes(slangId, 1)
      await userStateCache.setUserLikedSlang(userId, slangId, true)
    } else {
      await connection.query(
        'DELETE FROM likes WHERE user_id = $1 AND slang_id = $2',
        [userId, slangId]
      )
      
      await heatCounters.incrSlangLikes(slangId, -1)
      await userStateCache.setUserLikedSlang(userId, slangId, false)
    }

    const countResult = await connection.query(
      'SELECT COUNT(*) as count FROM likes WHERE slang_id = $1',
      [slangId]
    )
    const likeCount = countResult.rows[0]?.count || 0

    await cacheDel(cacheKeys.slang.detail(slangId))
    await cacheDelPattern('slang:list:*')

    return NextResponse.json({ isLiked: !isLiked, likes: likeCount })
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  } finally {
    if (connection) {
      await releaseDb(connection)
    }
  }
}
