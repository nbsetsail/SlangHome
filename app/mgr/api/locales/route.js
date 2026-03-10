import { NextResponse } from 'next/server'
import { getQuery, allQuery, executeQuery, smartInsert, smartUpdate } from '@/lib/db-adapter'
import { cacheDel, cacheDelPattern, cacheKeys } from '@/lib/cache'
import { clearActiveLocalesCache } from '@/i18n/config'
import { checkMgrAuth, unauthorizedResponse } from '../auth'

async function clearLocalesCache() {
  await cacheDel(cacheKeys.locale.active)
  await cacheDelPattern('locales:*')
  clearActiveLocalesCache()
}

export async function GET() {
  const authResult = await checkMgrAuth(['admin'])
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status)
  }

  try {
    const locales = await allQuery(`
      SELECT 
        l.code, l.name, l.native_name, l.bg_color, l.rtl, l.priority, l.is_default, l.status,
        (SELECT COUNT(*) FROM slang WHERE locale = l.code AND status = 'active') as slang_count,
        (SELECT COUNT(*) FROM categories WHERE locale = l.code) as category_count,
        (SELECT COUNT(*) FROM tags WHERE locale = l.code) as tag_count
      FROM locales l
      ORDER BY l.priority DESC
    `)
    
    return NextResponse.json({ locales })
  } catch (error) {
    console.error('Error fetching locales:', error)
    return NextResponse.json({ error: 'Failed to fetch locales' }, { status: 500 })
  }
}

export async function POST(request) {
  const authResult = await checkMgrAuth(['admin'])
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status)
  }

  try {
    const data = await request.json()
    const { code, name, native_name, bg_color, rtl, priority, is_default, status } = data
    
    if (!code || !name) {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 })
    }
    
    if (is_default) {
      await executeQuery('UPDATE locales SET is_default = false')
    }
    
    const existingLocale = await getQuery('SELECT code FROM locales WHERE code = $1', [code])
    
    if (existingLocale) {
      await smartUpdate('locales', {
        name,
        native_name: native_name || name,
        bg_color: bg_color || '#3B82F6',
        rtl: rtl || false,
        priority: priority || 0,
        is_default: is_default || false,
        status: status || 'inactive'
      }, 'code = $1', [code])
    } else {
      await smartInsert('locales', {
        code,
        name,
        native_name: native_name || name,
        bg_color: bg_color || '#3B82F6',
        rtl: rtl || false,
        priority: priority || 0,
        is_default: is_default || false,
        status: status || 'inactive'
      })
    }
    
    await clearLocalesCache()
    
    return NextResponse.json({ success: true, message: 'Locale saved successfully' })
  } catch (error) {
    console.error('Error saving locale:', error)
    return NextResponse.json({ error: 'Failed to save locale' }, { status: 500 })
  }
}

export async function PUT(request) {
  const authResult = await checkMgrAuth(['admin'])
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status)
  }

  try {
    const data = await request.json()
    const { code, name, native_name, bg_color, rtl, priority, is_default, status } = data
    
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }
    
    if (is_default) {
      await executeQuery('UPDATE locales SET is_default = false')
    }
    
    await executeQuery(`
      UPDATE locales 
      SET name = $1, native_name = $2, bg_color = $3, rtl = $4, priority = $5, is_default = $6, status = $7
      WHERE code = $8
    `, [name, native_name, bg_color, rtl || false, priority, is_default || false, status, code])
    
    await clearLocalesCache()
    
    return NextResponse.json({ success: true, message: 'Locale updated successfully' })
  } catch (error) {
    console.error('Error updating locale:', error)
    return NextResponse.json({ error: 'Failed to update locale' }, { status: 500 })
  }
}

export async function DELETE(request) {
  const authResult = await checkMgrAuth(['admin'])
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status)
  }

  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }
    
    const defaultLocale = await getQuery('SELECT code FROM locales WHERE is_default = true')
    if (defaultLocale?.code === code) {
      return NextResponse.json({ error: 'Cannot delete default locale' }, { status: 400 })
    }
    
    await executeQuery('DELETE FROM locales WHERE code = $1', [code])
    
    await clearLocalesCache()
    
    return NextResponse.json({ success: true, message: 'Locale deleted successfully' })
  } catch (error) {
    console.error('Error deleting locale:', error)
    return NextResponse.json({ error: 'Failed to delete locale' }, { status: 500 })
  }
}
