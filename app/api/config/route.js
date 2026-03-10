import { getReadDb, getWriteDb, releaseDb, smartUpdate } from '@/lib/db-adapter'
import { cacheGet, cacheSet, cacheDel, cacheKeys, cacheTTLs } from '@/lib/cache'

export async function GET(request) {
  let connection = null
  try {
    const cacheKey = cacheKeys.config.all
    const cachedConfigs = await cacheGet(cacheKey)
    if (cachedConfigs) {
      return new Response(JSON.stringify({ configs: cachedConfigs }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    connection = await getReadDb()
    
    const result = await connection.query('SELECT id, item, value FROM config ORDER BY item')
    
    await cacheSet(cacheKey, result.rows, cacheTTLs.static())
    
    return new Response(JSON.stringify({ configs: result.rows }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error fetching configs:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch configs',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  } finally {
    if (connection) {
      await releaseDb(connection)
    }
  }
}

export async function POST(request) {
  let connection = null
  try {
    connection = await getWriteDb()
    
    const body = await request.json()
    const { configs } = body
    
    if (!Array.isArray(configs)) {
      return new Response(JSON.stringify({ error: 'Invalid config data format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    for (const config of configs) {
      if (config.id && config.value !== undefined) {
        await smartUpdate('config', { value: config.value }, 'id = $1', [config.id])
      }
    }
    
    await cacheDel(cacheKeys.config.all)
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error saving configs:', error)
    return new Response(JSON.stringify({ error: 'Failed to save configs' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  } finally {
    if (connection) {
      await releaseDb(connection)
    }
  }
}
