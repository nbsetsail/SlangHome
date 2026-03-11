import { NextResponse } from 'next/server';
import { getWriteDb, releaseDb, getQuery, runQuery, smartUpdate } from '@/lib/db-adapter'
import { hashPassword } from '@/lib/auth'
import { withRateLimit } from '@/lib/rate-limit'

export async function GET(request) {
  const rateCheck = await withRateLimit(request, 'passwordReset');
  if (!rateCheck.allowed) {
    return rateCheck.response;
  }

  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  try {
    const tokenRecord = await getQuery(
      'SELECT id, user_id, expires_at FROM password_reset_tokens WHERE token = $1',
      [token]
    )

    if (!tokenRecord) {
      return NextResponse.json({ error: 'Invalid reset token' }, { status: 400 })
    }

    const now = new Date()
    const expiresAt = new Date(tokenRecord.expires_at)
    if (now > expiresAt) {
      await runQuery('DELETE FROM password_reset_tokens WHERE id = $1', [tokenRecord.id])
      return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 })
    }

    const user = await getQuery('SELECT email FROM users WHERE id = $1', [tokenRecord.user_id])

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      email: user.email 
    })
  } catch (error) {
    console.error('Error verifying reset token:', error)
    return NextResponse.json({ error: 'Failed to verify token' }, { status: 500 })
  }
}

export async function POST(request) {
  const rateCheck = await withRateLimit(request, 'passwordReset');
  if (!rateCheck.allowed) {
    return rateCheck.response;
  }

  let db = null;
  try {
    const { token, newPassword, confirmPassword } = await request.json()

    if (!token || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
    }

    if (newPassword.length !== 64 || !/^[a-fA-F0-9]{64}$/.test(newPassword)) {
      return NextResponse.json({ error: 'Invalid password format' }, { status: 400 })
    }

    db = await getWriteDb();

    const tokenRecord = await getQuery(
      'SELECT id, user_id, expires_at FROM password_reset_tokens WHERE token = $1',
      [token]
    )

    if (!tokenRecord) {
      await releaseDb(db);
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    }

    const now = new Date()
    const expiresAt = new Date(tokenRecord.expires_at)
    if (now > expiresAt) {
      await runQuery('DELETE FROM password_reset_tokens WHERE id = $1', [tokenRecord.id])
      await releaseDb(db);
      return NextResponse.json({ error: 'Reset token has expired. Please request a new one.' }, { status: 400 })
    }

    const user = await getQuery('SELECT id, username, email FROM users WHERE id = $1', [tokenRecord.user_id])

    if (!user) {
      await releaseDb(db);
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const hashedPassword = await hashPassword(newPassword)

    await smartUpdate('users', { password: hashedPassword }, 'id = $1', [user.id])

    await runQuery('DELETE FROM password_reset_tokens WHERE id = $1', [tokenRecord.id])

    await runQuery('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id])

    await releaseDb(db);
    return NextResponse.json({ success: true, message: 'Password has been reset successfully' })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
