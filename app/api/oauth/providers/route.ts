import { NextResponse } from 'next/server'
import { getEnabledOAuthProviders } from '@/lib/oauth-config'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const providers = await getEnabledOAuthProviders()
    
    return NextResponse.json({
      success: true,
      providers
    })
  } catch (error) {
    console.error('Error getting OAuth providers:', error)
    return NextResponse.json({
      success: true,
      providers: []
    })
  }
}
