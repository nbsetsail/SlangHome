import { NextResponse } from 'next/server';
import { withReadDb } from '@/lib/db-adapter';

export async function GET() {
  const startTime = Date.now();
  
  try {
    await withReadDb(async (conn) => {
      await conn.query('SELECT 1');
    });
    
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
