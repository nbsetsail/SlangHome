import { NextResponse } from 'next/server';
import { getWriteDb, releaseDb, smartInsert, smartUpdate } from '@/lib/db-adapter';
import { cacheDelPattern } from '@/lib/cache';
import { calculateTagHeat } from '@/lib/calculateHeat';

export async function POST(request) {
  let connection = null;
  try {
    connection = await getWriteDb();
    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }
    
    if (name.includes(',') || name.includes('，')) {
      return NextResponse.json({ error: 'Tag name cannot contain commas' }, { status: 400 });
    }
    
    const tagResult = await connection.query('SELECT * FROM tags WHERE name = $1', [name]);
    const tag = tagResult.rows[0];
    
    if (tag) {
      await smartUpdate('tags', { click_count: (tag.click_count || 0) + 1 }, 'id = $1', [tag.id]);
      
      await calculateTagHeat();
      await cacheDelPattern('tags:*');
      
      const updatedResult = await connection.query('SELECT * FROM tags WHERE id = $1', [tag.id]);
      return NextResponse.json({ success: true, tag: updatedResult.rows[0] });
    } else {
      const insertResult = await smartInsert('tags', { name, click_count: 1 });
      
      await cacheDelPattern('tags:*');
      
      return NextResponse.json({ success: true, tag: insertResult });
    }
  } catch (error) {
    console.error('Error handling tag click:', error);
    return NextResponse.json({ error: 'Failed to handle tag click' }, { status: 500 });
  } finally {
    if (connection) {
      await releaseDb(connection);
    }
  }
}
