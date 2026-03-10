import { NextResponse } from 'next/server';
import { getWriteDb, releaseDb, getQuery, runQuery, smartInsert, smartUpdate } from '@/lib/db-adapter'
import { registerSchema, validateSchema } from '@/lib/validators'
import { generateUUIDv7 } from '@/lib/uuid.js';
import { validateVerificationCode, cleanupExpiredVerificationCodes } from '@/lib/verification';
import { hashPassword } from '@/lib/auth';

export async function POST(request) {
  let db = null
  try {
    const data = await request.json()

    const validationResult = validateSchema(registerSchema, data)
    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 })
    }

    const { username, displayName, email, password, verificationCode } = validationResult.data

    db = await getWriteDb()
    const existingUser = await getQuery('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email])
    
    if (existingUser) {
      await releaseDb(db)
      return NextResponse.json({ error: 'User with this username or email already exists' }, { status: 400 })
    }

    if (!verificationCode) {
      await releaseDb(db)
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 })
    }

    await cleanupExpiredVerificationCodes(db)
    const codeValidationResult = await validateVerificationCode(db, email, verificationCode)
    
    if (!codeValidationResult.valid) {
      await releaseDb(db)
      return NextResponse.json({ 
        error: codeValidationResult.error || 'Invalid verification code' 
      }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const userId = generateUUIDv7();

    await smartInsert('users', {
      id: userId,
      username,
      display_name: displayName,
      email,
      password: hashedPassword,
      role: 'user',
      status: 'active',
      email_verified: 1
    })

    await smartUpdate('email_verification_codes', { user_id: userId }, 'id = $1', [codeValidationResult.codeId])

    const newUser = await getQuery('SELECT id, username, display_name, email, role, status, created_at FROM users WHERE id = $1', [userId])

    await releaseDb(db);
    return NextResponse.json({ 
      success: true, 
      user: {
        id: newUser.id,
        username: newUser.username,
        displayName: newUser.display_name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error registering user:', error)
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 })
  } finally {
    if (db) {
      releaseDb(db)
    }
  }
}
