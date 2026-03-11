import { NextResponse } from 'next/server';
import { auth, comparePassword } from '@/lib/auth';
import { getWriteDb, getQuery } from '@/lib/db-adapter';
import { cacheDel, cacheKeys } from '@/lib/cache';
import { logAction } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request) {
  const rateCheck = await withRateLimit(request, 'deleteAccount');
  if (!rateCheck.allowed) {
    return rateCheck.response;
  }

  try {
    const session = await auth();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { password, confirmation } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required to delete account' },
        { status: 400 }
      );
    }

    if (confirmation !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { error: 'Please type "DELETE MY ACCOUNT" to confirm' },
        { status: 400 }
      );
    }

    const user = await getQuery(
      'SELECT id, password FROM users WHERE email = $1',
      [session.user.email]
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      await logAction({
        userId: session.user.id,
        action: 'account_delete',
        targetType: 'user',
        targetId: session.user.id,
        details: 'Failed account deletion attempt - invalid password'
      }).catch(() => {});
      
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 400 }
      );
    }

    const connection = await getWriteDb();
    const userEmail = session.user.email;
    const userId = user.id;

    await connection.query('START TRANSACTION');

    try {
      await connection.query(
        'DELETE FROM notifications WHERE user_id = $1',
        [userId]
      );

      await connection.query(
        'DELETE FROM views WHERE user_id = $1',
        [userId]
      );

      await connection.query(
        'DELETE FROM likes WHERE user_id = $1',
        [userId]
      );

      await connection.query(
        'DELETE FROM favorites WHERE user_id = $1',
        [userId]
      );

      await connection.query(
        `DELETE FROM comment_likes WHERE comment_id IN (
          SELECT id FROM comments WHERE user_id = $1
        )`,
        [userId]
      );

      await connection.query(
        'DELETE FROM comments WHERE user_id = $1',
        [userId]
      );

      await connection.query(
        'DELETE FROM pk_matches WHERE player1_id = $1 OR player2_id = $1',
        [userId]
      );

      await connection.query(
        'DELETE FROM pk_achievements WHERE user_id = $1',
        [userId]
      );

      await connection.query(
        `DELETE FROM comments WHERE slang_id IN (
          SELECT id FROM slang WHERE user_id = $1
        )`,
        [userId]
      );

      await connection.query(
        `DELETE FROM likes WHERE slang_id IN (
          SELECT id FROM slang WHERE user_id = $1
        )`,
        [userId]
      );

      await connection.query(
        `DELETE FROM favorites WHERE slang_id IN (
          SELECT id FROM slang WHERE user_id = $1
        )`,
        [userId]
      );

      await connection.query(
        `DELETE FROM views WHERE slang_id IN (
          SELECT id FROM slang WHERE user_id = $1
        )`,
        [userId]
      );

      await connection.query(
        'DELETE FROM slang WHERE user_id = $1',
        [userId]
      );

      await connection.query(
        'DELETE FROM reports WHERE reporter_id = $1',
        [userId]
      );

      await connection.query(
        'DELETE FROM users WHERE id = $1',
        [userId]
      );

      await connection.query('COMMIT');

      await logAction({
        userId: session.user.id,
        action: 'account_delete',
        targetType: 'user',
        targetId: session.user.id,
        details: 'Account permanently deleted'
      }).catch(() => {});

      try {
        await cacheDel(cacheKeys.user.base(userId));
        await cacheDel(cacheKeys.user.email(userEmail));
        if (session.user.name) {
          await cacheDel(cacheKeys.user.username(session.user.name));
        }
      } catch (cacheError) {
        console.warn('Failed to clear user cache:', cacheError);
      }

      return NextResponse.json({
        success: true,
        message: 'Account and all related data have been permanently deleted',
      });
    } catch (transactionError) {
      await connection.query('ROLLBACK');
      throw transactionError;
    }
  } catch (error) {
    console.error('Error deleting user account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
