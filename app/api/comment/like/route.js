import { NextResponse } from 'next/server';
import { getReadDb, getWriteDb, releaseDb, smartInsertIgnore } from '@/lib/db-adapter';
import { userStateCache } from '@/lib/cache';

export async function POST(request) {
  let connection = null;
  try {
    const data = await request.json()
    const { commentId, userId } = data

    if (!commentId || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    connection = await getWriteDb();

    const commentResult = await connection.query('SELECT user_id FROM comments WHERE id = $1', [commentId]);
    const comment = commentResult.rows[0];

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.user_id === userId) {
      return NextResponse.json({ error: 'Cannot like your own comment' }, { status: 400 });
    }

    const currentLikeResult = await connection.query('SELECT * FROM comment_likes WHERE user_id = $1 AND comment_id = $2', [userId, commentId]);
    const isLiked = currentLikeResult.rows.length === 0;

    if (isLiked) {
      await smartInsertIgnore('comment_likes', { user_id: userId, comment_id: commentId });
      await userStateCache.setUserLikedComment(userId, commentId, true);
    } else {
      await connection.query('DELETE FROM comment_likes WHERE user_id = $1 AND comment_id = $2', [userId, commentId]);
      await userStateCache.setUserLikedComment(userId, commentId, false);
    }

    const likeCountResult = await connection.query('SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = $1', [commentId]);
    const likeCount = likeCountResult.rows[0]?.count || 0;
    await connection.query('UPDATE comments SET likes = $1 WHERE id = $2', [likeCount, commentId]);

    const result = { success: true, isLiked, likeCount };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error toggling comment like:', error);
    return NextResponse.json({ error: 'Failed to toggle comment like' }, { status: 500 });
  } finally {
    if (connection) {
      await releaseDb(connection);
    }
  }
}

export async function GET(request) {
  let connection = null;
  try {
    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('commentId')
    const userId = searchParams.get('userId')

    if (!commentId) {
      return new Response(JSON.stringify({ error: 'Missing commentId parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    connection = await getReadDb();
    
    const commentResult = await connection.query('SELECT likes FROM comments WHERE id = $1', [commentId])
    const comment = commentResult.rows[0]

    if (!comment) {
      return new Response(JSON.stringify({ error: 'Comment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const likeCount = comment.likes || 0
    let isLiked = false

    if (userId) {
      const cachedLiked = await userStateCache.getUserLikedComment(userId, commentId);
      if (cachedLiked !== null) {
        isLiked = cachedLiked;
      } else {
        const likeStatusResult = await connection.query('SELECT * FROM comment_likes WHERE user_id = $1 AND comment_id = $2', [userId, commentId])
        isLiked = likeStatusResult.rows.length > 0;
        if (isLiked) {
          await userStateCache.setUserLikedComment(userId, commentId);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, likeCount, isLiked }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error getting comment likes:', error)
    return new Response(JSON.stringify({ error: 'Failed to get comment likes' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  } finally {
    if (connection) {
      await releaseDb(connection);
    }
  }
}
