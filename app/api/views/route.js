import { NextResponse } from 'next/server';
import { incrementCounter } from '@/lib/batch-queue';

export async function POST(request) {
  try {
    const { slangId } = await request.json()

    if (!slangId) {
      return NextResponse.json({ error: 'Slang ID is required' }, { status: 400 })
    }
    
    await incrementCounter('views', slangId, 1);
    
    return NextResponse.json({ success: true, message: 'View count queued for update' })
  } catch (error) {
    console.error('Error incrementing view count:', error)
    return NextResponse.json({ error: 'Failed to increment view count' }, { status: 500 })
  }
}
