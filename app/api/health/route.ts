import { NextResponse } from 'next/server';
import { withReadDb } from '@/lib/db-adapter';
import { getRedisClient } from '@/lib/cache-adapter';

interface HealthCheck {
  status: string;
  latency: number | null;
  error?: string;
}

interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
  };
}

export async function GET() {
  const startTime = Date.now();
  const checks: HealthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: { status: 'unknown', latency: null },
      redis: { status: 'unknown', latency: null }
    }
  };

  try {
    const dbStart = Date.now();
    await withReadDb(async (conn) => {
      await conn.query('SELECT 1');
    });
    checks.checks.database = {
      status: 'healthy',
      latency: Date.now() - dbStart
    };
  } catch (error) {
    checks.checks.database = {
      status: 'unhealthy',
      latency: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    checks.status = 'degraded';
  }

  try {
    const redisStart = Date.now();
    const redis = await getRedisClient();
    if (redis) {
      await redis.ping();
      checks.checks.redis = {
        status: 'healthy',
        latency: Date.now() - redisStart
      };
    } else {
      checks.checks.redis = {
        status: 'unhealthy',
        latency: null,
        error: 'Redis client not initialized'
      };
      checks.status = 'degraded';
    }
  } catch (error) {
    checks.checks.redis = {
      status: 'unhealthy',
      latency: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    checks.status = 'degraded';
  }

  const responseTime = Date.now() - startTime;

  return NextResponse.json({
    ...checks,
    responseTime
  }, { 
    status: checks.status === 'ok' ? 200 : 503 
  });
}
