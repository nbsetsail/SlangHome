import { NextResponse } from 'next/server';
import { calculateAllHeat, calculateSlangHeat, calculateCategoryHeat, calculateTagHeat } from '@/lib/calculateHeat.js';
import { checkMgrAuth, unauthorizedResponse } from '../auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const authResult = await checkMgrAuth(['admin']);
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status);
  }

  try {
    const result = await calculateAllHeat();
    
    return NextResponse.json({
      success: true,
      message: 'Heat calculation completed',
      data: result
    });
  } catch (error) {
    console.error('Error calculating heat:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate heat' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const authResult = await checkMgrAuth(['admin']);
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status);
  }

  try {
    const { type } = await request.json();
    
    let result;
    switch (type) {
      case 'slang':
        result = await calculateSlangHeat();
        break;
      case 'category':
        result = await calculateCategoryHeat();
        break;
      case 'tag':
        result = await calculateTagHeat();
        break;
      default:
        result = await calculateAllHeat();
    }
    
    return NextResponse.json({
      success: true,
      message: `${type || 'all'} heat calculation completed`,
      data: { count: result }
    });
  } catch (error) {
    console.error('Error calculating heat:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate heat' },
      { status: 500 }
    );
  }
}
