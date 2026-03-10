import { NextResponse } from 'next/server';
import { getQuery, runQuery } from '@/lib/db-adapter'
import { checkMgrAuth, unauthorizedResponse } from '../auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request, { params }) {
  const authResult = await checkMgrAuth(['admin', 'moderator']);
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status);
  }

  try {
    const { id } = params

    const user = await getQuery('SELECT id, username, email, role, status, created_at FROM users WHERE id = $1', [id])

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    const stats = {
      totalSlang: 0,
      totalComments: 0,
      totalLikes: 0,
      totalFavorites: 0
    }

    const slangCount = await getQuery('SELECT COUNT(*) as count FROM slang WHERE user_id = $1', [id])
    if (slangCount) {
      stats.totalSlang = slangCount.count
    }

    const commentCount = await getQuery('SELECT COUNT(*) as count FROM comments WHERE user_id = $1', [id])
    if (commentCount) {
      stats.totalComments = commentCount.count
    }

    const likeCount = await getQuery('SELECT COUNT(*) as count FROM likes WHERE user_id = $1', [id])
    if (likeCount) {
      stats.totalLikes = likeCount.count
    }

    const favoriteCount = await getQuery('SELECT COUNT(*) as count FROM favorites WHERE user_id = $1', [id])
    if (favoriteCount) {
      stats.totalFavorites = favoriteCount.count
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        stats: stats
      }
    })
  } catch (error) {
    console.error('Error fetching user details:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch user details',
      message: error.message
    }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  const authResult = await checkMgrAuth(['admin', 'moderator']);
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status);
  }

  try {
    const { id } = params
    const body = await request.json()
    const { username, email, role, status } = body

    if (!username || !email) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    const existingUser = await getQuery('SELECT id, role FROM users WHERE id = $1', [id])

    if (!existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    if (authResult.user.role === 'moderator' && existingUser.role !== 'user') {
      return NextResponse.json({
        success: false,
        error: 'Moderators can only edit regular users'
      }, { status: 403 })
    }

    const duplicateUser = await getQuery('SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3', [username, email, id])

    if (duplicateUser) {
      return NextResponse.json({
        success: false,
        error: 'Username or email is already taken'
      }, { status: 400 })
    }

    let updateSql = 'UPDATE users SET username = $1, email = $2'
    let updateParams = [username, email]
    let paramIndex = 3

    if (role && authResult.user.role === 'admin') {
      updateSql += `, role = $${paramIndex}`
      updateParams.push(role)
      paramIndex++
    }

    if (status) {
      updateSql += `, status = $${paramIndex}`
      updateParams.push(status)
      paramIndex++
    }

    updateSql += ` WHERE id = $${paramIndex}`
    updateParams.push(id)

    await runQuery(updateSql, updateParams)

    const updatedUser = await getQuery('SELECT id, username, email, role, status, created_at FROM users WHERE id = $1', [id])

    return NextResponse.json({
      success: true,
      data: updatedUser
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update user',
      message: error.message
    }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const authResult = await checkMgrAuth(['admin']);
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status);
  }

  try {
    const { id } = params

    const existingUser = await getQuery('SELECT id FROM users WHERE id = $1', [id])

    if (!existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    await runQuery('DELETE FROM users WHERE id = $1', [id])

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete user',
      message: error.message
    }, { status: 500 })
  }
}
