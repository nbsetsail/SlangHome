import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getQuery, smartUpdate } from '@/lib/db-adapter'
import { logAction } from '@/lib/logger'
import { getUTCTimestamp } from '@/lib/date-utils'

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const { userId, newUsername } = data

    if (!userId || !newUsername) {
      return NextResponse.json(
        { success: false, error: 'userId and newUsername are required' },
        { status: 400 }
      )
    }

    const currentUserId = session.user.id
    const currentUserRole = session.user.role
    
    if (currentUserId !== userId && currentUserRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden. You can only change your own username.' },
        { status: 403 }
      )
    }

    const user = await getQuery(
      'SELECT id, username, username_updated_at FROM users WHERE id = $1',
      [userId]
    )
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000
    if (user.username_updated_at) {
      const lastUpdate = new Date(user.username_updated_at).getTime()
      if (Date.now() - lastUpdate < ONE_YEAR_MS) {
        const remainingDays = Math.ceil((ONE_YEAR_MS - (Date.now() - lastUpdate)) / (24 * 60 * 60 * 1000))
        return NextResponse.json(
          { success: false, error: `Username can only be changed once per year. Please wait ${remainingDays} more days.` },
          { status: 400 }
        )
      }
    }

    if (newUsername.length < 3 || newUsername.length > 20) {
      return NextResponse.json(
        { success: false, error: 'Username must be between 3 and 20 characters' },
        { status: 400 }
      )
    }

    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      return NextResponse.json(
        { success: false, error: 'Username can only contain letters, numbers, and underscores' },
        { status: 400 }
      )
    }

    const existingUser = await getQuery(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [newUsername, userId]
    )
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Username already taken' },
        { status: 400 }
      )
    }

    await smartUpdate('users', { username: newUsername, username_updated_at: getUTCTimestamp() }, 'id = $1', [userId])

    await logAction({
      userId,
      action: 'username_change',
      targetType: 'user',
      targetId: userId,
      details: `Changed from "${user.username}" to "${newUsername}"`
    }).catch(() => {})

    const updatedUser = await getQuery(
      'SELECT id, username, display_name, username_updated_at FROM users WHERE id = $1',
      [userId]
    )

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        displayName: updatedUser.display_name,
        usernameUpdatedAt: updatedUser.username_updated_at
      }
    })
  } catch (error) {
    console.error('Error changing username:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
