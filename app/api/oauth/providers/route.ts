import { NextResponse } from 'next/server'
import { getEnabledOAuthProviders } from '@/lib/oauth-config'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    console.log('[OAuth Providers] Fetching enabled providers...')
    const providers = await getEnabledOAuthProviders()
    console.log('[OAuth Providers] Enabled providers:', providers)
    
    return NextResponse.json({
      success: true,
      providers
    })
  } catch (error) {
    console.error('[OAuth Providers] Error:', error)
    console.error('[OAuth Providers] Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      providers: []
    }, { status: 500 })
  }
}
