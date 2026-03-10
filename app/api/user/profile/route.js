import { NextResponse } from 'next/server';
import { getQuery, smartUpdate, allQuery } from '@/lib/db-adapter';
import { auth } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const [userWithRank, achievements] = await Promise.all([
      getQuery(
        `SELECT u.id, u.username, u.email, u.role, u.status, u.avatar, u.gender, u.bio, 
                u.show_rank, u.show_achievement, u.equipped_achievement, u.created_at,
                pks.level, pks.stars, pks.total_wins, pks.total_losses, pks.current_streak, 
                pks.max_streak, pks.perfect_wins, pks.all_correct_games, pks.perfect_games,
                pr.name as rank_name, pr.badge_icon as rank_badge_icon
         FROM users u
         LEFT JOIN user_pk_stats pks ON u.id = pks.user_id
         LEFT JOIN pk_ranks pr ON pks.level BETWEEN pr.min_level AND pr.max_level
         WHERE u.id = $1`,
        [userId]
      ),
      allQuery(
        'SELECT achievement_type, achievement_value FROM pk_achievements WHERE user_id = $1',
        [userId]
      )
    ]);

    if (!userWithRank) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const { rank_name, rank_badge_icon, ...userData } = userWithRank;
    const pkStats = userWithRank.level ? {
      level: userWithRank.level,
      stars: userWithRank.stars,
      total_wins: userWithRank.total_wins,
      total_losses: userWithRank.total_losses,
      current_streak: userWithRank.current_streak,
      max_streak: userWithRank.max_streak,
      perfect_wins: userWithRank.perfect_wins,
      all_correct_games: userWithRank.all_correct_games,
      perfect_games: userWithRank.perfect_games
    } : null;
    const pkRank = rank_name ? { name: rank_name, badge_icon: rank_badge_icon } : null;

    return NextResponse.json({
      success: true,
      data: {
        ...userData,
        pkStats,
        pkRank,
        achievements
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please login first.' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { userId, displayName, gender, bio, show_rank, show_achievement, equipped_achievement } = data;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const currentUserId = session.user.id;
    const currentUserRole = session.user.role;
    
    if (currentUserId !== userId && currentUserRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden. You can only update your own profile.' },
        { status: 403 }
      );
    }

    const targetUser = await getQuery('SELECT id, status FROM users WHERE id = $1', [userId]);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (displayName !== undefined) {
      if (displayName.length < 1 || displayName.length > 25) {
        return NextResponse.json(
          { success: false, error: 'Display name must be between 1 and 25 characters' },
          { status: 400 }
        );
      }
      if (!/^[\p{L}\p{N}\s_-]+$/u.test(displayName)) {
        return NextResponse.json(
          { success: false, error: 'Display name contains invalid characters' },
          { status: 400 }
        );
      }
    }

    const updateData = {};
    
    if (displayName !== undefined) {
      updateData.display_name = displayName;
    }
    if (gender !== undefined) {
      updateData.gender = gender || null;
    }
    if (bio !== undefined) {
      updateData.bio = bio || null;
    }
    if (show_rank !== undefined) {
      updateData.show_rank = show_rank ? 1 : 0;
    }
    if (show_achievement !== undefined) {
      updateData.show_achievement = show_achievement ? 1 : 0;
    }
    if (equipped_achievement !== undefined) {
      updateData.equipped_achievement = equipped_achievement || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    await smartUpdate('users', updateData, 'id = $1', [userId]);

    const updatedUser = await getQuery(
      'SELECT id, username, email, role, status, avatar, gender, bio, show_rank, show_achievement, equipped_achievement, created_at FROM users WHERE id = $1',
      [userId]
    );

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}
