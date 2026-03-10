import { NextResponse } from 'next/server';
import { getWriteDb, releaseDb, smartInsert } from '@/lib/db-adapter';
import { cacheDelPattern, cacheDel, heatCounters, userStateCache, cacheKeys } from '@/lib/cache';

export async function POST(request) {
  let connection = null
  try {
    const { slangId, userId } = await request.json()

    if (!slangId || !userId) {
      return NextResponse.json({ error: 'Slang ID and User ID are required' }, { status: 400 })
    }

    connection = await getWriteDb()

    const existingResult = await connection.query(
      'SELECT * FROM favorites WHERE user_id = $1 AND slang_id = $2',
      [userId, slangId]
    )
    const isFavorited = existingResult.rows.length > 0

    const slangResult = await connection.query(
      'SELECT * FROM slang WHERE id = $1',
      [slangId]
    )
    const slang = slangResult.rows.length > 0 ? slangResult.rows[0] : null

    if (!slang) {
      return NextResponse.json({ error: 'Slang not found' }, { status: 404 })
    }

    if (!isFavorited) {
      await smartInsert('favorites', {
        user_id: userId,
        slang_id: slangId
      }, connection)

      if (slang.user_id && slang.user_id !== userId) {
        const userResult = await connection.query(
          'SELECT username FROM users WHERE id = $1',
          [userId]
        )
        const favoriterName = userResult.rows.length > 0 ? userResult.rows[0].username : 'Someone'
        await smartInsert('notifications', {
          user_id: slang.user_id,
          type: 'favorite',
          title: 'New Favorite!',
          content: `${favoriterName} favorited your slang "${slang.phrase}"`,
          link: `/slang/phrase/${encodeURIComponent(slang.phrase)}`,
          is_read: false
        }, connection)
      }
      
      await heatCounters.incrSlangFavorites(slangId, 1)
      await userStateCache.setUserFavoritedSlang(userId, slangId, true)
    } else {
      await connection.query(
        'DELETE FROM favorites WHERE user_id = $1 AND slang_id = $2',
        [userId, slangId]
      )
      
      await heatCounters.incrSlangFavorites(slangId, -1)
      await userStateCache.setUserFavoritedSlang(userId, slangId, false)
    }

    const countResult = await connection.query(
      'SELECT COUNT(*) as count FROM favorites WHERE slang_id = $1',
      [slangId]
    )
    const favoriteCount = countResult.rows[0]?.count || 0

    await cacheDel(cacheKeys.slang.detail(slangId))
    await cacheDelPattern('slang:list:*')

    return NextResponse.json({ isFavorited: !isFavorited, favorites: favoriteCount })
  } catch (error) {
    console.error('Error toggling favorite:', error)
    return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 })
  } finally {
    if (connection) {
      await releaseDb(connection)
    }
  }
}
