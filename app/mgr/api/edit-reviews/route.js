import { NextResponse } from 'next/server';
import { getQuery, allQuery, executeQuery, smartUpdate, smartInsert } from '@/lib/db-adapter';
import { checkMgrAuth, unauthorizedResponse, getLocaleFilter } from '../auth';
import { getUTCTimestamp } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  const authResult = await checkMgrAuth();
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status);
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'pending';
    const locale = searchParams.get('locale') || '';
    const offset = (page - 1) * limit;

    const localeFilter = getLocaleFilter(authResult);
    
    if (locale && localeFilter && !localeFilter.includes(locale)) {
      return NextResponse.json({
        success: false,
        error: `You do not have permission to manage locale: ${locale}`,
        managedLocales: authResult.managedLocales
      }, { status: 403 });
    }

    let whereConditions = ['er.status = $1'];
    const params: any[] = [status];
    let paramIndex = 2;

    if (locale) {
      whereConditions.push(`s.locale = $${paramIndex}`);
      params.push(locale);
      paramIndex++;
    } else if (localeFilter) {
      whereConditions.push(`s.locale IN (${localeFilter.map((_, i) => `$${paramIndex + i}`).join(', ')})`);
      params.push(...localeFilter);
      paramIndex += localeFilter.length;
    }

    const whereClause = whereConditions.join(' AND ');

    const countResult = await getQuery(
      `SELECT COUNT(*) as count FROM edit_reviews er 
       JOIN slang_versions sv ON er.version_id = sv.id 
       JOIN slang s ON sv.slang_id = s.id 
       WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult?.count || '0');

    const reviews = await allQuery(
      `SELECT 
        er.id, er.status, er.review_comment, er.reviewed_at, er.created_at,
        sv.id as version_id, sv.version_number, sv.edit_type, sv.edit_summary,
        sv.phrase, sv.explanation, sv.example, sv.origin, sv.categories, sv.tags,
        s.id as slang_id, s.phrase as current_phrase, s.explanation as current_explanation,
        s.locale,
        u.name as editor_name,
        reviewer.name as reviewer_name
       FROM edit_reviews er 
       JOIN slang_versions sv ON er.version_id = sv.id 
       JOIN slang s ON sv.slang_id = s.id 
       LEFT JOIN users u ON sv.editor_id = u.id
       LEFT JOIN users reviewer ON er.reviewer_id = reviewer.id
       WHERE ${whereClause}
       ORDER BY er.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching edit reviews:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch edit reviews'
    }, { status: 500 });
  }
}

export async function POST(request) {
  const authResult = await checkMgrAuth();
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status);
  }

  try {
    const data = await request.json();
    const { versionId, action, reviewComment } = data;

    if (!versionId || !action) {
      return NextResponse.json({
        success: false,
        error: 'Version ID and action are required'
      }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Must be approve or reject'
      }, { status: 400 });
    }

    const version = await getQuery(
      `SELECT sv.*, s.locale FROM slang_versions sv 
       JOIN slang s ON sv.slang_id = s.id 
       WHERE sv.id = $1`,
      [versionId]
    );

    if (!version) {
      return NextResponse.json({
        success: false,
        error: 'Version not found'
      }, { status: 404 });
    }

    const localeFilter = getLocaleFilter(authResult);
    if (localeFilter && !localeFilter.includes(version.locale)) {
      return NextResponse.json({
        success: false,
        error: `You do not have permission to manage locale: ${version.locale}`,
        managedLocales: authResult.managedLocales
      }, { status: 403 });
    }

    const now = getUTCTimestamp();
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await smartUpdate('edit_reviews', 
      { 
        status: newStatus, 
        review_comment: reviewComment || null, 
        reviewer_id: authResult.user.id,
        reviewed_at: now
      }, 
      'version_id = $1', 
      [versionId]
    );

    if (action === 'approve') {
      await smartUpdate('slang_versions', 
        { is_current: false }, 
        'slang_id = $1 AND is_current = true', 
        [version.slang_id]
      );
      
      await smartUpdate('slang_versions', 
        { is_current: true }, 
        'id = $1', 
        [versionId]
      );
      
      await smartUpdate('slang', 
        { 
          phrase: version.phrase, 
          explanation: version.explanation, 
          example: version.example, 
          origin: version.origin, 
          categories: version.categories, 
          tags: version.tags 
        }, 
        'id = $1', 
        [version.slang_id]
      );
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Edit approved and applied' : 'Edit rejected'
    });
  } catch (error) {
    console.error('Error processing edit review:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process edit review'
    }, { status: 500 });
  }
}
