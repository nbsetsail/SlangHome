export {
  getCacheConfig,
  loadCacheConfig,
  reloadConfigCache,
  isUsingMemoryFallback,
  isCacheUsingRedis,
  getStats as getCacheStats,
  getCacheHealthStatus,
  getCacheStatus,
  initCacheHealthCheck,
  stopCacheHealthCheck,
  resetCacheStats,
  getRedisClient,
  buildKey,
  invalidateConfigCache
} from './health.js';

export {
  cacheGet,
  cacheSet,
  cacheDel,
  cacheDelPattern,
  cacheExists,
  cacheTTL,
  cacheIncr,
  cacheExpire,
  cacheMGet,
  cacheHIncrBy,
  cacheHGetAll,
  cacheHDel,
  clearAllCache,
  warmupCache
} from './core.js';

export { getOrSet, acquireLock, releaseLock } from './lock.js';

export { cacheKeys, cacheTTLs, hashKey } from './keys.js';

export { heatCounters } from './counters.js';

export { userStateCache } from './user-state.js';
