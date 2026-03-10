import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/cache-adapter';

export async function GET() {
  const startTime = Date.now();
  
  try {
    const redis = await getRedisClient();
    
    if (!redis) {
      return NextResponse.json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        latency: Date.now() - startTime,
        error: 'Redis client not initialized'
      }, { status: 503 });
    }
    
    await redis.ping();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      latency: Date.now() - startTime
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}
