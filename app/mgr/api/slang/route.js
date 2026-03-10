import { NextResponse } from 'next/server';
import { getQuery, allQuery, runQuery, executeQuery, beginTransaction, commitTransaction, rollbackTransaction, smartInsert, smartUpdate } from '@/lib/db-adapter';
import { generateUUIDv7 } from '@/lib/uuid.js';
import { checkMgrAuth, unauthorizedResponse, getLocaleFilter } from '../auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  const authResult = await checkMgrAuth();
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status);
  }

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const locale = searchParams.get('locale') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    const offset = (page - 1) * limit
    
    const validSortFields = ['created_at', 'phrase', 'views', 'likes', 'heat']
    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid sort field'
      }, { status: 400 })
    }
    
    if (!['asc', 'desc'].includes(sortOrder)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid sort order'
      }, { status: 400 })
    }

    const localeFilter = getLocaleFilter(authResult)
    
    if (locale && localeFilter && !localeFilter.includes(locale)) {
      return NextResponse.json({
        success: false,
        error: `You do not have permission to manage locale: ${locale}`,
        managedLocales: authResult.managedLocales
      }, { status: 403 })
    }
    
    const conditions = ['1=1']
    const params = []
    let paramIndex = 1
    
    if (search) {
      conditions.push(`(phrase ILIKE $${paramIndex} OR explanation ILIKE $${paramIndex + 1} OR example ILIKE $${paramIndex + 2})`)
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
      paramIndex += 3
    }
    
    if (status) {
      conditions.push(`status = $${paramIndex++}`)
      params.push(status)
    }
    
    if (locale) {
      conditions.push(`locale = $${paramIndex++}`)
      params.push(locale)
    } else if (localeFilter) {
      const placeholders = localeFilter.map((_, i) => `$${paramIndex + i}`).join(', ')
      conditions.push(`locale IN (${placeholders})`)
      params.push(...localeFilter)
      paramIndex += localeFilter.length
    }
    
    const whereClause = 'WHERE ' + conditions.join(' AND ')
    
    const countSql = `SELECT COUNT(*) as count FROM slang ${whereClause}`
    const totalResult = await getQuery(countSql, params)
    const total = totalResult?.count || 0
    
    const slangSql = `
      SELECT id, phrase, explanation, example, origin, views, likes, comments_count, favorites, shares, heat, status, user_id, created_at, categories, tags, locale
      FROM slang 
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `
    params.push(limit, offset)
    
    const slang = await allQuery(slangSql, params)
    const totalPages = Math.ceil(total / limit)
    
    return NextResponse.json({
      success: true,
      data: {
        slang,
        pagination: {
          currentPage: page,
          pageSize: limit,
          totalItems: total,
          totalPages
        },
        managedLocales: authResult.managedLocales
      }
    })
  } catch (error) {
    console.error('Error fetching slang:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch slang',
      message: error.message
    }, { status: 500 })
  }
}

export async function POST(request) {
  const authResult = await checkMgrAuth();
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status);
  }

  try {
    const contentType = request.headers.get('content-type')
    
    if (contentType && contentType.startsWith('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file')
      
      if (!file) {
        return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
      }
      
      if (!file.name.endsWith('.json')) {
        return NextResponse.json({ success: false, error: 'File must be a JSON file' }, { status: 400 })
      }
      
      const fileContent = await file.text()
      const slangData = JSON.parse(fileContent)
      
      if (!Array.isArray(slangData)) {
        return NextResponse.json({ success: false, error: 'JSON must be an array of slang objects' }, { status: 400 })
      }
      
      let importedCount = 0
      let failedCount = 0
      const failedItems = []
      
      for (const item of slangData) {
        const itemLocale = item.locale || 'en'
        
        if (authResult.user.role === 'moderator' && !authResult.managedLocales?.includes(itemLocale)) {
          failedCount++
          failedItems.push({ phrase: item.phrase, error: `No permission for locale: ${itemLocale}` })
          continue
        }
        
        const conn = await beginTransaction()
        
        try {
          if (!item.phrase || !item.explanation) {
            throw new Error('Missing required fields: phrase and explanation')
          }
          
          const existingRows = await executeQuery('SELECT id FROM slang WHERE phrase = $1 AND locale = $2', [item.phrase, itemLocale])
          
          if (existingRows.length > 0) {
            throw new Error('Slang with this phrase already exists in this locale')
          }
          
          const slangId = generateUUIDv7();
          
          await smartInsert('slang', {
            id: slangId,
            phrase: item.phrase,
            explanation: item.explanation,
            example: item.example || null,
            origin: item.origin || null,
            categories: item.categories || null,
            tags: item.tags || null,
            user_id: item.user_id || null,
            status: item.status || 'active',
            has_evolution: item.evolution && item.evolution.length > 0 ? true : false,
            locale: itemLocale
          })
          
          if (item.evolution && item.evolution.length > 0) {
            for (let i = 0; i < item.evolution.length; i++) {
              const evolution = item.evolution[i]
              await smartInsert('slang_evolution', {
                slang_id: slangId,
                period: evolution.period || null,
                phase: evolution.phase || null,
                explanation: evolution.explanation || null,
                example: evolution.example || null,
                origin: evolution.origin || null,
                story: evolution.story || null,
                seq: i + 1
              })
            }
          }
          
          await commitTransaction(conn)
          importedCount++
        } catch (error) {
          await rollbackTransaction(conn)
          failedCount++
          failedItems.push({ phrase: item.phrase, error: error.message })
        }
      }
      
      return NextResponse.json({
        success: true,
        data: { importedCount, failedCount, failedItems, totalProcessed: slangData.length }
      })
    } else {
      const body = await request.json()
      const { phrase, explanation, example, origin, categories, tags, user_id, status = 'pending', evolution, locale = 'en' } = body
      
      if (!phrase || !explanation) {
        return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
      }

      if (authResult.user.role === 'moderator' && !authResult.managedLocales?.includes(locale)) {
        return NextResponse.json({ 
          success: false, 
          error: `You do not have permission to manage locale: ${locale}`,
          managedLocales: authResult.managedLocales
        }, { status: 403 })
      }
      
      const categoryList = categories ? (Array.isArray(categories) ? categories : categories.replace(/，/g, ',').split(',').map(cat => cat.trim()).filter(cat => cat)) : [];
      const tagList = tags ? (Array.isArray(tags) ? tags : tags.replace(/，/g, ',').split(',').map(tag => tag.trim()).filter(tag => tag)) : [];
      
      const existingRows = await executeQuery('SELECT id FROM slang WHERE phrase = $1 AND locale = $2', [phrase, locale])
      
      if (existingRows.length > 0) {
        return NextResponse.json({ success: false, error: 'Slang with this phrase already exists in this locale' }, { status: 400 })
      }
      
      const slangId = generateUUIDv7();
      
      const conn = await beginTransaction()
      
      try {
        await smartInsert('slang', {
          id: slangId,
          phrase,
          explanation,
          example,
          origin,
          categories: JSON.stringify(categoryList),
          tags: JSON.stringify(tagList),
          user_id,
          status,
          has_evolution: evolution && evolution.length > 0 ? true : false,
          locale
        })
        
        if (evolution && evolution.length > 0) {
          for (let i = 0; i < evolution.length; i++) {
            const phase = evolution[i]
            await smartInsert('slang_evolution', {
              slang_id: slangId,
              period: phase.period || null,
              phase: phase.phase || null,
              explanation: phase.explanation || null,
              example: phase.example || null,
              origin: phase.origin || null,
              story: phase.story || null,
              seq: i + 1
            })
          }
        }
        
        await commitTransaction(conn)
      } catch (error) {
        await rollbackTransaction(conn)
        throw error
      }
      
      const newSlang = await getQuery(
        `SELECT id, phrase, explanation, example, origin, views, likes, comments_count, favorites, shares, heat, status, user_id, created_at, has_evolution, categories, tags, locale 
         FROM slang WHERE id = $1`, 
        [slangId]
      )
      
      return NextResponse.json({ success: true, data: newSlang }, { status: 201 })
    }
  } catch (error) {
    console.error('Error handling request:', error)
    return NextResponse.json({ success: false, error: 'Failed to process request', message: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  const authResult = await checkMgrAuth();
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status);
  }

  try {
    const body = await request.json()
    const { id, phrase, explanation, example, origin, categories, tags, status, evolution, locale } = body
    
    if (!id || !phrase || !explanation) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }
    
    const categoryList = categories ? (Array.isArray(categories) ? categories : categories.replace(/，/g, ',').split(',').map(cat => cat.trim()).filter(cat => cat)) : [];
    const tagList = tags ? (Array.isArray(tags) ? tags : tags.replace(/，/g, ',').split(',').map(tag => tag.trim()).filter(tag => tag)) : [];
    
    const existingRows = await executeQuery('SELECT id, locale FROM slang WHERE id = $1', [id])
    
    if (existingRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Slang not found' }, { status: 404 })
    }

    const slangLocale = locale || existingRows[0].locale
    if (authResult.user.role === 'moderator' && !authResult.managedLocales?.includes(slangLocale)) {
      return NextResponse.json({ 
        success: false, 
        error: `You do not have permission to manage locale: ${slangLocale}`,
        managedLocales: authResult.managedLocales
      }, { status: 403 })
    }
    
    const duplicateRows = await executeQuery('SELECT id FROM slang WHERE phrase = $1 AND locale = $2 AND id != $3', [phrase, slangLocale, id])
    
    if (duplicateRows.length > 0) {
      return NextResponse.json({ success: false, error: 'Slang with this phrase already exists in this locale' }, { status: 400 })
    }
    
    const conn = await beginTransaction()
    
    try {
      await smartUpdate('slang', 
        { phrase, explanation, example, origin, categories: JSON.stringify(categoryList), tags: JSON.stringify(tagList), status, has_evolution: evolution && evolution.length > 0 ? true : false, locale: slangLocale }, 
        'id = $1', 
        [id]
      )
      
      await executeQuery('DELETE FROM slang_evolution WHERE slang_id = $1', [id])
      
      if (evolution && evolution.length > 0) {
        for (let i = 0; i < evolution.length; i++) {
          const phase = evolution[i]
          await smartInsert('slang_evolution', {
            slang_id: id,
            period: phase.period || null,
            phase: phase.phase || null,
            explanation: phase.explanation || null,
            example: phase.example || null,
            origin: phase.origin || null,
            story: phase.story || null,
            seq: i + 1
          })
        }
      }
      
      await commitTransaction(conn)
    } catch (error) {
      await rollbackTransaction(conn)
      throw error
    }
    
    const updatedSlang = await getQuery(
      `SELECT id, phrase, explanation, example, origin, views, likes, comments_count, favorites, shares, heat, status, user_id, created_at, has_evolution, categories, tags, locale 
       FROM slang WHERE id = $1`, 
      [id]
    )
    
    return NextResponse.json({ success: true, data: updatedSlang })
  } catch (error) {
    console.error('Error updating slang:', error)
    return NextResponse.json({ success: false, error: 'Failed to update slang', message: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  const authResult = await checkMgrAuth(['admin', 'moderator']);
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status);
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing slang id' }, { status: 400 })
    }
    
    const existingRows = await executeQuery('SELECT id, locale FROM slang WHERE id = $1', [id])
    
    if (existingRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Slang not found' }, { status: 404 })
    }

    if (authResult.user.role === 'moderator' && !authResult.managedLocales?.includes(existingRows[0].locale)) {
      return NextResponse.json({ 
        success: false, 
        error: `You do not have permission to manage locale: ${existingRows[0].locale}`,
        managedLocales: authResult.managedLocales
      }, { status: 403 })
    }
    
    const conn = await beginTransaction()
    
    try {
      await executeQuery('DELETE FROM views WHERE slang_id = $1', [id])
      await executeQuery('DELETE FROM likes WHERE slang_id = $1', [id])
      await executeQuery('DELETE FROM favorites WHERE slang_id = $1', [id])
      await executeQuery('DELETE FROM shares WHERE slang_id = $1', [id])
      await executeQuery('DELETE FROM comments WHERE slang_id = $1', [id])
      await executeQuery('DELETE FROM slang_evolution WHERE slang_id = $1', [id])
      await executeQuery('DELETE FROM slang WHERE id = $1', [id])
      
      await commitTransaction(conn)
    } catch (error) {
      await rollbackTransaction(conn)
      throw error
    }
    
    return NextResponse.json({ success: true, message: 'Slang deleted successfully' })
  } catch (error) {
    console.error('Error deleting slang:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete slang', message: error.message }, { status: 500 })
  }
}
