import { NextResponse } from 'next/server';
import { getWriteDb, releaseDb, smartInsert, smartUpdate } from '@/lib/db-adapter';
import { cacheDelPattern } from '@/lib/cache';
import { calculateCategoryHeat } from '@/lib/calculateHeat';

export async function POST(request) {
  let connection = null;
  try {
    connection = await getWriteDb();
    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }
    
    if (name.includes(',') || name.includes('，')) {
      return NextResponse.json({ error: 'Category name cannot contain commas' }, { status: 400 });
    }
    
    const categoryResult = await connection.query('SELECT * FROM categories WHERE name = $1', [name]);
    const category = categoryResult.rows[0];
    
    if (category) {
      await smartUpdate('categories', { click_count: (category.click_count || 0) + 1 }, 'id = $1', [category.id]);
      
      await calculateCategoryHeat();
      await cacheDelPattern('categories:*');
      
      const updatedResult = await connection.query('SELECT * FROM categories WHERE id = $1', [category.id]);
      return NextResponse.json({ success: true, category: updatedResult.rows[0] });
    } else {
      const insertResult = await smartInsert('categories', { name, click_count: 1 });
      
      await cacheDelPattern('categories:*');
      
      return NextResponse.json({ success: true, category: insertResult });
    }
  } catch (error) {
    console.error('Error handling category click:', error);
    return NextResponse.json({ error: 'Failed to handle category click' }, { status: 500 });
  } finally {
    if (connection) {
      await releaseDb(connection);
    }
  }
}
