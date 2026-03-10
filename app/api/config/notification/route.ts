import { NextRequest, NextResponse } from 'next/server'
import { getConfig } from '@/lib/system-config'

/**
 * 获取通知配置（公开接口）
 * 供前端客户端获取通知轮询间隔
 */
export async function GET(request: NextRequest) {
  try {
    const config = await getConfig('notification_config')
    
    return NextResponse.json({
      success: true,
      data: {
        config: {
          pollIntervalMs: config?.pollIntervalMs || 300000
        }
      }
    })
  } catch (error) {
    console.error('Error fetching notification config:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch notification config'
    }, { status: 500 })
  }
}
