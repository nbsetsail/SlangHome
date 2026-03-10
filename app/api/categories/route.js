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
      ? cacheKeys.category.search(search, page, limit, locale)
      : cacheKeys.category.list(page, limit, locale);
    
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
      sql = `SELECT id, name, heat, click_count FROM categories WHERE name ILIKE $1 AND locale = $2 ORDER BY heat DESC LIMIT $3 OFFSET $4`;
      countSql = `SELECT COUNT(*) as total FROM categories WHERE name ILIKE $1 AND locale = $2`;
      params = [`%${search}%`, locale, limit, offset];
      countParams = [`%${search}%`, locale];
    } else {
      sql = `SELECT id, name, heat, click_count FROM categories WHERE locale = $1 ORDER BY heat DESC LIMIT $2 OFFSET $3`;
      countSql = `SELECT COUNT(*) as total FROM categories WHERE locale = $1`;
      params = [locale, limit, offset];
      countParams = [locale];
    }
    
    const categories = await allQuery(sql, params);
    const countResult = await getQuery(countSql, countParams);
    const total = countResult?.total || 0;

    const responseData = { 
      categories,
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
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, locale = 'en' } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }
    
    if (name.includes(',') || name.includes('，')) {
      return NextResponse.json({ error: 'Category name cannot contain commas' }, { status: 400 });
    }

    const result = await smartInsert('categories', { name, locale, heat: 0, click_count: 0 });

    await cacheDelPattern('categories:*');

    return NextResponse.json({ 
      success: true, 
      id: result.insertId,
      message: 'Category created successfully' 
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, name } = await request.json();
    
    if (!id || !name) {
      return NextResponse.json({ error: 'Category ID and name are required' }, { status: 400 });
    }

    await smartUpdate('categories', { name }, 'id = $1', [id]);

    await cacheDelPattern('categories:*');

    return NextResponse.json({ 
      success: true,
      message: 'Category updated successfully' 
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    await executeUpdate('DELETE FROM categories WHERE id = $1', [id]);

    await cacheDelPattern('categories:*');

    return NextResponse.json({ 
      success: true,
      message: 'Category deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
