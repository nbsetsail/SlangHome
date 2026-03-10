import { getQuery } from '@/lib/db-adapter'

export async function POST(request) {
  try {
    const { username } = await request.json()

    if (!username) {
      return new Response(JSON.stringify({ error: 'Username is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const existingUser = await getQuery('SELECT id FROM users WHERE username = $1', [username])

    return new Response(JSON.stringify({
      exists: !!existingUser
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error checking username:', error)
    return new Response(JSON.stringify({ error: 'Failed to check username' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
