import { NextResponse } from 'next/server';
import { getReadDb, releaseDb } from '@/lib/db-adapter';
import { heatCounters } from '@/lib/cache';

export async function GET(request, { params }) {
  const resolvedParams = await params;
  let { phrase } = resolvedParams;
  let connection = null

  if (!phrase) {
    return NextResponse.json({ error: 'Phrase is required' }, { status: 400 });
  }

  phrase = decodeURIComponent(phrase);

  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  console.log('API: Received phrase:', phrase);
  console.log('API: Received userId:', userId);
  console.log('API: Request URL:', request.url);

  try {
    connection = await getReadDb()
    
    console.log('API: Querying slang with phrase:', phrase);

    let slang;

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
      console.log('API: Exact match failed, trying case-insensitive match');

      if (userId) {
        const result = await connection.query(`
          SELECT s.*,
                 CASE WHEN l.slang_id IS NOT NULL THEN 1 ELSE 0 END as "isLiked",
                 CASE WHEN f.slang_id IS NOT NULL THEN 1 ELSE 0 END as "isFavorited"
          FROM slang as s
          LEFT JOIN likes as l ON s.id = l.slang_id AND l.user_id = $1
          LEFT JOIN favorites as f ON s.id = f.slang_id AND f.user_id = $2
          WHERE LOWER(s.phrase) = LOWER($3)
        `, [userId, userId, phrase]);
        slang = result.rows.length > 0 ? result.rows[0] : null;
      } else {
        const result = await connection.query(`
          SELECT * FROM slang
          WHERE LOWER(phrase) = LOWER($1)
        `, [phrase]);
        slang = result.rows.length > 0 ? result.rows[0] : null;
      }

      if (slang) {
        console.log('API: Case-insensitive match found');
        return NextResponse.json({
          ...slang,
          has_evolution: !!slang.has_evolution
        });
      }
    }

    console.log('API: Found slang:', slang);

    if (!slang) {
      return NextResponse.json({ error: 'Slang not found' }, { status: 404 });
    }

    let pendingCounters = { views: 0, likes: 0, comments: 0, favorites: 0, shares: 0 };
    try {
      const counters = await heatCounters.getSlangCounters(slang.id);
      pendingCounters = counters;
    } catch (err) {
      console.error('Error getting pending counters:', err);
    }

    const result = {
      ...slang,
      has_evolution: !!slang.has_evolution,
      views: (slang.views || 0) + pendingCounters.views,
      likes: (slang.likes || 0) + pendingCounters.likes,
      comments_count: (slang.comments_count || 0) + pendingCounters.comments,
      favorites: (slang.favorites || 0) + pendingCounters.favorites,
      shares: (slang.shares || 0) + pendingCounters.shares,
      isLiked: slang.isLiked ? !!slang.isLiked : false,
      isFavorited: slang.isFavorited ? !!slang.isFavorited : false
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
