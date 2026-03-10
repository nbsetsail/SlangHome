'use client'
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { LoadingIndicator, ErrorMessage } from '@/components/ui'
import SimpleChart from '@/components/SimpleChart'

interface ChartData {
  label: string
  views: number
  clicks: number
}

interface AdSummary {
  id: number
  title: string
  totalViews: number
  totalClicks: number
  ctr: number
}

interface ComparisonData {
  views: {
    current: number
    previous: number
    change: string
  }
  clicks: {
    current: number
    previous: number
    change: string
  }
}

export default function AdStatsPage() {
  const { data: session, status } = useSession({ required: true })
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [summaries, setSummaries] = useState<AdSummary[]>([])
  const [comparison, setComparison] = useState<ComparisonData | null>(null)
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day')

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/mgr')
      return
    }

    if (status === 'authenticated') {
      fetchStats()
    }
  }, [status, session, groupBy])

  const fetchStats = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/mgr/api/ad-stats?groupBy=${groupBy}`)
      const data = await response.json()

      if (data.success) {
        setChartData(data.data.chartData || [])
        setSummaries(data.data.summaries || [])
        setComparison(data.data.comparison || null)
      } else {
        setError(data.error || 'Failed to fetch ad stats')
      }
    } catch (err) {
      console.error('Error fetching ad stats:', err)
      setError('Failed to fetch ad stats')
    } finally {
      setLoading(false)
    }
  }

  const getPreviousPeriodLabel = () => {
    switch (groupBy) {
      case 'day': return 'vs Previous 2 Weeks'
      case 'week': return 'vs Previous 3 Months'
      case 'month': return 'vs Previous 1 Year'
      default: return 'vs Previous Period'
    }
  }

  const formatChange = (change: string) => {
    const num = parseFloat(change)
    if (num > 0) return { text: `+${change}%`, color: 'text-green-600', icon: '↑' }
    if (num < 0) return { text: `${change}%`, color: 'text-red-600', icon: '↓' }
    return { text: `${change}%`, color: 'text-gray-600', icon: '→' }
  }

  if (status === 'loading' || loading) {
    return <LoadingIndicator text="Loading ad stats..." />
  }

  if (error) {
    return <ErrorMessage message={error} type="error" />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ad Statistics</h1>
        <div className="flex items-center space-x-4">
          <label className="text-sm text-gray-600">Group By:</label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as 'day' | 'week' | 'month')}
            className="px-3 py-2 border rounded-md"
          >
            <option value="day">By Day (Last 2 Weeks)</option>
            <option value="week">By Week (Last 3 Months)</option>
            <option value="month">By Month (Last 1 Year)</option>
          </select>
          <button
            onClick={fetchStats}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Views Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Total Views {groupBy === 'day' && '(2 Weeks)'}{groupBy === 'week' && '(3 Months)'}{groupBy === 'month' && '(1 Year)'}
              </h3>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {comparison?.views.current.toLocaleString() || '0'}
              </p>
            </div>
            {comparison && (
              <div className="text-right">
                <p className="text-xs text-gray-400">{getPreviousPeriodLabel()}</p>
                <p className={`text-sm font-medium ${formatChange(comparison.views.change).color}`}>
                  {formatChange(comparison.views.change).icon} {formatChange(comparison.views.change).text}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {comparison.views.previous.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Total Clicks Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Total Clicks {groupBy === 'day' && '(2 Weeks)'}{groupBy === 'week' && '(3 Months)'}{groupBy === 'month' && '(1 Year)'}
              </h3>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {comparison?.clicks.current.toLocaleString() || '0'}
              </p>
            </div>
            {comparison && (
              <div className="text-right">
                <p className="text-xs text-gray-400">{getPreviousPeriodLabel()}</p>
                <p className={`text-sm font-medium ${formatChange(comparison.clicks.change).color}`}>
                  {formatChange(comparison.clicks.change).icon} {formatChange(comparison.clicks.change).text}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {comparison.clicks.previous.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Average CTR Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Average CTR {groupBy === 'day' && '(2 Weeks)'}{groupBy === 'week' && '(3 Months)'}{groupBy === 'month' && '(1 Year)'}
              </h3>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {summaries.length > 0
                  ? (summaries.reduce((sum, ad) => sum + ad.ctr, 0) / summaries.length).toFixed(2)
                  : '0.00'}%
              </p>
            </div>
            {comparison && comparison.views.current > 0 && (
              <div className="text-right">
                <p className="text-xs text-gray-400">Current Period CTR</p>
                <p className="text-sm font-medium text-purple-600">
                  {((comparison.clicks.current / comparison.views.current) * 100).toFixed(2)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-lg font-semibold p-4 border-b">
          {groupBy === 'day' && 'Daily Statistics (Last 2 Weeks)'}
          {groupBy === 'week' && 'Weekly Statistics (Last 3 Months)'}
          {groupBy === 'month' && 'Monthly Statistics (Last 1 Year)'}
        </h2>
        <div className="p-4">
          <SimpleChart data={chartData} groupBy={groupBy} />
        </div>
      </div>

      {/* Ad Performance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-lg font-semibold p-4 border-b">
          Ad Performance {groupBy === 'day' && '(Last 2 Weeks)'}{groupBy === 'week' && '(Last 3 Months)'}{groupBy === 'month' && '(Last 1 Year)'}
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ad Title
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CTR
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {summaries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No ad data available
                  </td>
                </tr>
              ) : (
                summaries.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {ad.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {ad.totalViews.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {ad.totalClicks.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={`font-medium ${ad.ctr > 1 ? 'text-green-600' : ad.ctr > 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {ad.ctr.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
