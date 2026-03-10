import { getQuery } from '@/lib/db-adapter'

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const existingUser = await getQuery('SELECT id FROM users WHERE email = $1', [email])

    return new Response(JSON.stringify({
      exists: !!existingUser
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error checking email:', error)
    return new Response(JSON.stringify({ error: 'Failed to check email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
