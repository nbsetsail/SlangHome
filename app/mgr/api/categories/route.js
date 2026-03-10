import { NextResponse } from 'next/server';
import { getQuery, allQuery, executeQuery, beginTransaction, commitTransaction, rollbackTransaction, smartInsert, smartUpdate } from '@/lib/db-adapter';
import { checkMgrAuth, unauthorizedResponse, getLocaleFilter } from '../auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  const authResult = await checkMgrAuth();
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status);
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const keyword = searchParams.get('keyword');
    const locale = searchParams.get('locale');

    const conditions = ['1=1'];
    const params = [];
    let paramIndex = 1;

    if (keyword) {
      conditions.push(`name ILIKE $${paramIndex++}`);
      params.push(`%${keyword}%`);
    }

    if (locale) {
      conditions.push(`locale = $${paramIndex++}`);
      params.push(locale);
    }

    const localeFilter = getLocaleFilter(authResult);
    if (localeFilter) {
      const placeholders = localeFilter.map((_, i) => `$${paramIndex + i}`).join(', ');
      conditions.push(`locale IN (${placeholders})`);
      params.push(...localeFilter);
      paramIndex += localeFilter.length;
    }

    const whereClause = conditions.join(' AND ');

    const countQuery = `SELECT COUNT(*) as total FROM categories WHERE ${whereClause}`;
    const totalResult = await getQuery(countQuery, params);
    const total = totalResult?.total || 0;

    const offset = (page - 1) * pageSize;
    const dataQuery = `
      SELECT * FROM categories 
      WHERE ${whereClause}
      ORDER BY heat DESC, click_count DESC, created_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(pageSize, offset);

    let categories = await allQuery(dataQuery, params);

    if (!Array.isArray(categories)) {
      categories = [];
    }

    return NextResponse.json({
      success: true,
      data: {
        categories,
        pagination: {
          page,
          pageSize,
          total,
          pages: Math.ceil(total / pageSize)
        },
        managedLocales: authResult.managedLocales
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  const authResult = await checkMgrAuth();
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status);
  }

  try {
    const body = await request.json();
    const { action, categoryId, name, heat, clickCount, locale } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Action is required' }, { status: 400 });
    }

    if (action === 'delete') {
      const deleteAuthResult = await checkMgrAuth(['admin']);
      if (!deleteAuthResult.authorized) {
        return unauthorizedResponse(deleteAuthResult.error, deleteAuthResult.status);
      }
    }

    const localeFilter = getLocaleFilter(authResult);
    if (locale && localeFilter && !localeFilter.includes(locale)) {
      return NextResponse.json({ 
        success: false, 
        error: `You do not have permission to manage locale: ${locale}` 
      }, { status: 403 });
    }

    const conn = await beginTransaction();

    try {
      if (action === 'create') {
        if (!name) {
          await rollbackTransaction(conn);
          return NextResponse.json({ success: false, error: 'Category name is required' }, { status: 400 });
        }
        if (name.includes(',') || name.includes('，')) {
          await rollbackTransaction(conn);
          return NextResponse.json({ success: false, error: 'Category name cannot contain commas' }, { status: 400 });
        }

        const categoryLocale = locale || (localeFilter ? localeFilter[0] : 'en');
        
        const existing = await getQuery('SELECT id FROM categories WHERE name = $1 AND locale = $2', [name, categoryLocale]);
        if (existing) {
          await rollbackTransaction(conn);
          return NextResponse.json({ success: false, error: 'Category with this name already exists in this locale' }, { status: 400 });
        }

        const result = await smartInsert('categories', {
          name,
          heat: heat || 0,
          click_count: clickCount || 0,
          locale: categoryLocale
        });

        await commitTransaction(conn);
        return NextResponse.json({
          success: true,
          data: {
            id: result.insertId,
            name,
            heat: heat || 0,
            click_count: clickCount || 0,
            locale: categoryLocale
          }
        });
      }

      if (action === 'update') {
        if (!categoryId) {
          await rollbackTransaction(conn);
          return NextResponse.json({ success: false, error: 'Category ID is required' }, { status: 400 });
        }

        const existingCategory = await getQuery('SELECT locale FROM categories WHERE id = $1', [categoryId]);
        if (!existingCategory) {
          await rollbackTransaction(conn);
          return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
        }

        if (localeFilter && !localeFilter.includes(existingCategory.locale)) {
          await rollbackTransaction(conn);
          return NextResponse.json({ 
            success: false, 
            error: `You do not have permission to manage locale: ${existingCategory.locale}` 
          }, { status: 403 });
        }

        const updates = [];
        const updateParams = [];
        let updateIndex = 1;

        if (name !== undefined) {
          updates.push(`name = $${updateIndex++}`);
          updateParams.push(name);
        }
        if (heat !== undefined) {
          updates.push(`heat = $${updateIndex++}`);
          updateParams.push(heat);
        }
        if (clickCount !== undefined) {
          updates.push(`click_count = $${updateIndex++}`);
          updateParams.push(clickCount);
        }

        if (updates.length === 0) {
          await rollbackTransaction(conn);
          return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (heat !== undefined) updateData.heat = heat;
        if (clickCount !== undefined) updateData.click_count = clickCount;
        
        await smartUpdate('categories', updateData, 'id = $1', [categoryId]);

        await commitTransaction(conn);
        return NextResponse.json({ success: true, message: 'Category updated successfully' });
      }

      if (action === 'delete') {
        if (!categoryId) {
          await rollbackTransaction(conn);
          return NextResponse.json({ success: false, error: 'Category ID is required' }, { status: 400 });
        }

        const existingCategory = await getQuery('SELECT locale FROM categories WHERE id = $1', [categoryId]);
        if (!existingCategory) {
          await rollbackTransaction(conn);
          return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
        }

        if (localeFilter && !localeFilter.includes(existingCategory.locale)) {
          await rollbackTransaction(conn);
          return NextResponse.json({ 
            success: false, 
            error: `You do not have permission to manage locale: ${existingCategory.locale}` 
          }, { status: 403 });
        }

        await executeQuery('DELETE FROM categories WHERE id = $1', [categoryId]);

        await commitTransaction(conn);
        return NextResponse.json({ success: true, message: 'Category deleted successfully' });
      }

      await rollbackTransaction(conn);
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    } catch (error) {
      await rollbackTransaction(conn);
      throw error;
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
