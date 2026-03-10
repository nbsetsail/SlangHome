import { getRedis } from './cache-adapter';

export async function mget(keys: string[]): Promise<(string | null)[]> {
  if (!keys || keys.length === 0) {
    return [];
  }

  const redis = await getRedis();
  if (!redis) {
    return keys.map(() => null);
  }

  try {
    if (process.env.USE_UPSTASH === 'true') {
      const results = await redis.mget(...keys);
      return results as (string | null)[];
    } else {
      const results = await redis.mGet(keys);
      return results as (string | null)[];
    }
  } catch (error) {
    console.error('批量获取缓存失败:', error);
    return keys.map(() => null);
  }
}

export async function mset(
  keyValuePairs: Array<{ key: string; value: string; ttl?: number }>
): Promise<boolean> {
  if (!keyValuePairs || keyValuePairs.length === 0) {
    return true;
  }

  const redis = await getRedis();
  if (!redis) {
    return false;
  }

  try {
    if (process.env.USE_UPSTASH === 'true') {
      const pipeline = redis.pipeline();
      for (const { key, value, ttl } of keyValuePairs) {
        if (ttl) {
          pipeline.set(key, value, { ex: ttl });
        } else {
          pipeline.set(key, value);
        }
      }
      await pipeline.exec();
    } else {
      const multi = redis.multi();
      for (const { key, value, ttl } of keyValuePairs) {
        if (ttl) {
          multi.setEx(key, ttl, value);
        } else {
          multi.set(key, value);
        }
      }
      await multi.exec();
    }
    return true;
  } catch (error) {
    console.error('批量设置缓存失败:', error);
    return false;
  }
}

export async function mdel(keys: string[]): Promise<boolean> {
  if (!keys || keys.length === 0) {
    return true;
  }

  const redis = await getRedis();
  if (!redis) {
    return false;
  }

  try {
    if (process.env.USE_UPSTASH === 'true') {
      await redis.del(...keys);
    } else {
      await redis.del(keys);
    }
    return true;
  } catch (error) {
    console.error('批量删除缓存失败:', error);
    return false;
  }
}

export async function mgetJson<T = any>(keys: string[]): Promise<(T | null)[]> {
  const results = await mget(keys);
  return results.map(result => {
    if (!result) return null;
    try {
      return JSON.parse(result) as T;
    } catch {
      return null;
    }
  });
}

export async function msetJson(
  keyValuePairs: Array<{ key: string; value: any; ttl?: number }>
): Promise<boolean> {
  const stringPairs = keyValuePairs.map(({ key, value, ttl }) => ({
    key,
    value: JSON.stringify(value),
    ttl
  }));
  return mset(stringPairs);
}

export async function batchGetWithFallback<T>(
  keys: string[],
  fallbackFn: (missingKeys: string[]) => Promise<Record<string, T>>,
  ttl: number = 3600
): Promise<Record<string, T>> {
  const cachedResults = await mgetJson<T>(keys);
  
  const result: Record<string, T> = {};
  const missingKeys: string[] = [];
  
  keys.forEach((key, index) => {
    if (cachedResults[index] !== null) {
      result[key] = cachedResults[index] as T;
    } else {
      missingKeys.push(key);
    }
  });
  
  if (missingKeys.length > 0) {
    const freshData = await fallbackFn(missingKeys);
    
    const toCache: Array<{ key: string; value: T; ttl: number }> = [];
    for (const key of missingKeys) {
      if (freshData[key] !== undefined) {
        result[key] = freshData[key];
        toCache.push({ key, value: freshData[key], ttl });
      }
    }
    
    if (toCache.length > 0) {
      await msetJson(toCache);
    }
  }
  
  return result;
}
