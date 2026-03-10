import { NextResponse } from 'next/server';
import { runQuery, getQuery, allQuery, executeQuery, beginTransaction, commitTransaction, rollbackTransaction } from '@/lib/db-adapter';
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
    const status = searchParams.get('status');
    const user = searchParams.get('user');
    const slang = searchParams.get('slang');
    const keyword = searchParams.get('keyword');
    const locale = searchParams.get('locale');

    const conditions = ['1=1'];
    const params = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`c.status = $${paramIndex++}`);
      params.push(status);
    }

    if (user) {
      conditions.push(`(u.username ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex + 1})`);
      params.push(`%${user}%`, `%${user}%`);
      paramIndex += 2;
    }

    if (slang) {
      conditions.push(`s.phrase ILIKE $${paramIndex++}`);
      params.push(`%${slang}%`);
    }

    if (keyword) {
      conditions.push(`c.content ILIKE $${paramIndex++}`);
      params.push(`%${keyword}%`);
    }

    if (locale) {
      conditions.push(`s.locale = $${paramIndex++}`);
      params.push(locale);
    }

    const localeFilter = getLocaleFilter(authResult);
    if (localeFilter) {
      const placeholders = localeFilter.map((_, i) => `$${paramIndex + i}`).join(', ');
      conditions.push(`s.locale IN (${placeholders})`);
      params.push(...localeFilter);
      paramIndex += localeFilter.length;
    }

    const whereClause = conditions.join(' AND ');

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM comments c 
      LEFT JOIN users u ON c.user_id = u.id 
      LEFT JOIN slang s ON c.slang_id = s.id 
      WHERE ${whereClause}
    `;
    const totalResult = await getQuery(countQuery, params);
    const total = totalResult?.total || 0;

    const offset = (page - 1) * pageSize;
    const dataQuery = `
      SELECT c.*, u.username as user_name, u.email as user_email, s.phrase as slang_phrase, s.locale as slang_locale
      FROM comments c 
      LEFT JOIN users u ON c.user_id = u.id 
      LEFT JOIN slang s ON c.slang_id = s.id 
      WHERE ${whereClause}
      ORDER BY c.created_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(pageSize, offset);

    let comments = await allQuery(dataQuery, params);

    if (!Array.isArray(comments)) {
      comments = [];
    }

    return NextResponse.json({
      success: true,
      data: {
        comments,
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
    const { action, commentIds, status } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Action is required' }, { status: 400 });
    }

    if (action === 'delete') {
      const deleteAuthResult = await checkMgrAuth(['admin', 'moderator']);
      if (!deleteAuthResult.authorized) {
        return unauthorizedResponse(deleteAuthResult.error, deleteAuthResult.status);
      }
    }

    if (action === 'delete' || action === 'updateStatus') {
      if (!Array.isArray(commentIds) || commentIds.length === 0) {
        return NextResponse.json({ success: false, error: 'Comment IDs are required' }, { status: 400 });
      }
    }

    let response;

    const conn = await beginTransaction();

    try {
      if (action === 'delete') {
        for (const id of commentIds) {
          if (authResult.user.role === 'moderator') {
            const commentLocale = await getQuery(`
              SELECT s.locale 
              FROM comments c 
              JOIN slang s ON c.slang_id = s.id 
              WHERE c.id = $1
            `, [id]);
            
            if (commentLocale && !authResult.managedLocales?.includes(commentLocale.locale)) {
              continue;
            }
          }
          await executeQuery('DELETE FROM comments WHERE id = $1', [id]);
        }

        response = NextResponse.json({ success: true, message: 'Comments deleted successfully' });
      } else if (action === 'updateStatus') {
        if (!status) {
          response = NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
        } else {
          for (const id of commentIds) {
            if (authResult.user.role === 'moderator') {
              const commentLocale = await getQuery(`
                SELECT s.locale 
                FROM comments c 
                JOIN slang s ON c.slang_id = s.id 
                WHERE c.id = $1
              `, [id]);
              
              if (commentLocale && !authResult.managedLocales?.includes(commentLocale.locale)) {
                continue;
              }
            }
            await executeQuery('UPDATE comments SET status = $1 WHERE id = $2', [status, id]);
          }

          response = NextResponse.json({ success: true, message: 'Comments updated successfully' });
        }
      } else {
        response = NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
      }

      await commitTransaction(conn);

    } catch (error) {
      await rollbackTransaction(conn);
      throw error;
    }

    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
