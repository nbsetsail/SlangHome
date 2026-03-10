import { NextResponse } from 'next/server';
import { executeQuery, smartInsert, smartUpdate } from '@/lib/db';
import { getUTCTimestamp } from '@/lib/date-utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword') || '';
    const userId = searchParams.get('userId') || '';
    const locale = searchParams.get('locale') || 'en';

    const category = searchParams.get('category') || '';
    const tag = searchParams.get('tag') || '';
    const sortBy = searchParams.get('sortBy') || 'heat';
    const dateRange = searchParams.get('dateRange') || '';
    const includeEvolution = searchParams.get('includeEvolution') === 'true';
    const page = parseInt(searchParams.get('page') || '1') || 1;
    const limit = parseInt(searchParams.get('limit') || '20') || 20;

    if (!keyword.trim() && !category && !tag) {
      return NextResponse.json({ slang: [], pagination: { totalItems: 0, totalPages: 0 } });
    }

    return await searchWithPostgres({
      keyword,
      userId,
      category,
      tag,
      sortBy,
      dateRange,
      includeEvolution,
      page,
      limit,
      locale
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed', message: (error as Error).message }, { status: 500 });
  }
}

async function searchWithPostgres(params: {
  keyword: string;
  userId: string;
  category: string;
  tag: string;
  sortBy: string;
  dateRange: string;
  includeEvolution: boolean;
  page: number;
  limit: number;
  locale: string;
}) {
  const {
    keyword,
    userId,
    category,
    tag,
    sortBy,
    dateRange,
    includeEvolution,
    page,
    limit,
    locale
  } = params;

  const offset = (page - 1) * limit;
  const startTime = Date.now();

  try {
    const conditions: string[] = ['(s.status IS NULL OR s.status = $1)', 's.locale = $2'];
    const queryParams: any[] = ['active', locale];
    let paramIndex = 3;

    if (keyword.trim()) {
      const searchTerms = keyword.split(/[\s,;，；、.。:：]+/).filter(k => k.trim() !== '');
      
      if (searchTerms.length > 0) {
        const orConditions: string[] = [];
        
        for (const term of searchTerms) {
          const likePattern = `%${term}%`;
          const baseCondition = `(s.phrase ILIKE $${paramIndex} OR s.explanation ILIKE $${paramIndex} OR s.example ILIKE $${paramIndex} OR s.origin ILIKE $${paramIndex})`;
          orConditions.push(baseCondition);
          queryParams.push(likePattern);
          paramIndex++;
          
          if (includeEvolution) {
            const evoCondition = `EXISTS (SELECT 1 FROM slang_evolution se WHERE se.slang_id = s.id AND (se.period ILIKE $${paramIndex} OR se.phase ILIKE $${paramIndex} OR se.explanation ILIKE $${paramIndex} OR se.example ILIKE $${paramIndex}))`;
            orConditions.push(evoCondition);
            queryParams.push(likePattern);
            paramIndex++;
          }
        }
        
        conditions.push(`(${orConditions.join(' OR ')})`);
      }
    }

    if (category) {
      conditions.push(`s.categories @> $${paramIndex}::jsonb`);
      queryParams.push(JSON.stringify([category]));
      paramIndex++;
    }

    if (tag) {
      conditions.push(`s.tags @> $${paramIndex}::jsonb`);
      queryParams.push(JSON.stringify([tag]));
      paramIndex++;
    }

    if (dateRange && dateRange !== 'all') {
      const intervalMap: Record<string, number> = {
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
        '1y': 365 * 24 * 60 * 60 * 1000
      };
      
      const intervalMs = intervalMap[dateRange];
      if (intervalMs) {
        const cutoffTime = new Date(Date.now() - intervalMs).toISOString();
        conditions.push(`s.created_at >= $${paramIndex}`);
        queryParams.push(cutoffTime);
        paramIndex++;
      }
    }

    const whereClause = conditions.join(' AND ');

    const sortMap: Record<string, string> = {
      heat: 's.heat DESC',
      views: 's.views DESC',
      likes: 's.likes DESC',
      favorites: 's.favorites DESC',
      comments: 's.comments_count DESC',
      shares: 's.shares DESC',
      newest: 's.created_at DESC',
      oldest: 's.created_at ASC'
    };
    const orderBy = sortMap[sortBy] || 's.heat DESC';

    const countSql = `SELECT COUNT(*) as count FROM slang s WHERE ${whereClause}`;
    const countRows = await executeQuery(countSql, queryParams);
    const totalItems = Number(countRows[0]?.count) || 0;
    const totalPages = Math.ceil(totalItems / limit);

    let dataSql: string;
    let dataParams: any[];

    if (userId) {
      dataSql = `
        SELECT s.id, s.phrase, s.explanation, s.example, s.origin, s.has_evolution,
               s.views, s.likes, s.comments_count, s.favorites, s.shares, s.heat,
               s.categories, s.tags, s.created_at,
               CASE WHEN l.slang_id IS NOT NULL THEN 1 ELSE 0 END as "isLiked",
               CASE WHEN f.slang_id IS NOT NULL THEN 1 ELSE 0 END as "isFavorited"
        FROM slang s
        LEFT JOIN likes l ON s.id = l.slang_id AND l.user_id = $${paramIndex}
        LEFT JOIN favorites f ON s.id = f.slang_id AND f.user_id = $${paramIndex + 1}
        WHERE ${whereClause}
        ORDER BY ${orderBy}
        LIMIT $${paramIndex + 2} OFFSET $${paramIndex + 3}
      `;
      dataParams = [...queryParams, userId, userId, limit, offset];
    } else {
      dataSql = `
        SELECT s.id, s.phrase, s.explanation, s.example, s.origin, s.has_evolution,
               s.views, s.likes, s.comments_count, s.favorites, s.shares, s.heat,
               s.categories, s.tags, s.created_at
        FROM slang s
        WHERE ${whereClause}
        ORDER BY ${orderBy}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      dataParams = [...queryParams, limit, offset];
    }

    const rows = await executeQuery(dataSql, dataParams);
    const slang = rows.map((item: any) => ({
      ...item,
      has_evolution: !!item.has_evolution,
      isLiked: item.isLiked ? true : false,
      isFavorited: item.isFavorited ? true : false
    }));

    if (keyword.trim()) {
      updateSearchCount(keyword, userId).catch(err =>
        console.error('Error updating search count:', err)
      );
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      slang,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages
      },
      source: 'postgres',
      processingTime
    });
  } catch (error) {
    console.error('PostgreSQL search error:', error);
    throw error;
  }
}

async function updateSearchCount(keyword: string, userId: string) {
  try {
    const existingRows = await executeQuery('SELECT id, times FROM searches WHERE keyword = $1', [keyword]);
    
    if (existingRows.length > 0) {
      await smartUpdate('searches', { times: (existingRows[0].times || 0) + 1 }, 'id = $1', [existingRows[0].id]);
    } else {
      await smartInsert('searches', { user_id: userId || null, keyword, times: 1 });
    }
  } catch (searchError) {
    console.error('Error updating search count:', searchError);
  }
}
