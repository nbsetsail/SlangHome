import { NextResponse } from 'next/server';
import { getWriteDb, releaseDb } from '@/lib/db-adapter';
import { validateVerificationCode, cleanupExpiredVerificationCodes } from '@/lib/verification';

// POST /api/auth/verify-code - Verify email verification code
export async function POST(request) {
  let db = null;
  try {
    const data = await request.json();
    const { email, code } = data;

    // Validate required fields
    if (!email || !code) {
      return NextResponse.json({ error: 'Email and verification code are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate code format (6 digits)
    const codeRegex = /^\d{6}$/;
    if (!codeRegex.test(code)) {
      return NextResponse.json({ error: 'Invalid verification code format' }, { status: 400 });
    }

    db = await getWriteDb();

    // Clean up expired codes
    await cleanupExpiredVerificationCodes(db);

    // Validate verification code
    const validationResult = await validateVerificationCode(db, email, code);

    if (!validationResult.valid) {
      await releaseDb(db);
      return NextResponse.json({ 
        error: validationResult.error || 'Invalid verification code' 
      }, { status: 400 });
    }

    // Code is valid, return success
    await releaseDb(db);
    return NextResponse.json({ 
      success: true, 
      message: 'Email verified successfully',
      userId: validationResult.userId,
      email: validationResult.email,
      codeId: validationResult.codeId
    });

  } catch (error) {
    console.error('Error verifying code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    if (db) {
      releaseDb(db);
    }
  }
}