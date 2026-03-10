import { NextResponse } from 'next/server';
import { allQuery, withWriteDb, smartUpdate } from '@/lib/db-adapter'
import { checkMgrAuth, unauthorizedResponse } from '../auth';
import { getAllCachedConfigs, loadAllConfigsFromDB, getConfig } from '@/lib/system-config';
import { reloadConfigCache as reloadCacheConfig } from '@/lib/cache';
import { reloadConfigCache as reloadNotificationConfig } from '@/lib/notification-queue';
import { reloadConfigCache as reloadHeatConfig } from '@/lib/calculateHeat';
import { getCacheStatus } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const authCheck = await checkMgrAuth(['admin']);
    if (!authCheck.authorized) {
      return unauthorizedResponse(authCheck.error, authCheck.status);
    }

    const url = new URL(request.url);
    const all = url.searchParams.get('all');

    if (all === 'true') {
      const [configs, cacheStatus, oauthConfig, notificationConfig, reportConfig] = await Promise.all([
        allQuery('SELECT id, item as key, value, description FROM config ORDER BY item'),
        getCacheStatus().catch(() => null),
        getConfig('oauth_config').catch(() => null),
        getConfig('notification_config').catch(() => null),
        getConfig('report_config').catch(() => null)
      ]);

      return NextResponse.json({
        success: true,
        data: {
          configs,
          cacheStatus,
          oauthConfig,
          notificationConfig,
          reportConfig
        }
      });
    }

    const configs = await allQuery('SELECT id, item as key, value, description FROM config ORDER BY item')

    return NextResponse.json({
      success: true,
      data: configs
    })
  } catch (error) {
    console.error('Error fetching configs:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch configs',
      message: error.message
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const authCheck = await checkMgrAuth(['admin']);
    if (!authCheck.authorized) {
      return unauthorizedResponse(authCheck.error, authCheck.status);
    }

    const body = await request.json()
    const { configs } = body

    if (!Array.isArray(configs)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid config data format'
      }, { status: 400 })
    }

    for (const config of configs) {
      if (config.key && config.value !== undefined) {
        await smartUpdate('config', 
          { value: config.value }, 
          'item = $1', 
          [config.key]
        )
      }
    }

    await loadAllConfigsFromDB()
    
    await Promise.all([
      reloadCacheConfig(),
      reloadNotificationConfig(),
      reloadHeatConfig()
    ])

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully'
    })
  } catch (error) {
    console.error('Error saving configs:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to save configs',
      message: error.message
    }, { status: 500 })
  }
}
