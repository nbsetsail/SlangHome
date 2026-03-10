import { NextResponse } from 'next/server';
import { getReadDb, releaseDb } from '@/lib/db-adapter';
import { cacheGet, cacheSet, cacheKeys, cacheTTLs } from '@/lib/cache';

export async function GET(request, context) {
  let connection = null;
  try {
    const params = await context.params;
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const cacheKey = cacheKeys.user.stats(id);
    const cachedStats = await cacheGet(cacheKey);
    if (cachedStats) {
      return NextResponse.json(cachedStats);
    }

    connection = await getReadDb();

    const viewCountResult = await connection.query('SELECT COUNT(*) as count FROM views WHERE user_id = $1', [id]);
    const views = viewCountResult.rows[0]?.count || 0;

    const likeCountResult = await connection.query('SELECT COUNT(*) as count FROM likes WHERE user_id = $1', [id]);
    const likes = likeCountResult.rows[0]?.count || 0;

    const commentCountResult = await connection.query('SELECT COUNT(*) as count FROM comments WHERE user_id = $1', [id]);
    const comments = commentCountResult.rows[0]?.count || 0;

    const commentLikesResult = await connection.query(`
      SELECT SUM(c.likes) as total_likes 
      FROM comments c 
      WHERE c.user_id = $1
    `, [id]);
    const commentLikes = commentLikesResult.rows[0]?.total_likes || 0;

    const slangByLocaleResult = await connection.query(`
      SELECT locale, COUNT(*) as count 
      FROM slang 
      WHERE user_id = $1 AND status != 'rejected'
      GROUP BY locale
    `, [id]);
    
    const slangByLocale = {};
    for (const row of slangByLocaleResult.rows) {
      slangByLocale[row.locale] = row.count;
    }

    const favoriteByLocaleResult = await connection.query(`
      SELECT s.locale, COUNT(*) as count 
      FROM favorites f
      JOIN slang s ON f.slang_id = s.id
      WHERE f.user_id = $1
      GROUP BY s.locale
    `, [id]);
    
    const favoritesByLocale = {};
    for (const row of favoriteByLocaleResult.rows) {
      favoritesByLocale[row.locale] = row.count;
    }

    const stats = {
      views,
      likes,
      comments,
      commentLikes,
      slangByLocale,
      favoritesByLocale
    };

    await cacheSet(cacheKey, stats, cacheTTLs.userState());

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: 'Failed to fetch user stats' }, { status: 500 });
  } finally {
    if (connection) {
      await releaseDb(connection);
    }
  }
}
