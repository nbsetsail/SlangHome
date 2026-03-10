import { NextResponse } from 'next/server';
import { getSlangVersionById, rollbackSlangVersion } from '@/lib/version-control';
import { cacheDelPattern } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { versionId, userId, editSummary } = body;

    if (!versionId) {
      return NextResponse.json(
        { error: 'Version ID is required' },
        { status: 400 }
      );
    }

    const version = await getSlangVersionById(versionId);
    if (!version || version.slang_id !== id) {
      return NextResponse.json(
        { error: 'Version not found or does not belong to this slang' },
        { status: 404 }
      );
    }

    const newVersion = await rollbackSlangVersion(versionId, userId || null, editSummary);

    await cacheDelPattern('slang:*');
    await cacheDelPattern(`slang:${id}:*`);

    return NextResponse.json({
      success: true,
      version: newVersion,
      message: `Successfully rolled back to version ${version.version_number}`
    });
  } catch (error) {
    console.error('Error rolling back version:', error);
    return NextResponse.json(
      { error: 'Failed to rollback version' },
      { status: 500 }
    );
  }
}
