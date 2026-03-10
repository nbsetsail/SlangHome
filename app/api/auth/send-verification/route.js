import { NextResponse } from 'next/server';
import { getWriteDb, releaseDb, getQuery } from '@/lib/db-adapter';
import { emailService, isEmailEnabled } from '@/lib/email';
import { 
  generateVerificationCodeWithExpiry, 
  storeVerificationCode,
  hasPendingVerification,
  cleanupExpiredVerificationCodes,
  invalidateActiveVerificationCodes 
} from '@/lib/verification';
import { generateUUIDv7 } from '@/lib/uuid.js';

export async function POST(request) {
  let db = null;
  try {
    const data = await request.json();
    const { email } = data;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const tempUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
    if (!tempUsername) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    db = await getWriteDb();

    const existingUser = await getQuery('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser) {
      await releaseDb(db);
      return NextResponse.json({ error: 'Email is already registered' }, { status: 400 });
    }

    await invalidateActiveVerificationCodes(db, email);
    await cleanupExpiredVerificationCodes(db);

    const verificationData = generateVerificationCodeWithExpiry(6, 10);
    
    const tempUserId = generateUUIDv7();

    console.log('Debug - Before storeVerificationCode:', {
      tempUserId: tempUserId,
      tempUserIdType: typeof tempUserId,
      email: email,
      emailType: typeof email,
      code: verificationData.code,
      codeType: typeof verificationData.code,
      expiresAt: verificationData.expiresAt,
      expiresAtType: typeof verificationData.expiresAt
    });

    const verificationId = await storeVerificationCode(
      db, 
      tempUserId, 
      email, 
      verificationData.code, 
      verificationData.expiresAt
    );

    if (isEmailEnabled()) {
      try {
        const sent = await emailService.sendVerificationCodeEmail(email, verificationData.code);
        
        if (sent) {
          console.log(`✅ Verification code sent to ${email}`);
          await releaseDb(db);
          return NextResponse.json({ 
            success: true, 
            message: 'Verification code sent successfully',
            verificationId,
            expiresInMinutes: verificationData.expiresInMinutes
          });
        } else {
          console.error(`❌ Failed to send verification email to ${email}`);
          await releaseDb(db);
          return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
        }
      } catch (emailError) {
        console.error('❌ Failed to send verification email:', emailError);
        return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
      }
    } else {
      console.error(`❌ Email verification is disabled - cannot send verification code to ${email}`);
      return NextResponse.json({ error: 'Email verification is disabled' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending verification code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    if (db) {
      releaseDb(db);
    }
  }
}
