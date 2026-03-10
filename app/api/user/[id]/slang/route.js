import { getReadDb, releaseDb } from '@/lib/db-adapter';
import { cacheGet, cacheSet, cacheKeys, cacheTTLs } from '@/lib/cache';

export async function GET(request, context) {
  let connection = null;
  try {
    const params = await context.params;
    const id = params.id;

    if (!id) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cacheKey = cacheKeys.user.slang(id, 1, 100);
    const cachedSlang = await cacheGet(cacheKey);
    if (cachedSlang) {
      return new Response(JSON.stringify({ slang: cachedSlang }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    connection = await getReadDb();

    const result = await connection.query(`
      SELECT * FROM slang
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [id]);

    const slang = result.rows.map(item => ({
      ...item,
      has_evolution: !!item.has_evolution
    }));

    await cacheSet(cacheKey, slang, cacheTTLs.userState());

    return new Response(JSON.stringify({ slang }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching user slang:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch user slang' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    if (connection) {
      await releaseDb(connection);
    }
  }
}
