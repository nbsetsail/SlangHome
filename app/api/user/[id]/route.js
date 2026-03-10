import { NextResponse } from 'next/server';
import { getReadDb, getWriteDb, releaseDb, smartUpdate } from '@/lib/db-adapter';
import { auth } from '@/lib/auth';
import { cacheGet, cacheSet, cacheDel, cacheKeys, cacheTTLs } from '@/lib/cache';

export async function GET(request, context) {
  let connection = null;
  try {
    const params = await context.params;
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const cacheKey = cacheKeys.user.profile(id);
    const cachedUser = await cacheGet(cacheKey);
    if (cachedUser) {
      return NextResponse.json(cachedUser);
    }

    connection = await getReadDb();

    const result = await connection.query('SELECT id, username, email, role, created_at FROM users WHERE id = $1', [id]);
    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await cacheSet(cacheKey, user, cacheTTLs.userState());

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  } finally {
    if (connection) {
      await releaseDb(connection);
    }
  }
}

export async function PATCH(request, context) {
  let connection = null;
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    if (session.user.id !== id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - You can only update your own profile' }, { status: 403 });
    }

    const data = await request.json();
    const { username, email, bio, avatar_url } = data;

    connection = await getWriteDb();

    const updateData = {};

    if (username) {
      const existingResult = await connection.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, id]);
      if (existingResult.rows.length > 0) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
      }
      updateData.username = username;
    }

    if (email) {
      const existingResult = await connection.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (existingResult.rows.length > 0) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
      updateData.email = email;
    }

    if (bio !== undefined) {
      updateData.bio = bio;
    }

    if (avatar_url !== undefined) {
      updateData.avatar_url = avatar_url;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    await smartUpdate('users', updateData, 'id = $1', [id]);

    const updatedResult = await connection.query('SELECT id, username, email, role, bio, avatar_url, created_at FROM users WHERE id = $1', [id]);
    
    await cacheDel(cacheKeys.user.profile(id));
    await cacheDel(cacheKeys.user.stats(id));
    
    return NextResponse.json({ success: true, user: updatedResult.rows[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  } finally {
    if (connection) {
      await releaseDb(connection);
    }
  }
}
