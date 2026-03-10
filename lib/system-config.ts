/**
 * System Configuration Management
 * Unified management of all system configuration reads and updates
 * Caching is managed by cache.js (Redis + memory fallback)
 */

import { cacheGet, cacheSet, cacheDel } from './cache';
import { cacheKeys } from './cache/keys';

type ConfigValue = Record<string, unknown>

const CONFIG_CACHE_TTL = 86400;

export const configKeys = {
  slangHeat: 'slang_heat_config',
  categoryHeat: 'category_heat_config',
  tagHeat: 'tag_heat_config',
  rateLimit: 'rate_limit_config',
  cache: 'cache_config',
  batchUpdate: 'batch_update_config',
  heatCalc: 'heat_calc_config',
  pk: 'pk_config',
  notification: 'notification_config',
  oauth: 'oauth_config',
  report: 'report_config',
  logCleanup: 'log_cleanup_config',
  backup: 'backup_config',
} as const

export type ConfigKey = typeof configKeys[keyof typeof configKeys]

export const defaultConfigs: Record<string, ConfigValue> = {
  [configKeys.slangHeat]: {
    like_weight: 0.1,
    comment_weight: 0.2,
    favorite_weight: 0.25,
    share_weight: 0.4,
    view_weight: 0.05
  },
  [configKeys.categoryHeat]: {
    slang_heat_weight: 0.5,
    click_weight: 0.25,
    search_weight: 0.25
  },
  [configKeys.tagHeat]: {
    slang_heat_weight: 0.5,
    click_weight: 0.25,
    search_weight: 0.25
  },
  [configKeys.rateLimit]: {
    verification: { windowMs: 60000, maxRequests: 1 },
    'password-reset': { windowMs: 60000, maxRequests: 1 },
    register: { windowMs: 60000, maxRequests: 3 },
    auth: { windowMs: 60000, maxRequests: 5 },
    'api-read': { windowMs: 60000, maxRequests: 120 },
    'api-write': { windowMs: 60000, maxRequests: 30 },
    'admin-read': { windowMs: 60000, maxRequests: 300 },
    'admin-write': { windowMs: 60000, maxRequests: 100 },
    default: { windowMs: 60000, maxRequests: 60 }
  },
  [configKeys.cache]: {
    enabled: true,
    defaultTTL: 3600,
    staticDataTTL: 86400,
    hotContentTTL: 3600,
    searchResultTTL: 1800,
    userStateTTL: 1800,
    manageDataTTL: 300,
    maxKeyLength: 256,
    nullCacheTTL: 60,
    heatCounterTTL: 0,
    memoryMaxSize: 1000
  },
  [configKeys.batchUpdate]: {
    enabled: true,
    slang: {
      enabled: true,
      flushInterval: 300000,
      maxBatchSize: 100
    },
    comment: {
      enabled: true,
      flushInterval: 60000,
      maxBatchSize: 50
    },
    category: {
      enabled: true,
      flushInterval: 86400000,
      maxBatchSize: 200
    },
    tag: {
      enabled: true,
      flushInterval: 86400000,
      maxBatchSize: 200
    }
  },
  [configKeys.heatCalc]: {
    slangInterval: 60,
    categoryTagInterval: 600
  },
  [configKeys.pk]: {
    matchTimeout: 30000,
    waitQueueTimeout: 120000,
    reconnectTimeout: 10000,
    maxReconnectAttempts: 3,
    questionTime: 10000,
    maxQueueSize: 500,
    maxWaitQueueSize: 300,
    maxGameRooms: 300,
    maxDailyGames: 20,
    heartbeatInterval: 30000,
    roomTTL: 180,
    statsTTL: 300,
    leaderboardTTL: 300,
    historyTTL: 1800,
    achievementsTTL: 600,
    maxMessagesPerSecond: 1000,
    maxConnectionsPerIP: 5000000,
    maxTotalConnections: 1200
  },
  [configKeys.notification]: {
    pollIntervalMs: 300000
  },
  [configKeys.oauth]: {
    google: { enabled: false },
    github: { enabled: true },
    apple: { enabled: false },
    twitter: { enabled: false }
  },
  [configKeys.report]: {
    operationReport: {
      enabled: true,
      defaultPeriod: 'monthly',
      autoGenerate: false,
      recipients: ['admin', 'moderator']
    },
    annualSummary: {
      enabled: true,
      autoGenerate: false,
      year: new Date().getFullYear() - 1
    }
  },
  [configKeys.logCleanup]: {
    enabled: true,
    loginLogsRetentionDays: 90,
    accessLogsRetentionDays: 30,
    actionLogsRetentionDays: 180,
    systemLogsRetentionDays: 90
  },
  [configKeys.backup]: {
    enabled: true,
    fullBackupIntervalHours: 24,
    incrementalBackupIntervalHours: 1,
    retentionDays: 30,
    fullBackupRetentionDays: 7,
    incrementalBackupRetentionDays: 3,
    maxBackups: 10,
    compressBackups: true,
    enableIncremental: false
  }
}

const getCacheKey = (key: string) => cacheKeys.config.item(key);

export async function loadAllConfigsFromDB(): Promise<void> {
  console.log('🔧 Loading system configurations...')
  const { allQuery } = await import('./db-adapter')
  
  try {
    const rows = await allQuery('SELECT item, value FROM config', [])
    let loadedCount = 0
    
    for (const row of rows as any[]) {
      try {
        const value = JSON.parse(row.value)
        await cacheSet(getCacheKey(row.item), value, CONFIG_CACHE_TTL)
        loadedCount++
      } catch (e) {
        console.error(`Failed to parse config ${row.item}:`, e)
      }
    }
    
    for (const key of Object.keys(defaultConfigs)) {
      const cached = await cacheGet(getCacheKey(key))
      if (!cached) {
        await cacheSet(getCacheKey(key), defaultConfigs[key], CONFIG_CACHE_TTL)
      }
    }
    
    console.log(`✅ System configurations loaded: ${loadedCount} items`)
  } catch (error) {
    console.error('❌ Failed to load system configurations:', error)
  }
}

export async function getConfig<T = ConfigValue>(key: ConfigKey): Promise<T | null> {
  const cacheKey = getCacheKey(key)
  const cached = await cacheGet(cacheKey)
  if (cached) {
    return cached as T
  }
  
  await loadAllConfigsFromDB()
  
  const reloaded = await cacheGet(cacheKey)
  if (reloaded) {
    return reloaded as T
  }
  
  return (defaultConfigs[key] as T) || null
}

export async function getConfigWithDefault<T>(key: ConfigKey, defaultValue: T): Promise<T> {
  const config = await getConfig<T>(key)
  return config ?? defaultValue
}

export async function setConfig(key: ConfigKey, value: ConfigValue): Promise<boolean> {
  try {
    const { smartUpsert } = await import('./db')
    
    await smartUpsert('config', {
      item: key,
      value: JSON.stringify(value),
      description: ''
    }, ['item'])
    
    await cacheSet(getCacheKey(key), value, CONFIG_CACHE_TTL)
    
    console.log(`✅ Configuration ${key} updated`)
    return true
  } catch (error) {
    console.error(`❌ Failed to update configuration ${key}:`, error)
    return false
  }
}

export async function deleteConfig(key: ConfigKey): Promise<boolean> {
  try {
    const { withWriteDb } = await import('./db-adapter')
    
    await withWriteDb(async (connection) => {
      await connection.query('DELETE FROM config WHERE item = $1', [key])
    })
    
    await cacheDel(getCacheKey(key))
    
    console.log(`✅ Configuration ${key} deleted`)
    return true
  } catch (error) {
    console.error(`❌ Failed to delete configuration ${key}:`, error)
    return false
  }
}

export async function clearConfigCache(key?: ConfigKey): Promise<void> {
  if (key) {
    await cacheDel(getCacheKey(key))
  } else {
    const { cacheDelPattern } = await import('./cache')
    await cacheDelPattern('config:*')
  }
}

export async function getAllCachedConfigs(): Promise<Record<string, ConfigValue>> {
  const result: Record<string, ConfigValue> = {}
  
  for (const key of Object.keys(defaultConfigs)) {
    const cached = await cacheGet(getCacheKey(key))
    result[key] = (cached as ConfigValue) || defaultConfigs[key]
  }
  
  return result
}

export default {
  configKeys,
  defaultConfigs,
  loadAllConfigsFromDB,
  getConfig,
  getConfigWithDefault,
  setConfig,
  deleteConfig,
  clearConfigCache,
  getAllCachedConfigs
}
