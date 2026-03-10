import { NextResponse } from 'next/server';
import { checkMgrAuth, unauthorizedResponse } from '../../auth';
import { getConfig, setConfig, configKeys } from '@/lib/system-config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const authCheck = await checkMgrAuth(['admin']);
    if (!authCheck.authorized) {
      return unauthorizedResponse(authCheck.error, authCheck.status);
    }

    const dbConfig = await getConfig(configKeys.oauth) || {
      google: { enabled: false },
      github: { enabled: true },
      apple: { enabled: false },
      twitter: { enabled: false }
    };

    const config = {
      google: {
        enabled: dbConfig.google?.enabled ?? false,
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ? '******' : ''
      },
      github: {
        enabled: dbConfig.github?.enabled ?? true,
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET ? '******' : ''
      },
      apple: {
        enabled: dbConfig.apple?.enabled ?? false,
        clientId: process.env.APPLE_ID || '',
        clientSecret: process.env.APPLE_PRIVATE_KEY_PATH ? '******' : ''
      },
      twitter: {
        enabled: dbConfig.twitter?.enabled ?? false,
        clientId: process.env.TWITTER_CLIENT_ID || '',
        clientSecret: process.env.TWITTER_CLIENT_SECRET ? '******' : ''
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        config,
        defaultConfig: {
          google: { enabled: false },
          github: { enabled: true },
          apple: { enabled: false },
          twitter: { enabled: false }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching OAuth config:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch OAuth config',
      message: error.message
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const authCheck = await checkMgrAuth(['admin']);
    if (!authCheck.authorized) {
      return unauthorizedResponse(authCheck.error, authCheck.status);
    }

    const body = await request.json();
    const { config } = body;

    if (!config || typeof config !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Invalid config data format'
      }, { status: 400 });
    }

    for (const [provider, providerConfig] of Object.entries(config)) {
      if (typeof providerConfig === 'object' && providerConfig !== null) {
        if (typeof providerConfig.enabled !== 'boolean') {
          return NextResponse.json({
            success: false,
            error: `Invalid enabled value for provider: ${provider}`
          }, { status: 400 });
        }
      }
    }

    const success = await setConfig(configKeys.oauth, config);

    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to save OAuth config to database'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'OAuth configuration updated successfully',
      data: { config }
    });
  } catch (error) {
    console.error('Error saving OAuth config:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save OAuth config',
      message: error.message
    }, { status: 500 });
  }
}
