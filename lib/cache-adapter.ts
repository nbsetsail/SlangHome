import { Redis as UpstashRedis } from '@upstash/redis';
import { createClient } from 'redis';

const IS_VERCEL = process.env.VERCEL === '1';

let upstashRedis: UpstashRedis | null = null;
let localRedis: ReturnType<typeof createClient> | null = null;
let isLocalConnecting = false;

function getUpstashRedis(): UpstashRedis {
  if (!upstashRedis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!url || !token) {
      throw new Error('Upstash Redis 配置缺失。请设置 UPSTASH_REDIS_REST_URL 和 UPSTASH_REDIS_REST_TOKEN');
    }
    
    upstashRedis = new UpstashRedis({ url, token });
    console.log('✅ Upstash Redis 连接已建立');
  }
  return upstashRedis;
}

async function getLocalRedis() {
  if (localRedis) {
    return localRedis;
  }
  
  if (isLocalConnecting) {
    while (isLocalConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return localRedis;
  }
  
  isLocalConnecting = true;
  
  try {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379');
    const password = process.env.REDIS_PASSWORD || undefined;
    const db = parseInt(process.env.REDIS_DB || '0');
    
    localRedis = createClient({
      socket: {
        host,
        port,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Redis连接重试次数超过限制');
            return new Error('Redis connection retries exceeded');
          }
          return Math.min(retries * 100, 3000);
        },
        connectTimeout: 5000
      },
      password: password || undefined,
      database: db
    });
    
    localRedis.on('error', (err) => {
      console.error('❌ Redis客户端错误:', err.message);
    });
    
    localRedis.on('connect', () => {
      console.log('📡 Redis连接中...');
    });
    
    localRedis.on('ready', () => {
      console.log('✅ Redis连接就绪');
    });
    
    await localRedis.connect();
    console.log(`✅ 本地 Redis 连接成功 - ${host}:${port} DB:${db}`);
    
    return localRedis;
  } catch (error) {
    console.error('❌ Redis初始化失败:', (error as Error).message);
    localRedis = null;
    throw error;
  } finally {
    isLocalConnecting = false;
  }
}

export async function getRedis(): Promise<any> {
  if (IS_VERCEL) {
    return getUpstashRedis();
  }
  return await getLocalRedis();
}

export async function initRedis(): Promise<void> {
  if (IS_VERCEL) {
    getUpstashRedis();
    console.log('✅ Upstash Redis 初始化完成');
  } else {
    await getLocalRedis();
    console.log('✅ 本地 Redis 初始化完成');
  }
}

export async function isRedisConnected(): Promise<boolean> {
  try {
    if (IS_VERCEL) {
      const client = getUpstashRedis();
      await client.ping();
      return true;
    } else {
      const client = await getLocalRedis();
      if (client) {
        await client.ping();
        return true;
      }
      return false;
    }
  } catch {
    return false;
  }
}

export async function getRedisInfo(): Promise<any> {
  if (IS_VERCEL) {
    return {
      connected: true,
      type: 'upstash',
      url: process.env.UPSTASH_REDIS_REST_URL?.replace(/\/[^\/]*$/, '/***')
    };
  }
  
  try {
    const client = await getLocalRedis();
    if (!client) {
      return {
        connected: false,
        type: 'local',
        error: 'Redis client not available'
      };
    }
    const info = await client.info('memory');
    const dbSize = await client.dbSize();
    
    return {
      connected: true,
      type: 'local',
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || '6379',
      db: process.env.REDIS_DB || '0',
      dbSize,
      info: info.substring(0, 500)
    };
  } catch (error) {
    return {
      connected: false,
      type: 'local',
      error: (error as Error).message
    };
  }
}

export function resetRedisConnection(): void {
  if (IS_VERCEL) {
    upstashRedis = null;
    console.log('🔄 Upstash Redis 连接已重置');
  } else {
    if (localRedis) {
      localRedis.quit().catch(() => {});
      localRedis = null;
    }
    console.log('🔄 本地 Redis 连接已重置');
  }
}

export async function closeRedis(): Promise<void> {
  if (IS_VERCEL) {
    upstashRedis = null;
    console.log('✅ Upstash Redis 连接已关闭');
  } else {
    if (localRedis) {
      await localRedis.quit();
      localRedis = null;
    }
    console.log('✅ 本地 Redis 连接已关闭');
  }
}

export async function getRedisClient(): Promise<any> {
  return getRedis();
}

export { IS_VERCEL };
