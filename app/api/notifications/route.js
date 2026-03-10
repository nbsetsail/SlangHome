import { NextResponse } from 'next/server'
import { getReadDb, getWriteDb, releaseDb, smartInsert, smartUpdate } from '@/lib/db-adapter'
import { auth } from '@/lib/auth'

const NOTIFICATION_TYPES = {
  COMMENT: 'comment',
  LIKE: 'like',
  FAVORITE: 'favorite',
  SYSTEM: 'system',
  REPORT_RESULT: 'report_result'
}

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const isRead = searchParams.get('isRead')
  const page = parseInt(searchParams.get('page')) || 1
  const limit = Math.min(parseInt(searchParams.get('limit')) || 20, 100)
  const offset = (page - 1) * limit

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User ID is required' },
      { status: 400 }
    )
  }

  let connection = null
  try {
    connection = await getReadDb()
    
    let whereClause = 'n.user_id = $1'
    const params = [userId]
    let paramIndex = 2
    
    if (isRead !== null && isRead !== undefined) {
      whereClause += ` AND n.is_read = $${paramIndex}`
      params.push(isRead === 'true' ? 1 : 0)
      paramIndex++
    }
    
    const countResult = await connection.query(
      `SELECT COUNT(*) as count FROM notifications n WHERE ${whereClause}`,
      params
    )
    const count = countResult.rows[0]?.count || 0
    
    const unreadResult = await connection.query(
      'SELECT COUNT(*) as count FROM notifications n WHERE n.user_id = $1 AND n.is_read = false',
      [userId]
    )
    const unreadCount = unreadResult.rows[0]?.count || 0
    
    const notificationsResult = await connection.query(
      `SELECT n.* 
       FROM notifications n
       WHERE ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    )
    
    return NextResponse.json({
      success: true,
      data: {
        notifications: notificationsResult.rows,
        unreadCount,
        pagination: {
          page,
          limit,
          totalItems: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    })
    
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  } finally {
    if (connection) await releaseDb(connection)
  }
}

export async function PUT(request) {
  const { searchParams } = new URL(request.url)
  const notificationId = searchParams.get('id')
  const userId = searchParams.get('userId')
  const markAllRead = searchParams.get('markAllRead') === 'true'

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User ID is required' },
      { status: 400 }
    )
  }

  let connection = null
  try {
    connection = await getWriteDb()
    
    if (markAllRead) {
      await smartUpdate('notifications', { is_read: true }, 'user_id = $1 AND is_read = false', [userId])
    } else if (notificationId) {
      await smartUpdate('notifications', { is_read: true }, 'id = $1 AND user_id = $2', [notificationId, userId])
    } else {
      return NextResponse.json(
        { success: false, error: 'Notification ID or markAllRead is required' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: { message: 'Notifications updated successfully' }
    })
    
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update notifications' },
      { status: 500 }
    )
  } finally {
    if (connection) await releaseDb(connection)
  }
}

export async function POST(request) {
  try {
    const session = await auth()
    const apiKey = request.headers.get('X-Internal-API-Key')
    
    const isInternalCall = apiKey && apiKey === INTERNAL_API_KEY
    const isAdmin = session?.user?.role === 'admin'
    
    if (!isInternalCall && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Only admin or internal calls allowed.' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { userId, type, title, content, link } = body
    
    if (!userId || !type || !title) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const connection = await getWriteDb()
    
    try {
      const result = await smartInsert('notifications', { 
        user_id: userId, 
        type, 
        title, 
        content: content || null, 
        link: link || null, 
        is_read: false 
      })
      
      return NextResponse.json({
        success: true,
        data: { id: result.insertId }
      })
    } finally {
      await releaseDb(connection)
    }
    
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url)
  const notificationId = searchParams.get('id')
  const userId = searchParams.get('userId')
  const deleteAll = searchParams.get('deleteAll') === 'true'

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'User ID is required' },
      { status: 400 }
    )
  }

  let connection = null
  try {
    connection = await getWriteDb()
    
    if (deleteAll) {
      await connection.query(
        'DELETE FROM notifications WHERE user_id = $1',
        [userId]
      )
    } else if (notificationId) {
      await connection.query(
        'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
        [notificationId, userId]
      )
    } else {
      return NextResponse.json(
        { success: false, error: 'Notification ID or deleteAll is required' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: { message: 'Notification(s) deleted successfully' }
    })
    
  } catch (error) {
    console.error('Error deleting notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete notifications' },
      { status: 500 }
    )
  } finally {
    if (connection) await releaseDb(connection)
  }
}
