import { NextResponse } from 'next/server';
import { getWriteDb, releaseDb, smartInsert } from '@/lib/db-adapter'
import { cacheDelPattern, cacheDel, cacheKeys } from '@/lib/cache';
import { updateSlangHeatOnAction } from '@/lib/calculateHeat';

export async function POST(request) {
  let connection = null
  try {
    const { slangId, userId } = await request.json()

    if (!slangId) {
      return NextResponse.json({ error: 'Slang ID is required' }, { status: 400 })
    }

    connection = await getWriteDb()
    await connection.query('BEGIN')

    await connection.query(
      'UPDATE slang SET shares = shares + 1 WHERE id = $1',
      [slangId]
    )

    const result = await connection.query(
      'SELECT shares FROM slang WHERE id = $1',
      [slangId]
    )
    const newShares = result.rows.length > 0 ? result.rows[0].shares : 0

    if (userId) {
      try {
        await smartInsert('shares', { user_id: userId, slang_id: slangId })
      } catch (error) {
        console.error('Error recording share in shares table:', error)
      }
    }

    await connection.query('COMMIT')

    await updateSlangHeatOnAction(slangId, 'share')

    await cacheDel(cacheKeys.slang.detail(slangId))
    await cacheDelPattern('slang:list:*')

    return NextResponse.json({ shares: newShares, shared: true })
  } catch (error) {
    if (connection) {
      try {
        await connection.query('ROLLBACK')
      } catch (e) {
        console.error('Rollback failed:', e)
      }
    }
    console.error('Error incrementing share count:', error)
    return NextResponse.json({ error: 'Failed to increment share count' }, { status: 500 })
  } finally {
    if (connection) {
      await releaseDb(connection)
    }
  }
}
