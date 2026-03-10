import { NextResponse } from 'next/server';
import { getQuery, allQuery, runQuery, executeQuery, smartInsert, smartUpdate } from '@/lib/db-adapter';
import { generateUUIDv7 } from '@/lib/uuid.js';
import { 
  cacheGet, 
  cacheSet, 
  cacheDelPattern,
  cacheKeys, 
  cacheTTLs,
  userStateCache,
  heatCounters
} from '@/lib/cache';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit
    const sort = searchParams.get('sort') || 'heat'
    const userId = searchParams.get('userId')
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')
    const locale = searchParams.get('locale')
    const allLocales = searchParams.get('allLocales') === 'true'

    const cacheKeyParams = { page, limit, sort, category, tag, search: search || '', locale: allLocales ? 'all' : (locale || 'en') }
    const cacheKey = cacheKeys.slang.list(cacheKeyParams)
    
    if (!userId && !search) {
      const cachedData = await cacheGet(cacheKey)
      if (cachedData) {
        return new Response(JSON.stringify(cachedData), {
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120'
          }
        })
      }
    }

    const conditions = ['(s.status IS NULL OR s.status = $1)']
    const params = ['active']
    let paramIndex = 2

    if (!allLocales && locale) {
      conditions.push(`s.locale = $${paramIndex++}`)
      params.push(locale)
    } else if (!allLocales) {
      conditions.push(`s.locale = $${paramIndex++}`)
      params.push('en')
    }

    if (category) {
      conditions.push(`s.categories @> $${paramIndex++}::jsonb`)
      params.push(JSON.stringify([category]))
    }

    if (tag) {
      conditions.push(`s.tags @> $${paramIndex++}::jsonb`)
      params.push(JSON.stringify([tag]))
    }

    if (search) {
      const keywords = search.split(/[\s,;，；、.。:：]+/).filter(k => k.trim() !== '')
      if (keywords.length > 0) {
        const orConditions = keywords.map(() => {
          const paramIdx = paramIndex++
          return `(s.phrase ILIKE $${paramIdx} OR s.explanation ILIKE $${paramIdx} OR s.example ILIKE $${paramIdx} OR s.origin ILIKE $${paramIdx})`
        })
        conditions.push(`(${orConditions.join(' OR ')})`)
        keywords.forEach(k => params.push(`%${k}%`))
        
        updateSearchCount(search, userId).catch(err => 
          console.error('Error updating search count:', err)
        )
      }
    }

    const whereClause = conditions.join(' AND ')

    const sortMap = {
      views: 's.views DESC',
      likes: 's.likes DESC',
      favorites: 's.favorites DESC',
      comments: 's.comments_count DESC',
      shares: 's.shares DESC',
      newest: 's.created_at DESC',
      oldest: 's.created_at ASC',
      heat: 's.heat DESC'
    }
    const orderClause = sortMap[sort] || 's.heat DESC'

    const countSql = `SELECT COUNT(*) as count FROM slang s WHERE ${whereClause}`
    const countResult = await getQuery(countSql, params)
    const total = countResult?.count || 0

    let dataSql
    let dataParams

    if (userId) {
      dataSql = `
        SELECT s.id, s.phrase, s.explanation, s.example, s.origin, s.has_evolution,
               s.views, s.likes, s.comments_count, s.favorites, s.shares, s.heat,
               s.categories, s.tags, s.locale, s.created_at,
               CASE WHEN l.slang_id IS NOT NULL THEN 1 ELSE 0 END as "isLiked",
               CASE WHEN f.slang_id IS NOT NULL THEN 1 ELSE 0 END as "isFavorited"
        FROM slang s
        LEFT JOIN likes l ON s.id = l.slang_id AND l.user_id = $${paramIndex}
        LEFT JOIN favorites f ON s.id = f.slang_id AND f.user_id = $${paramIndex + 1}
        WHERE ${whereClause}
        ORDER BY ${orderClause}
        LIMIT $${paramIndex + 2} OFFSET $${paramIndex + 3}
      `
      dataParams = [...params, userId, userId, limit, offset]
    } else {
      dataSql = `
        SELECT s.id, s.phrase, s.explanation, s.example, s.origin, s.has_evolution,
               s.views, s.likes, s.comments_count, s.favorites, s.shares, s.heat,
               s.categories, s.tags, s.locale, s.created_at
        FROM slang s
        WHERE ${whereClause}
        ORDER BY ${orderClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `
      dataParams = [...params, limit, offset]
    }

    const slangList = await allQuery(dataSql, dataParams)
    const slangIds = slangList.map(s => s.id)

    let cachedUserLiked = {}
    let cachedUserFavorited = {}
    if (userId) {
      cachedUserLiked = await userStateCache.getMultipleUserLikedSlang(userId, slangIds)
      cachedUserFavorited = await userStateCache.getMultipleUserFavoritedSlang(userId, slangIds)
    }

    const pendingCounters = await heatCounters.getMultipleSlangCounters(slangIds)

    const slangWithMetrics = slangList.map((slang) => {
      const result = {
        ...slang,
        has_evolution: !!slang.has_evolution
      }

      const pending = pendingCounters[slang.id]
      if (pending) {
        result.views = (slang.views || 0) + pending.views
        result.likes = (slang.likes || 0) + pending.likes
        result.comments_count = (slang.comments_count || 0) + pending.comments
        result.favorites = (slang.favorites || 0) + pending.favorites
        result.shares = (slang.shares || 0) + pending.shares
      }

      if (userId) {
        if (slang.id in cachedUserLiked) {
          result.isLiked = cachedUserLiked[slang.id]
        } else {
          result.isLiked = slang.isLiked ? !!slang.isLiked : false
        }

        if (slang.id in cachedUserFavorited) {
          result.isFavorited = cachedUserFavorited[slang.id]
        } else {
          result.isFavorited = slang.isFavorited ? !!slang.isFavorited : false
        }
      } else {
        result.isLiked = false
        result.isFavorited = false
      }

      return result
    })

    const result = {
      slang: slangWithMetrics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      source: 'postgres'
    }

    if (!userId && !search) {
      await cacheSet(cacheKey, result, cacheTTLs.hot())
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error fetching slang:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch slang', 
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function updateSearchCount(keyword, userId) {
  try {
    const keywords = keyword.split(/[\s,;，；、.。:：]+/).filter(k => k.trim() !== '')
    
    for (const kw of keywords) {
      const existingSearch = await getQuery('SELECT id, times FROM searches WHERE keyword = $1', [kw])
      if (existingSearch) {
        await smartUpdate('searches', { times: (existingSearch.times || 0) + 1 }, 'id = $1', [existingSearch.id])
      } else {
        await smartInsert('searches', { user_id: userId || null, keyword: kw, times: 1 })
      }
    }
  } catch (error) {
    console.error('Error updating search count:', error)
  }
}

export async function POST(request) {
  try {
    const data = await request.json()
    const { phrase, explanation, example, origin, has_evolution, categories, tags, user_id, locale = 'en' } = data

    const categoryList = categories ? categories.replace(/，/g, ',').split(',').map(cat => cat.trim()).filter(cat => cat) : []
    const tagList = tags ? tags.replace(/，/g, ',').split(',').map(tag => tag.trim()).filter(tag => tag) : []

    for (const category of categoryList) {
      const existingCategory = await getQuery('SELECT id FROM categories WHERE name = $1 AND locale = $2', [category, locale])
      if (!existingCategory) {
        await smartInsert('categories', { name: category, locale })
      }
    }

    for (const tag of tagList) {
      const existingTag = await getQuery('SELECT id FROM tags WHERE name = $1 AND locale = $2', [tag, locale])
      if (!existingTag) {
        await smartInsert('tags', { name: tag, locale })
      }
    }

    const slangId = generateUUIDv7()

    await smartInsert('slang', { 
      id: slangId, phrase, explanation, example, origin, 
      has_evolution, 
      categories: JSON.stringify(categoryList), 
      tags: JSON.stringify(tagList), 
      user_id, locale 
    })

    const result = await getQuery('SELECT * FROM slang WHERE id = $1', [slangId])

    await cacheDelPattern('slang:list:*')
    await cacheDelPattern('categories:*')
    await cacheDelPattern('tags:*')

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error creating slang:', error)
    return NextResponse.json({ 
      error: 'Failed to create slang', 
      message: error.message 
    }, {
      status: 500
    })
  }
}
