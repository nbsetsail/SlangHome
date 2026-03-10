import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    let query = 'SELECT * FROM series WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1
    
    if (locale) {
      query += ` AND locale = $${paramIndex}`
      params.push(locale)
      paramIndex++
    }
    
    if (type) {
      query += ` AND type = $${paramIndex}`
      params.push(type)
      paramIndex++
    }
    
    query += ` ORDER BY priority ASC, issue_date DESC LIMIT $${paramIndex}`
    params.push(limit)

    const series = await executeQuery(query, params)

    return NextResponse.json({
      success: true,
      data: {
        series: series || []
      }
    })
  } catch (error) {
    console.error('Error fetching series:', error)
    return NextResponse.json({
      success: true,
      data: {
        series: []
      }
    })
  }
}
