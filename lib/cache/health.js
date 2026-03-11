import { getRedis, isRedisConnected, getRedisInfo, resetRedisConnection } from '../cache-adapter';
import { getConfig, configKeys, defaultConfigs } from '../system-config';
import memoryStore, { syncToRedis } from './memory-store.js';

const ENV_PREFIX = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';

let cachedConfig = null;

export const getCacheConfig = () => {
  return cachedConfig || defaultConfigs[configKeys.cache];
};

export const loadCacheConfig = async (forceReload = false) => {
  if (cachedConfig && !forceReload) {
    return cachedConfig;
  }
  cachedConfig = await getConfig(configKeys.cache);
  return cachedConfig || defaultConfigs[configKeys.cache];
};

export const reloadConfigCache = async () => {
  cachedConfig = null;
  await loadCacheConfig(true);
};

const getGlobalState = () => {
  if (typeof globalThis !== 'undefined') {
    if (!globalThis.__cacheHealthState) {
      globalThis.__cacheHealthState = {
        useMemoryFallback: false,
        redisHealthCheckInterval: null,
        lastHealthCheckTime: null,
        fallbackStartTime: null,
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        stats: {
          hits: 0,
          misses: 0,
          errors: 0,
          sets: 0,
          deletes: 0,
          redisFallback: 0,
          redisRecovered: 0,
          cacheSynced: 0,
          cacheSyncFailed: 0
        }
      };
    }
    return globalThis.__cacheHealthState;
  }
  return {
    useMemoryFallback: false,
    redisHealthCheckInterval: null,
    lastHealthCheckTime: null,
    fallbackStartTime: null,
    consecutiveFailures: 0,
    consecutiveSuccesses: 0,
    stats: {
      hits: 0,
      misses: 0,
      errors: 0,
      sets: 0,
      deletes: 0,
      redisFallback: 0,
      redisRecovered: 0,
      cacheSynced: 0,
      cacheSyncFailed: 0
    }
  };
};

const HEALTH_CHECK_INTERVAL = 30000;
const RECOVERY_THRESHOLD = 3;
const FALLBACK_THRESHOLD = 2;

export const isUsingMemoryFallback = () => getGlobalState().useMemoryFallback;

export const isCacheUsingRedis = () => !getGlobalState().useMemoryFallback;

export const getStats = () => {
  const state = getGlobalState();
  const stats = state.stats;
  return {
    ...stats,
    hitRate: stats.hits + stats.misses > 0
      ? (stats.hits / (stats.hits + stats.misses) * 100).toFixed(2) + '%'
      : '0%',
    useMemoryFallback: state.useMemoryFallback
  };
};

export const recordHit = () => { getGlobalState().stats.hits++; };
export const recordMiss = () => { getGlobalState().stats.misses++; };
export const recordError = () => { getGlobalState().stats.errors++; };
export const recordSet = () => { getGlobalState().stats.sets++; };
export const recordDelete = () => { getGlobalState().stats.deletes++; };

export const incrementFailure = () => {
  const state = getGlobalState();
  state.consecutiveFailures++;
  state.consecutiveSuccesses = 0;
  return state.consecutiveFailures;
};

export const resetFailures = () => {
  getGlobalState().consecutiveFailures = 0;
};

export const shouldFallback = () => {
  const state = getGlobalState();
  return state.consecutiveFailures >= FALLBACK_THRESHOLD && !state.useMemoryFallback;
};

export const activateFallback = () => {
  const state = getGlobalState();
  if (!state.useMemoryFallback) {
    console.log('⚠️ Redis connection failed, falling back to memory cache mode');
    state.useMemoryFallback = true;
    if (!state.fallbackStartTime) {
      state.fallbackStartTime = Date.now();
    }
    state.stats.redisFallback++;
  }
};

const checkRedisHealth = async () => {
  const state = getGlobalState();
  state.lastHealthCheckTime = Date.now();

  try {
    let redis = await getRedis();

    if (!redis) {
      throw new Error('Redis client not available');
    }

    const startTime = Date.now();
    await redis.ping();
    const latency = Date.now() - startTime;

    state.consecutiveSuccesses++;
    state.consecutiveFailures = 0;

    if (state.useMemoryFallback && state.consecutiveSuccesses >= RECOVERY_THRESHOLD) {
      console.log(`✅ Redis recovered, switching back to Redis cache mode (latency: ${latency}ms)`);
      
      state.useMemoryFallback = false;
      state.fallbackStartTime = null;
      state.consecutiveSuccesses = 0;

      state.stats.redisRecovered++;
    }

    return { healthy: true, latency };
  } catch (error) {
    state.consecutiveFailures++;
    state.consecutiveSuccesses = 0;

    if (!state.useMemoryFallback && state.consecutiveFailures >= FALLBACK_THRESHOLD) {
      console.log('⚠️ Redis health check failed, falling back to memory cache mode');
      state.useMemoryFallback = true;
      if (!state.fallbackStartTime) {
        state.fallbackStartTime = Date.now();
      }
      state.stats.redisFallback++;
    }

    return { healthy: false, error: error.message };
  }
};

export const initCacheHealthCheck = async () => {
  const state = getGlobalState();
  if (state.redisHealthCheckInterval) {
    clearInterval(state.redisHealthCheckInterval);
  }

  const initialStatus = await checkRedisHealth();

  if (initialStatus.healthy) {
    state.useMemoryFallback = false;
    state.consecutiveFailures = 0;
    state.consecutiveSuccesses = 1;
    state.fallbackStartTime = null;
  }

  const mode = state.useMemoryFallback ? '内存缓存' : 'Redis';
  console.log(`🔄 Redis health check started (interval: 30s, mode: ${mode}, initial status: ${initialStatus.healthy ? 'healthy' : 'unhealthy'})`);

  state.redisHealthCheckInterval = setInterval(checkRedisHealth, HEALTH_CHECK_INTERVAL);
};

export const stopCacheHealthCheck = () => {
  const state = getGlobalState();
  if (state.redisHealthCheckInterval) {
    clearInterval(state.redisHealthCheckInterval);
    state.redisHealthCheckInterval = null;
    console.log('🛑 Redis health check stopped');
  }
};

export const getCacheHealthStatus = () => {
  const state = getGlobalState();
  return {
    useMemoryFallback: state.useMemoryFallback,
    fallbackStartTime: state.fallbackStartTime,
    fallbackDuration: state.fallbackStartTime ? Date.now() - state.fallbackStartTime : null,
    lastHealthCheckTime: state.lastHealthCheckTime,
    consecutiveFailures: state.consecutiveFailures,
    consecutiveSuccesses: state.consecutiveSuccesses,
    healthCheckRunning: state.redisHealthCheckInterval !== null
  };
};

export const getCacheStatus = async () => {
  try {
    const redisConnected = await isRedisConnected();
    let redisInfo = { connected: false };

    if (redisConnected) {
      redisInfo = await getRedisInfo();
    }

    const config = getCacheConfig();
    return {
      enabled: config.enabled,
      connected: redisConnected,
      redis: redisInfo,
      config: config,
      stats: getStats(),
      health: getCacheHealthStatus()
    };
  } catch (error) {
    console.error('Error getting cache status:', error.message);
    const config = getCacheConfig();
    return {
      enabled: config.enabled,
      connected: false,
      redis: { connected: false, error: error.message },
      config: config,
      stats: getStats(),
      health: getCacheHealthStatus()
    };
  }
};

export const resetCacheStats = () => {
  const stats = getGlobalState().stats;
  stats.hits = 0;
  stats.misses = 0;
  stats.errors = 0;
  stats.sets = 0;
  stats.deletes = 0;
  stats.redisFallback = 0;
  stats.redisRecovered = 0;
  stats.cacheSynced = 0;
  stats.cacheSyncFailed = 0;
};

export const getRedisClient = async () => {
  const state = getGlobalState();
  if (state.useMemoryFallback) {
    return null;
  }

  try {
    const redis = await getRedis();
    return redis;
  } catch (error) {
    console.error('Get Redis client error:', error.message);
    return null;
  }
};

export const buildKey = (key) => {
  const config = getCacheConfig();
  const fullKey = `${ENV_PREFIX}:${key}`;
  if (fullKey.length > config.maxKeyLength) {
    const { hashKey } = require('./keys.js');
    return `${ENV_PREFIX}:hash:${hashKey(key)}`;
  }
  return fullKey;
};

export const getMemoryStore = () => memoryStore;

export const getEnvPrefix = () => ENV_PREFIX;

export const invalidateConfigCache = () => {
};
