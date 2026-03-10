import { NextResponse } from 'next/server';
import { getWriteDb, releaseDb, getQuery, smartInsert } from '@/lib/db-adapter'
import { generateUUIDv7 } from '@/lib/uuid.js';
import { emailService, isEmailEnabled } from '@/lib/email';
import { getUTCTimestamp } from '@/lib/date-utils';

export async function POST(request) {
  let db = null;
  try {
    const { email, locale } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    db = await getWriteDb();

    const user = await getQuery('SELECT id, username, email, locale as user_locale FROM users WHERE email = $1', [email])

    if (!user) {
      await releaseDb(db);
      return NextResponse.json({ 
        success: true, 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      })
    }

    const resetToken = generateUUIDv7()
    const tokenExpires = getUTCTimestamp()

    await smartInsert('password_reset_tokens', { 
      id: generateUUIDv7(), 
      user_id: user.id, 
      token: resetToken, 
      expires_at: tokenExpires 
    })

    const userLocale = locale || user.user_locale || 'en'
    
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${userLocale}/auth/reset-password?token=${resetToken}`

    if (isEmailEnabled()) {
      try {
        await emailService.sendPasswordResetEmail(email, user.username, resetLink)
        console.log(`Password reset email sent to ${email}`)
        await releaseDb(db);
        return NextResponse.json({ 
          success: true, 
          message: 'If an account with that email exists, a password reset link has been sent.' 
        })
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError)
        await releaseDb(db);
        return NextResponse.json({ error: 'Failed to send password reset email' }, { status: 500 })
      }
    }

    await releaseDb(db);
    return NextResponse.json({ 
      success: true, 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    })
  } catch (error) {
    console.error('Error requesting password reset:', error)
    return NextResponse.json({ error: 'Failed to request password reset' }, { status: 500 })
  }
}
