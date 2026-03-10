import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getReadDb } from '@/lib/db-adapter';

export const dynamic = 'force-dynamic';

/**
 * GDPR 数据导出接口
 * 允许用户导出其所有个人数据（JSON 格式）
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const connection = await getReadDb();
    const userEmail = session.user.email;

    // 获取用户基本信息
    const users = await connection.query(
      'SELECT id, username, email, display_name, avatar, bio, created_at FROM users WHERE email = $1',
      [userEmail]
    );

    if (!Array.isArray(users.rows) || users.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users.rows[0] as any;
    const userId = user.id;

    const slangListResult = await connection.query(
      `SELECT id, phrase, explanation, origin, example, categories, created_at, updated_at 
       FROM slang WHERE user_id = $1`,
      [userId]
    );
    const slangList = slangListResult.rows || [];

    const commentsResult = await connection.query(
      `SELECT id, content, slang_id, parent_id, created_at, updated_at 
       FROM comments WHERE user_id = $1`,
      [userId]
    );
    const comments = commentsResult.rows || [];

    const favoritesResult = await connection.query(
      `SELECT slang_id, created_at FROM favorites WHERE user_id = $1`,
      [userId]
    );
    const favorites = favoritesResult.rows || [];

    const likesResult = await connection.query(
      `SELECT slang_id, comment_id, created_at FROM likes WHERE user_id = $1`,
      [userId]
    );
    const likes = likesResult.rows || [];

    const notificationsResult = await connection.query(
      `SELECT id, type, title, content, is_read, created_at FROM notifications WHERE user_id = $1`,
      [userId]
    );
    const notifications = notificationsResult.rows || [];

    const viewsResult = await connection.query(
      `SELECT slang_id, created_at as viewed_at FROM views WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [userId]
    );
    const views = viewsResult.rows || [];

    const pkHistoryResult = await connection.query(
      `SELECT id, player2_id as opponent_id, player1_score as score, player2_score as opponent_score, 
              CASE WHEN winner_id = $1 THEN 'win' WHEN winner_id IS NULL THEN 'draw' ELSE 'lose' END as result, 
              created_at as played_at 
       FROM pk_matches WHERE (player1_id = $1 OR player2_id = $1) ORDER BY created_at DESC LIMIT 100`,
      [userId]
    );
    const pkHistory = pkHistoryResult.rows || [];

    const achievementsResult = await connection.query(
      `SELECT achievement_type as achievement_id, created_at as unlocked_at FROM pk_achievements WHERE user_id = $1`,
      [userId]
    );
    const achievements = achievementsResult.rows || [];

    // 构建导出数据
    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.created_at,
      },
      content: {
        slang: slangList,
        comments: comments,
      },
      interactions: {
        favorites: favorites,
        likes: likes,
        views: views,
      },
      activity: {
        notifications: notifications,
        pkGames: pkHistory,
        achievements: achievements,
      },
      statistics: {
        totalSlang: slangList.length,
        totalComments: comments.length,
        totalFavorites: favorites.length,
        totalLikes: likes.length,
        totalGames: pkHistory.length,
      },
    };

    // 创建响应
    const response = new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });

    return response;
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
