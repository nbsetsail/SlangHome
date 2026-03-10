import { NextResponse } from 'next/server'
import { getQuery, smartUpdate, getWriteDb, releaseDb } from '@/lib/db-adapter'
import { hashPassword, comparePassword } from '@/lib/auth'
import { logAction } from '@/lib/logger'

export async function PUT(request: Request) {
  let db = null
  try {
    const { userId, currentPassword, newPassword } = await request.json()

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    db = await getWriteDb()

    const user = await getQuery('SELECT id, password, username FROM users WHERE id = $1', [userId])

    if (!user) {
      await releaseDb(db)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isValid = await comparePassword(currentPassword, user.password)
    if (!isValid) {
      await releaseDb(db)
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(newPassword)

    await smartUpdate('users', { password: hashedPassword }, 'id = $1', [userId])

    await logAction({
      userId,
      action: 'password_change',
      targetType: 'user',
      targetId: userId
    }).catch(() => {})

    await releaseDb(db)
    return NextResponse.json({ success: true, message: 'Password changed successfully' })
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
  }
}
