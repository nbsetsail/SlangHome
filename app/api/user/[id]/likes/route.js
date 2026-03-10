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
      SELECT l.*, s.phrase, s.explanation 
      FROM likes l
      JOIN slang s ON l.slang_id = s.id
      WHERE l.user_id = $1
      ORDER BY l.created_at DESC
    `, [id]);

    return new Response(JSON.stringify({ likes: result.rows }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching user likes:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch user likes' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    if (connection) {
      await releaseDb(connection);
    }
  }
}
