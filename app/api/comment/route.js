import { NextResponse } from 'next/server';
import { getReadDb, getWriteDb, releaseDb } from '@/lib/db-adapter';
import { cacheDelPattern, cacheDel, cacheKeys } from '@/lib/cache';
import { updateSlangHeatOnAction } from '@/lib/calculateHeat';

export async function POST(request) {
  let connection = null;
  try {
    const { slangId } = await request.json()
    
    if (!slangId) {
      return NextResponse.json({ error: 'Slang ID is required' }, { status: 400 })
    }
    
    connection = await getWriteDb();
    
    await connection.query('UPDATE slang SET comments_count = comments_count + 1 WHERE id = $1', [slangId]);
    
    const result = await connection.query('SELECT comments_count FROM slang WHERE id = $1', [slangId]);
    const newCommentCount = result.rows[0]?.comments_count || 0;
    
    await updateSlangHeatOnAction(slangId, 'comment')
    
    await cacheDel(cacheKeys.slang.detail(slangId))
    await cacheDelPattern('slang:list:*')
    await cacheDelPattern('comments:slang:*')
    
    return NextResponse.json({ comments: newCommentCount });
  } catch (error) {
    console.error('Error incrementing comment count:', error);
    return NextResponse.json({ error: 'Failed to increment comment count' }, { status: 500 });
  } finally {
    if (connection) {
      await releaseDb(connection);
    }
  }
}
