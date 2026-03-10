import { NextResponse } from 'next/server'
import { getActiveLocales } from '@/lib/locale.js'

export async function GET() {
  try {
    const locales = await getActiveLocales()
    return NextResponse.json({ locales })
  } catch (error) {
    console.error('Error fetching locales:', error)
    return NextResponse.json({ error: 'Failed to fetch locales' }, { status: 500 })
  }
}
