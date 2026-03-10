'use client'
import React, { useState, useEffect } from 'react'
import { useMgrSession } from '../layout'
import { useRouter } from 'next/navigation'

interface ConfigItem {
  id: number
  key: string
  value: string
  description?: string
}

interface JsonConfigData {
  [key: string]: number | boolean | { windowMs: number; maxRequests: number } | { enabled: boolean; flushInterval: number; maxBatchSize: number }
}

interface RateLimitType {
  windowMs: number
  maxRequests: number
}

interface BatchConfigType {
  enabled: boolean
  flushInterval: number
  maxBatchSize: number
}

interface CacheStatus {
  enabled: boolean
  connected: boolean
  redis: {
    connected: boolean
    clusterMode: boolean
    dbSize: number
    memory: {
      used: number
      usedHuman: string
      total: number
      totalHuman: string
      max: number
      maxHuman: string
      effectiveMax: number
      effectiveMaxHuman: string
      usedPercent: string
      fragmentationRatio: number
      peak: number
      peakHuman: string
    }
    config: {
      maxmemory: number
      maxmemoryPolicy: string
    }
    error?: string
  }
  config: {
    enabled: boolean
    defaultTTL: number
    staticDataTTL: number
    hotContentTTL: number
    searchResultTTL: number
    userStateTTL: number
    manageDataTTL: number
    maxKeyLength: number
    nullCacheTTL: number
  }
  stats: {
    hits: number
    misses: number
    errors: number
    sets: number
    deletes: number
    hitRate: string
    useMemoryFallback: boolean
    redisFallback: number
    redisRecovered: number
    cacheSynced: number
    cacheSyncFailed: number
    health: {
      useMemoryFallback: boolean
      fallbackStartTime: number | null
      fallbackDuration: number | null
      lastHealthCheckTime: number | null
      consecutiveFailures: number
      consecutiveSuccesses: number
      healthCheckRunning: boolean
    }
  }
}

interface PKConfig {
  matchTimeout: number
  waitQueueTimeout: number
  reconnectTimeout: number
  maxReconnectAttempts: number
  questionTime: number
  maxQueueSize: number
  maxWaitQueueSize: number
  maxDailyGames: number
  heartbeatInterval: number
  roomTTL: number
  statsTTL: number
  leaderboardTTL: number
  historyTTL: number
  achievementsTTL: number
}

interface NotificationConfig {
  pollIntervalMs: number
}

interface ReportConfig {
  operationReport: {
    enabled: boolean
    defaultPeriod: string
    autoGenerate: boolean
    recipients: string[]
  }
  annualSummary: {
    enabled: boolean
    autoGenerate: boolean
    year: number
  }
}

export default function ConfigPage() {
  const router = useRouter()
  const session = useMgrSession()
  const [configs, setConfigs] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null)
  const [cacheLoading, setCacheLoading] = useState(false)
  const [cacheActionMsg, setCacheActionMsg] = useState('')
  const [pkConfig, setPKConfig] = useState<PKConfig | null>(null)
  const [pkLoading, setPKLoading] = useState(false)
  const [pkSaving, setPKSaving] = useState(false)
  const [oauthConfig, setOauthConfig] = useState<any>(null)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [oauthSaving, setOauthSaving] = useState(false)
  const [savingConfigId, setSavingConfigId] = useState<string | null>(null)
  const [newOAuthProvider, setNewOAuthProvider] = useState('')
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig | null>(null)
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [notificationSaving, setNotificationSaving] = useState(false)
  const [reportConfig, setReportConfig] = useState<ReportConfig | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportSaving, setReportSaving] = useState(false)

  if (session.user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-700 mb-4">Only admins can access configuration settings.</p>
          <a href="/mgr" className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">
            Back to Dashboard
          </a>
        </div>
      </div>
    )
  }

  const fetchAllConfigs = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/mgr/api/config?all=true')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch configs')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setConfigs(data.data.configs || [])
        setCacheStatus(data.data.cacheStatus)
        if (data.data.pkConfig) setPKConfig(data.data.pkConfig)
        if (data.data.oauthConfig) setOauthConfig(data.data.oauthConfig)
        if (data.data.notificationConfig) setNotificationConfig(data.data.notificationConfig)
        if (data.data.reportConfig) setReportConfig(data.data.reportConfig)
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to load configuration data: ${err.message}`)
      } else {
        setError('Failed to load configuration data: Unknown error')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchCacheStatus = async () => {
    try {
      const response = await fetch('/mgr/api/config/cache')
      if (response.ok) {
        const data = await response.json()
        setCacheStatus(data.data)
      }
    } catch (err) {
      console.error('Error fetching cache status:', err)
    }
  }

  const fetchPKConfig = async () => {
    setPKLoading(true)
    try {
      const response = await fetch('/mgr/api/config/pk')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPKConfig(data.data.config)
        }
      }
    } catch (err) {
      console.error('Error fetching PK config:', err)
    } finally {
      setPKLoading(false)
    }
  }

  const fetchOauthConfig = async () => {
    setOauthLoading(true)
    try {
      const response = await fetch('/mgr/api/config/oauth')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setOauthConfig(data.data.config)
        }
      }
    } catch (err) {
      console.error('Error fetching OAuth config:', err)
    } finally {
      setOauthLoading(false)
    }
  }

  const fetchNotificationConfig = async () => {
    setNotificationLoading(true)
    try {
      const response = await fetch('/mgr/api/config/notification')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setNotificationConfig(data.data.config)
        }
      }
    } catch (err) {
      console.error('Error fetching notification config:', err)
    } finally {
      setNotificationLoading(false)
    }
  }

  const fetchReportConfig = async () => {
    setReportLoading(true)
    try {
      const response = await fetch('/mgr/api/config/report')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setReportConfig(data.data.config)
        }
      }
    } catch (err) {
      console.error('Error fetching report config:', err)
    } finally {
      setReportLoading(false)
    }
  }

  const handlePKConfigChange = (key: keyof PKConfig, value: number) => {
    if (pkConfig) {
      setPKConfig({ ...pkConfig, [key]: value })
    }
  }

  const savePKConfig = async () => {
    if (!pkConfig) return
    setPKSaving(true)
    try {
      const response = await fetch('/mgr/api/config/pk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: pkConfig })
      })
      const data = await response.json()
      if (data.success) {
        alert('PK config saved and applied')
      } else {
        alert('Save failed: ' + data.error)
      }
    } catch (err) {
      alert('Save failed')
    } finally {
      setPKSaving(false)
    }
  }

  const handleOauthConfigChange = (provider: string, enabled: boolean) => {
    if (oauthConfig) {
      setOauthConfig({
        ...oauthConfig,
        [provider]: {
          ...oauthConfig[provider],
          enabled
        }
      })
    }
  }

  const saveOauthConfig = async () => {
    if (!oauthConfig) return
    setOauthSaving(true)
    try {
      const response = await fetch('/mgr/api/config/oauth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: oauthConfig })
      })
      const data = await response.json()
      if (data.success) {
        alert('OAuth config saved and applied')
      } else {
        alert('Save failed: ' + data.error)
      }
    } catch (err) {
      alert('Save failed')
    } finally {
      setOauthSaving(false)
    }
  }

  const handleNotificationConfigChange = (key: keyof NotificationConfig, value: number) => {
    if (notificationConfig) {
      setNotificationConfig({ ...notificationConfig, [key]: value })
    }
  }

  const saveNotificationConfig = async () => {
    if (!notificationConfig) return
    setNotificationSaving(true)
    try {
      const response = await fetch('/mgr/api/config/notification', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: notificationConfig })
      })
      const data = await response.json()
      if (data.success) {
        alert('Notification config saved and applied')
      } else {
        alert('Save failed: ' + data.error)
      }
    } catch (err) {
      alert('Save failed')
    } finally {
      setNotificationSaving(false)
    }
  }

  const saveReportConfig = async () => {
    if (!reportConfig) return
    setReportSaving(true)
    try {
      const response = await fetch('/mgr/api/config/report', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: reportConfig })
      })
      const data = await response.json()
      if (data.success) {
        alert('Report config saved and applied')
      } else {
        alert('Save failed: ' + data.error)
      }
    } catch (err) {
      alert('Save failed')
    } finally {
      setReportSaving(false)
    }
  }

  const saveCacheConfig = async (key: string) => {
    await saveConfig(key)
  }

  const saveBatchConfig = async (key: string) => {
    await saveConfig(key)
  }

  const saveConfig = async (key: string) => {
    setSavingConfigId(key as any)
    try {
      const configToSave = configs.find(c => c.key === key)
      if (!configToSave) return
      
      const response = await fetch('/mgr/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: [configToSave] })
      })
      const data = await response.json()
      if (data.success) {
        alert('Config saved and applied')
      } else {
        alert('Save failed: ' + data.error)
      }
    } catch (err) {
      alert('Save failed')
    } finally {
      setSavingConfigId(null)
    }
  }

  useEffect(() => {
    if (session.user.role === 'admin') {
      fetchAllConfigs()
    }
  }, [session.user.role])

  const parseJsonConfig = (value: string): JsonConfigData | null => {
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }

  const isRateLimitConfig = (jsonData: JsonConfigData | null): boolean => {
    if (!jsonData) return false
    const firstValue = Object.values(jsonData)[0]
    return typeof firstValue === 'object' && firstValue !== null && 'windowMs' in firstValue
  }

  const isCacheConfig = (jsonData: JsonConfigData | null): boolean => {
    if (!jsonData) return false
    return 'enabled' in jsonData && 'defaultTTL' in jsonData
  }

  const isBatchConfig = (jsonData: JsonConfigData | null): boolean => {
    if (!jsonData) return false
    if ('enabled' in jsonData && ('slang' in jsonData || 'comment' in jsonData || 'category' in jsonData || 'tag' in jsonData)) return true
    if ('enabled' in jsonData && 'flushInterval' in jsonData && 'maxBatchSize' in jsonData) return true
    return false
  }

  const isHeatCalcConfig = (jsonData: JsonConfigData | null): boolean => {
    if (!jsonData) return false
    return 'slangInterval' in jsonData && 'categoryTagInterval' in jsonData
  }

  const isSlangHeatConfig = (jsonData: JsonConfigData | null): boolean => {
    if (!jsonData) return false
    return 'like_weight' in jsonData && 'comment_weight' in jsonData && 'favorite_weight' in jsonData
  }

  const isCategoryTagHeatConfig = (jsonData: JsonConfigData | null): boolean => {
    if (!jsonData) return false
    return 'slang_heat_weight' in jsonData && 'click_weight' in jsonData && 'search_weight' in jsonData
  }

  const isPKConfig = (jsonData: JsonConfigData | null): boolean => {
    if (!jsonData) return false
    return 'matchTimeout' in jsonData && 'questionTime' in jsonData
  }

  const isOAuthConfig = (jsonData: JsonConfigData | null): boolean => {
    if (!jsonData) return false
    const keys = Object.keys(jsonData)
    if (keys.length === 0) return false
    if ('operationReport' in jsonData || 'annualSummary' in jsonData) return false
    return keys.every(k => {
      const val = jsonData[k]
      return typeof val === 'object' && val !== null && 'enabled' in val
    })
  }

  const isNotificationConfig = (jsonData: JsonConfigData | null): boolean => {
    if (!jsonData) return false
    return 'pollIntervalMs' in jsonData
  }

  const isReportConfig = (jsonData: JsonConfigData | null): boolean => {
    if (!jsonData) return false
    return 'operationReport' in jsonData && 'annualSummary' in jsonData
  }

  const handleJsonFieldChange = (configId: number, fieldKey: string, newValue: number | boolean) => {
    setConfigs(prev => prev.map(config => {
      if (config.id === configId) {
        const jsonData = parseJsonConfig(config.value)
        if (jsonData) {
          jsonData[fieldKey] = newValue
          return { ...config, value: JSON.stringify(jsonData) }
        }
      }
      return config
    }))
  }

  const handleRateLimitChange = (configId: number, typeKey: string, field: 'windowMs' | 'maxRequests', newValue: number) => {
    setConfigs(prev => prev.map(config => {
      if (config.id === configId) {
        const jsonData = parseJsonConfig(config.value)
        if (jsonData && typeof jsonData[typeKey] === 'object') {
          const typeConfig = jsonData[typeKey] as RateLimitType
          jsonData[typeKey] = { ...typeConfig, [field]: newValue }
          return { ...config, value: JSON.stringify(jsonData) }
        }
      }
      return config
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaveSuccess(false)
    try {
      const response = await fetch('/mgr/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ configs })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save configs')
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setError('Failed to save configuration changes')
      console.error('Error saving configs:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCacheAction = async (action: string) => {
    setCacheLoading(true)
    setCacheActionMsg('')
    try {
      const response = await fetch('/mgr/api/config/cache', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
      const data = await response.json()
      if (data.success) {
        setCacheActionMsg(data.message)
        await fetchCacheStatus()
      } else {
        setCacheActionMsg(`Error: ${data.error}`)
      }
    } catch (err) {
      setCacheActionMsg('Operation failed')
    } finally {
      setCacheLoading(false)
      setTimeout(() => setCacheActionMsg(''), 3000)
    }
  }

  const renderCacheStatus = () => {
    if (!cacheStatus) return null

    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Cache Status</h3>
            <p className="text-sm text-gray-500">Redis cache real-time status monitoring</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleCacheAction('warmup')}
              disabled={cacheLoading}
              className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400"
            >
              Warmup Cache
            </button>
            <button
              onClick={() => handleCacheAction('flushCounters')}
              disabled={cacheLoading}
              className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:bg-gray-400"
            >
              Flush Counters
            </button>
            <button
              onClick={() => handleCacheAction('clear')}
              disabled={cacheLoading}
              className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:bg-gray-400"
            >
              Clear Cache
            </button>
            <button
              onClick={() => handleCacheAction('resetStats')}
              disabled={cacheLoading}
              className="px-3 py-1.5 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-400"
            >
              Reset Stats
            </button>
            <button
              onClick={() => handleCacheAction('reloadConfig')}
              disabled={cacheLoading}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              Reload Config
            </button>
          </div>
        </div>
        
        {cacheActionMsg && (
          <div className="mb-4 p-2 bg-blue-100 text-blue-700 rounded-md text-sm">
            {cacheActionMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-md border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Redis Connection</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                !cacheStatus.enabled ? 'bg-gray-100 text-gray-700' :
                cacheStatus.redis.connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {!cacheStatus.enabled ? 'Disabled' :
                 cacheStatus.redis.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {cacheStatus.redis.error && (
              <p className="text-xs text-red-500">{cacheStatus.redis.error}</p>
            )}
            {!cacheStatus.enabled && (
              <p className="text-xs text-gray-500">Set REDIS_ENABLED=true in .env.local to enable</p>
            )}
            {cacheStatus.enabled && cacheStatus.redis.connected && (
              <div className="mt-2 text-sm text-gray-500">
                <p>Mode: {cacheStatus.redis.clusterMode ? 'Cluster' : 'Standalone'}</p>
                <p>Key count: {cacheStatus.redis.dbSize}</p>
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-md border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Memory Usage</h4>
            {cacheStatus.redis.memory ? (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Used:</span>
                  <span className="font-medium text-blue-600">{cacheStatus.redis.memory.usedHuman}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Max limit:</span>
                  <span className="font-medium">{cacheStatus.redis.memory.maxHuman}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">System memory:</span>
                  <span className="font-medium">{cacheStatus.redis.memory.totalHuman}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Peak:</span>
                  <span className="font-medium text-orange-600">{cacheStatus.redis.memory.peakHuman}</span>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Usage rate</span>
                    <span className="font-medium">{cacheStatus.redis.memory.usedPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${parseFloat(cacheStatus.redis.memory.usedPercent) > 80 ? 'bg-red-500' : parseFloat(cacheStatus.redis.memory.usedPercent) > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(parseFloat(cacheStatus.redis.memory.usedPercent), 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Unable to get memory info</p>
            )}
          </div>

          <div className="bg-white p-4 rounded-md border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Cache Statistics</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Hits:</span>
                <span className="font-medium text-green-600">{cacheStatus.stats.hits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Misses:</span>
                <span className="font-medium text-orange-600">{cacheStatus.stats.misses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Writes:</span>
                <span className="font-medium">{cacheStatus.stats.sets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Deletes:</span>
                <span className="font-medium">{cacheStatus.stats.deletes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Errors:</span>
                <span className="font-medium text-red-600">{cacheStatus.stats.errors}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-md border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-600">Cache Mode</h4>
              <span className={`px-2 py-1 text-xs rounded-full ${
                cacheStatus.stats.useMemoryFallback ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
              }`}>
                {cacheStatus.stats.useMemoryFallback ? 'Memory Fallback' : 'Redis'}
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Fallback count:</span>
                <span className="font-medium text-orange-600">{cacheStatus.stats.redisFallback}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Recovery count:</span>
                <span className="font-medium text-green-600">{cacheStatus.stats.redisRecovered}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sync success:</span>
                <span className="font-medium">{cacheStatus.stats.cacheSynced}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sync failed:</span>
                <span className="font-medium text-red-600">{cacheStatus.stats.cacheSyncFailed}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-md border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Health Check</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={`font-medium ${cacheStatus.stats.health?.healthCheckRunning ? 'text-green-600' : 'text-gray-400'}`}>
                  {cacheStatus.stats.health?.healthCheckRunning ? 'Running' : 'Not started'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Consecutive successes:</span>
                <span className="font-medium text-green-600">{cacheStatus.stats.health?.consecutiveSuccesses || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Consecutive failures:</span>
                <span className="font-medium text-red-600">{cacheStatus.stats.health?.consecutiveFailures || 0}</span>
              </div>
              {cacheStatus.stats.health?.fallbackDuration && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Fallback duration:</span>
                  <span className="font-medium text-orange-600">
                    {Math.floor(cacheStatus.stats.health.fallbackDuration / 1000)}s
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-md border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Hit Rate</h4>
            <div className="flex items-center justify-center h-16">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{cacheStatus.stats.hitRate}</div>
                <p className="text-xs text-gray-400 mt-1">Cache hits / Total requests</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-md border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Redis Config</h4>
            {cacheStatus.redis.config ? (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Memory limit:</span>
                  <span className="font-medium">{cacheStatus.redis.memory?.maxHuman || 'unlimited'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Eviction policy:</span>
                  <span className="font-medium">{cacheStatus.redis.config.maxmemoryPolicy || 'noeviction'}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Unable to get config info</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderCacheConfig = (config: ConfigItem) => {
    const jsonData = parseJsonConfig(config.value)
    if (!jsonData) return null

    const ttlFields = [
      { key: 'defaultTTL', label: 'Default TTL', desc: 'Default cache expiration time (seconds)' },
      { key: 'staticDataTTL', label: 'Static Data TTL', desc: 'Categories, tags, etc. (seconds)' },
      { key: 'hotContentTTL', label: 'Hot Content TTL', desc: 'Popular slang details (seconds)' },
      { key: 'searchResultTTL', label: 'Search Result TTL', desc: 'Search result cache (seconds)' },
      { key: 'userStateTTL', label: 'User State TTL', desc: 'Likes, favorites state (seconds)' },
      { key: 'manageDataTTL', label: 'Admin Data TTL', desc: 'Admin panel data (seconds)' },
      { key: 'nullCacheTTL', label: 'Null Cache TTL', desc: 'Empty result cache time (seconds)' },
      { key: 'heatCounterTTL', label: 'Heat Counter TTL', desc: '0=no TTL, scheduled refresh (seconds)' },
      { key: 'maxKeyLength', label: 'Max Key Length', desc: 'Maximum cache key length' }
    ]

    return (
      <div key={config.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Cache Config</h3>
          <button
            onClick={() => saveConfig(config.key)}
            disabled={savingConfigId === config.key}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {savingConfigId === config.key ? 'Saving...' : 'Save Config'}
          </button>
        </div>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Enable Cache</h4>
                <p className="text-xs text-gray-500">Enable Redis caching</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(jsonData.enabled)}
                  onChange={(e) => handleJsonFieldChange(config.id, 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ttlFields.map(field => {
              const value = jsonData[field.key]
              if (typeof value !== 'number') return null
              return (
                <div key={field.key} className="bg-white p-3 rounded-md border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => handleJsonFieldChange(config.id, field.key, parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">{field.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Configuration Notes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-xs text-blue-700">
            <span>• <strong>Default TTL</strong>: 3600s (1 hour)</span>
            <span>• <strong>Static Data</strong>: 86400s (24 hours)</span>
            <span>• <strong>Hot Content</strong>: 1800s (30 minutes)</span>
            <span>• <strong>Search Results</strong>: 300s (5 minutes)</span>
            <span>• <strong>User State</strong>: 7200s (2 hours)</span>
            <span>• <strong>Admin Data</strong>: 60s (1 minute)</span>
            <span>• <strong>Null Cache</strong>: 60s (1 minute)</span>
            <span>• <strong>Heat Counter</strong>: 0=scheduled refresh</span>
            <span>• <strong>Max Key Length</strong>: 200 chars</span>
          </div>
        </div>
      </div>
    )
  }

  const renderBatchConfig = (config: ConfigItem) => {
    const jsonData = parseJsonConfig(config.value)
    if (!jsonData) return null

    const isNewFormat = 'slang' in jsonData || 'comment' in jsonData || 'category' in jsonData || 'tag' in jsonData

    const batchTypes = [
      { key: 'comment', label: 'Comment Replies', desc: 'Comment reply counters, users expect timely updates', defaultInterval: 10000, defaultBatch: 50 },
      { key: 'slang', label: 'Slang Stats', desc: 'Slang views/likes/favorites counters', defaultInterval: 30000, defaultBatch: 100 },
      { key: 'category', label: 'Category Clicks', desc: 'Category click counters, not urgent', defaultInterval: 60000, defaultBatch: 200 },
      { key: 'tag', label: 'Tag Clicks', desc: 'Tag click counters, not urgent', defaultInterval: 60000, defaultBatch: 200 }
    ]

    const migrateToNewFormat = () => {
      const newData = {
        enabled: jsonData.enabled,
        slang: { enabled: true, flushInterval: jsonData.flushInterval || 30000, maxBatchSize: jsonData.maxBatchSize || 100 },
        comment: { enabled: true, flushInterval: 10000, maxBatchSize: 50 },
        category: { enabled: true, flushInterval: 60000, maxBatchSize: 200 },
        tag: { enabled: true, flushInterval: 60000, maxBatchSize: 200 }
      }
      setConfigs(prev => prev.map(c => c.id === config.id ? { ...c, value: JSON.stringify(newData) } : c))
    }

    const handleBatchTypeChange = (typeKey: string, field: 'enabled' | 'flushInterval' | 'maxBatchSize', value: number | boolean) => {
      const newData: Record<string, BatchConfigType> = { ...jsonData } as Record<string, BatchConfigType>
      if (!newData[typeKey]) {
        const typeInfo = batchTypes.find(t => t.key === typeKey)
        newData[typeKey] = { enabled: true, flushInterval: typeInfo?.defaultInterval || 30000, maxBatchSize: typeInfo?.defaultBatch || 100 }
      }
      newData[typeKey][field] = value as never
      setConfigs(prev => prev.map(c => c.id === config.id ? { ...c, value: JSON.stringify(newData) } : c))
    }

    return (
      <div key={config.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Batch Update Config</h3>
          <button
            onClick={() => saveConfig(config.key)}
            disabled={savingConfigId === config.key}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {savingConfigId === config.key ? 'Saving...' : 'Save Config'}
          </button>
        </div>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Global Enable</h4>
                <p className="text-xs text-gray-500">Enable batch update for all counters</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(jsonData.enabled)}
                  onChange={(e) => handleJsonFieldChange(config.id, 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          
          {isNewFormat ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batchTypes.map(type => {
                const typeConfig = (jsonData as any)[type.key] || { enabled: false, flushInterval: type.defaultInterval, maxBatchSize: type.defaultBatch }
                return (
                  <div key={type.key} className="bg-white p-4 rounded-md border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800">{type.label}</h4>
                        <p className="text-xs text-gray-400">{type.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(typeConfig.enabled)}
                          onChange={(e) => handleBatchTypeChange(type.key, 'enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Flush interval (ms)</label>
                        <input
                          type="number"
                          value={typeConfig.flushInterval}
                          onChange={(e) => handleBatchTypeChange(type.key, 'flushInterval', parseInt(e.target.value) || type.defaultInterval)}
                          disabled={!typeConfig.enabled}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                        <p className="text-xs text-gray-400 mt-0.5">{typeConfig.flushInterval >= 1000 ? `${typeConfig.flushInterval / 1000}s` : `${typeConfig.flushInterval}ms`}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Batch size</label>
                        <input
                          type="number"
                          value={typeConfig.maxBatchSize}
                          onChange={(e) => handleBatchTypeChange(type.key, 'maxBatchSize', parseInt(e.target.value) || type.defaultBatch)}
                          disabled={!typeConfig.enabled}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        />
                        <p className="text-xs text-gray-400 mt-0.5">items/batch</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-md border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flush interval (ms)
                </label>
                <input
                  type="number"
                  value={jsonData.flushInterval as number}
                  onChange={(e) => handleJsonFieldChange(config.id, 'flushInterval', parseInt(e.target.value) || 5000)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {(jsonData.flushInterval as number) >= 1000 ? `${(jsonData.flushInterval as number) / 1000} seconds` : `${jsonData.flushInterval} milliseconds`}
                </p>
              </div>
              <div className="bg-white p-3 rounded-md border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max batch size
                </label>
                <input
                  type="number"
                  value={jsonData.maxBatchSize as number}
                  onChange={(e) => handleJsonFieldChange(config.id, 'maxBatchSize', parseInt(e.target.value) || 100)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Flush immediately when reached</p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Configuration Notes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-1 text-xs text-blue-700">
            <span>• <strong>Comment Replies</strong>: 10s/50 items</span>
            <span>• <strong>Slang Stats</strong>: 30s/100 items</span>
            <span>• <strong>Category Clicks</strong>: 60s/200 items</span>
            <span>• <strong>Tag Clicks</strong>: 60s/200 items</span>
          </div>
          <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-blue-600">
            <strong>Tiered flush strategy</strong>: Comment replies most frequent (10s), users expect timely updates; Slang stats moderate (30s); Category/Tag clicks not urgent (60s)
          </div>
        </div>
      </div>
    )
  }

  const renderHeatCalcConfig = (config: ConfigItem) => {
    const jsonData = parseJsonConfig(config.value)
    if (!jsonData) return null

    return (
      <div key={config.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Heat Calculation Config</h3>
          <button
            onClick={() => saveConfig(config.key)}
            disabled={savingConfigId === config.key}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {savingConfigId === config.key ? 'Saving...' : 'Save Config'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded-md border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slang heat calculation interval (minutes)
            </label>
            <input
              type="number"
              value={jsonData.slangInterval as number}
              onChange={(e) => handleJsonFieldChange(config.id, 'slangInterval', parseInt(e.target.value) || 60)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              {(jsonData.slangInterval as number) >= 60 ? `${(jsonData.slangInterval as number) / 60} hours` : `${jsonData.slangInterval} minutes`}
            </p>
          </div>
          <div className="bg-white p-3 rounded-md border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category/Tag heat calculation interval (minutes)
            </label>
            <input
              type="number"
              value={jsonData.categoryTagInterval as number}
              onChange={(e) => handleJsonFieldChange(config.id, 'categoryTagInterval', parseInt(e.target.value) || 600)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              {(jsonData.categoryTagInterval as number) >= 60 ? `${(jsonData.categoryTagInterval as number) / 60} hours` : `${jsonData.categoryTagInterval} minutes`}
            </p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Configuration Notes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs text-blue-700">
            <span>• <strong>Slang Heat</strong>: 60 minutes (1 hour)</span>
            <span>• <strong>Category/Tag</strong>: 600 minutes (10 hours)</span>
          </div>
        </div>
      </div>
    )
  }

  const renderRateLimitConfig = (config: ConfigItem) => {
    const jsonData = parseJsonConfig(config.value)
    if (!jsonData) return null

    const typeLabels: Record<string, string> = {
      verification: 'Verification code',
      'password-reset': 'Password reset email',
      register: 'Registration request',
      auth: 'Auth API',
      'api-read': 'API Read',
      'api-write': 'API Write',
      'admin-read': 'Admin Read',
      'admin-write': 'Admin Write',
      default: 'Default API'
    }

    return (
      <div key={config.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Rate Limit Config</h3>
          <button
            onClick={() => saveConfig(config.key)}
            disabled={savingConfigId === config.key}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {savingConfigId === config.key ? 'Saving...' : 'Save Config'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(jsonData).map(([typeKey, typeValue]) => {
            const typeConfig = typeValue as RateLimitType
            return (
              <div key={typeKey} className="bg-white p-3 rounded-md border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  {typeLabels[typeKey] || typeKey}
                  <span className="ml-1 text-xs text-gray-400">({typeKey})</span>
                </h4>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Time window (ms)</label>
                      <input
                        type="number"
                        value={typeConfig.windowMs}
                        onChange={(e) => handleRateLimitChange(config.id, typeKey, 'windowMs', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-400 mt-0.5">
                        {typeConfig.windowMs >= 1000 ? `${typeConfig.windowMs / 1000}s` : `${typeConfig.windowMs}ms`}
                      </p>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Max requests</label>
                      <input
                        type="number"
                        value={typeConfig.maxRequests}
                        onChange={(e) => handleRateLimitChange(config.id, typeKey, 'maxRequests', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-400 mt-0.5">requests/window</p>
                    </div>
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Configuration Notes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-xs text-blue-700">
            <span>• <strong>Verification code</strong>: 1 per 60s</span>
            <span>• <strong>Password reset</strong>: 1 per 60s</span>
            <span>• <strong>Registration</strong>: 3 per 60s</span>
            <span>• <strong>Auth API</strong>: 5 per 60s</span>
            <span>• <strong>API Read</strong>: 120 per 60s</span>
            <span>• <strong>API Write</strong>: 30 per 60s</span>
            <span>• <strong>Admin Read</strong>: 300 per 60s</span>
            <span>• <strong>Admin Write</strong>: 100 per 60s</span>
            <span>• <strong>Default API</strong>: 60 per 60s</span>
          </div>
        </div>
      </div>
    )
  }

  const renderSlangHeatConfig = (config: ConfigItem) => {
    const jsonData = parseJsonConfig(config.value)
    if (!jsonData) return null

    const fieldLabels: Record<string, { label: string; desc: string }> = {
      like_weight: { label: 'Like Weight', desc: 'Like contribution to heat' },
      comment_weight: { label: 'Comment Weight', desc: 'Comment contribution to heat' },
      favorite_weight: { label: 'Favorite Weight', desc: 'Favorite contribution to heat' },
      share_weight: { label: 'Share Weight', desc: 'Share contribution to heat' },
      view_weight: { label: 'View Weight', desc: 'View contribution to heat' }
    }

    return (
      <div key={config.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Slang Heat Weight Config</h3>
          <button
            onClick={() => saveConfig(config.key)}
            disabled={savingConfigId === config.key}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {savingConfigId === config.key ? 'Saving...' : 'Save Config'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {Object.entries(jsonData).map(([fieldKey, fieldValue]) => {
            if (typeof fieldValue !== 'number') return null
            const field = fieldLabels[fieldKey]
            return (
              <div key={fieldKey} className="bg-white p-3 rounded-md border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field?.label || fieldKey}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={fieldValue}
                  onChange={(e) => handleJsonFieldChange(config.id, fieldKey, parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-400 mt-0.5">{field?.desc || ''}</p>
              </div>
            )
          })}
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Configuration Notes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-xs text-blue-700">
            <span>• <strong>Like Weight</strong>: 0.1</span>
            <span>• <strong>Comment Weight</strong>: 0.2</span>
            <span>• <strong>Favorite Weight</strong>: 0.25</span>
            <span>• <strong>Share Weight</strong>: 0.4</span>
            <span>• <strong>View Weight</strong>: 0.05</span>
          </div>
          <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-blue-600">
            <strong>Formula</strong>: Heat = Likes×{String(jsonData.like_weight || 0)} + Comments×{String(jsonData.comment_weight || 0)} + Favorites×{String(jsonData.favorite_weight || 0)} + Shares×{String(jsonData.share_weight || 0)} + Views×{String(jsonData.view_weight || 0)}
            <br />
            <span className="text-blue-500">Weight sum = {((Number(jsonData.like_weight) || 0) + (Number(jsonData.comment_weight) || 0) + (Number(jsonData.favorite_weight) || 0) + (Number(jsonData.share_weight) || 0) + (Number(jsonData.view_weight) || 0)).toFixed(2)} (recommended: 1.0)</span>
          </div>
        </div>
      </div>
    )
  }

  const renderCategoryTagHeatConfig = (config: ConfigItem) => {
    const jsonData = parseJsonConfig(config.value)
    if (!jsonData) return null

    const isCategory = config.key === 'category_heat_config'
    const title = isCategory ? 'Category Heat Weight Config' : 'Tag Heat Weight Config'
    
    const fieldLabels: Record<string, { label: string; desc: string }> = {
      slang_heat_weight: { label: 'Slang Heat Weight', desc: 'Child slang heat contribution' },
      click_weight: { label: 'Click Weight', desc: 'Click count contribution' },
      search_weight: { label: 'Search Weight', desc: 'Search hit contribution' }
    }

    return (
      <div key={config.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button
            onClick={() => saveConfig(config.key)}
            disabled={savingConfigId === config.key}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {savingConfigId === config.key ? 'Saving...' : 'Save Config'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(jsonData).map(([fieldKey, fieldValue]) => {
            if (typeof fieldValue !== 'number') return null
            const field = fieldLabels[fieldKey]
            return (
              <div key={fieldKey} className="bg-white p-3 rounded-md border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field?.label || fieldKey}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={fieldValue}
                  onChange={(e) => handleJsonFieldChange(config.id, fieldKey, parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-400 mt-0.5">{field?.desc || ''}</p>
              </div>
            )
          })}
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Configuration Notes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs text-blue-700">
            <span>• <strong>Slang Heat Weight</strong>: 0.5</span>
            <span>• <strong>Click Weight</strong>: 0.25</span>
            <span>• <strong>Search Weight</strong>: 0.25</span>
          </div>
          <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-blue-600">
            <strong>Formula</strong>: Heat = Total slang heat×{String(jsonData.slang_heat_weight || 0)} + Clicks×{String(jsonData.click_weight || 0)} + Search hits×{String(jsonData.search_weight || 0)}
            <br />
            <span className="text-blue-500">Weight sum = {((Number(jsonData.slang_heat_weight) || 0) + (Number(jsonData.click_weight) || 0) + (Number(jsonData.search_weight) || 0)).toFixed(2)} (must equal 1.0)</span>
          </div>
        </div>
      </div>
    )
  }

  const renderSimpleJsonConfig = (config: ConfigItem) => {
    const jsonData = parseJsonConfig(config.value)
    if (!jsonData) return null

    const renderField = (fieldKey: string, fieldValue: any, parentKey: string = ''): React.ReactNode => {
      const fullKey = parentKey ? `${parentKey}.${fieldKey}` : fieldKey
      
      if (typeof fieldValue === 'boolean') {
        return (
          <div key={fullKey} className="bg-white p-3 rounded-md border border-gray-200">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={fieldValue}
                onChange={(e) => {
                  const newData = { ...jsonData }
                  const keys = fullKey.split('.')
                  let current: any = newData
                  for (let i = 0; i < keys.length - 1; i++) {
                    current = current[keys[i]]
                  }
                  current[keys[keys.length - 1]] = e.target.checked
                  setConfigs(prev => prev.map(c => 
                    c.id === config.id ? { ...c, value: JSON.stringify(newData) } : c
                  ))
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">{formatFieldName(fieldKey)}</span>
            </label>
          </div>
        )
      }
      
      if (typeof fieldValue === 'number') {
        return (
          <div key={fullKey} className="bg-white p-3 rounded-md border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formatFieldName(fieldKey)}
            </label>
            <input
              type="number"
              value={fieldValue}
              onChange={(e) => {
                const newData = { ...jsonData }
                const keys = fullKey.split('.')
                let current: any = newData
                for (let i = 0; i < keys.length - 1; i++) {
                  current = current[keys[i]]
                }
                current[keys[keys.length - 1]] = parseFloat(e.target.value) || 0
                setConfigs(prev => prev.map(c => 
                  c.id === config.id ? { ...c, value: JSON.stringify(newData) } : c
                ))
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )
      }
      
      if (typeof fieldValue === 'string') {
        return (
          <div key={fullKey} className="bg-white p-3 rounded-md border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formatFieldName(fieldKey)}
            </label>
            <input
              type="text"
              value={fieldValue}
              onChange={(e) => {
                const newData = { ...jsonData }
                const keys = fullKey.split('.')
                let current: any = newData
                for (let i = 0; i < keys.length - 1; i++) {
                  current = current[keys[i]]
                }
                current[keys[keys.length - 1]] = e.target.value
                setConfigs(prev => prev.map(c => 
                  c.id === config.id ? { ...c, value: JSON.stringify(newData) } : c
                ))
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )
      }
      
      if (typeof fieldValue === 'object' && fieldValue !== null) {
        return (
          <div key={fullKey} className="col-span-full">
            <h4 className="text-sm font-semibold text-gray-800 mb-2 bg-gray-100 px-3 py-2 rounded-md">
              {formatFieldName(fieldKey)}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-2 border-l-2 border-gray-200 pl-3">
              {Object.entries(fieldValue).map(([k, v]) => renderField(k, v, fullKey))}
            </div>
          </div>
        )
      }
      
      return null
    }

    return (
      <div key={config.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{config.key}</h3>
            {config.description && (
              <p className="text-sm text-gray-500">{config.description}</p>
            )}
          </div>
          <button
            onClick={() => saveConfig(config.key)}
            disabled={savingConfigId === config.key}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 text-sm"
          >
            {savingConfigId === config.key ? 'Saving...' : 'Save Config'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(jsonData).map(([fieldKey, fieldValue]) => renderField(fieldKey, fieldValue))}
        </div>
      </div>
    )
  }

  const renderPKConfig = (config: ConfigItem) => {
    const jsonData = parseJsonConfig(config.value)
    if (!jsonData) return null

    const fields = [
      { key: 'matchTimeout', label: 'Match Timeout', desc: 'Normal match timeout (ms)', group: 'Match' },
      { key: 'waitQueueTimeout', label: 'Wait Queue Timeout', desc: 'Wait queue timeout (ms)', group: 'Match' },
      { key: 'maxQueueSize', label: 'Max Queue Size', desc: 'Max players in match queue', group: 'Match' },
      { key: 'maxWaitQueueSize', label: 'Max Wait Queue', desc: 'Max players in wait queue', group: 'Match' },
      { key: 'maxGameRooms', label: 'Max Rooms', desc: 'Max concurrent game rooms', group: 'Match' },
      { key: 'maxDailyGames', label: 'Max Daily Games', desc: 'Max games per user per day', group: 'Match' },
      { key: 'questionTime', label: 'Question Time', desc: 'Time per question (ms)', group: 'Game' },
      { key: 'reconnectTimeout', label: 'Reconnect Timeout', desc: 'Disconnect reconnect timeout (ms)', group: 'Connection' },
      { key: 'maxReconnectAttempts', label: 'Max Reconnect Attempts', desc: 'Max reconnect attempts', group: 'Connection' },
      { key: 'heartbeatInterval', label: 'Heartbeat Interval', desc: 'Heartbeat check interval (ms)', group: 'Connection' },
      { key: 'maxMessagesPerSecond', label: 'Message Rate Limit', desc: 'Max messages per second', group: 'Connection' },
      { key: 'maxConnectionsPerIP', label: 'Connections per IP', desc: 'Max connections per IP', group: 'Connection' },
      { key: 'maxTotalConnections', label: 'Total Connections', desc: 'Max total server connections', group: 'Connection' },
      { key: 'roomTTL', label: 'Room Cache Time', desc: 'Room data cache time (s), recommend 3 min', group: 'Cache' },
      { key: 'statsTTL', label: 'Stats Cache Time', desc: 'Stats data cache time (s)', group: 'Cache' },
      { key: 'leaderboardTTL', label: 'Leaderboard Cache', desc: 'Leaderboard cache time (s)', group: 'Cache' },
      { key: 'historyTTL', label: 'History Cache Time', desc: 'History record cache time (s)', group: 'Cache' },
      { key: 'achievementsTTL', label: 'Achievement Cache Time', desc: 'Achievement data cache time (s)', group: 'Cache' }
    ]

    const groups = ['Match', 'Game', 'Connection', 'Cache']

    return (
      <div key={config.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">PK Config</h3>
          <button
            onClick={() => saveConfig(config.key)}
            disabled={savingConfigId === config.key}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {savingConfigId === config.key ? 'Saving...' : 'Save Config'}
          </button>
        </div>
        {groups.map(group => (
          <div key={group} className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">{group} Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {fields.filter(f => f.group === group).map(field => {
                const value = jsonData[field.key]
                if (typeof value !== 'number') return null
                return (
                  <div key={field.key} className="bg-white p-3 rounded-md border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleJsonFieldChange(config.id, field.key, parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-0.5">{field.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Configuration Notes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-xs text-blue-700">
            <span>• <strong>Match Timeout</strong>: 30s</span>
            <span>• <strong>Wait Queue</strong>: 120s</span>
            <span>• <strong>Reconnect Timeout</strong>: 5s</span>
            <span>• <strong>Question Time</strong>: 10s</span>
            <span>• <strong>Daily Games</strong>: 20 games</span>
            <span>• <strong>Heartbeat</strong>: 30s</span>
            <span>• <strong>Max Rooms</strong>: 300</span>
            <span>• <strong>Connections per IP</strong>: 5</span>
            <span>• <strong>Total Connections</strong>: 1200</span>
          </div>
        </div>
      </div>
    )
  }

  const renderOAuthConfig = (config: ConfigItem) => {
    const jsonData = parseJsonConfig(config.value)
    if (!jsonData) return null

    const providers = Object.keys(jsonData).map(key => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      config: jsonData[key] as { enabled: boolean }
    }))

    const handleAddProvider = () => {
      if (!newOAuthProvider.trim()) return
      const key = newOAuthProvider.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
      if (!key || jsonData[key]) {
        alert('Invalid name or already exists')
        return
      }
      const newData = { ...jsonData, [key]: { enabled: false } }
      setConfigs(prev => prev.map(c => c.id === config.id ? { ...c, value: JSON.stringify(newData) } : c))
      setNewOAuthProvider('')
    }

    const handleRemoveProvider = (key: string) => {
      if (!confirm(`Are you sure to delete ${key} login?`)) return
      const newData = { ...jsonData }
      delete newData[key]
      setConfigs(prev => prev.map(c => c.id === config.id ? { ...c, value: JSON.stringify(newData) } : c))
    }

    return (
      <div key={config.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">OAuth Config</h3>
          <button
            onClick={() => saveConfig(config.key)}
            disabled={savingConfigId === config.key}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {savingConfigId === config.key ? 'Saving...' : 'Save Config'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map(provider => (
            <div key={provider.key} className="bg-white p-4 rounded-md border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <img 
                    src={`/thirdpart/${provider.key}.svg`} 
                    alt={provider.label}
                    className="w-5 h-5"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  <h4 className="text-sm font-semibold text-gray-800">{provider.label}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={provider.config.enabled}
                      onChange={(e) => {
                        const newData = { ...jsonData, [provider.key]: { ...provider.config, enabled: e.target.checked } }
                        setConfigs(prev => prev.map(c => c.id === config.id ? { ...c, value: JSON.stringify(newData) } : c))
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <button
                    onClick={() => handleRemoveProvider(provider.key)}
                    className="text-red-500 hover:text-red-700 text-xs"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {provider.config.enabled ? 'Enabled' : 'Disabled'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Key: {provider.key}</p>
            </div>
          ))}
          <div className="bg-white p-4 rounded-md border-2 border-dashed border-gray-300">
            <div className="flex gap-2">
              <input
                type="text"
                value={newOAuthProvider}
                onChange={(e) => setNewOAuthProvider(e.target.value)}
                placeholder="Add provider name"
                className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleAddProvider}
                disabled={!newOAuthProvider.trim()}
                className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Enter provider name (e.g. wechat, qq)</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Configuration Notes</h4>
          <div className="text-xs text-blue-700 space-y-1">
            <p>• Enable/disable third-party login methods, need to configure corresponding OAuth credentials in environment variables</p>
            <p>• After adding a new provider, add corresponding CLIENT_ID and CLIENT_SECRET in .env</p>
            <p>• To display icons, place SVG files in public/thirdpart/{`{key}`}.svg</p>
            <p>• Add corresponding OAuth Provider configuration in lib/auth.ts</p>
          </div>
        </div>
      </div>
    )
  }

  const renderNotificationConfig = (config: ConfigItem) => {
    const jsonData = parseJsonConfig(config.value)
    if (!jsonData) return null

    return (
      <div key={config.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Notification Config</h3>
          <button
            onClick={() => saveConfig(config.key)}
            disabled={savingConfigId === config.key}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {savingConfigId === config.key ? 'Saving...' : 'Save Config'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded-md border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Poll interval (ms)
            </label>
            <input
              type="number"
              value={jsonData.pollIntervalMs as number}
              onChange={(e) => handleJsonFieldChange(config.id, 'pollIntervalMs', parseInt(e.target.value) || 300000)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Current: {(jsonData.pollIntervalMs as number) / 1000} seconds
            </p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Configuration Notes</h4>
          <div className="text-xs text-blue-700">
            <span>• <strong>Poll interval</strong>: Frontend polling interval for new notifications, default 300s (5 minutes)</span>
          </div>
        </div>
      </div>
    )
  }

  const renderReportConfig = (config: ConfigItem) => {
    const jsonData = parseJsonConfig(config.value)
    if (!jsonData) return null

    const periodOptions = [
      { value: 'monthly', label: 'Monthly' },
      { value: 'quarterly', label: 'Quarterly' },
      { value: 'semiannual', label: 'Semi-annual' },
      { value: 'annual', label: 'Annual' }
    ]

    const recipientOptions = [
      { value: 'admin', label: 'Admin' },
      { value: 'moderator', label: 'Moderator' }
    ]

    return (
      <div key={config.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Report Config</h3>
          <button
            onClick={() => saveConfig(config.key)}
            disabled={savingConfigId === config.key}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {savingConfigId === config.key ? 'Saving...' : 'Save Config'}
          </button>
        </div>
        <div className="space-y-4">
          {jsonData.operationReport && (
            <div className="bg-white p-4 rounded-md border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Operation Report</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                  <span className="text-sm text-gray-600">Enabled</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean((jsonData.operationReport as any).enabled)}
                      onChange={(e) => {
                        const newData = { ...jsonData, operationReport: { ...(jsonData.operationReport as object), enabled: e.target.checked } }
                        setConfigs(prev => prev.map(c => c.id === config.id ? { ...c, value: JSON.stringify(newData) } : c))
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                  <span className="text-sm text-gray-600">Auto Generate</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean((jsonData.operationReport as any).autoGenerate)}
                      onChange={(e) => {
                        const newData = { ...jsonData, operationReport: { ...(jsonData.operationReport as object), autoGenerate: e.target.checked } }
                        setConfigs(prev => prev.map(c => c.id === config.id ? { ...c, value: JSON.stringify(newData) } : c))
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <label className="block text-sm text-gray-600 mb-1">Default Period</label>
                  <select
                    value={(jsonData.operationReport as any).defaultPeriod || 'monthly'}
                    onChange={(e) => {
                      const newData = { ...jsonData, operationReport: { ...(jsonData.operationReport as object), defaultPeriod: e.target.value } }
                      setConfigs(prev => prev.map(c => c.id === config.id ? { ...c, value: JSON.stringify(newData) } : c))
                    }}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    {periodOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <label className="block text-sm text-gray-600 mb-1">Recipients</label>
                  <div className="flex flex-wrap gap-2">
                    {recipientOptions.map(opt => (
                      <label key={opt.value} className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={((jsonData.operationReport as any).recipients || []).includes(opt.value)}
                          onChange={(e) => {
                            const currentRecipients = (jsonData.operationReport as any).recipients || []
                            const newRecipients = e.target.checked
                              ? [...currentRecipients, opt.value]
                              : currentRecipients.filter((r: string) => r !== opt.value)
                            const newData = { ...jsonData, operationReport: { ...(jsonData.operationReport as object), recipients: newRecipients } }
                            setConfigs(prev => prev.map(c => c.id === config.id ? { ...c, value: JSON.stringify(newData) } : c))
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {jsonData.annualSummary && (
            <div className="bg-white p-4 rounded-md border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Annual Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                  <span className="text-sm text-gray-600">Enabled</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean((jsonData.annualSummary as any).enabled)}
                      onChange={(e) => {
                        const newData = { ...jsonData, annualSummary: { ...(jsonData.annualSummary as object), enabled: e.target.checked } }
                        setConfigs(prev => prev.map(c => c.id === config.id ? { ...c, value: JSON.stringify(newData) } : c))
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                  <span className="text-sm text-gray-600">Auto Generate</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean((jsonData.annualSummary as any).autoGenerate)}
                      onChange={(e) => {
                        const newData = { ...jsonData, annualSummary: { ...(jsonData.annualSummary as object), autoGenerate: e.target.checked } }
                        setConfigs(prev => prev.map(c => c.id === config.id ? { ...c, value: JSON.stringify(newData) } : c))
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <label className="block text-sm text-gray-600 mb-1">Generate Year</label>
                  <input
                    type="number"
                    value={(jsonData.annualSummary as any).year || new Date().getFullYear() - 1}
                    onChange={(e) => {
                      const newData = { ...jsonData, annualSummary: { ...(jsonData.annualSummary as object), year: parseInt(e.target.value) || new Date().getFullYear() - 1 } }
                      setConfigs(prev => prev.map(c => c.id === config.id ? { ...c, value: JSON.stringify(newData) } : c))
                    }}
                    min={2000}
                    max={new Date().getFullYear()}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Configuration Notes</h4>
          <div className="text-xs text-blue-700 space-y-1">
            <p>• <strong>Operation Report</strong>: Periodically generate platform operation data reports and send to designated recipients</p>
            <p>• <strong>Annual Summary</strong>: Generate personalized annual usage summary for all users</p>
            <p>• <strong>Recipients</strong>: Admins and moderators can receive operation report emails</p>
          </div>
        </div>
      </div>
    )
  }

  const renderConfigItem = (config: ConfigItem) => {
    const jsonData = parseJsonConfig(config.value)
    
    if (jsonData) {
      if (isCacheConfig(jsonData)) {
        return renderCacheConfig(config)
      }
      if (isBatchConfig(jsonData)) {
        return renderBatchConfig(config)
      }
      if (isHeatCalcConfig(jsonData)) {
        return renderHeatCalcConfig(config)
      }
      if (isRateLimitConfig(jsonData)) {
        return renderRateLimitConfig(config)
      }
      if (isSlangHeatConfig(jsonData)) {
        return renderSlangHeatConfig(config)
      }
      if (isCategoryTagHeatConfig(jsonData)) {
        return renderCategoryTagHeatConfig(config)
      }
      if (isPKConfig(jsonData)) {
        return renderPKConfig(config)
      }
      if (isOAuthConfig(jsonData)) {
        return renderOAuthConfig(config)
      }
      if (isNotificationConfig(jsonData)) {
        return renderNotificationConfig(config)
      }
      if (isReportConfig(jsonData)) {
        return renderReportConfig(config)
      }
      return renderSimpleJsonConfig(config)
    }
    
    return (
      <tr key={config.id}>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-gray-900">{config.key}</div>
        </td>
        <td className="px-6 py-4">
          <input
            type="text"
            value={config.value}
            onChange={(e) => setConfigs(prev => prev.map(c => 
              c.id === config.id ? { ...c, value: e.target.value } : c
            ))}
            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {config.description || 'No description available'}
        </td>
      </tr>
    )
  }

  const formatFieldName = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
  }

  const excludedConfigs = ['backup_config', 'log_cleanup_config']
  
  const jsonConfigs = configs.filter(c => parseJsonConfig(c.value) && !excludedConfigs.includes(c.key))
  const simpleConfigs = configs.filter(c => !parseJsonConfig(c.value) && !excludedConfigs.includes(c.key))

  const configOrder = [
    'rate_limit_config',
    'cache_config', 
    'batch_update_config',
    'heat_calc_config',
    'slang_heat_config',
    'category_heat_config',
    'tag_heat_config',
    'pk_config',
    'oauth_config',
    'notification_config',
    'report_config'
  ]
  
  jsonConfigs.sort((a, b) => {
    const indexA = configOrder.indexOf(a.key)
    const indexB = configOrder.indexOf(b.key)
    if (indexA === -1 && indexB === -1) return 0
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">System Configuration</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {saveSuccess && (
        <div className="bg-green-100 text-green-700 p-4 rounded-md mb-4">
          Configuration saved successfully!
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {renderCacheStatus()}
          
          {jsonConfigs.length > 0 && (
            <div className="space-y-4">
              {jsonConfigs.map(config => renderConfigItem(config))}
            </div>
          )}
          
          {simpleConfigs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Config Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {simpleConfigs.map(config => renderConfigItem(config))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Configuration Notes</h3>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li><strong>Rate Limit Config</strong>: Control request frequency limits for each API type</li>
              <li><strong>Cache Config</strong>: Control Redis cache enable status and expiration times for each data type</li>
              <li><strong>Batch Update Config</strong>: Control batch update strategy for view counts and other counters</li>
              <li><strong>Heat Calculation Config</strong>: Control heat calculation intervals for slang, categories, tags</li>
              <li><strong>Slang Heat Weight</strong>: Control weight parameters for slang heat calculation</li>
              <li><strong>Category Heat Weight</strong>: Control weight parameters for category heat calculation</li>
              <li><strong>Tag Heat Weight</strong>: Control weight parameters for tag heat calculation</li>
              <li><strong>PK Config</strong>: Control match, timeout, reconnect and other PK game parameters</li>
              <li><strong>OAuth Config</strong>: Control third-party login enable status, supports dynamic addition</li>
              <li><strong>Notification Config</strong>: Control notification polling interval</li>
              <li><strong>Report Config</strong>: Control operation report and annual summary generation settings</li>
              <li>Changes take effect immediately, no service restart required</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
