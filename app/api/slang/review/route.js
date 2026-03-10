import { NextResponse } from 'next/server'
import { getReadDb, getWriteDb, releaseDb, smartInsert, smartUpdate } from '@/lib/db-adapter'
import { generateUUIDv7 } from '@/lib/uuid'

export async function GET(request) {
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '10')
  const status = url.searchParams.get('status') || 'pending'
  const userId = url.searchParams.get('userId') || null
  
  let connection = null
  try {
    connection = await getReadDb()
    
    let whereClause = 'WHERE status = $1'
    const params = [status]
    let paramIndex = 2
    
    if (userId) {
      whereClause += ` AND user_id = $${paramIndex}`
      params.push(userId)
      paramIndex++
    }
    
    const offset = (page - 1) * limit
    
    const countResult = await connection.query(
      `SELECT COUNT(*) as count FROM slang ${whereClause}`,
      params
    )
    const count = countResult.rows[0]?.count || 0
    
    const slangResult = await connection.query(`
      SELECT s.*, u.username as submitter_name
      FROM slang s
      LEFT JOIN users u ON s.user_id = u.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, offset])
    
    return NextResponse.json({
      success: true,
      data: {
        slang: slangResult.rows,
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    })
    
  } catch (error) {
    console.error('Error fetching slang for review:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch slang for review' },
      { status: 500 }
    )
  } finally {
    if (connection) await releaseDb(connection)
  }
}

export async function POST(request) {
  let connection = null
  try {
    const body = await request.json()
    const { phrase, explanation, example, origin, categories, tags, userId } = body
    
    if (!phrase || !explanation || !userId) {
      return NextResponse.json(
        { success: false, error: 'Phrase, explanation and userId are required' },
        { status: 400 }
      )
    }
    
    const categoryList = categories ? (Array.isArray(categories) ? categories : categories.replace(/，/g, ',').split(',').map(cat => cat.trim()).filter(cat => cat)) : [];
    const tagList = tags ? (Array.isArray(tags) ? tags : tags.replace(/，/g, ',').split(',').map(tag => tag.trim()).filter(tag => tag)) : [];
    
    connection = await getWriteDb()
    await connection.query('BEGIN')
    
    const existingResult = await connection.query(
      "SELECT id FROM slang WHERE phrase = $1 AND status != 'rejected'",
      [phrase]
    )
    
    if (existingResult.rows.length > 0) {
      await connection.query('ROLLBACK')
      return NextResponse.json(
        { success: false, error: 'Slang with this phrase already exists' },
        { status: 400 }
      )
    }
    
    const slangId = generateUUIDv7()
    
    await smartInsert('slang', { 
      id: slangId, phrase, explanation, example: example || '', 
      origin: origin || '', categories: JSON.stringify(categoryList), tags: JSON.stringify(tagList), 
      user_id: userId, status: 'pending' 
    })
    
    await smartInsert('action_logs', { 
      user_id: userId, action: 'slang_submitted', target_type: 'slang', 
      target_id: slangId, details: `User submitted new slang: ${phrase}`,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    })
    
    await connection.query('COMMIT')
    
    return NextResponse.json({
      success: true,
      data: { id: slangId, message: 'Slang submitted for review' }
    })
    
  } catch (error) {
    if (connection) {
      try {
        await connection.query('ROLLBACK')
      } catch (e) {
        console.error('Rollback failed:', e)
      }
    }
    console.error('Error submitting slang:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit slang' },
      { status: 500 }
    )
  } finally {
    if (connection) await releaseDb(connection)
  }
}

export async function PUT(request) {
  let connection = null
  try {
    const body = await request.json()
    const { id, status, reviewerId, rejectionReason } = body
    
    if (!id || !status || !reviewerId) {
      return NextResponse.json(
        { success: false, error: 'ID, status and reviewerId are required' },
        { status: 400 }
      )
    }
    
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be approved or rejected' },
        { status: 400 }
      )
    }
    
    connection = await getWriteDb()
    await connection.query('BEGIN')
    
    const slangResult = await connection.query(
      "SELECT * FROM slang WHERE id = $1 AND status = 'pending'",
      [id]
    )
    const slang = slangResult.rows[0]
    
    if (!slang) {
      await connection.query('ROLLBACK')
      return NextResponse.json(
        { success: false, error: 'Slang not found or not in pending status' },
        { status: 404 }
      )
    }
    
    if (status === 'rejected') {
      await smartUpdate('slang', 
        { status, rejection_reason: rejectionReason || null }, 
        'id = $1', 
        [id]
      )
    } else {
      await smartUpdate('slang', 
        { status }, 
        'id = $1', 
        [id]
      )
    }
    
    const action = status === 'approved' ? 'slang_approved' : 'slang_rejected'
    const details = status === 'approved' 
      ? `Slang "${slang.phrase}" approved by moderator`
      : `Slang "${slang.phrase}" rejected by moderator. Reason: ${rejectionReason || 'No reason provided'}`
    
    await smartInsert('action_logs', { 
      user_id: reviewerId, action, target_type: 'slang', target_id: id, details,
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    })
    
    await connection.query('COMMIT')
    
    return NextResponse.json({
      success: true,
      data: { 
        id, 
        status,
        message: status === 'approved' ? 'Slang approved successfully' : 'Slang rejected successfully'
      }
    })
    
  } catch (error) {
    if (connection) {
      try {
        await connection.query('ROLLBACK')
      } catch (e) {
        console.error('Rollback failed:', e)
      }
    }
    console.error('Error reviewing slang:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to review slang' },
      { status: 500 }
    )
  } finally {
    if (connection) await releaseDb(connection)
  }
}
