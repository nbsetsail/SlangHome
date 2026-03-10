'use client'
import React, { useState, useEffect } from 'react'
import { useMgrSession } from './layout'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ContentLoader } from '@/components/ui'

export default function MgrDashboard() {
  const router = useRouter()
  const session = useMgrSession()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSlang: 0,
    totalComments: 0,
    totalLogs: 0,
    pendingSlang: 0
  })
  const [growth, setGrowth] = useState({
    users: 0,
    slang: 0,
    comments: 0,
    logs: 0
  })
  const [growthCount, setGrowthCount] = useState({
    users: 0,
    slang: 0,
    comments: 0,
    logs: 0
  })
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeDimension, setTimeDimension] = useState('month') // Default: monthly

  // Time dimension options
  const timeDimensions = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
    { value: 'quarter', label: 'Quarterly' },
    { value: 'halfyear', label: 'Half-Yearly' },
    { value: 'year', label: 'Yearly' }
  ]

  // Fetch stats from API based on time dimension
  useEffect(() => {
    const fetchStats = async () => {
      // Only prevent duplicate requests if we're not on the first load
      if (loading && recentActivities.length > 0) return // Prevent duplicate requests
      
      setLoading(true)
      setError('')
      
      try {
        // Build query parameters
        const params = new URLSearchParams()
        params.append('timeDimension', timeDimension)
        
        const response = await fetch(`/mgr/api/stats?${params.toString()}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to fetch stats')
        }
        
        const data = await response.json()
        if (data.success) {
          setStats(data.data.stats)
          setGrowth(data.data.growth)
          setGrowthCount(data.data.growthCount)
          setRecentActivities(data.data.recentActivities)
        } else {
          throw new Error(data.error || 'Failed to fetch stats')
        }
      } catch (err) {
        setError('Failed to load dashboard data')
        console.error('Error fetching stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [timeDimension])

  // Get activity icon based on type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_register':
        return { icon: 'U', color: 'bg-blue-100 text-blue-600' }
      case 'slang_added':
        return { icon: 'S', color: 'bg-green-100 text-green-600' }
      case 'comment_added':
        return { icon: 'C', color: 'bg-yellow-100 text-yellow-600' }
      case 'login_attempt':
        return { icon: 'L', color: 'bg-red-100 text-red-600' }
      default:
        return { icon: 'A', color: 'bg-gray-100 text-gray-600' }
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString('zh-CN')
  }

  return (
    <div>


      {/* Time dimension selector */}
      <div className="mb-6 flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Time Dimension:</label>
        <div className="flex flex-wrap gap-2">
          {timeDimensions.map((dimension) => (
            <button
              key={dimension.value}
              onClick={() => setTimeDimension(dimension.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${timeDimension === dimension.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              {dimension.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <p className="text-2xl font-bold text-gray-900">{loading ? '--' : stats.totalUsers}</p>
            <p className={`text-xs mt-1 ${growth.users >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growth.users >= 0 ? '+' : ''}{growth.users}% from last {timeDimension === 'day' ? 'day' : timeDimension === 'week' ? 'week' : timeDimension === 'month' ? 'month' : timeDimension === 'quarter' ? 'quarter' : timeDimension === 'halfyear' ? 'half-year' : 'year'}
            </p>
          </div>
          <div className="flex items-center">
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${growth.users >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {growth.users >= 0 ? '+' : ''}{growthCount.users}
            </span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Slang</h3>
            <p className="text-2xl font-bold text-gray-900">{loading ? '--' : stats.totalSlang}</p>
            <p className={`text-xs mt-1 ${growth.slang >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growth.slang >= 0 ? '+' : ''}{growth.slang}% from last {timeDimension === 'day' ? 'day' : timeDimension === 'week' ? 'week' : timeDimension === 'month' ? 'month' : timeDimension === 'quarter' ? 'quarter' : timeDimension === 'halfyear' ? 'half-year' : 'year'}
            </p>
          </div>
          <div className="flex items-center">
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${growth.slang >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {growth.slang >= 0 ? '+' : ''}{growthCount.slang}
            </span>
          </div>
        </div>
        {/* Pending Review Card - Only for moderator/admin */}
        {session?.user?.role !== 'user' && (
          <div className="bg-yellow-50 p-4 rounded-lg shadow border border-yellow-200 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Pending Review</h3>
              <p className="text-2xl font-bold text-yellow-900">{loading ? '--' : stats.pendingSlang}</p>
              <p className="text-xs mt-1 text-yellow-700">slang awaiting moderation</p>
            </div>
            <Link 
              href="/mgr/slang?status=pending"
              className={`px-4 py-2 rounded-md text-sm font-medium ${stats.pendingSlang > 0 ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-gray-200 text-gray-500'}`}
            >
              Review Now
            </Link>
          </div>
        )}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Comments</h3>
            <p className="text-2xl font-bold text-gray-900">{loading ? '--' : stats.totalComments}</p>
            <p className={`text-xs mt-1 ${growth.comments >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growth.comments >= 0 ? '+' : ''}{growth.comments}% from last {timeDimension === 'day' ? 'day' : timeDimension === 'week' ? 'week' : timeDimension === 'month' ? 'month' : timeDimension === 'quarter' ? 'quarter' : timeDimension === 'halfyear' ? 'half-year' : 'year'}
            </p>
          </div>
          <div className="flex items-center">
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${growth.comments >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {growth.comments >= 0 ? '+' : ''}{growthCount.comments}
            </span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Logs</h3>
            <p className="text-2xl font-bold text-gray-900">{loading ? '--' : stats.totalLogs}</p>
            <p className={`text-xs mt-1 ${growth.logs >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growth.logs >= 0 ? '+' : ''}{growth.logs}% from last {timeDimension === 'day' ? 'day' : timeDimension === 'week' ? 'week' : timeDimension === 'month' ? 'month' : timeDimension === 'quarter' ? 'quarter' : timeDimension === 'halfyear' ? 'half-year' : 'year'}
            </p>
          </div>
          <div className="flex items-center">
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${growth.logs >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {growth.logs >= 0 ? '+' : ''}{growthCount.logs}
            </span>
          </div>
        </div>
      </div>

      {/* View Detailed Stats Link - Only for admin/moderator */}
      {session?.user?.role !== 'user' && (
        <div className="mt-4 flex justify-end">
          <Link 
            href="/mgr/stats" 
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            View Detailed Statistics →
          </Link>
        </div>
      )}

      {/* Recent activity */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        
        {loading ? (
          <ContentLoader text="Loading dashboard..." minHeight="py-8" />
        ) : recentActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No recent activities
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivities.map((activity, index) => {
              const iconInfo = getActivityIcon(activity.type)
              return (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full ${iconInfo.color} flex items-center justify-center`}>
                    <span className="font-medium">{iconInfo.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.details}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
