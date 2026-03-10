import { getReadDb, releaseDb } from '@/lib/db-adapter';

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

    connection = await getReadDb();

    const result = await connection.query(`
      SELECT s.* FROM slang s
      JOIN favorites f ON s.id = f.slang_id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `, [id]);

    const processedFavorites = result.rows.map(item => ({
      ...item,
      has_evolution: !!item.has_evolution
    }));

    return new Response(JSON.stringify({ slang: processedFavorites }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching user favorites:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch user favorites' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    if (connection) {
      await releaseDb(connection);
    }
  }
}
