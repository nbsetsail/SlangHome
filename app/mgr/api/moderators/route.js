import { NextResponse } from 'next/server'
import { getQuery, allQuery, executeQuery, beginTransaction, commitTransaction, rollbackTransaction, smartInsert, smartUpdate } from '@/lib/db-adapter'
import { auth } from '@/lib/auth'
import { checkMgrAuth, unauthorizedResponse, ALL_LOCALES } from '../auth'
import { getUTCTimestamp } from '@/lib/date-utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request) {
  const authResult = await checkMgrAuth(['admin'])
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status)
  }

  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const offset = (page - 1) * limit

    if (action === 'applications') {
      const status = searchParams.get('status') || ''
      
      const conditions = ['1=1']
      const params = []
      let paramIndex = 1

      if (status) {
        conditions.push(`ma.status = $${paramIndex++}`)
        params.push(status)
      }

      const whereClause = conditions.join(' AND ')

      const countSql = `SELECT COUNT(*) as count FROM moderator_applications ma WHERE ${whereClause}`
      const countResult = await getQuery(countSql, params)
      const total = countResult?.count || 0

      const applicationsSql = `
        SELECT ma.*, u.username, u.email, u.created_at as user_created_at,
               ru.username as reviewer_name
        FROM moderator_applications ma
        JOIN users u ON ma.user_id = u.id
        LEFT JOIN users ru ON ma.reviewed_by = ru.id
        WHERE ${whereClause}
        ORDER BY ma.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `
      params.push(limit, offset)

      const applications = await allQuery(applicationsSql, params)

      return NextResponse.json({
        success: true,
        data: {
          applications,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      })
    }

    if (action === 'moderators') {
      const moderators = await allQuery(`
        SELECT u.id, u.username, u.email, u.managed_locales, u.created_at,
               (SELECT COUNT(*) FROM slang WHERE user_id = u.id) as slang_count,
               (SELECT COUNT(*) FROM comments WHERE user_id = u.id) as comment_count
        FROM users u
        WHERE u.role = 'moderator'
        ORDER BY u.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset])

      const countResult = await getQuery("SELECT COUNT(*) as count FROM users WHERE role = 'moderator'")
      const total = countResult?.count || 0

      return NextResponse.json({
        success: true,
        data: {
          moderators,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in moderator management:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action, requestedLocales, reason } = body

    if (action === 'apply') {
      if (!requestedLocales || !Array.isArray(requestedLocales) || requestedLocales.length === 0) {
        return NextResponse.json({ success: false, error: 'Please select at least one locale' }, { status: 400 })
      }

      const validLocales = requestedLocales.filter(l => ALL_LOCALES.includes(l))
      if (validLocales.length === 0) {
        return NextResponse.json({ success: false, error: 'Invalid locale selection' }, { status: 400 })
      }

      const existingApplication = await getQuery(
        "SELECT id, status FROM moderator_applications WHERE user_id = $1 AND status = 'pending'",
        [session.user.id]
      )

      if (existingApplication) {
        return NextResponse.json({ 
          success: false, 
          error: 'You already have a pending application' 
        }, { status: 400 })
      }

      const user = await getQuery('SELECT role FROM users WHERE id = $1', [session.user.id])
      if (user?.role === 'admin') {
        return NextResponse.json({ 
          success: false, 
          error: 'Admins do not need to apply for moderator' 
        }, { status: 400 })
      }

      await smartInsert('moderator_applications', {
        user_id: session.user.id,
        requested_locales: validLocales,
        reason: reason || null
      })

      return NextResponse.json({ 
        success: true, 
        message: 'Application submitted successfully' 
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in moderator application:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  const authResult = await checkMgrAuth(['admin'])
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status)
  }

  try {
    const body = await request.json()
    const { action, applicationId, userId, managedLocales, reviewNote } = body

    if (action === 'approve') {
      if (!applicationId) {
        return NextResponse.json({ success: false, error: 'Application ID is required' }, { status: 400 })
      }

      const application = await getQuery(
        'SELECT user_id, requested_locales FROM moderator_applications WHERE id = $1',
        [applicationId]
      )

      if (!application) {
        return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 })
      }

      const conn = await beginTransaction()

      try {
        const now = getUTCTimestamp()
        await smartUpdate('moderator_applications', 
          { status: 'approved', reviewed_by: authResult.user.id, reviewed_at: now }, 
          'id = $1', 
          [applicationId]
        )

        await smartUpdate('users', 
          { role: 'moderator', managed_locales: application.requested_locales }, 
          'id = $1', 
          [application.user_id]
        )

        await commitTransaction(conn)
      } catch (error) {
        await rollbackTransaction(conn)
        throw error
      }

      return NextResponse.json({ success: true, message: 'Application approved' })
    }

    if (action === 'reject') {      
      if (!applicationId) {
        return NextResponse.json({ success: false, error: 'Application ID is required' }, { status: 400 })
      }

      const now = getUTCTimestamp()
      await smartUpdate('moderator_applications', 
        { status: 'rejected', reviewed_by: authResult.user.id, reviewed_at: now, review_note: reviewNote || null }, 
        'id = $1', 
        [applicationId]
      )

      return NextResponse.json({ success: true, message: 'Application rejected' })
    }

    if (action === 'updateLocales') {
      if (!userId || !managedLocales) {
        return NextResponse.json({ success: false, error: 'User ID and managed locales are required' }, { status: 400 })
      }

      const validLocales = managedLocales.filter(l => ALL_LOCALES.includes(l))
      if (validLocales.length === 0) {
        return NextResponse.json({ success: false, error: 'Invalid locale selection' }, { status: 400 })
      }

      await executeQuery(
        'UPDATE users SET managed_locales = $1 WHERE id = $2',
        [validLocales, userId]
      )

      return NextResponse.json({ success: true, message: 'Managed locales updated' })
    }

    if (action === 'revoke') {
      if (!userId) {
        return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
      }

      await executeQuery(
        "UPDATE users SET role = 'user', managed_locales = NULL WHERE id = $1",
        [userId]
      )

      return NextResponse.json({ success: true, message: 'Moderator role revoked' })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in moderator management:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
