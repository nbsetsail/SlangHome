import { getRedis } from '../cache-adapter';
import { getCacheConfig, isUsingMemoryFallback, buildKey, getMemoryStore, recordError } from './health.js';
import { cacheDel } from './core.js';
import { cacheKeys } from './keys.js';

const LOCK_PREFIX = 'lock:';
const LOCK_TTL = 10;
const LOCK_RETRY_DELAY = 50;
const LOCK_MAX_RETRIES = 100;

const acquireLock = async (key) => {
  const config = getCacheConfig();
  if (!config.enabled) {
    return true;
  }

 const lockKey = cacheKeys.lock.acquire(key);
  const fullKey = buildKey(lockKey);
  const memoryStore = getMemoryStore();

  if (isUsingMemoryFallback()) {
    const existing = memoryStore.get(fullKey);
    if (existing !== null) {
      return false;
    }
    memoryStore.set(fullKey, '1', LOCK_TTL);
    return true;
  }

  try {
    const redis = await getRedis();
    const result = await redis.set(fullKey, '1', 'NX', 'EX', LOCK_TTL);
    return result === 'OK';
  } catch (error) {
    recordError();
    console.error('Lock acquire error:', error.message);
    memoryStore.set(fullKey, '1', LOCK_TTL);
    return true;
  }
};

const releaseLock = async (key) => {
  const lockKey = cacheKeys.lock.acquire(key);
  await cacheDel(lockKey);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getOrSet = async (key, fetchFn, ttl = null) => {
  const config = getCacheConfig();
  const { cacheGet, cacheSet } = await import('./core.js');
  
  const cached = await cacheGet(key);
  if (cached !== null) {
    if (cached && cached.__null__) {
      return null;
    }
    return cached;
  }

  const lockAcquired = await acquireLock(key);

  if (lockAcquired) {
    try {
      const doubleCheck = await cacheGet(key);
      if (doubleCheck !== null) {
        return doubleCheck.__null__ ? null : doubleCheck;
      }

      const value = await fetchFn();

      if (value !== null && value !== undefined) {
        await cacheSet(key, value, ttl);
      } else if (config.nullCacheTTL > 0) {
        await cacheSet(key, { __null__: true }, config.nullCacheTTL);
      }

      return value;
    } finally {
      await releaseLock(key);
    }
  } else {
    for (let i = 0; i < LOCK_MAX_RETRIES; i++) {
      await sleep(LOCK_RETRY_DELAY);

      const cachedAfterWait = await cacheGet(key);
      if (cachedAfterWait !== null) {
        return cachedAfterWait.__null__ ? null : cachedAfterWait;
      }

      const retryLockAcquired = await acquireLock(key);
      if (retryLockAcquired) {
        try {
          const doubleCheck = await cacheGet(key);
          if (doubleCheck !== null) {
            return doubleCheck.__null__ ? null : doubleCheck;
          }

          const value = await fetchFn();

          if (value !== null && value !== undefined) {
            await cacheSet(key, value, ttl);
          } else if (config.nullCacheTTL > 0) {
            await cacheSet(key, { __null__: true }, config.nullCacheTTL);
          }

          return value;
        } finally {
          await releaseLock(key);
        }
      }
    }

    console.warn('Cache lock wait timeout, fallback to direct fetch');
    return await fetchFn();
  }
};

export { acquireLock, releaseLock };
