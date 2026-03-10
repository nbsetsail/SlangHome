import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    let query = 'SELECT * FROM activities WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1
    
    if (locale) {
      query += ` AND locale = $${paramIndex}`
      params.push(locale)
      paramIndex++
    }
    
    if (status) {
      query += ` AND status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }
    
    query += ` ORDER BY 
      CASE status 
        WHEN 'ongoing' THEN 1 
        WHEN 'upcoming' THEN 2 
        WHEN 'ended' THEN 3 
      END,
      start_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const activities = await executeQuery(query, params)

    let countQuery = 'SELECT COUNT(*) as total FROM activities WHERE 1=1'
    const countParams: any[] = []
    let countParamIndex = 1
    
    if (locale) {
      countQuery += ` AND locale = $${countParamIndex}`
      countParams.push(locale)
      countParamIndex++
    }
    
    if (status) {
      countQuery += ` AND status = $${countParamIndex}`
      countParams.push(status)
      countParamIndex++
    }
    
    const countResult = await executeQuery(countQuery, countParams)
    const total = countResult[0]?.total || 0

    return NextResponse.json({
      success: true,
      data: {
        activities: activities || [],
        total: parseInt(total),
        hasMore: offset + limit < parseInt(total)
      }
    })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json({
      success: true,
      data: {
        activities: [],
        total: 0,
        hasMore: false
      }
    })
  }
}
