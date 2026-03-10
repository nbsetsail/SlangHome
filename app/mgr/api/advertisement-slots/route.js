/**
 * Advertisement Slot Management API
 * Admin access only
 */

import { NextResponse } from 'next/server'
import { getQuery, allQuery, runQuery, smartInsert } from '@/lib/db-adapter'
import { checkMgrAuth, unauthorizedResponse } from '../auth'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  const authCheck = await checkMgrAuth(['admin']);
  if (!authCheck.authorized) {
    return unauthorizedResponse(authCheck.error, authCheck.status);
  }

  const { searchParams } = new URL(request.url)
  const isActive = searchParams.get('isActive')
  const page = parseInt(searchParams.get('page')) || 1
  const limit = parseInt(searchParams.get('limit')) || 20
  const offset = (page - 1) * limit

  try {
    let whereClause = ''
    const params = []

    if (isActive !== null && isActive !== undefined) {
      whereClause = 'WHERE is_active = $1'
      params.push(isActive === 'true' ? 1 : 0)
    }

    const countResult = await getQuery(
      `SELECT COUNT(*) as count FROM advertisement_slots ${whereClause}`,
      params
    )

    const slots = await allQuery(
      `SELECT * FROM advertisement_slots ${whereClause} ORDER BY priority DESC, id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    )

    return NextResponse.json({
      success: true,
      data: {
        slots,
        pagination: {
          page,
          limit,
          totalItems: countResult?.count || 0,
          totalPages: Math.ceil((countResult?.count || 0) / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error fetching advertisement slots:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch advertisement slots' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  const authCheck = await checkMgrAuth(['admin']);
  if (!authCheck.authorized) {
    return unauthorizedResponse(authCheck.error, authCheck.status);
  }

  try {
    const body = await request.json()
    const { name, position, size, width, height, priority, isActive } = body

    if (!name || !position) {
      return NextResponse.json(
        { success: false, error: 'Name and position are required' },
        { status: 400 }
      )
    }

    const result = await smartInsert('advertisement_slots', {
      name,
      position,
      size: size || null,
      width: width || null,
      height: height || null,
      priority: priority || 1,
      is_active: isActive ? 1 : 1
    })

    return NextResponse.json({
      success: true,
      data: { id: result.insertId }
    })

  } catch (error) {
    console.error('Error creating advertisement slot:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create advertisement slot' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  const authCheck = await checkMgrAuth(['admin']);
  if (!authCheck.authorized) {
    return unauthorizedResponse(authCheck.error, authCheck.status);
  }

  try {
    const body = await request.json()
    const { id, name, position, size, width, height, priority, isActive } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      )
    }

    await runQuery(`
      UPDATE advertisement_slots
      SET name = $1, position = $2, size = $3, width = $4, height = $5, priority = $6, is_active = $7
      WHERE id = $8
    `, [name, position, size, width, height, priority, isActive ? 1 : 0, id])

    return NextResponse.json({
      success: true,
      data: { message: 'Advertisement slot updated successfully' }
    })

  } catch (error) {
    console.error('Error updating advertisement slot:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update advertisement slot' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  const authCheck = await checkMgrAuth(['admin']);
  if (!authCheck.authorized) {
    return unauthorizedResponse(authCheck.error, authCheck.status);
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      )
    }

    const adsCount = await getQuery(
      'SELECT COUNT(*) as count FROM advertisements WHERE slot_id = $1',
      [id]
    )

    if (adsCount?.count > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete slot with existing advertisements' },
        { status: 400 }
      )
    }

    await runQuery('DELETE FROM advertisement_slots WHERE id = $1', [id])

    return NextResponse.json({
      success: true,
      data: { message: 'Advertisement slot deleted successfully' }
    })

  } catch (error) {
    console.error('Error deleting advertisement slot:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete advertisement slot' },
      { status: 500 }
    )
  }
}
