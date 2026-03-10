import { NextResponse } from 'next/server';
import { getEvolutionById } from '@/lib/db-adapter';

export async function GET(request) {
  const url = new URL(request.url)
  const slangId = url.searchParams.get('slangId')

  if (!slangId) {
    return NextResponse.json({ error: 'Slang ID is required' }, { status: 400 })
  }

  try {
    const evolution = await getEvolutionById(slangId)
    return NextResponse.json({ evolution })
  } catch (error) {
    console.error('Error fetching evolution:', error)
    return NextResponse.json({ error: 'Failed to fetch evolution data' }, { status: 500 })
  }
}
