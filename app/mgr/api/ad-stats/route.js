/**
 * 广告统计 API
 * 管理员接口，用于获取广告统计数据
 * 支持按天(2周)、周(3个月)、月(1年)分组，并包含上期对比数据
 */

import { NextResponse } from 'next/server'
import { getQuery, allQuery } from '@/lib/db-adapter'
import { checkMgrAuth, unauthorizedResponse } from '../auth'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  const authCheck = await checkMgrAuth(['admin']);
  if (!authCheck.authorized) {
    return unauthorizedResponse(authCheck.error, authCheck.status);
  }

  const { searchParams } = new URL(request.url)
  const groupBy = searchParams.get('groupBy') || 'day'

  try {
    let days, currentStartDate, currentEndDate, previousStartDate, previousEndDate
    const now = new Date()
    currentEndDate = now.toISOString().split('T')[0]

    if (groupBy === 'day') {
      days = 14
      currentStartDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      previousEndDate = currentStartDate
      previousStartDate = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    } else if (groupBy === 'week') {
      days = 90
      currentStartDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      previousEndDate = currentStartDate
      previousStartDate = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    } else {
      days = 365
      currentStartDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      previousEndDate = currentStartDate
      previousStartDate = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }

    const currentRawStats = await allQuery(`
      SELECT
        date,
        SUM(views) as views,
        SUM(clicks) as clicks
      FROM advertisement_stats
      WHERE date >= $1 AND date <= $2
      GROUP BY date
      ORDER BY date ASC
    `, [currentStartDate, currentEndDate])

    const previousRawStats = await allQuery(`
      SELECT
        SUM(views) as totalViews,
        SUM(clicks) as totalClicks
      FROM advertisement_stats
      WHERE date >= $1 AND date <= $2
    `, [previousStartDate, previousEndDate])

    const previousPeriod = previousRawStats[0] || { totalViews: 0, totalClicks: 0 }

    let chartData = []

    if (groupBy === 'day') {
      chartData = currentRawStats.map(stat => ({
        label: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        views: stat.views,
        clicks: stat.clicks
      }))
    } else if (groupBy === 'week') {
      const weekMap = new Map()
      currentRawStats.forEach(stat => {
        const date = new Date(stat.date)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        const weekKey = weekStart.toISOString().split('T')[0]
        const weekLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

        if (!weekMap.has(weekKey)) {
          weekMap.set(weekKey, { label: `Week of ${weekLabel}`, views: 0, clicks: 0 })
        }
        const week = weekMap.get(weekKey)
        week.views += stat.views
        week.clicks += stat.clicks
      })
      chartData = Array.from(weekMap.values())
    } else {
      const monthMap = new Map()
      currentRawStats.forEach(stat => {
        const date = new Date(stat.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })

        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, { label: monthLabel, views: 0, clicks: 0 })
        }
        const month = monthMap.get(monthKey)
        month.views += stat.views
        month.clicks += stat.clicks
      })
      chartData = Array.from(monthMap.values())
    }

    const summaries = await allQuery(`
      SELECT
        a.id,
        a.title,
        COALESCE(SUM(s.views), 0) as totalViews,
        COALESCE(SUM(s.clicks), 0) as totalClicks,
        CASE
          WHEN COALESCE(SUM(s.views), 0) > 0
          THEN ROUND(CAST(COALESCE(SUM(s.clicks), 0) AS FLOAT) / COALESCE(SUM(s.views), 0) * 100, 2)
          ELSE 0
        END as ctr
      FROM advertisements a
      LEFT JOIN advertisement_stats s ON a.id = s.advertisement_id
        AND s.date >= $1 AND s.date <= $2
      GROUP BY a.id, a.title
      ORDER BY totalViews DESC
    `, [currentStartDate, currentEndDate])

    const currentTotal = {
      views: currentRawStats.reduce((sum, stat) => sum + stat.views, 0),
      clicks: currentRawStats.reduce((sum, stat) => sum + stat.clicks, 0)
    }

    const comparison = {
      views: {
        current: currentTotal.views,
        previous: previousPeriod.totalViews || 0,
        change: previousPeriod.totalViews ? ((currentTotal.views - previousPeriod.totalViews) / previousPeriod.totalViews * 100).toFixed(2) : '0.00'
      },
      clicks: {
        current: currentTotal.clicks,
        previous: previousPeriod.totalClicks || 0,
        change: previousPeriod.totalClicks ? ((currentTotal.clicks - previousPeriod.totalClicks) / previousPeriod.totalClicks * 100).toFixed(2) : '0.00'
      }
    }

    return NextResponse.json({
      success: true,
      data: { chartData, summaries, groupBy, comparison }
    })

  } catch (error) {
    console.error('Error fetching ad stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ad stats' },
      { status: 500 }
    )
  }
}
