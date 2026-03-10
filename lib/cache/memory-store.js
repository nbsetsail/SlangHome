const memoryCache = new Map();
const memoryCacheTimers = new Map();

const getCacheConfig = () => {
  try {
    const { getCacheConfig: getConfig } = require('./health');
    return getConfig();
  } catch {
    return { memoryMaxSize: 10000, defaultTTL: 300 };
  }
};

const memoryStore = {
  get: (key) => {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (item.expires && Date.now() > item.expires) {
      memoryCache.delete(key);
      return null;
    }
    return item.value;
  },

  set: (key, value, ttlSeconds) => {
    const config = getCacheConfig();
    if (memoryCache.size >= config.memoryMaxSize) {
      const firstKey = memoryCache.keys().next().value;
      memoryCache.delete(firstKey);
      if (memoryCacheTimers.has(firstKey)) {
        clearTimeout(memoryCacheTimers.get(firstKey));
        memoryCacheTimers.delete(firstKey);
      }
    }

    const expires = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    memoryCache.set(key, { value, expires, ttlSeconds });

    if (ttlSeconds) {
      const timer = setTimeout(() => {
        memoryCache.delete(key);
        memoryCacheTimers.delete(key);
      }, ttlSeconds * 1000);
      memoryCacheTimers.set(key, timer);
    }

    return true;
  },

  del: (key) => {
    const existed = memoryCache.has(key);
    memoryCache.delete(key);
    if (memoryCacheTimers.has(key)) {
      clearTimeout(memoryCacheTimers.get(key));
      memoryCacheTimers.delete(key);
    }
    return existed;
  },

  clear: () => {
    memoryCacheTimers.forEach(timer => clearTimeout(timer));
    memoryCacheTimers.clear();
    const size = memoryCache.size;
    memoryCache.clear();
    return size;
  },

  size: () => memoryCache.size,

  has: (key) => {
    const item = memoryCache.get(key);
    if (!item) return false;
    if (item.expires && Date.now() > item.expires) {
      memoryCache.delete(key);
      return false;
    }
    return true;
  },

  entries: () => {
    const result = [];
    for (const [key, item] of memoryCache.entries()) {
      if (item.expires && Date.now() > item.expires) {
        continue;
      }
      const remainingTTL = item.expires
        ? Math.max(1, Math.floor((item.expires - Date.now()) / 1000))
        : null;
      result.push({ key, value: item.value, remainingTTL });
    }
    return result;
  },

  keys: () => memoryCache.keys(),

  getRawItem: (key) => memoryCache.get(key)
};

export const syncToRedis = async (redis, config) => {
  const entries = memoryStore.entries();
  if (entries.length === 0) {
    return { synced: 0, failed: 0 };
  }

  console.log(`📤 开始同步内存缓存到 Redis (${entries.length} 条)...`);

  let synced = 0;
  let failed = 0;

  for (const { key, value, remainingTTL } of entries) {
    try {
      const ttl = remainingTTL || config.defaultTTL;
      await redis.setEx(key, ttl, value);
      synced++;
    } catch (err) {
      failed++;
      console.error(`同步缓存失败 [${key}]:`, err.message);
    }
  }

  console.log(`✅ 内存缓存同步完成: 成功 ${synced} 条, 失败 ${failed} 条`);
  return { synced, failed };
};

export default memoryStore;
