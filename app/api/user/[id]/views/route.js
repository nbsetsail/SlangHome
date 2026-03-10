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
      SELECT v.*, s.phrase, s.explanation 
      FROM views v
      JOIN slang s ON v.slang_id = s.id
      WHERE v.user_id = $1
      ORDER BY v.viewed_at DESC
    `, [id]);

    return new Response(JSON.stringify({ views: result.rows }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching user views:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch user views' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    if (connection) {
      await releaseDb(connection);
    }
  }
}
