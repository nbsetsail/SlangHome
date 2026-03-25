import { NextResponse } from 'next/server';
import { getReadDb, releaseDb } from '@/lib/db-adapter';
import { heatCounters } from '@/lib/cache';
import { executeQuery } from '@/lib/db';

export async function GET(request, { params }) {
  const resolvedParams = await params;
  let { phrase } = resolvedParams;
  let connection = null;

  if (!phrase) {
    return NextResponse.json({ error: 'Phrase is required' }, { status: 400 });
  }

  phrase = decodeURIComponent(phrase);

  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const activationCode = url.searchParams.get('code');
  const locale = url.searchParams.get('locale');

  let isPremium = false;
  if (activationCode) {
    try {
      const codeResult = await executeQuery<{
        count: number;
        device_ids: string[];
        expired_at: string;
      }[]>(`
        SELECT count, device_ids, expired_at FROM activation_codes WHERE code = $1
      `, [activationCode.toUpperCase()]);
      
      if (codeResult.length > 0) {
        const code = codeResult[0];
        const isExpired = new Date(code.expired_at) < new Date();
        const hasRemaining = code.count > 0;
        isPremium = !isExpired && hasRemaining;
      }
    } catch (err) {
      console.error('Code verification error:', err);
    }
  }

  try {
    connection = await getReadDb();
    
    let slang;

    if (userId) {
      if (locale) {
        const result = await connection.query(`
          SELECT s.*,
                 CASE WHEN l.slang_id IS NOT NULL THEN 1 ELSE 0 END as "isLiked",
                 CASE WHEN f.slang_id IS NOT NULL THEN 1 ELSE 0 END as "isFavorited"
          FROM slang as s
          LEFT JOIN likes as l ON s.id = l.slang_id AND l.user_id = $1
          LEFT JOIN favorites as f ON s.id = f.slang_id AND f.user_id = $2
          WHERE LOWER(s.phrase) = LOWER($3) AND s.locale = $4
        `, [userId, userId, phrase, locale]);
        slang = result.rows.length > 0 ? result.rows[0] : null;
      } else {
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
      }
    } else {
      if (locale) {
        const result = await connection.query(`
          SELECT * FROM slang WHERE LOWER(phrase) = LOWER($1) AND locale = $2
        `, [phrase, locale]);
        slang = result.rows.length > 0 ? result.rows[0] : null;
      } else {
        const result = await connection.query(`
          SELECT * FROM slang WHERE LOWER(phrase) = LOWER($1)
        `, [phrase]);
        slang = result.rows.length > 0 ? result.rows[0] : null;
      }
    }

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
      id: slang.id,
      phrase: slang.phrase,
      locale: slang.locale,
      isPremium: isPremium,
      has_more: !!(slang.origin || slang.categories || slang.tags || slang.has_evolution)
    };

    if (userId) {
      result.views = (slang.views || 0) + pendingCounters.views;
      result.likes = (slang.likes || 0) + pendingCounters.likes;
      result.isLiked = slang.isLiked ? !!slang.isLiked : false;
      result.isFavorited = slang.isFavorited ? !!slang.isFavorited : false;
    }

    if (isPremium) {
      result.explanation = slang.explanation;
      result.example = slang.example;
      result.origin = slang.origin;
      result.categories = slang.categories;
      result.tags = slang.tags;
      
      if (slang.has_evolution) {
        const evolutionResult = await connection.query(`
          SELECT period, phase, explanation, example, origin, story, seq 
          FROM slang_evolution 
          WHERE slang_id = $1 ORDER BY seq ASC
        `, [slang.id]);
        
        result.evolution = evolutionResult.rows;
      }
    } else {
      result.explanation = slang.explanation;
      result.example = slang.example;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching slang:', error);
    return NextResponse.json({ error: 'Failed to fetch slang' }, { status: 500 });
  } finally {
    if (connection) {
      await releaseDb(connection);
    }
  }
}
