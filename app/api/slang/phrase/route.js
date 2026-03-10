import { NextResponse } from 'next/server';
import { getReadDb, releaseDb } from '@/lib/db-adapter';
import { userStateCache } from '@/lib/cache';
import { auth } from '@/lib/auth';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const phrase = searchParams.get('phrase');
  let connection = null

  if (!phrase) {
    return NextResponse.json({ error: 'Phrase is required' }, { status: 400 });
  }

  try {
    const session = await auth();
    const userId = session?.user?.id || null;

    connection = await getReadDb()
    
    let slang = null;
    if (userId) {
      const result = await connection.query(`
        SELECT s.*,
               CASE WHEN l.slang_id IS NOT NULL THEN 1 ELSE 0 END as "isLiked",
               CASE WHEN f.slang_id IS NOT NULL THEN 1 ELSE 0 END as "isFavorited"
        FROM slang as s
        LEFT JOIN likes as l ON s.id = l.slang_id AND l.user_id = $1
        LEFT JOIN favorites as f ON s.id = f.slang_id AND f.user_id = $2
        WHERE s.phrase = $3
      `, [userId, userId, phrase]);
      slang = result.rows.length > 0 ? result.rows[0] : null;
    } else {
      const result = await connection.query(`
        SELECT * FROM slang
        WHERE phrase = $1
      `, [phrase]);
      slang = result.rows.length > 0 ? result.rows[0] : null;
    }

    if (!slang) {
      return NextResponse.json({ error: 'Slang not found' }, { status: 404 });
    }
    
    let isLiked = false
    let isFavorited = false
    
    if (userId) {
      const cachedLiked = await userStateCache.getUserLikedSlang(userId, slang.id)
      const cachedFavorited = await userStateCache.getUserFavoritedSlang(userId, slang.id)
      
      isLiked = cachedLiked ?? !!slang.isLiked
      isFavorited = cachedFavorited ?? !!slang.isFavorited
    }

    const result = {
      ...slang,
      has_evolution: !!slang.has_evolution,
      isLiked,
      isFavorited
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching slang by phrase:', error);
    return NextResponse.json({
      error: 'Failed to fetch slang',
      message: error.message
    }, { status: 500 });
  } finally {
    if (connection) {
      await releaseDb(connection)
    }
  }
}
