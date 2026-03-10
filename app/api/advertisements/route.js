import { NextResponse } from 'next/server'
import { allQuery, sql } from '@/lib/db-adapter'
import { cacheGet, cacheSet, cacheKeys, cacheTTLs } from '@/lib/cache'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const position = searchParams.get('position')

  try {
    const cacheKey = cacheKeys.ads.position(position)
    const cachedAds = await cacheGet(cacheKey)
    if (cachedAds) {
      return NextResponse.json({
        success: true,
        data: { advertisements: cachedAds, position }
      })
    }

    let query = `
      SELECT a.*, s.position as slot_position
      FROM advertisements a
      LEFT JOIN advertisement_slots s ON a.slot_id = s.id
      WHERE a.status = 'active'
      AND (s.is_active = true OR a.slot_id IS NULL)
    `
    const params = []
    let paramIndex = 1

    if (position) {
      query += ` AND (s.position = $${paramIndex++} OR (s.position IS NULL AND a.slot_id IS NULL))`
      params.push(position)
    }

    query += ` AND (a.start_date IS NULL OR a.start_date <= CURRENT_DATE)`
    query += ` AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)`
    query += ` ORDER BY a.priority DESC, RANDOM()`

    const advertisements = await allQuery(query, params)

    await cacheSet(cacheKey, advertisements, cacheTTLs.hot())

    return NextResponse.json({
      success: true,
      data: { advertisements, position }
    })

  } catch (error) {
    console.error('Error fetching advertisements:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch advertisements' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    if (action === 'click') {
      const { advertisementId } = await request.json()

      if (!advertisementId) {
        return NextResponse.json(
          { success: false, error: 'Advertisement ID is required' },
          { status: 400 }
        )
      }

      const client = await sql.connect()
      
      try {
        await client.query('BEGIN')

        await client.query(
          'UPDATE advertisements SET clicks = clicks + 1 WHERE id = $1',
          [advertisementId]
        )

        const today = new Date().toISOString().split('T')[0]
        const existingStats = await client.query(
          'SELECT * FROM advertisement_stats WHERE advertisement_id = $1 AND date = $2',
          [advertisementId, today]
        )

        if (existingStats.rows.length > 0) {
          await client.query(
            'UPDATE advertisement_stats SET clicks = clicks + 1 WHERE advertisement_id = $1 AND date = $2',
            [advertisementId, today]
          )
        } else {
          await client.query(
            'INSERT INTO advertisement_stats (advertisement_id, date, views, clicks) VALUES ($1, $2, 0, 1)',
            [advertisementId, today]
          )
        }

        await client.query('COMMIT')

        return NextResponse.json({
          success: true,
          data: { message: 'Click recorded' }
        })
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
    }

    if (action === 'view') {
      const { advertisementId } = await request.json()

      if (!advertisementId) {
        return NextResponse.json(
          { success: false, error: 'Advertisement ID is required' },
          { status: 400 }
        )
      }

      const client = await sql.connect()
      
      try {
        await client.query('BEGIN')

        await client.query(
          'UPDATE advertisements SET views = views + 1 WHERE id = $1',
          [advertisementId]
        )

        const today = new Date().toISOString().split('T')[0]
        const existingStats = await client.query(
          'SELECT * FROM advertisement_stats WHERE advertisement_id = $1 AND date = $2',
          [advertisementId, today]
        )

        if (existingStats.rows.length > 0) {
          await client.query(
            'UPDATE advertisement_stats SET views = views + 1 WHERE advertisement_id = $1 AND date = $2',
            [advertisementId, today]
          )
        } else {
          await client.query(
            'INSERT INTO advertisement_stats (advertisement_id, date, views, clicks) VALUES ($1, $2, 1, 0)',
            [advertisementId, today]
          )
        }

        await client.query('COMMIT')

        return NextResponse.json({
          success: true,
          data: { message: 'View recorded' }
        })
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error recording advertisement action:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record action' },
      { status: 500 }
    )
  }
}
