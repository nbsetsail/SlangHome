import { NextRequest, NextResponse } from 'next/server'
import { getWriteDb, releaseDb, smartInsert } from '@/lib/db-adapter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, title, content, userId } = body

    if (!type || !title || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const connection = await getWriteDb()
    
    try {
      await smartInsert('feedback', { 
        type, title, content, 
        user_id: userId || null, 
        status: 'pending' 
      })

      return NextResponse.json({ success: true })
    } finally {
      await releaseDb(connection)
    }
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const connection = await getWriteDb()
    
    try {
      let query = 'SELECT * FROM feedback'
      const conditions: string[] = []
      const params: any[] = []
      let paramIndex = 1

      if (status) {
        conditions.push(`status = $${paramIndex}`)
        params.push(status)
        paramIndex++
      }

      if (type) {
        conditions.push(`type = $${paramIndex}`)
        params.push(type)
        paramIndex++
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ')
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await connection.query(query, params)

      return NextResponse.json({
        success: true,
        data: {
          feedback: result.rows,
          total: result.rows.length
        }
      })
    } finally {
      await releaseDb(connection)
    }
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}
