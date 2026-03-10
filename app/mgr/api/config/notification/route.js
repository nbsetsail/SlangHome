import { NextResponse } from 'next/server'
import { getConfig, setConfig, configKeys, defaultConfigs } from '@/lib/system-config'
import { reloadConfigCache } from '@/lib/notification-queue'
import { checkMgrAuth, unauthorizedResponse } from '../../auth'

export async function GET() {
  const authResult = await checkMgrAuth(['admin']);
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status);
  }

  try {
    const config = await getConfig(configKeys.notification)
    
    return NextResponse.json({ success: true, data: { config: config || defaultConfigs[configKeys.notification] } })
  } catch (error) {
    console.error('Error fetching notification config:', error)
    return NextResponse.json({ error: 'Failed to fetch notification config' }, { status: 500 })
  }
}

export async function PUT(request) {
  const authResult = await checkMgrAuth(['admin']);
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status);
  }

  try {
    const body = await request.json()
    const { config } = body

    if (!config || typeof config.pollIntervalMs !== 'number') {
      return NextResponse.json({ error: 'Invalid config' }, { status: 400 })
    }

    const success = await setConfig(configKeys.notification, config)
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to save config' }, { status: 500 })
    }

    await reloadConfigCache()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving notification config:', error)
    return NextResponse.json({ error: 'Failed to save notification config' }, { status: 500 })
  }
}
