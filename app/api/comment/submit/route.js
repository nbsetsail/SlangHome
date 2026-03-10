import { NextResponse } from 'next/server';
import { getWriteDb, releaseDb, smartInsert } from '@/lib/db-adapter';
import { cacheDelPattern, cacheDel, heatCounters, cacheKeys } from '@/lib/cache';
import { addNotificationToQueue } from '@/lib/notification-queue';

export async function POST(request) {
  let connection = null;
  try {
    const { slangId, userId, content, parentId, images, slangUserId, slangPhrase, parentUserId } = await request.json()
    
    if (!slangId || !userId || (!content && !images)) {
      return NextResponse.json({ error: 'Slang ID, User ID, and content or images are required' }, { status: 400 });
    }
    
    connection = await getWriteDb();
    
    const result = await smartInsert('comments', {
      slang_id: slangId,
      user_id: userId,
      parent_id: parentId || null,
      content: content || '',
      images: images || null
    }, connection);
    
    await heatCounters.incrSlangComments(slangId, 1)
    
    if (parentId) {
      await heatCounters.incrCommentReplies(parentId, 1)
      
      const parentResult = await connection.query(
        'SELECT parent_id FROM comments WHERE id = $1',
        [parentId]
      )
      
      if (parentResult.rows.length > 0 && parentResult.rows[0].parent_id) {
        await heatCounters.incrCommentReplies(parentResult.rows[0].parent_id, 1)
      }
    }
    
    const pendingCounters = await heatCounters.getSlangCounters(slangId)
    
    await cacheDel(cacheKeys.slang.detail(slangId))
    await cacheDelPattern('slang:list:*')
    await cacheDelPattern('comments:slang:*')
    
    if (slangUserId && slangUserId !== userId) {
      await addNotificationToQueue({
        userId: slangUserId,
        type: 'comment',
        title: 'New Comment!',
        content: `Someone commented on your slang "${slangPhrase || 'unknown'}"`,
        link: `/slang/phrase/${encodeURIComponent(slangPhrase || '')}`
      });
    }
    
    if (parentId && parentUserId && parentUserId !== userId) {
      await addNotificationToQueue({
        userId: parentUserId,
        type: 'reply',
        title: 'New Reply!',
        content: `Someone replied to your comment on "${slangPhrase || 'a slang'}"`,
        link: `/slang/phrase/${encodeURIComponent(slangPhrase || '')}`
      });
    }
    
    return NextResponse.json({ 
      success: true,
      commentId: result.id,
      commentsCount: pendingCounters.comments
    });
  } catch (error) {
    console.error('Error submitting comment:', error);
    return NextResponse.json({ error: 'Failed to submit comment' }, { status: 500 });
  } finally {
    if (connection) {
      await releaseDb(connection);
    }
  }
}
