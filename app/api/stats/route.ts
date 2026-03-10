import { NextRequest, NextResponse } from 'next/server'
import { getQuery } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const slangCountResult = await getQuery('SELECT COUNT(*) as count FROM slang WHERE status = $1', ['approved'])
    const slangCount = (slangCountResult as any)?.count || 0

    const userCountResult = await getQuery('SELECT COUNT(*) as count FROM users WHERE status = $1', ['active'])
    const userCount = (userCountResult as any)?.count || 0

    const languageCountResult = await getQuery('SELECT COUNT(DISTINCT locale) as count FROM slang WHERE status = $1', ['approved'])
    const languageCount = (languageCountResult as any)?.count || 20

    return NextResponse.json({
      success: true,
      data: {
        slangCount,
        userCount,
        languageCount
      }
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({
      success: true,
      data: {
        slangCount: 0,
        userCount: 0,
        languageCount: 20
      }
    })
  }
}
