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
      SELECT c.*, s.phrase as slang_phrase 
      FROM comments c
      JOIN slang s ON c.slang_id = s.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `, [id]);

    return new Response(JSON.stringify({ comments: result.rows }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching user comments:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch user comments' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    if (connection) {
      await releaseDb(connection);
    }
  }
}
