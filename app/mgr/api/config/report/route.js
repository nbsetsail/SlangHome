import { NextResponse } from 'next/server'
import { getReadDb, getWriteDb, releaseDb } from '@/lib/db-adapter'
import { cacheDel } from '@/lib/cache'
import { getConfig, setConfig, configKeys, defaultConfigs } from '@/lib/system-config'
import { checkMgrAuth, unauthorizedResponse } from '../../auth'

export async function GET() {
  const authResult = await checkMgrAuth(['admin']);
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status);
  }

  try {
    const config = await getConfig(configKeys.report)
    
    return NextResponse.json({ 
      success: true, 
      data: { config: config || defaultConfigs[configKeys.report] } 
    })
  } catch (error) {
    console.error('Error fetching report config:', error)
    return NextResponse.json({ error: 'Failed to fetch report config' }, { status: 500 })
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

    if (!config) {
      return NextResponse.json({ error: 'Invalid config' }, { status: 400 })
    }

    if (config.operationReport) {
      if (typeof config.operationReport.enabled !== 'boolean') {
        return NextResponse.json({ error: 'operationReport.enabled must be boolean' }, { status: 400 })
      }
      if (config.operationReport.defaultPeriod && !['monthly', 'quarterly', 'semiannual', 'annual'].includes(config.operationReport.defaultPeriod)) {
        return NextResponse.json({ error: 'Invalid operationReport.defaultPeriod' }, { status: 400 })
      }
    }

    if (config.annualSummary) {
      if (typeof config.annualSummary.enabled !== 'boolean') {
        return NextResponse.json({ error: 'annualSummary.enabled must be boolean' }, { status: 400 })
      }
      if (config.annualSummary.year && (typeof config.annualSummary.year !== 'number' || config.annualSummary.year < 2000 || config.annualSummary.year > new Date().getFullYear())) {
        return NextResponse.json({ error: 'Invalid annualSummary.year' }, { status: 400 })
      }
    }

    const success = await setConfig(configKeys.report, config)
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to save config' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving report config:', error)
    return NextResponse.json({ error: 'Failed to save report config' }, { status: 500 })
  }
}
