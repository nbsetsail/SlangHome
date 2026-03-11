import { NextResponse } from 'next/server';
import { getQuery, allQuery, runQuery, executeQuery, beginTransaction, commitTransaction, rollbackTransaction, smartInsert, smartUpdate } from '@/lib/db-adapter'
import { checkMgrAuth, unauthorizedResponse, ALL_LOCALES } from '../auth';
import { getUTCTimestamp } from '@/lib/date-utils';
import { logAction } from '@/lib/logger';

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
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''

    const offset = (page - 1) * limit

    const conditions = ['1=1']
    const params = []
    let paramIndex = 1

    if (search) {
      conditions.push(`(username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`)
      params.push(`%${search}%`)
      paramIndex++
    }

    if (role) {
      conditions.push(`role = $${paramIndex++}`)
      params.push(role)
    }

    if (status) {
      conditions.push(`status = $${paramIndex++}`)
      params.push(status)
    }

    const whereClause = conditions.join(' AND ')

    const countSql = `SELECT COUNT(*) as count FROM users WHERE ${whereClause}`
    const totalResult = await getQuery(countSql, params)
    const total = totalResult?.count || 0

    const usersSql = `
      SELECT id, username, email, role, status, created_at, managed_locales 
      FROM users 
      WHERE ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `
    params.push(limit, offset)

    const users = await allQuery(usersSql, params)

    const now = getUTCTimestamp()
    for (const user of users) {
      const banInfo = await getQuery(
        'SELECT * FROM user_bans WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > $2) ORDER BY created_at DESC LIMIT 1',
        [user.id, now]
      )
      const freezeInfo = await getQuery(
        'SELECT * FROM user_freezes WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > $2) ORDER BY created_at DESC LIMIT 1',
        [user.id, now]
      )
      
      user.is_banned = !!banInfo
      user.ban_reason = banInfo?.reason || null
      user.ban_expires = banInfo?.expires_at || null
      user.is_frozen = !!freezeInfo
      user.freeze_reason = freezeInfo?.reason || null
      user.freeze_expires = freezeInfo?.expires_at || null
    }

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        allLocales: authResult.user.role === 'admin' ? ALL_LOCALES : null
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request) {
  const authResult = await checkMgrAuth(['admin']);
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status);
  }

  try {
    const data = await request.json()
    const { action, ...params } = data

    if (action === 'ban') {
      const { userId, reason, duration } = params
      
      await beginTransaction()
      try {
        let expiresAt = null
        if (duration && duration !== 'permanent') {
          const now = new Date()
          const durationMs = {
            '1h': 1 * 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
          }
          if (durationMs[duration]) {
            expiresAt = new Date(now.getTime() + durationMs[duration]).toISOString()
          }
        }
        
        await smartInsert('user_bans', {
          user_id: userId,
          reason: reason || null,
          banned_by: authResult.user.id,
          expires_at: expiresAt
        })
        
        await smartUpdate('users', { status: 'banned' }, 'id = $1', [userId])
        await commitTransaction()
        
        await logAction({
          userId: authResult.user.id,
          action: 'user_ban',
          targetType: 'user',
          targetId: userId,
          details: `Banned user. Reason: ${reason || 'N/A'}, Duration: ${duration || 'permanent'}`
        }).catch(() => {})
        
        return NextResponse.json({ success: true, message: 'User banned successfully' })
      } catch (error) {
        await rollbackTransaction()
        throw error
      }
    }

    if (action === 'freeze') {
      const { userId, reason, duration } = params
      
      await beginTransaction()
      try {
        let expiresAt = null
        if (duration && duration !== 'permanent') {
          const now = new Date()
          const durationMs = {
            '1h': 1 * 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
          }
          if (durationMs[duration]) {
            expiresAt = new Date(now.getTime() + durationMs[duration]).toISOString()
          }
        }
        
        await smartInsert('user_freezes', {
          user_id: userId,
          reason: reason || null,
          frozen_by: authResult.user.id,
          expires_at: expiresAt
        })
        
        await smartUpdate('users', { status: 'frozen' }, 'id = $1', [userId])
        await commitTransaction()
        
        return NextResponse.json({ success: true, message: 'User frozen successfully' })
      } catch (error) {
        await rollbackTransaction()
        throw error
      }
    }

    if (action === 'unban') {
      const { userId } = params
      
      await beginTransaction()
      try {
        const now = getUTCTimestamp()
        await smartUpdate('user_bans', { expires_at: now }, 'user_id = $1 AND (expires_at IS NULL OR expires_at > $2)', [userId, now])
        await smartUpdate('users', { status: 'active' }, 'id = $1', [userId])
        await commitTransaction()
        
        await logAction({
          userId: authResult.user.id,
          action: 'user_unban',
          targetType: 'user',
          targetId: userId,
          details: 'Unbanned user'
        }).catch(() => {})
        
        return NextResponse.json({ success: true, message: 'User unbanned successfully' })
      } catch (error) {
        await rollbackTransaction()
        throw error
      }
    }

    if (action === 'unfreeze') {
      const { userId } = params
      
      await beginTransaction()
      try {
        const now = getUTCTimestamp()
        await smartUpdate('user_freezes', { expires_at: now }, 'user_id = $1 AND (expires_at IS NULL OR expires_at > $2)', [userId, now])
        await smartUpdate('users', { status: 'active' }, 'id = $1', [userId])
        await commitTransaction()
        return NextResponse.json({ success: true, message: 'User unfrozen successfully' })
      } catch (error) {
        await rollbackTransaction()
        throw error
      }
    }

    if (action === 'setRole') {
      const { userId, role, managedLocales } = params
      
      if (!['user', 'moderator', 'admin'].includes(role)) {
        return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 })
      }

      if (role === 'moderator') {
        if (!Array.isArray(managedLocales) || managedLocales.length === 0) {
          return NextResponse.json({ success: false, error: 'Moderator must have at least one managed locale' }, { status: 400 })
        }
        await executeQuery('UPDATE users SET role = $1, managed_locales = $2 WHERE id = $3', [role, managedLocales, userId])
      } else if (role === 'admin') {
        await executeQuery('UPDATE users SET role = $1, managed_locales = $2 WHERE id = $3', [role, ALL_LOCALES, userId])
      } else {
        await executeQuery('UPDATE users SET role = $1, managed_locales = NULL WHERE id = $2', [role, userId])
      }
      
      await logAction({
        userId: authResult.user.id,
        action: 'role_change',
        targetType: 'user',
        targetId: userId,
        details: `Changed role to ${role}${managedLocales ? `, managed locales: ${managedLocales.join(', ')}` : ''}`
      }).catch(() => {})
      
      return NextResponse.json({ success: true, message: 'User role updated successfully' })
    }

    if (action === 'setManagedLocales') {
      const { userId, managedLocales } = params
      
      const targetUser = await getQuery('SELECT role FROM users WHERE id = $1', [userId])
      if (!targetUser) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
      }
      
      if (targetUser.role !== 'moderator') {
        return NextResponse.json({ success: false, error: 'Can only set managed locales for moderators' }, { status: 400 })
      }

      if (!Array.isArray(managedLocales) || managedLocales.length === 0) {
        return NextResponse.json({ success: false, error: 'Must have at least one managed locale' }, { status: 400 })
      }

      await executeQuery('UPDATE users SET managed_locales = $1 WHERE id = $2', [managedLocales, userId])
      
      return NextResponse.json({ success: true, message: 'Managed locales updated successfully' })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in user action:', error)
    return NextResponse.json({ success: false, error: 'Failed to perform action' }, { status: 500 })
  }
}

export async function PUT(request) {
  const authResult = await checkMgrAuth();
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status);
  }

  try {
    const data = await request.json()
    const { id, username, email, role, status, managedLocales } = data

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    const targetUser = await getQuery('SELECT role FROM users WHERE id = $1', [id]);

    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    if (authResult.user.role === 'moderator' && targetUser.role !== 'user') {
      return NextResponse.json({ success: false, error: 'Moderators can only edit regular users' }, { status: 403 })
    }

    const updates = []
    const values = []
    let paramIndex = 1

    if (username) {
      updates.push(`username = $${paramIndex++}`)
      values.push(username)
    }
    if (email) {
      updates.push(`email = $${paramIndex++}`)
      values.push(email)
    }
    if (role && authResult.user.role === 'admin') {
      updates.push(`role = $${paramIndex++}`)
      values.push(role)
      
      if (role === 'admin') {
        updates.push(`managed_locales = $${paramIndex++}`)
        values.push(ALL_LOCALES)
      } else if (role === 'moderator' && managedLocales) {
        updates.push(`managed_locales = $${paramIndex++}`)
        values.push(managedLocales)
      } else if (role === 'user') {
        updates.push(`managed_locales = NULL`)
      }
    }
    if (status) {
      updates.push(`status = $${paramIndex++}`)
      values.push(status)
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 })
    }

    values.push(id)
    await executeQuery(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values)

    return NextResponse.json({ success: true, message: 'User updated successfully' })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(request) {
  const authResult = await checkMgrAuth(['admin']);
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status);
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const hardDelete = searchParams.get('hard') === 'true'

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    }

    const targetUser = await getQuery('SELECT id, username, role FROM users WHERE id = $1', [id])
    
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    if (targetUser.role === 'admin') {
      return NextResponse.json({ success: false, error: 'Cannot delete admin user' }, { status: 403 })
    }

    if (hardDelete) {
      await beginTransaction()
      try {
        await executeQuery('DELETE FROM likes WHERE user_id = $1', [id])
        await executeQuery('DELETE FROM favorites WHERE user_id = $1', [id])
        await executeQuery('DELETE FROM comments WHERE user_id = $1', [id])
        await executeQuery('UPDATE slang SET user_id = NULL WHERE user_id = $1', [id])
        await executeQuery('DELETE FROM user_bans WHERE user_id = $1', [id])
        await executeQuery('DELETE FROM user_freezes WHERE user_id = $1', [id])
        await executeQuery('DELETE FROM users WHERE id = $1', [id])
        await commitTransaction()
        
        await logAction({
          userId: authResult.user.id,
          action: 'delete',
          targetType: 'user',
          targetId: id,
          details: `Hard deleted user: ${targetUser.username}`
        }).catch(() => {})
        
        return NextResponse.json({ success: true, message: 'User permanently deleted' })
      } catch (error) {
        await rollbackTransaction()
        throw error
      }
    } else {
      await executeQuery(
        "UPDATE users SET status = 'deleted', username = CONCAT('deleted_', id), email = CONCAT('deleted_', id, '@deleted.local') WHERE id = $1",
        [id]
      )
      
      return NextResponse.json({ success: true, message: 'User soft deleted successfully' })
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 })
  }
}
