import { NextResponse } from 'next/server';
import { getQuery, smartInsert, smartUpdate, beginTransaction, commitTransaction, rollbackTransaction } from '@/lib/db-adapter';
import { createSlangVersion, getCurrentSlangVersion } from '@/lib/version-control';
import { cacheDelPattern } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const slang = await getQuery(
      `SELECT s.*, 
        (SELECT json_agg(e ORDER BY e.seq) 
         FROM slang_evolution e 
         WHERE e.slang_id = s.id) as evolution
       FROM slang s 
       WHERE s.id = $1`,
      [id]
    );
    
    if (!slang) {
      return NextResponse.json({ error: 'Slang not found' }, { status: 404 });
    }
    
    const currentVersion = await getCurrentSlangVersion(id);
    
    return NextResponse.json({
      slang,
      currentVersion
    });
  } catch (error) {
    console.error('Error fetching slang for maintenance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch slang' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      phrase, 
      explanation, 
      example, 
      origin, 
      categories, 
      tags, 
      editSummary,
      userId,
      evolution 
    } = body;

    if (!phrase || !explanation) {
      return NextResponse.json(
        { error: 'Phrase and explanation are required' },
        { status: 400 }
      );
    }

    const existingSlang = await getQuery(
      'SELECT id FROM slang WHERE phrase = $1 AND id != $2',
      [phrase, id]
    );
    
    if (existingSlang) {
      return NextResponse.json(
        { error: 'Slang with this phrase already exists' },
        { status: 400 }
      );
    }

    const conn = await beginTransaction();

    try {
      await createSlangVersion(
        id,
        { phrase, explanation, example, origin, categories, tags },
        userId || null,
        editSummary,
        'edit'
      );

      if (evolution && Array.isArray(evolution)) {
        for (const evo of evolution) {
          if (evo.id) {
            await smartUpdate('slang_evolution', { 
              period: evo.period || null, 
              phase: evo.phase || null, 
              explanation: evo.explanation || null, 
              example: evo.example || null, 
              origin: evo.origin || null, 
              story: evo.story || null, 
              seq: evo.seq || null 
            }, 'id = $1', [evo.id]);
          } else {
            await smartInsert('slang_evolution', { 
              slang_id: id, 
              period: evo.period || null, 
              phase: evo.phase || null, 
              explanation: evo.explanation || null, 
              example: evo.example || null, 
              origin: evo.origin || null, 
              story: evo.story || null, 
              seq: evo.seq || null 
            });
          }
        }
      }

      await commitTransaction(conn);

      await cacheDelPattern('slang:*');
      await cacheDelPattern(`slang:${id}:*`);

      const updatedSlang = await getQuery(
        `SELECT s.*, 
          (SELECT json_agg(e ORDER BY e.seq) 
           FROM slang_evolution e 
           WHERE e.slang_id = s.id) as evolution
         FROM slang s 
         WHERE s.id = $1`,
        [id]
      );

      return NextResponse.json({
        success: true,
        slang: updatedSlang
      });
    } catch (error) {
      await rollbackTransaction(conn);
      throw error;
    }
  } catch (error) {
    console.error('Error updating slang:', error);
    return NextResponse.json(
      { error: 'Failed to update slang' },
      { status: 500 }
    );
  }
}
