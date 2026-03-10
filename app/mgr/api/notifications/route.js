import { NextResponse } from 'next/server';
import { allQuery, runQuery, getQuery, smartInsert } from '@/lib/db-adapter';
import { checkMgrAuth, unauthorizedResponse } from '../auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const authCheck = await checkMgrAuth();
    if (!authCheck.authorized) {
      return unauthorizedResponse(authCheck.error, authCheck.status);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const type = searchParams.get('type') || '';
    const user = searchParams.get('user') || '';
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const params = [];
    let paramIndex = 1;

    if (type) {
      whereClause += ` AND n.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (user) {
      whereClause += ` AND (u.username LIKE $${paramIndex} OR u.email LIKE $${paramIndex + 1})`;
      params.push(`%${user}%`, `%${user}%`);
      paramIndex += 2;
    }

    const countSql = `SELECT COUNT(*) as count FROM notifications n LEFT JOIN users u ON n.user_id = u.id WHERE ${whereClause}`;
    const countResult = await getQuery(countSql, params);
    const total = countResult?.count || 0;

    const sql = `
      SELECT n.*, u.username, u.email as user_email 
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const notifications = await allQuery(sql, [...params, limit, offset]);

    const typeStats = await allQuery(`
      SELECT type, COUNT(*) as count 
      FROM notifications 
      GROUP BY type
    `);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        typeStats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authCheck = await checkMgrAuth();
    if (!authCheck.authorized) {
      return unauthorizedResponse(authCheck.error, authCheck.status);
    }

    const data = await request.json();
    const { action } = data;

    if (action === 'send') {
      const { recipientType, role, userId, type, title, content, link } = data;

      if (!title || !content) {
        return NextResponse.json({ success: false, error: 'Title and content are required' }, { status: 400 });
      }

      let sent = 0;
      let total = 0;

      if (recipientType === 'user') {
        if (!userId) {
          return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
        }
        await smartInsert('notifications', {
          user_id: userId,
          type: type || 'system',
          title,
          content,
          link: link || null,
          is_read: false
        });
        sent = 1;
        total = 1;
      } else if (recipientType === 'role') {
        const users = await allQuery('SELECT id FROM users WHERE role = $1 AND status = $2', [role, 'active']);
        total = users.length;
        for (const user of users) {
          await smartInsert('notifications', {
            user_id: user.id,
            type: type || 'system',
            title,
            content,
            link: link || null,
            is_read: false
          });
          sent++;
        }
      } else {
        const users = await allQuery('SELECT id FROM users WHERE status = $1', ['active']);
        total = users.length;
        for (const user of users) {
          await smartInsert('notifications', {
            user_id: user.id,
            type: type || 'system',
            title,
            content,
            link: link || null,
            is_read: false
          });
          sent++;
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Notification sent successfully',
        data: { sent, total }
      });
    }

    if (action === 'delete') {
      const { notificationId } = data;
      if (!notificationId) {
        return NextResponse.json({ success: false, error: 'Notification ID is required' }, { status: 400 });
      }
      await runQuery('DELETE FROM notifications WHERE id = $1', [notificationId]);
      return NextResponse.json({ success: true, message: 'Notification deleted successfully' });
    }

    if (action === 'mark_read') {
      const { notificationId } = data;
      if (!notificationId) {
        return NextResponse.json({ success: false, error: 'Notification ID is required' }, { status: 400 });
      }
      await runQuery('UPDATE notifications SET is_read = true WHERE id = $1', [notificationId]);
      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    if (action === 'mark_all_read') {
      const { userId } = data;
      if (userId) {
        await runQuery('UPDATE notifications SET is_read = true WHERE user_id = $1', [userId]);
      } else {
        await runQuery('UPDATE notifications SET is_read = true');
      }
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in notification action:', error);
    return NextResponse.json({ success: false, error: 'Failed to perform action' }, { status: 500 });
  }
}
