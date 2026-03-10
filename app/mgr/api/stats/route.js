import { NextResponse } from 'next/server';
import { getQuery, allQuery } from '@/lib/db-adapter'
import { checkMgrAuth, unauthorizedResponse, getLocaleFilter } from '../auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  const authResult = await checkMgrAuth();
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status);
  }

  try {
    const { searchParams } = new URL(request.url)
    const timeDimension = searchParams.get('timeDimension') || 'month'
    const locale = searchParams.get('locale')

    const localeFilter = getLocaleFilter(authResult)
    
    let localeCondition = ''
    let localeParams = []
    
    if (locale) {
      localeCondition = ' AND locale = $1'
      localeParams = [locale]
    } else if (localeFilter) {
      const placeholders = localeFilter.map((_, i) => `$${i + 1}`).join(', ')
      localeCondition = ` AND locale IN (${placeholders})`
      localeParams = localeFilter
    }

    const totalUsers = await getQuery('SELECT COUNT(*) as count FROM users')
    
    let totalSlangQuery = 'SELECT COUNT(*) as count FROM slang WHERE 1=1' + localeCondition
    const totalSlang = await getQuery(totalSlangQuery, localeParams)
    
    let totalCommentsQuery = `
      SELECT COUNT(*) as count FROM comments c
      JOIN slang s ON c.slang_id = s.id
      WHERE 1=1
    `
    let totalCommentsParams = []
    if (locale) {
      totalCommentsQuery += ' AND s.locale = $1'
      totalCommentsParams = [locale]
    } else if (localeFilter) {
      const placeholders = localeFilter.map((_, i) => `$${i + 1}`).join(', ')
      totalCommentsQuery += ` AND s.locale IN (${placeholders})`
      totalCommentsParams = localeFilter
    }
    const totalComments = await getQuery(totalCommentsQuery, totalCommentsParams)
    
    let pendingSlangQuery = "SELECT COUNT(*) as count FROM slang WHERE status = 'pending'" + localeCondition
    const pendingSlang = await getQuery(pendingSlangQuery, localeParams)

    const loginLogs = await getQuery('SELECT COUNT(*) as count FROM login_logs')
    const accessLogs = await getQuery('SELECT COUNT(*) as count FROM access_logs')
    const actionLogs = await getQuery('SELECT COUNT(*) as count FROM action_logs')
    const systemLogs = await getQuery('SELECT COUNT(*) as count FROM system_logs')
    const totalLogs = {
      count: (loginLogs.count || 0) + (accessLogs.count || 0) + (actionLogs.count || 0) + (systemLogs.count || 0)
    }

    const growthRates = await calculateGrowthRates(timeDimension, locale, localeFilter)

    const growthCount = {
      users: Math.round((totalUsers.count || 0) * (growthRates.users / 100)),
      slang: Math.round((totalSlang.count || 0) * (growthRates.slang / 100)),
      comments: Math.round((totalComments.count || 0) * (growthRates.comments / 100)),
      logs: Math.round((totalLogs.count || 0) * (growthRates.logs / 100))
    }

    const recentActivities = await getRecentActivities(locale, localeFilter)

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalUsers: totalUsers.count || 0,
          totalSlang: totalSlang.count || 0,
          totalComments: totalComments.count || 0,
          totalLogs: totalLogs.count || 0,
          pendingSlang: pendingSlang.count || 0
        },
        growth: growthRates,
        growthCount: growthCount,
        recentActivities: recentActivities,
        managedLocales: authResult.managedLocales,
        filteredLocale: locale
      }
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch stats',
      message: error.message
    }, { status: 500 })
  }
}

async function calculateGrowthRates(timeDimension, locale, localeFilter) {
  try {
    const now = new Date()
    let previousPeriodStart

    switch (timeDimension) {
      case 'day':
        previousPeriodStart = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
        break
      case 'week':
        previousPeriodStart = new Date(now.getTime() - 2 * 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        previousPeriodStart = new Date(now.getTime() - 2 * 30 * 24 * 60 * 60 * 1000)
        break
      case 'quarter':
        previousPeriodStart = new Date(now.getTime() - 2 * 90 * 24 * 60 * 60 * 1000)
        break
      case 'halfyear':
        previousPeriodStart = new Date(now.getTime() - 2 * 180 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        previousPeriodStart = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000)
        break
      default:
        previousPeriodStart = new Date(now.getTime() - 2 * 30 * 24 * 60 * 60 * 1000)
    }

    const periodStart = new Date(now.getTime() - getTimeDimensionMs(timeDimension))

    const currentPeriodCounts = await getPeriodCounts(periodStart, now, locale, localeFilter)
    const previousPeriodCounts = await getPeriodCounts(previousPeriodStart, periodStart, locale, localeFilter)

    const calculateGrowthRate = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    return {
      users: calculateGrowthRate(currentPeriodCounts.users, previousPeriodCounts.users),
      slang: calculateGrowthRate(currentPeriodCounts.slang, previousPeriodCounts.slang),
      comments: calculateGrowthRate(currentPeriodCounts.comments, previousPeriodCounts.comments),
      logs: calculateGrowthRate(currentPeriodCounts.logs, previousPeriodCounts.logs)
    }
  } catch (error) {
    console.error('Error calculating growth rates:', error)
    return {
      users: 12,
      slang: 8,
      comments: 15,
      logs: 20
    }
  }
}

function getTimeDimensionMs(timeDimension) {
  switch (timeDimension) {
    case 'day': return 24 * 60 * 60 * 1000
    case 'week': return 7 * 24 * 60 * 60 * 1000
    case 'month': return 30 * 24 * 60 * 60 * 1000
    case 'quarter': return 90 * 24 * 60 * 60 * 1000
    case 'halfyear': return 180 * 24 * 60 * 60 * 1000
    case 'year': return 365 * 24 * 60 * 60 * 1000
    default: return 30 * 24 * 60 * 60 * 1000
  }
}

async function getPeriodCounts(startDate, endDate, locale, localeFilter) {
  const users = await getQuery('SELECT COUNT(*) as count FROM users WHERE created_at >= $1 AND created_at <= $2', [startDate, endDate])
  
  let slangQuery = 'SELECT COUNT(*) as count FROM slang WHERE created_at >= $1 AND created_at <= $2'
  let slangParams = [startDate, endDate]
  if (locale) {
    slangQuery += ' AND locale = $3'
    slangParams.push(locale)
  } else if (localeFilter) {
    const placeholders = localeFilter.map((_, i) => `$${i + 3}`).join(', ')
    slangQuery += ` AND locale IN (${placeholders})`
    slangParams.push(...localeFilter)
  }
  const slang = await getQuery(slangQuery, slangParams)

  let commentsQuery = `
    SELECT COUNT(*) as count FROM comments c
    JOIN slang s ON c.slang_id = s.id
    WHERE c.created_at >= $1 AND c.created_at <= $2
  `
  let commentsParams = [startDate, endDate]
  if (locale) {
    commentsQuery += ' AND s.locale = $3'
    commentsParams.push(locale)
  } else if (localeFilter) {
    const placeholders = localeFilter.map((_, i) => `$${i + 3}`).join(', ')
    commentsQuery += ` AND s.locale IN (${placeholders})`
    commentsParams.push(...localeFilter)
  }
  const comments = await getQuery(commentsQuery, commentsParams)

  const loginLogs = await getQuery('SELECT COUNT(*) as count FROM login_logs WHERE timestamp >= $1 AND timestamp <= $2', [startDate, endDate])
  const accessLogs = await getQuery('SELECT COUNT(*) as count FROM access_logs WHERE timestamp >= $1 AND timestamp <= $2', [startDate, endDate])
  const actionLogs = await getQuery('SELECT COUNT(*) as count FROM action_logs WHERE timestamp >= $1 AND timestamp <= $2', [startDate, endDate])
  const systemLogs = await getQuery('SELECT COUNT(*) as count FROM system_logs WHERE timestamp >= $1 AND timestamp <= $2', [startDate, endDate])

  return {
    users: users.count || 0,
    slang: slang.count || 0,
    comments: comments.count || 0,
    logs: (loginLogs.count || 0) + (accessLogs.count || 0) + (actionLogs.count || 0) + (systemLogs.count || 0)
  }
}

async function getRecentActivities(locale, localeFilter) {
  try {
    const recentUsers = await allQuery('SELECT id, username, created_at FROM users ORDER BY created_at DESC LIMIT 3')

    let recentSlangQuery = 'SELECT id, phrase, created_at FROM slang WHERE 1=1'
    let recentSlangParams = []
    if (locale) {
      recentSlangQuery += ' AND locale = $1'
      recentSlangParams.push(locale)
    } else if (localeFilter) {
      const placeholders = localeFilter.map((_, i) => `$${i + 1}`).join(', ')
      recentSlangQuery += ` AND locale IN (${placeholders})`
      recentSlangParams = localeFilter
    }
    recentSlangQuery += ' ORDER BY created_at DESC LIMIT 3'
    const recentSlang = await allQuery(recentSlangQuery, recentSlangParams)

    let recentCommentsQuery = `
      SELECT c.id, c.content, c.created_at, u.username, s.locale
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      JOIN slang s ON c.slang_id = s.id
      WHERE 1=1
    `
    let recentCommentsParams = []
    if (locale) {
      recentCommentsQuery += ' AND s.locale = $1'
      recentCommentsParams.push(locale)
    } else if (localeFilter) {
      const placeholders = localeFilter.map((_, i) => `$${i + 1}`).join(', ')
      recentCommentsQuery += ` AND s.locale IN (${placeholders})`
      recentCommentsParams = localeFilter
    }
    recentCommentsQuery += ' ORDER BY c.created_at DESC LIMIT 3'
    const recentComments = await allQuery(recentCommentsQuery, recentCommentsParams)

    const recentLogins = await allQuery('SELECT id, username, action, status, timestamp FROM login_logs ORDER BY timestamp DESC LIMIT 3')

    const activities = []

    recentUsers.forEach(user => {
      activities.push({
        type: 'user_register',
        user: user.username,
        timestamp: user.created_at,
        details: `User ${user.username} registered`
      })
    })

    recentSlang.forEach(item => {
      activities.push({
        type: 'slang_added',
        user: 'system',
        timestamp: item.created_at,
        details: `New slang added: "${item.phrase}"`
      })
    })

    recentComments.forEach(comment => {
      activities.push({
        type: 'comment_added',
        user: comment.username || 'anonymous',
        timestamp: comment.created_at,
        details: `Comment added by ${comment.username || 'anonymous'}`
      })
    })

    recentLogins.forEach(login => {
      activities.push({
        type: 'login_attempt',
        user: login.username || 'unknown',
        timestamp: login.timestamp,
        details: `${login.action} for user ${login.username || 'unknown'} (${login.status})`
      })
    })

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return activities.slice(0, 8)
  } catch (error) {
    console.error('Error getting recent activities:', error)
    return []
  }
}
