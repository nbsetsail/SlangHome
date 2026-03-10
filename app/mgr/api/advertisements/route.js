/**
 * Advertisement Management API
 * Admin access only
 */

import { NextResponse } from 'next/server'
import { getQuery, allQuery, runQuery, smartInsert, smartUpdate } from '@/lib/db-adapter'
import { checkMgrAuth, unauthorizedResponse } from '../auth'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  const authCheck = await checkMgrAuth(['admin']);
  if (!authCheck.authorized) {
    return unauthorizedResponse(authCheck.error, authCheck.status);
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const slotId = searchParams.get('slotId')
  const page = parseInt(searchParams.get('page')) || 1
  const limit = parseInt(searchParams.get('limit')) || 20
  const offset = (page - 1) * limit

  try {
    let whereClause = 'WHERE 1=1'
    const params = []
    let paramIndex = 1

    if (status) {
      whereClause += ` AND a.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    if (slotId) {
      whereClause += ` AND a.slot_id = $${paramIndex}`
      params.push(slotId)
      paramIndex++
    }

    const countResult = await getQuery(
      `SELECT COUNT(*) as count FROM advertisements a ${whereClause}`,
      params
    )

    const advertisements = await allQuery(
      `SELECT a.*, s.name as slot_name, s.position as slot_position
       FROM advertisements a
       LEFT JOIN advertisement_slots s ON a.slot_id = s.id
       ${whereClause}
       ORDER BY a.priority DESC, a.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    )

    return NextResponse.json({
      success: true,
      data: {
        advertisements,
        pagination: {
          page,
          limit,
          totalItems: countResult?.count || 0,
          totalPages: Math.ceil((countResult?.count || 0) / limit)
        }
      }
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
  const authCheck = await checkMgrAuth(['admin']);
  if (!authCheck.authorized) {
    return unauthorizedResponse(authCheck.error, authCheck.status);
  }

  try {
    const body = await request.json()
    const { title, content, imageUrl, linkUrl, slotId, status, startDate, endDate, priority } = body

    if (!title || !linkUrl) {
      return NextResponse.json(
        { success: false, error: 'Title and link URL are required' },
        { status: 400 }
      )
    }

    const result = await smartInsert('advertisements', {
      title,
      content: content || null,
      image_url: imageUrl || null,
      link_url: linkUrl,
      slot_id: slotId || null,
      status: status || 'active',
      start_date: startDate || null,
      end_date: endDate || null,
      priority: priority || 0,
      created_by: authCheck.user.id
    })

    return NextResponse.json({
      success: true,
      data: { id: result.insertId }
    })

  } catch (error) {
    console.error('Error creating advertisement:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create advertisement' },
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
    const { id, title, content, imageUrl, linkUrl, slotId, status, startDate, endDate, priority } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      )
    }

    await smartUpdate('advertisements', {
      title,
      content,
      image_url: imageUrl,
      link_url: linkUrl,
      slot_id: slotId,
      status,
      start_date: startDate,
      end_date: endDate,
      priority
    }, 'id = $1', [id])

    return NextResponse.json({
      success: true,
      data: { message: 'Advertisement updated successfully' }
    })

  } catch (error) {
    console.error('Error updating advertisement:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update advertisement' },
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

    await runQuery('DELETE FROM advertisement_targets WHERE advertisement_id = $1', [id])
    await runQuery('DELETE FROM advertisement_stats WHERE advertisement_id = $1', [id])
    await runQuery('DELETE FROM advertisements WHERE id = $1', [id])

    return NextResponse.json({
      success: true,
      data: { message: 'Advertisement deleted successfully' }
    })

  } catch (error) {
    console.error('Error deleting advertisement:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete advertisement' },
      { status: 500 }
    )
  }
}
