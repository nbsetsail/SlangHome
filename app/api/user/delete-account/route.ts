import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getWriteDb } from '@/lib/db-adapter';
import { cacheDel, cacheKeys } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function DELETE() {
  try {
    const session = await auth();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const connection = await getWriteDb();
    const userEmail = session.user.email;

    await connection.query('START TRANSACTION');

    try {
      const users = await connection.query(
        'SELECT id FROM users WHERE email = $1',
        [userEmail]
      );

      if (!Array.isArray(users.rows) || users.rows.length === 0) {
        await connection.query('ROLLBACK');
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const userId = users.rows[0].id;

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
