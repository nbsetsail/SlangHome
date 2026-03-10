import { NextResponse } from 'next/server';
import { getSlangVersions, getSlangVersionById, compareSlangVersions } from '@/lib/version-control';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const versionId = searchParams.get('versionId');
    const compareWith = searchParams.get('compareWith');

    if (versionId && compareWith) {
      const v1 = await getSlangVersionById(versionId);
      const v2 = await getSlangVersionById(compareWith);
      
      if (!v1 || !v2) {
        return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      }
      
      const diff = compareSlangVersions(v1, v2);
      return NextResponse.json({ v1, v2, diff });
    }

    if (versionId) {
      const version = await getSlangVersionById(versionId);
      if (!version) {
        return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      }
      return NextResponse.json({ version });
    }

    const { versions, total } = await getSlangVersions(id, page, limit);
    
    return NextResponse.json({
      versions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching slang versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}
