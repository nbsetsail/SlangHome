import { getRedisClient, isCacheUsingRedis } from './cache.js';

const memoryStore = {
  string: new Map<string, { value: string; expires?: number }>(),
  hash: new Map<string, Map<string, string>>(),
  zset: new Map<string, Array<{ value: string; score: number }>>(),
  set: new Map<string, Set<string>>(),
  rateLimit: new Map<string, { count: number; expiresAt: number }>()
};

const memoryTimers = new Map<string, NodeJS.Timeout>();

function checkAndSetExpiry(key: string, ttlSeconds: number) {
  if (ttlSeconds > 0) {
    const existingTimer = memoryTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    const timer = setTimeout(() => {
      memoryStore.string.delete(key);
      memoryStore.hash.delete(key);
      memoryStore.zset.delete(key);
      memoryStore.set.delete(key);
      memoryTimers.delete(key);
    }, ttlSeconds * 1000);
    memoryTimers.set(key, timer);
  }
}

function isExpired(key: string): boolean {
  const item = memoryStore.string.get(key);
  if (item?.expires && Date.now() > item.expires) {
    memoryStore.string.delete(key);
    return true;
  }
  return false;
}

export const isMemoryMode = () => !isCacheUsingRedis();

export const getMemoryStats = () => ({
  stringCount: memoryStore.string.size,
  hashCount: memoryStore.hash.size,
  zsetCount: memoryStore.zset.size,
  setCount: memoryStore.set.size
});

export const kvStore = {
  get: async (key: string): Promise<string | null> => {
    if (!isCacheUsingRedis()) {
      if (isExpired(key)) return null;
      return memoryStore.string.get(key)?.value || null;
    }
    
    const redis = await getRedisClient();
    if (!redis) {
      if (isExpired(key)) return null;
      return memoryStore.string.get(key)?.value || null;
    }
    
    try {
      const result = await redis.get(key);
      
      if (result !== null) {
        memoryStore.string.set(key, { value: result });
        return result;
      }
      
      const memoryBackup = memoryStore.string.get(key)?.value;
      if (memoryBackup) {
        return memoryBackup;
      }
      
      return null;
    } catch (error) {
      console.error('KV Store get error:', error);
      if (isExpired(key)) return null;
      return memoryStore.string.get(key)?.value || null;
    }
  },

  set: async (key: string, value: string, ttlSeconds?: number): Promise<boolean> => {
    if (!isCacheUsingRedis()) {
      memoryStore.string.set(key, {
        value,
        expires: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined
      });
      checkAndSetExpiry(key, ttlSeconds || 0);
      return true;
    }
    
    const redis = await getRedisClient();
    if (!redis) {
      memoryStore.string.set(key, {
        value,
        expires: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined
      });
      checkAndSetExpiry(key, ttlSeconds || 0);
      return true;
    }
    
    try {
      if (ttlSeconds) {
        await redis.setEx(key, ttlSeconds, value);
      } else {
        await redis.set(key, value);
      }
      
      memoryStore.string.set(key, {
        value,
        expires: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined
      });
      
      return true;
    } catch (error) {
      console.error('KV Store set error:', error);
      memoryStore.string.set(key, {
        value,
        expires: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined
      });
      checkAndSetExpiry(key, ttlSeconds || 0);
      return true;
    }
  },

  del: async (key: string): Promise<boolean> => {
    memoryStore.string.delete(key);
    memoryStore.hash.delete(key);
    memoryStore.zset.delete(key);
    memoryStore.set.delete(key);
    memoryTimers.delete(key);
    
    if (!isCacheUsingRedis()) {
      return true;
    }
    
    const redis = await getRedisClient();
    if (!redis) {
      return true;
    }
    
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('KV Store del error:', error);
      return true;
    }
  }
};

export const syncKVStoreToRedis = async (redis: any): Promise<{ synced: number; failed: number }> => {
  let synced = 0;
  let failed = 0;

  for (const [key, item] of memoryStore.string.entries()) {
    if (item.expires && Date.now() > item.expires) {
      continue;
    }
    try {
      const ttl = item.expires ? Math.max(1, Math.floor((item.expires - Date.now()) / 1000)) : undefined;
      if (ttl) {
        await redis.setEx(key, ttl, item.value);
      } else {
        await redis.set(key, item.value);
      }
      synced++;
    } catch (err) {
      failed++;
      console.error(`KV Store sync failed [${key}]:`, (err as Error).message);
    }
  }

  for (const [key, set] of memoryStore.set.entries()) {
    try {
      for (const member of set) {
        await redis.sAdd(key, member);
      }
      synced++;
    } catch (err) {
      failed++;
    }
  }

  console.log(`📤 KV Store synced to Redis: ${synced} succeeded, ${failed} failed`);
  return { synced, failed };
};

export const hashStore = {
  hSet: async (key: string, field: string, value: string): Promise<boolean> => {
    if (!isCacheUsingRedis()) {
      if (!memoryStore.hash.has(key)) {
        memoryStore.hash.set(key, new Map());
      }
      memoryStore.hash.get(key)!.set(field, value);
      return true;
    }
    
    const redis = await getRedisClient();
    if (!redis) {
      if (!memoryStore.hash.has(key)) {
        memoryStore.hash.set(key, new Map());
      }
      memoryStore.hash.get(key)!.set(field, value);
      return true;
    }
    
    try {
      await redis.hSet(key, field, value);
      
      if (!memoryStore.hash.has(key)) {
        memoryStore.hash.set(key, new Map());
      }
      memoryStore.hash.get(key)!.set(field, value);
      
      return true;
    } catch (error) {
      console.error('Hash Store hSet error:', error);
      if (!memoryStore.hash.has(key)) {
        memoryStore.hash.set(key, new Map());
      }
      memoryStore.hash.get(key)!.set(field, value);
      return true;
    }
  },

  hGet: async (key: string, field: string): Promise<string | null> => {
    if (!isCacheUsingRedis()) {
      return memoryStore.hash.get(key)?.get(field) || null;
    }
    
    const redis = await getRedisClient();
    if (!redis) {
      return memoryStore.hash.get(key)?.get(field) || null;
    }
    
    try {
      const result = await redis.hGet(key, field);
      return result;
    } catch (error) {
      console.error('Hash Store hGet error:', error);
      return memoryStore.hash.get(key)?.get(field) || null;
    }
  },

  hDel: async (key: string, field: string): Promise<boolean> => {
    memoryStore.hash.get(key)?.delete(field);
    
    if (!isCacheUsingRedis()) {
      return true;
    }
    
    const redis = await getRedisClient();
    if (!redis) {
      return true;
    }
    
    try {
      await redis.hDel(key, field);
      return true;
    } catch (error) {
      console.error('Hash Store hDel error:', error);
      return true;
    }
  },

  hLen: async (key: string): Promise<number> => {
    if (!isCacheUsingRedis()) {
      return memoryStore.hash.get(key)?.size || 0;
    }
    
    const redis = await getRedisClient();
    if (!redis) {
      return memoryStore.hash.get(key)?.size || 0;
    }
    
    try {
      const result = await redis.hLen(key);
      return result;
    } catch (error) {
      console.error('Hash Store hLen error:', error);
      return memoryStore.hash.get(key)?.size || 0;
    }
  },

  hGetAll: async (key: string): Promise<Record<string, string>> => {
    if (!isCacheUsingRedis()) {
      const map = memoryStore.hash.get(key);
      if (!map) return {};
      return Object.fromEntries(map.entries());
    }
    
    const redis = await getRedisClient();
    if (!redis) {
      const map = memoryStore.hash.get(key);
      if (!map) return {};
      return Object.fromEntries(map.entries());
    }
    
    try {
      const result = await redis.hGetAll(key);
      return result;
    } catch (error) {
      console.error('Hash Store hGetAll error:', error);
      const map = memoryStore.hash.get(key);
      if (!map) return {};
      return Object.fromEntries(map.entries());
    }
  }
};

export const zsetStore = {
  zAdd: async (key: string, member: { value: string; score: number }): Promise<boolean> => {
    if (!isCacheUsingRedis()) {
      if (!memoryStore.zset.has(key)) {
        memoryStore.zset.set(key, []);
      }
      const zset = memoryStore.zset.get(key)!;
      const existingIndex = zset.findIndex(item => item.value === member.value);
      if (existingIndex >= 0) {
        zset[existingIndex] = member;
      } else {
        zset.push(member);
      }
      zset.sort((a, b) => a.score - b.score);
      return true;
    }
    
    const redis = await getRedisClient();
    if (!redis) {
      if (!memoryStore.zset.has(key)) {
        memoryStore.zset.set(key, []);
      }
      const zset = memoryStore.zset.get(key)!;
      const existingIndex = zset.findIndex(item => item.value === member.value);
      if (existingIndex >= 0) {
        zset[existingIndex] = member;
      } else {
        zset.push(member);
      }
      zset.sort((a, b) => a.score - b.score);
      return true;
    }
    
    try {
      await redis.zAdd(key, member);
      
      if (!memoryStore.zset.has(key)) {
        memoryStore.zset.set(key, []);
      }
      const zset = memoryStore.zset.get(key)!;
      const existingIndex = zset.findIndex(item => item.value === member.value);
      if (existingIndex >= 0) {
        zset[existingIndex] = member;
      } else {
        zset.push(member);
      }
      zset.sort((a, b) => a.score - b.score);
      
      return true;
    } catch (error) {
      console.error('ZSet Store zAdd error:', error);
      if (!memoryStore.zset.has(key)) {
        memoryStore.zset.set(key, []);
      }
      const zset = memoryStore.zset.get(key)!;
      const existingIndex = zset.findIndex(item => item.value === member.value);
      if (existingIndex >= 0) {
        zset[existingIndex] = member;
      } else {
        zset.push(member);
      }
      zset.sort((a, b) => a.score - b.score);
      return true;
    }
  },

  zRem: async (key: string, member: string): Promise<boolean> => {
    const zset = memoryStore.zset.get(key);
    if (zset) {
      const index = zset.findIndex(item => item.value === member);
      if (index >= 0) {
        zset.splice(index, 1);
      }
    }
    
    if (!isCacheUsingRedis()) {
      return true;
    }
    
    const redis = await getRedisClient();
    if (!redis) {
      return true;
    }
    
    try {
      await redis.zRem(key, member);
      return true;
    } catch (error) {
      console.error('ZSet Store zRem error:', error);
      return true;
    }
  },

  zRank: async (key: string, member: string): Promise<number | null> => {
    if (!isCacheUsingRedis()) {
      const zset = memoryStore.zset.get(key);
      if (!zset) return null;
      const index = zset.findIndex(item => item.value === member);
      return index >= 0 ? index : null;
    }
    
    const redis = await getRedisClient();
    if (!redis) {
      const zset = memoryStore.zset.get(key);
      if (!zset) return null;
      const index = zset.findIndex(item => item.value === member);
      return index >= 0 ? index : null;
    }
    
    try {
      const result = await redis.zRank(key, member);
      return result;
    } catch (error) {
      console.error('ZSet Store zRank error:', error);
      const zset = memoryStore.zset.get(key);
      if (!zset) return null;
      const index = zset.findIndex(item => item.value === member);
      return index >= 0 ? index : null;
    }
  },

  zCard: async (key: string): Promise<number> => {
    if (!isCacheUsingRedis()) {
      return memoryStore.zset.get(key)?.length || 0;
    }
    
    const redis = await getRedisClient();
    if (!redis) {
      return memoryStore.zset.get(key)?.length || 0;
    }
    
    try {
      const result = await redis.zCard(key);
      return result;
    } catch (error) {
      console.error('ZSet Store zCard error:', error);
      return memoryStore.zset.get(key)?.length || 0;
    }
  },

  zRange: async (key: string, start: number, stop: number): Promise<string[]> => {
    if (!isCacheUsingRedis()) {
      const zset = memoryStore.zset.get(key);
      if (!zset) return [];
      const end = stop < 0 ? zset.length + stop + 1 : stop + 1;
      return zset.slice(start, end).map(item => item.value);
    }
    
    const redis = await getRedisClient();
    if (!redis) {
      const zset = memoryStore.zset.get(key);
      if (!zset) return [];
      const end = stop < 0 ? zset.length + stop + 1 : stop + 1;
      return zset.slice(start, end).map(item => item.value);
    }
    
    try {
      const result = await redis.zRange(key, start, stop);
      return result;
    } catch (error) {
      console.error('ZSet Store zRange error:', error);
      const zset = memoryStore.zset.get(key);
      if (!zset) return [];
      const end = stop < 0 ? zset.length + stop + 1 : stop + 1;
      return zset.slice(start, end).map(item => item.value);
    }
  },

  zRangeByScore: async (key: string, min: number, max: number): Promise<string[]> => {
    if (!isCacheUsingRedis()) {
      const zset = memoryStore.zset.get(key);
      if (!zset) return [];
      return zset
        .filter(item => item.score >= min && item.score <= max)
        .map(item => item.value);
    }
    
    const redis = await getRedisClient();
    if (!redis) {
      const zset = memoryStore.zset.get(key);
      if (!zset) return [];
      return zset
        .filter(item => item.score >= min && item.score <= max)
        .map(item => item.value);
    }
    
    try {
      const result = await redis.zRangeByScore(key, min, max);
      return result;
    } catch (error) {
      console.error('ZSet Store zRangeByScore error:', error);
      const zset = memoryStore.zset.get(key);
      if (!zset) return [];
      return zset
        .filter(item => item.score >= min && item.score <= max)
        .map(item => item.value);
    }
  }
};

export const setStore = {
  sAdd: async (key: string, member: string): Promise<boolean> => {
    if (!isCacheUsingRedis()) {
      if (!memoryStore.set.has(key)) {
        memoryStore.set.set(key, new Set());
      }
      memoryStore.set.get(key)!.add(member);
      return true;
    }
    
    const redis = await getRedisClient();
    if (!redis) {
      if (!memoryStore.set.has(key)) {
        memoryStore.set.set(key, new Set());
      }
      memoryStore.set.get(key)!.add(member);
      return true;
    }
    
    try {
      await redis.sAdd(key, member);
      
      if (!memoryStore.set.has(key)) {
        memoryStore.set.set(key, new Set());
      }
      memoryStore.set.get(key)!.add(member);
      
      return true;
    } catch (error) {
      console.error('Set Store sAdd error:', error);
      if (!memoryStore.set.has(key)) {
        memoryStore.set.set(key, new Set());
      }
      memoryStore.set.get(key)!.add(member);
      return true;
    }
  },

  sRem: async (key: string, member: string): Promise<boolean> => {
    memoryStore.set.get(key)?.delete(member);
    
    if (!isCacheUsingRedis()) {
      return true;
    }
    
    const redis = await getRedisClient();
    if (!redis) {
      return true;
    }
    
    try {
      await redis.sRem(key, member);
      return true;
    } catch (error) {
      console.error('Set Store sRem error:', error);
      return true;
    }
  },

  sIsMember: async (key: string, member: string): Promise<boolean> => {
    if (!isCacheUsingRedis()) {
      return memoryStore.set.get(key)?.has(member) || false;
    }
    
    const redis = await getRedisClient();
    if (!redis) {
      return memoryStore.set.get(key)?.has(member) || false;
    }
    
    try {
      const result = await redis.sIsMember(key, member);
      return result;
    } catch (error) {
      console.error('Set Store sIsMember error:', error);
      return memoryStore.set.get(key)?.has(member) || false;
    }
  },

  sCard: async (key: string): Promise<number> => {
    if (!isCacheUsingRedis()) {
      return memoryStore.set.get(key)?.size || 0;
    }
    
    const redis = await getRedisClient();
    if (!redis) {
      return memoryStore.set.get(key)?.size || 0;
    }
    
    try {
      const result = await redis.sCard(key);
      return result;
    } catch (error) {
      console.error('Set Store sCard error:', error);
      return memoryStore.set.get(key)?.size || 0;
    }
  },

  sMembers: async (key: string): Promise<string[]> => {
    if (!isCacheUsingRedis()) {
      return Array.from(memoryStore.set.get(key) || []);
    }
    
    const redis = await getRedisClient();
    if (!redis) {
      return Array.from(memoryStore.set.get(key) || []);
    }
    
    try {
      const result = await redis.sMembers(key);
      
      memoryStore.set.set(key, new Set(result));
      
      return result;
    } catch (error) {
      console.error('Set Store sMembers error:', error);
      return Array.from(memoryStore.set.get(key) || []);
    }
  }
};

export const rateLimitStore = {
  getSync: (key: string): { count: number; expiresAt: number } | null => {
    const entry = memoryStore.rateLimit.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      memoryStore.rateLimit.delete(key);
      return null;
    }
    return entry;
  },

  setSync: (key: string, value: { count: number; expiresAt: number }): void => {
    memoryStore.rateLimit.set(key, value);
  },

  incrementSync: (key: string): number => {
    const entry = memoryStore.rateLimit.get(key);
    if (entry) {
      entry.count++;
      return entry.count;
    }
    return 0;
  },

  deleteSync: (key: string): void => {
    memoryStore.rateLimit.delete(key);
  },

  cleanupSync: (): void => {
    const now = Date.now();
    memoryStore.rateLimit.forEach((value, key) => {
      if (value.expiresAt < now) {
        memoryStore.rateLimit.delete(key);
      }
    });
  },

  getStatsSync: (): number => {
    return memoryStore.rateLimit.size;
  }
};
