import { NextResponse } from 'next/server'
import { getQuery, allQuery, executeQuery, smartInsert, smartUpdate, beginTransaction, commitTransaction, rollbackTransaction } from '@/lib/db-adapter'
import { checkMgrAuth, unauthorizedResponse, getLocaleFilter } from '@/lib/auth-mgr'

const REPORT_REASONS = [
  'spam',
  'inappropriate',
  'misinformation',
  'harassment',
  'violence',
  'other'
]

const REPORT_STATUS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed'
}

export async function GET(request) {
  const authResult = await checkMgrAuth()
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status)
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || ''
  const targetType = searchParams.get('targetType') || ''
  const page = parseInt(searchParams.get('page')) || 1
  const limit = parseInt(searchParams.get('limit')) || 20
  const offset = (page - 1) * limit

  try {
    const conditions = ['1=1']
    const params = []
    let paramIndex = 1
    
    if (status) {
      conditions.push(`r.status = $${paramIndex++}`)
      params.push(status)
    }
    
    if (targetType) {
      conditions.push(`r.target_type = $${paramIndex++}`)
      params.push(targetType)
    }

    const localeFilter = getLocaleFilter(authResult)
    if (localeFilter) {
      conditions.push(`(
        r.target_type = 'comment' AND EXISTS (
          SELECT 1 FROM comments c JOIN slang s ON c.slang_id = s.id WHERE c.id = r.target_id AND s.locale IN (${localeFilter.map((_, i) => `$${paramIndex + i}`).join(', ')})
        )
        OR r.target_type = 'slang' AND EXISTS (
          SELECT 1 FROM slang s WHERE s.id = r.target_id AND s.locale IN (${localeFilter.map((_, i) => `$${paramIndex + localeFilter.length + i}`).join(', ')})
        )
      )`)
      params.push(...localeFilter, ...localeFilter)
      paramIndex += localeFilter.length * 2
    }
    
    const whereClause = conditions.join(' AND ')
    
    const countSql = `SELECT COUNT(*) as count FROM reports r WHERE ${whereClause}`
    const countResult = await getQuery(countSql, params)
    const total = countResult?.count || 0
    
    const reportsSql = `
      SELECT r.*, 
        u.username as reporter_username,
        ru.username as reviewer_username
       FROM reports r
       LEFT JOIN users u ON r.reporter_id = u.id
       LEFT JOIN users ru ON r.reviewer_id = ru.id
       WHERE ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `
    params.push(limit, offset)
    
    const reports = await allQuery(reportsSql, params)
    
    return NextResponse.json({
      success: true,
      data: {
        reports,
        pagination: {
          page,
          limit,
          totalItems: total,
          totalPages: Math.ceil(total / limit)
        },
        managedLocales: authResult.managedLocales
      }
    })
    
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { targetType, targetId, reason, description, reporterId } = body
    
    if (!targetType || !targetId || !reason || !reporterId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    if (!['slang', 'comment'].includes(targetType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid target type' },
        { status: 400 }
      )
    }
    
    if (!REPORT_REASONS.includes(reason)) {
      return NextResponse.json(
        { success: false, error: 'Invalid report reason' },
        { status: 400 }
      )
    }
    
    const existingReport = await getQuery(
      'SELECT id FROM reports WHERE reporter_id = $1 AND target_type = $2 AND target_id = $3',
      [reporterId, targetType, targetId]
    )
    
    if (existingReport) {
      return NextResponse.json(
        { success: false, error: 'You have already reported this content' },
        { status: 409 }
      )
    }
    
    const result = await smartInsert('reports', { 
      reporter_id: reporterId, 
      target_type: targetType, 
      target_id: targetId, 
      reason, 
      description: description || null, 
      status: 'pending' 
    })
    
    return NextResponse.json({
      success: true,
      data: { 
        id: result.rows[0]?.id, 
        message: 'Report submitted successfully' 
      }
    })
    
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create report' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  const authResult = await checkMgrAuth()
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status)
  }

  try {
    const body = await request.json()
    const { reportId, status, reviewerId, resolution } = body
    
    if (!reportId || !status || !reviewerId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    if (!Object.values(REPORT_STATUS).includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    const report = await getQuery(
      'SELECT target_type, target_id FROM reports WHERE id = $1',
      [reportId]
    )

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      )
    }

    const localeFilter = getLocaleFilter(authResult)
    if (localeFilter) {
      if (report.target_type === 'slang') {
        const slang = await getQuery('SELECT locale FROM slang WHERE id = $1', [report.target_id])
        if (slang && !localeFilter.includes(slang.locale)) {
          return NextResponse.json(
            { success: false, error: 'You do not have permission to manage this content' },
            { status: 403 }
          )
        }
      } else if (report.target_type === 'comment') {
        const comment = await getQuery(`
          SELECT s.locale FROM comments c 
          JOIN slang s ON c.slang_id = s.id 
          WHERE c.id = $1
        `, [report.target_id])
        if (comment && !localeFilter.includes(comment.locale)) {
          return NextResponse.json(
            { success: false, error: 'You do not have permission to manage this content' },
            { status: 403 }
          )
        }
      }
    }
    
    const conn = await beginTransaction()
    
    try {
      await smartUpdate('reports', { 
        status, 
        reviewer_id: reviewerId, 
        resolution: resolution || null 
      }, 'id = $1', [reportId])
      
      if (status === 'resolved' && resolution === 'content_removed') {
        if (report.target_type === 'slang') {
          await smartUpdate('slang', { status: 'rejected' }, 'id = $1', [report.target_id])
        } else if (report.target_type === 'comment') {
          await smartUpdate('comments', { content: '[deleted]' }, 'id = $1', [report.target_id])
        }
      }
      
      await commitTransaction(conn)
    } catch (error) {
      await rollbackTransaction(conn)
      throw error
    }
    
    return NextResponse.json({
      success: true,
      data: { message: 'Report updated successfully' }
    })
    
  } catch (error) {
    console.error('Error updating report:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update report' },
      { status: 500 }
    )
  }
}
