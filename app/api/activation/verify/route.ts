import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, deviceId } = body;
    
    if (!code || !deviceId) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }
    
    const normalizedCode = code.toUpperCase().trim();
    
    const result = await executeQuery<{
      id: number;
      code: string;
      count: number;
      device_ids: string[];
      expired_at: string;
    }[]>(`
      SELECT id, code, count, device_ids, expired_at FROM activation_codes WHERE code = $1
    `, [normalizedCode]);
    
    if (result.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid code' });
    }
    
    const record = result[0];
    
    if (new Date(record.expired_at) < new Date()) {
      return NextResponse.json({ success: false, error: 'Code expired' });
    }
    
    const deviceIds: string[] = record.device_ids || [];
    
    if (deviceIds.includes(deviceId)) {
      return NextResponse.json({ 
        success: true, 
        message: 'Already activated',
        remaining: record.count
      });
    }
    
    if (record.count <= 0) {
      return NextResponse.json({ success: false, error: 'No activations remaining' });
    }
    
    const newDeviceIds = [...deviceIds, deviceId];
    const newCount = record.count - 1;
    
    await executeQuery(
      `UPDATE activation_codes SET count = $1, device_ids = $2::jsonb WHERE id = $3`,
      [newCount, JSON.stringify(newDeviceIds), record.id]
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Activated',
      remaining: newCount
    });
    
  } catch (error) {
    console.error('Activation error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ message: 'Activation API' });
  }
  
  const result = await executeQuery<{
    count: number;
    expired_at: string;
  }[]>(`SELECT count, expired_at FROM activation_codes WHERE code = $1`, [code.toUpperCase()]);
  
  if (result.length === 0) {
    return NextResponse.json({ valid: false, exists: false });
  }
  
  const record = result[0];
  const isExpired = new Date(record.expired_at) < new Date();
  
  return NextResponse.json({ 
    valid: !isExpired && record.count > 0,
    exists: true,
    remaining: record.count,
    expiresAt: record.expired_at
  });
}
