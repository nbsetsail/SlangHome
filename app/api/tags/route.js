import { NextResponse } from 'next/server';
import { allQuery, smartInsert, smartUpdate, getQuery } from '@/lib/db-adapter';
import { 
  cacheGet, 
  cacheSet, 
  cacheDelPattern,
  cacheKeys, 
  cacheTTLs 
} from '@/lib/cache';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const locale = searchParams.get('locale') || 'en';
    const offset = (page - 1) * limit;

    const cacheKey = search 
      ? cacheKeys.tag.search(search, page, limit, locale)
      : cacheKeys.tag.list(page, limit, locale);
    
    const cachedData = await cacheGet(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
        }
      });
    }
    
    let sql, countSql, params = [], countParams = [];
    
    if (search) {
      sql = `SELECT id, name, heat, click_count FROM tags WHERE name ILIKE $1 AND locale = $2 ORDER BY heat DESC LIMIT $3 OFFSET $4`;
      countSql = `SELECT COUNT(*) as total FROM tags WHERE name ILIKE $1 AND locale = $2`;
      params = [`%${search}%`, locale, limit, offset];
      countParams = [`%${search}%`, locale];
    } else {
      sql = `SELECT id, name, heat, click_count FROM tags WHERE locale = $1 ORDER BY heat DESC LIMIT $2 OFFSET $3`;
      countSql = `SELECT COUNT(*) as total FROM tags WHERE locale = $1`;
      params = [locale, limit, offset];
      countParams = [locale];
    }
    
    const tags = await allQuery(sql, params);
    const countResult = await getQuery(countSql, countParams);
    const total = countResult?.total || 0;

    const responseData = { 
      tags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    await cacheSet(cacheKey, responseData, cacheTTLs.static());

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, locale = 'en' } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }
    
    if (name.includes(',') || name.includes('，')) {
      return NextResponse.json({ error: 'Tag name cannot contain commas' }, { status: 400 });
    }

    const result = await smartInsert('tags', { name, locale, heat: 0, click_count: 0 });

    await cacheDelPattern('tags:*');

    return NextResponse.json({ 
      success: true, 
      id: result.insertId,
      message: 'Tag created successfully' 
    });
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, name } = await request.json();
    
    if (!id || !name) {
      return NextResponse.json({ error: 'Tag ID and name are required' }, { status: 400 });
    }

    await smartUpdate('tags', { name }, 'id = $1', [id]);

    await cacheDelPattern('tags:*');

    return NextResponse.json({ 
      success: true,
      message: 'Tag updated successfully' 
    });
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    await executeUpdate('DELETE FROM tags WHERE id = $1', [id]);

    await cacheDelPattern('tags:*');

    return NextResponse.json({ 
      success: true,
      message: 'Tag deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}
