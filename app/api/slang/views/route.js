import { NextResponse } from 'next/server';
import { heatCounters } from '@/lib/cache';

export async function POST(request) {
  try {
    const { slangId } = await request.json()

    if (!slangId) {
      return NextResponse.json({ error: 'Slang ID is required' }, { status: 400 })
    }

    await heatCounters.incrSlangViews(slangId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error incrementing view count:', error)
    return NextResponse.json({ error: 'Failed to increment view count' }, { status: 500 })
  }
}
