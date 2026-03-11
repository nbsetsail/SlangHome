import { getRedis, isUpstash, IS_VERCEL } from './cache-adapter';

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

class SmartCache {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private defaultTTL: number;
  private memoryTTL: number;
  private stats = {
    memoryHits: 0,
    redisHits: 0,
    misses: 0,
  };

  constructor(defaultTTL: number = 3600, memoryTTL: number = 60) {
    this.defaultTTL = defaultTTL;
    this.memoryTTL = memoryTTL;
    
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        this.cleanupExpired();
      }, 60000);
    }
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiry < now) {
        this.memoryCache.delete(key);
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const cached = this.memoryCache.get(key);
    if (cached && cached.expiry > Date.now()) {
      this.stats.memoryHits++;
      return cached.value as T;
    }

    try {
      const redis = await getRedis();
      if (!redis) {
        this.stats.misses++;
        return null;
      }
      
      const fromRedis = await (redis as any).get(key);
      
      if (fromRedis !== null) {
        this.stats.redisHits++;
        
        let parsedValue: T;
        if (typeof fromRedis === 'string') {
          try {
            parsedValue = JSON.parse(fromRedis);
          } catch {
            parsedValue = fromRedis as T;
          }
        } else {
          parsedValue = fromRedis as T;
        }
        
        this.memoryCache.set(key, {
          value: parsedValue,
          expiry: Date.now() + this.memoryTTL * 1000,
        });
        
        return parsedValue;
      }
      
      this.stats.misses++;
      return null;
    } catch (error) {
      console.error('SmartCache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const effectiveTTL = ttl || this.defaultTTL;
    
    this.memoryCache.set(key, {
      value,
      expiry: Date.now() + this.memoryTTL * 1000,
    });

    try {
      const redis = await getRedis();
      if (!redis) return false;
      
      const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (isUpstash()) {
        await (redis as any).set(key, valueToStore, { ex: effectiveTTL });
      } else {
        await (redis as any).setEx(key, effectiveTTL, valueToStore);
      }
      
      return true;
    } catch (error) {
      console.error('SmartCache set error:', error);
      return false;
    }
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T | null> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    try {
      const value = await fetcher();
      await this.set(key, value, ttl);
      return value;
    } catch (error) {
      console.error('SmartCache getOrSet fetcher error:', error);
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    this.memoryCache.delete(key);

    try {
      const redis = await getRedis();
      if (!redis) return false;
      await (redis as any).del(key);
      return true;
    } catch (error) {
      console.error('SmartCache delete error:', error);
      return false;
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    let deleted = 0;
    
    for (const key of this.memoryCache.keys()) {
      if (this.matchPattern(key, pattern)) {
        this.memoryCache.delete(key);
        deleted++;
      }
    }

    try {
      const redis = await getRedis();
      if (!redis) return deleted;
      
      if (isUpstash()) {
        const keys: string[] = [];
        let cursor = 0;
        
        do {
          const result = await (redis as any).scan(cursor, { match: pattern, count: 100 });
          cursor = result.cursor;
          keys.push(...result.keys);
        } while (cursor !== 0);
        
        if (keys.length > 0) {
          for (const key of keys) {
            await (redis as any).del(key);
          }
          deleted += keys.length;
        }
      } else {
        const keys = await (redis as any).keys(pattern);
        if (keys.length > 0) {
          await (redis as any).del(keys);
          deleted += keys.length;
        }
      }
    } catch (error) {
      console.error('SmartCache deletePattern error:', error);
    }

    return deleted;
  }

  private matchPattern(key: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(key);
  }

  getStats() {
    const total = this.stats.memoryHits + this.stats.redisHits + this.stats.misses;
    return {
      ...this.stats,
      total,
      memoryHitRate: total > 0 ? (this.stats.memoryHits / total * 100).toFixed(2) : '0',
      redisHitRate: total > 0 ? (this.stats.redisHits / total * 100).toFixed(2) : '0',
      missRate: total > 0 ? (this.stats.misses / total * 100).toFixed(2) : '0',
      memoryCacheSize: this.memoryCache.size,
      mode: IS_VERCEL ? 'upstash' : 'local-redis'
    };
  }

  resetStats(): void {
    this.stats = {
      memoryHits: 0,
      redisHits: 0,
      misses: 0,
    };
  }

  clearMemoryCache(): void {
    this.memoryCache.clear();
  }
}

export const smartCache = new SmartCache();

export async function smartGet<T>(key: string): Promise<T | null> {
  return smartCache.get<T>(key);
}

export async function smartSet<T>(key: string, value: T, ttl?: number): Promise<boolean> {
  return smartCache.set(key, value, ttl);
}

export async function smartGetOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T | null> {
  return smartCache.getOrSet(key, fetcher, ttl);
}

export async function smartDelete(key: string): Promise<boolean> {
  return smartCache.delete(key);
}

export async function smartDeletePattern(pattern: string): Promise<number> {
  return smartCache.deletePattern(pattern);
}

export function getSmartCacheStats() {
  return smartCache.getStats();
}
