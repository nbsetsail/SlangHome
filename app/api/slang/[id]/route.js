import { NextResponse } from 'next/server';
import { getReadDb, getWriteDb, releaseDb, smartUpdate } from '@/lib/db-adapter';
import { cacheGet, cacheSet, cacheDel, cacheDelPattern, cacheKeys, cacheTTLs, userStateCache, heatCounters } from '@/lib/cache';
import { auth } from '@/lib/auth';

export async function GET(request, context) {
  let connection = null;
  try {
    let id = null;

    if (context && context.params) {
      const resolvedParams = await context.params;
      if (resolvedParams.id) {
        id = resolvedParams.id;
      }
    }

    if (!id) {
      const url = new URL(request.url);
      const pathname = url.pathname;
      const parts = pathname.split('/');
      id = parts[parts.length - 1];
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const locale = url.searchParams.get('locale') || 'en';

    if (!id) {
      return new Response(JSON.stringify({
        error: 'Slang ID is required',
        message: 'Slang ID must be provided in the URL'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cacheKey = cacheKeys.slang.detail(id);
    
    if (!userId) {
      const cachedData = await cacheGet(cacheKey);
      if (cachedData) {
        return NextResponse.json(cachedData, {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
          }
        });
      }
    }

    connection = await getReadDb();
    
    let slang = null;
    if (userId) {
      const result = await connection.query(`
        SELECT s.*,
               CASE WHEN l.slang_id IS NOT NULL THEN 1 ELSE 0 END as "isLiked",
               CASE WHEN f.slang_id IS NOT NULL THEN 1 ELSE 0 END as "isFavorited"
        FROM slang as s
        LEFT JOIN likes as l ON s.id = l.slang_id AND l.user_id = $1
        LEFT JOIN favorites as f ON s.id = f.slang_id AND f.user_id = $2
        WHERE s.id = $3
      `, [userId, userId, id]);
      slang = result.rows[0];
    } else {
      const result = await connection.query('SELECT * FROM slang WHERE id = $1', [id]);
      slang = result.rows[0];
    }

    if (!slang) {
      return NextResponse.json({
        error: 'Slang not found',
        message: `Slang with ID ${id} not found`
      }, {
        status: 404
      });
    }
    
    let isLiked = false
    let isFavorited = false
    
    if (userId) {
      const cachedLiked = await userStateCache.getUserLikedSlang(userId, id)
      const cachedFavorited = await userStateCache.getUserFavoritedSlang(userId, id)
      
      isLiked = cachedLiked ?? !!slang.isLiked
      isFavorited = cachedFavorited ?? !!slang.isFavorited
    }
    
    let pendingCounters = { views: 0, likes: 0, comments: 0, favorites: 0, shares: 0 };
    try {
      const counters = await heatCounters.getSlangCounters(id);
      pendingCounters = counters;
    } catch (err) {
      console.error('Error getting pending counters:', err);
    }
    
    const result = {
      id: slang.id,
      phrase: slang.phrase,
      explanation: slang.explanation,
      example: slang.example,
      origin: slang.origin,
      has_evolution: !!slang.has_evolution,
      views: (slang.views || 0) + pendingCounters.views,
      likes: (slang.likes || 0) + pendingCounters.likes,
      comments_count: (slang.comments_count || 0) + pendingCounters.comments,
      favorites: (slang.favorites || 0) + pendingCounters.favorites,
      shares: (slang.shares || 0) + pendingCounters.shares,
      heat: slang.heat,
      categories: slang.categories,
      tags: slang.tags,
      user_id: slang.user_id,
      status: slang.status,
      created_at: slang.created_at,
      updated_at: slang.updated_at,
      isLiked,
      isFavorited
    };

    if (!userId) {
      await cacheSet(cacheKey, result, cacheTTLs.hot());
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('API ERROR:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message
    }, {
      status: 500
    });
  } finally {
    if (connection) {
      await releaseDb(connection);
    }
  }
}

export async function PUT(request, context) {
  let connection = null;
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const { id } = resolvedParams;
    
    const data = await request.json();
    const { phrase, explanation, example, origin, has_evolution, categories, tags } = data;

    const categoryList = categories ? (Array.isArray(categories) ? categories : categories.replace(/，/g, ',').split(',').map(cat => cat.trim()).filter(cat => cat)) : [];
    const tagList = tags ? (Array.isArray(tags) ? tags : tags.replace(/，/g, ',').split(',').map(tag => tag.trim()).filter(tag => tag)) : [];

    connection = await getWriteDb();

    const slangResult = await connection.query('SELECT user_id FROM slang WHERE id = $1', [id]);
    const slang = slangResult.rows[0];

    if (!slang) {
      return NextResponse.json({ error: 'Slang not found' }, { status: 404 });
    }

    if (slang.user_id !== session.user.id && session.user.role !== 'admin' && session.user.role !== 'moderator') {
      return NextResponse.json({ error: 'Forbidden - You can only edit your own slang' }, { status: 403 });
    }

    await smartUpdate('slang', 
      { phrase, explanation, example, origin, has_evolution: has_evolution ? true : false, categories: JSON.stringify(categoryList), tags: JSON.stringify(tagList) }, 
      'id = $1', 
      [id]
    );

    const updatedResult = await connection.query('SELECT * FROM slang WHERE id = $1', [id]);
    const updatedSlang = updatedResult.rows[0];

    await cacheDel(cacheKeys.slang.detail(id));
    await cacheDelPattern('slang:list:*');

    return NextResponse.json({ success: true, slang: updatedSlang });
  } catch (error) {
    console.error('Error updating slang:', error);
    return NextResponse.json({ error: 'Failed to update slang' }, { status: 500 });
  } finally {
    if (connection) {
      await releaseDb(connection);
    }
  }
}

export async function DELETE(request, context) {
  let connection = null;
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    connection = await getWriteDb();

    const slangResult = await connection.query('SELECT user_id FROM slang WHERE id = $1', [id]);
    const slang = slangResult.rows[0];

    if (!slang) {
      return NextResponse.json({ error: 'Slang not found' }, { status: 404 });
    }

    if (slang.user_id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - You can only delete your own slang' }, { status: 403 });
    }

    await connection.query('DELETE FROM slang WHERE id = $1', [id]);

    await cacheDel(cacheKeys.slang.detail(id));
    await cacheDelPattern('slang:list:*');

    return NextResponse.json({ success: true, message: 'Slang deleted successfully' });
  } catch (error) {
    console.error('Error deleting slang:', error);
    return NextResponse.json({ error: 'Failed to delete slang' }, { status: 500 });
  } finally {
    if (connection) {
      await releaseDb(connection);
    }
  }
}
