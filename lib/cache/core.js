import { getRedis, isUpstash } from '../cache-adapter';
import {
  getCacheConfig,
  isUsingMemoryFallback,
  buildKey,
  getMemoryStore,
  getEnvPrefix,
  recordHit,
  recordMiss,
  recordError,
  recordSet,
  recordDelete,
  incrementFailure,
  resetFailures,
  shouldFallback,
  activateFallback
} from './health.js';

export const cacheGet = async (key) => {
  const config = getCacheConfig();
  if (!config.enabled) {
    return null;
  }

  const fullKey = buildKey(key);
  const memoryStore = getMemoryStore();

  if (isUsingMemoryFallback()) {
    const data = memoryStore.get(fullKey);
    if (data !== null) {
      recordHit();
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    }
    recordMiss();
    return null;
  }

  try {
    const redis = await getRedis();

    if (!redis) {
      throw new Error('Redis client not available');
    }

    const data = await redis.get(fullKey);

    if (data !== null) {
      recordHit();
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    }

    recordMiss();
    return null;
  } catch (error) {
    recordError();
    console.error('Cache get error:', error.message);

    incrementFailure();
    if (shouldFallback()) {
      activateFallback();
    }

    const data = memoryStore.get(fullKey);
    if (data !== null) {
      recordHit();
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    }
    recordMiss();
    return null;
  }
};

export const cacheSet = async (key, value, ttl = null) => {
  const config = getCacheConfig();
  if (!config.enabled) {
    return false;
  }

  const fullKey = buildKey(key);
  const ttlSeconds = ttl ?? config.defaultTTL;
  const data = typeof value === 'string' ? value : JSON.stringify(value);
  const memoryStore = getMemoryStore();

  if (isUsingMemoryFallback()) {
    return memoryStore.set(fullKey, data, ttlSeconds);
  }

  try {
    const redis = await getRedis();
    if (isUpstash()) {
      await redis.set(fullKey, data, { ex: ttlSeconds });
    } else {
      await redis.setEx(fullKey, ttlSeconds, data);
    }
    recordSet();
    resetFailures();
    return true;
  } catch (error) {
    recordError();
    console.error('Cache set error:', error.message);

    incrementFailure();
    if (shouldFallback()) {
      activateFallback();
    }

    return memoryStore.set(fullKey, data, ttlSeconds);
  }
};

export const cacheDel = async (key) => {
  const config = getCacheConfig();
  if (!config.enabled) {
    return false;
  }

  const fullKey = buildKey(key);
  const memoryStore = getMemoryStore();

  if (isUsingMemoryFallback()) {
    return memoryStore.del(fullKey);
  }

  try {
    const redis = await getRedis();
    await redis.del(fullKey);
    recordDelete();
    resetFailures();
    return true;
  } catch (error) {
    recordError();
    console.error('Cache delete error:', error.message);

    incrementFailure();
    if (shouldFallback()) {
      activateFallback();
    }

    return memoryStore.del(fullKey);
  }
};

export const cacheDelPattern = async (pattern) => {
  const config = getCacheConfig();
  if (!config.enabled) {
    return 0;
  }

  const fullPattern = buildKey(pattern);
  const memoryStore = getMemoryStore();

  if (isUsingMemoryFallback()) {
    let count = 0;
    for (const key of memoryStore.keys()) {
      if (key.match(fullPattern.replace(/\*/g, '.*'))) {
        memoryStore.del(key);
        count++;
      }
    }
    return count;
  }

  try {
    const redis = await getRedis();
    const keys = [];

    let cursor = 0;
    do {
      const result = await redis.scan(cursor, { MATCH: fullPattern, COUNT: 100 });
      cursor = result.cursor;
      keys.push(...result.keys);
    } while (cursor !== 0);

    if (keys.length > 0) {
      await redis.del(keys);
    }

    return keys.length;
  } catch (error) {
    recordError();
    console.error('Cache delete pattern error:', error.message);

    incrementFailure();
    if (shouldFallback()) {
      activateFallback();
    }

    let count = 0;
    for (const key of memoryStore.keys()) {
      if (key.match(fullPattern.replace(/\*/g, '.*'))) {
        memoryStore.del(key);
        count++;
      }
    }
    return count;
  }
};

export const cacheExists = async (key) => {
  const config = getCacheConfig();
  if (!config.enabled) {
    return false;
  }

  const fullKey = buildKey(key);
  const memoryStore = getMemoryStore();

  if (isUsingMemoryFallback()) {
    return memoryStore.has(fullKey);
  }

  try {
    const redis = await getRedis();
    return await redis.exists(fullKey) === 1;
  } catch (error) {
    recordError();
    console.error('Cache exists error:', error.message);

    incrementFailure();
    if (shouldFallback()) {
      activateFallback();
    }

    return memoryStore.has(fullKey);
  }
};

export const cacheTTL = async (key) => {
  const config = getCacheConfig();
  if (!config.enabled) {
    return -1;
  }

  const fullKey = buildKey(key);
  const memoryStore = getMemoryStore();

  if (isUsingMemoryFallback()) {
    const item = memoryStore.getRawItem(fullKey);
    if (!item) return -1;
    if (!item.expires) return -1;
    return Math.max(0, Math.floor((item.expires - Date.now()) / 1000));
  }

  try {
    const redis = await getRedis();
    return await redis.ttl(fullKey);
  } catch (error) {
    recordError();
    console.error('Cache TTL error:', error.message);

    incrementFailure();
    if (shouldFallback()) {
      activateFallback();
    }

    const item = memoryStore.getRawItem(fullKey);
    if (!item || !item.expires) return -1;
    return Math.max(0, Math.floor((item.expires - Date.now()) / 1000));
  }
};

export const cacheIncr = async (key, by = 1) => {
  const config = getCacheConfig();
  if (!config.enabled) {
    return null;
  }

  const fullKey = buildKey(key);
  const memoryStore = getMemoryStore();

  if (isUsingMemoryFallback()) {
    const item = memoryStore.get(fullKey);
    if (item === null) {
      memoryStore.set(fullKey, String(by), config.defaultTTL);
      return by;
    }
    const newValue = parseInt(item, 10) + by;
    memoryStore.set(fullKey, String(newValue), config.defaultTTL);
    return newValue;
  }

  try {
    const redis = await getRedis();
    const result = await redis.incrBy(fullKey, by);
    resetFailures();
    return result;
  } catch (error) {
    recordError();
    console.error('Cache incr error:', error.message);

    incrementFailure();
    if (shouldFallback()) {
      activateFallback();
    }

    const item = memoryStore.get(fullKey);
    if (item === null) {
      memoryStore.set(fullKey, String(by), config.defaultTTL);
      return by;
    }
    const newValue = parseInt(item, 10) + by;
    memoryStore.set(fullKey, String(newValue), config.defaultTTL);
    return newValue;
  }
};

export const cacheMGet = async (keys) => {
  const config = getCacheConfig();
  if (!config.enabled || keys.length === 0) {
    return keys.map(() => null);
  }

  const fullKeys = keys.map(k => buildKey(k));
  const memoryStore = getMemoryStore();

  if (isUsingMemoryFallback()) {
    return fullKeys.map(fullKey => {
      const data = memoryStore.get(fullKey);
      if (data !== null) {
        recordHit();
        try {
          return JSON.parse(data);
        } catch {
          return data;
        }
      }
      recordMiss();
      return null;
    });
  }

  try {
    const redis = await getRedis();
    const values = await redis.mGet(fullKeys);
    
    values.forEach(v => {
      if (v !== null) recordHit();
      else recordMiss();
    });

    return values.map(v => {
      if (v === null) return null;
      try {
        return JSON.parse(v);
      } catch {
        return v;
      }
    });
  } catch (error) {
    recordError();
    console.error('Cache mget error:', error.message);

    incrementFailure();
    if (shouldFallback()) {
      activateFallback();
    }

    return fullKeys.map(fullKey => {
      const data = memoryStore.get(fullKey);
      if (data !== null) {
        recordHit();
        try {
          return JSON.parse(data);
        } catch {
          return data;
        }
      }
      recordMiss();
      return null;
    });
  }
};

export const cacheHIncrBy = async (key, field, by = 1) => {
  const config = getCacheConfig();
  if (!config.enabled) {
    return null;
  }

  const fullKey = buildKey(key);
  const memoryStore = getMemoryStore();
  const hashKey = `${fullKey}:hash`;

  if (isUsingMemoryFallback()) {
    const hashData = memoryStore.get(hashKey) || {};
    const currentValue = parseInt(hashData[field] || '0', 10);
    const newValue = currentValue + by;
    hashData[field] = String(newValue);
    memoryStore.set(hashKey, hashData, config.defaultTTL);
    return newValue;
  }

  try {
    const redis = await getRedis();
    const result = await redis.hIncrBy(fullKey, field, by);
    resetFailures();
    return result;
  } catch (error) {
    recordError();
    console.error('Cache hincrby error:', error.message);

    incrementFailure();
    if (shouldFallback()) {
      activateFallback();
    }

    const hashData = memoryStore.get(hashKey) || {};
    const currentValue = parseInt(hashData[field] || '0', 10);
    const newValue = currentValue + by;
    hashData[field] = String(newValue);
    memoryStore.set(hashKey, hashData, config.defaultTTL);
    return newValue;
  }
};

export const cacheHGetAll = async (key) => {
  const config = getCacheConfig();
  if (!config.enabled) {
    return {};
  }

  const fullKey = buildKey(key);
  const memoryStore = getMemoryStore();
  const hashKey = `${fullKey}:hash`;

  if (isUsingMemoryFallback()) {
    const data = memoryStore.get(hashKey);
    if (data !== null) {
      recordHit();
      return data;
    }
    recordMiss();
    return {};
  }

  try {
    const redis = await getRedis();
    const result = isUpstash() ? await redis.hgetall(fullKey) : await redis.hGetAll(fullKey);
    if (result && Object.keys(result).length > 0) {
      recordHit();
    } else {
      recordMiss();
    }
    return result || {};
  } catch (error) {
    recordError();
    console.error('Cache hgetall error:', error.message);

    incrementFailure();
    if (shouldFallback()) {
      activateFallback();
    }

    const data = memoryStore.get(hashKey);
    if (data !== null) {
      recordHit();
      return data;
    }
    recordMiss();
    return {};
  }
};

export const cacheHDel = async (key, field) => {
  const config = getCacheConfig();
  if (!config.enabled) {
    return false;
  }

  const fullKey = buildKey(key);
  const memoryStore = getMemoryStore();
  const hashKey = `${fullKey}:hash`;

  if (isUsingMemoryFallback()) {
    const hashData = memoryStore.get(hashKey);
    if (hashData && field in hashData) {
      delete hashData[field];
      memoryStore.set(hashKey, hashData, config.defaultTTL);
      return true;
    }
    return false;
  }

  try {
    const redis = await getRedis();
    await redis.hDel(fullKey, field);
    recordDelete();
    resetFailures();
    return true;
  } catch (error) {
    recordError();
    console.error('Cache hdel error:', error.message);

    incrementFailure();
    if (shouldFallback()) {
      activateFallback();
    }

    const hashData = memoryStore.get(hashKey);
    if (hashData && field in hashData) {
      delete hashData[field];
      memoryStore.set(hashKey, hashData, config.defaultTTL);
      return true;
    }
    return false;
  }
};

export const cacheExpire = async (key, ttl) => {
  const config = getCacheConfig();
  if (!config.enabled) {
    return false;
  }

  const fullKey = buildKey(key);
  const memoryStore = getMemoryStore();

  if (isUsingMemoryFallback()) {
    const item = memoryStore.getRawItem(fullKey);
    if (!item) return false;
    item.expires = Date.now() + ttl * 1000;
    item.ttlSeconds = ttl;
    return true;
  }

  try {
    const redis = await getRedis();
    await redis.expire(fullKey, ttl);
    return true;
  } catch (error) {
    recordError();
    console.error('Cache expire error:', error.message);

    incrementFailure();
    if (shouldFallback()) {
      activateFallback();
    }

    const item = memoryStore.getRawItem(fullKey);
    if (!item) return false;
    item.expires = Date.now() + ttl * 1000;
    item.ttlSeconds = ttl;
    return true;
  }
};

export const clearAllCache = async () => {
  const memoryStore = getMemoryStore();
  const ENV_PREFIX = getEnvPrefix();

  if (isUsingMemoryFallback()) {
    const count = memoryStore.clear();
    return count;
  }

  try {
    const redis = await getRedis();
    const pattern = `${ENV_PREFIX}:*`;
    const keys = [];

    let cursor = 0;
    do {
      const result = await redis.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = result.cursor;
      keys.push(...result.keys);
    } while (cursor !== 0);

    if (keys.length > 0) {
      await redis.del(keys);
    }

    return keys.length;
  } catch (error) {
    console.error('Clear all cache error:', error.message);

    incrementFailure();
    if (shouldFallback()) {
      activateFallback();
    }

    return memoryStore.clear();
  }
};

export const warmupCache = async (locale = 'en') => {
  console.log('🔥 开始缓存预热...');
  const startTime = Date.now();

  try {
    const { allQuery } = await import('../db-adapter');
    const { loadAllConfigsFromDB } = await import('../system-config');
    const { loadCacheConfig } = await import('./health.js');
    const { cacheKeys, cacheTTLs } = await import('./keys.js');

    console.log('  预热系统配置...');
    await loadAllConfigsFromDB();
    await loadCacheConfig(true);

    console.log('  预热分类数据...');
    const categories = await allQuery('SELECT id, name, heat, click_count FROM categories WHERE locale = $1 ORDER BY heat DESC LIMIT 100', [locale]);
    await cacheSet(cacheKeys.category.heat(locale), categories, cacheTTLs.static());

    console.log('  预热标签数据...');
    const tags = await allQuery('SELECT id, name, heat, click_count FROM tags WHERE locale = $1 ORDER BY heat DESC LIMIT 100', [locale]);
    await cacheSet(cacheKeys.tag.heat(locale), tags, cacheTTLs.static());

    console.log('  预热热门俚语...');
    const hotSlang = await allQuery(`
      SELECT id, phrase, explanation, example, origin, has_evolution, 
             views, likes, comments_count, favorites, shares, heat, 
             categories, tags, user_id, status, created_at
      FROM slang 
      WHERE status = 'active' AND locale = $1
      ORDER BY heat DESC 
      LIMIT 50
    `, [locale]);

    for (const slang of hotSlang) {
      await cacheSet(cacheKeys.slang.detail(slang.id), slang, cacheTTLs.hot());
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ 缓存预热完成 - 耗时 ${duration}s`);
    console.log(`   语言: ${locale}`);
    console.log(`   分类: ${categories.length} 条`);
    console.log(`   标签: ${tags.length} 条`);
    console.log(`   热门俚语: ${hotSlang.length} 条`);

    return {
      success: true,
      duration,
      locale,
      categories: categories.length,
      tags: tags.length,
      slang: hotSlang.length
    };
  } catch (error) {
    console.error('❌ 缓存预热失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
