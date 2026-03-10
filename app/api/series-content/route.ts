import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db'
import { getUTCTimestamp } from '@/lib/date-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const seriesType = searchParams.get('series_type')
    const locale = searchParams.get('locale')
    const contentId = searchParams.get('id')
    
    if (contentId) {
      const content = await executeQuery(
        `SELECT sc.*, s.type as series_type, s.title as series_title
         FROM series_content sc
         JOIN series s ON sc.series_type = s.type AND sc.locale = s.locale
         WHERE sc.id = $1`,
        [parseInt(contentId)]
      )
      
      return NextResponse.json({
        success: true,
        data: {
          content: content[0] || null
        }
      })
    }
    
    let query = `SELECT sc.*, s.type as series_type, s.title as series_title
                 FROM series_content sc
                 JOIN series s ON sc.series_type = s.type AND sc.locale = s.locale
                 WHERE 1=1`
    const params: any[] = []
    let paramIndex = 1
    
    if (seriesType) {
      query += ` AND sc.series_type = $${paramIndex}`
      params.push(seriesType)
      paramIndex++
    }
    
    if (locale) {
      query += ` AND sc.locale = $${paramIndex}`
      params.push(locale)
      paramIndex++
    }
    
    query += ` ORDER BY sc.priority ASC, sc.published_at DESC`

    const contents = await executeQuery(query, params)

    return NextResponse.json({
      success: true,
      data: {
        contents: contents || []
      }
    })
  } catch (error) {
    console.error('Error fetching series content:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch series content'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      series_type, locale, title, description, cover_image, 
      price, currency, gumroad_url, amazon_url, content, priority, published_at 
    } = body
    
    if (!series_type || !title) {
      return NextResponse.json({
        success: false,
        error: 'series_type and title are required'
      }, { status: 400 })
    }
    
    const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0
    const now = getUTCTimestamp()
    
    const result = await executeQuery(
      `INSERT INTO series_content (series_type, locale, title, description, cover_image, price, currency, gumroad_url, amazon_url, content, word_count, priority, published_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [series_type, locale || 'en', title, description, cover_image, price || 0, currency || 'USD', gumroad_url, amazon_url, content, wordCount, priority || 0, published_at, now, now]
    )

    return NextResponse.json({
      success: true,
      data: {
        content: result[0]
      }
    })
  } catch (error) {
    console.error('Error creating series content:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create series content'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, description, cover_image, price, currency, gumroad_url, amazon_url, content, priority, published_at } = body
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'id is required'
      }, { status: 400 })
    }
    
    const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0
    const now = getUTCTimestamp()
    
    const result = await executeQuery(
      `UPDATE series_content 
       SET title = COALESCE($1, title), 
           description = COALESCE($2, description), 
           cover_image = COALESCE($3, cover_image),
           price = COALESCE($4, price),
           currency = COALESCE($5, currency),
           gumroad_url = COALESCE($6, gumroad_url),
           amazon_url = COALESCE($7, amazon_url),
           content = COALESCE($8, content),
           word_count = $9,
           priority = COALESCE($10, priority),
           published_at = COALESCE($11, published_at),
           updated_at = $12
       WHERE id = $13
       RETURNING *`,
      [title, description, cover_image, price, currency, gumroad_url, amazon_url, content, wordCount, priority, published_at, now, id]
    )

    return NextResponse.json({
      success: true,
      data: {
        content: result[0]
      }
    })
  } catch (error) {
    console.error('Error updating series content:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update series content'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'id is required'
      }, { status: 400 })
    }
    
    await executeQuery('DELETE FROM series_content WHERE id = $1', [parseInt(id)])

    return NextResponse.json({
      success: true,
      message: 'Content deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting series content:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete series content'
    }, { status: 500 })
  }
}
