import { NextResponse, NextRequest } from 'next/server';
import { getQuery, executeQuery, smartInsert, beginTransaction, commitTransaction, rollbackTransaction } from '@/lib/db-adapter';
import { generateUUIDv7 } from '@/lib/uuid.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phrase, explanation, example, origin, categories, tags, user_id, evolution } = body

    if (!phrase || !explanation) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: phrase and explanation'
      }, { status: 400 })
    }

    if (phrase.length > 100) {
      return NextResponse.json({
        success: false,
        error: 'Phrase must be 100 characters or less'
      }, { status: 400 })
    }

    if (explanation.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'Explanation must be at least 10 characters'
      }, { status: 400 })
    }

    const categoryList = categories ? (Array.isArray(categories) ? categories : categories.replace(/，/g, ',').split(',').map((cat: string) => cat.trim()).filter((cat: string) => cat)) : [];
    const tagList = tags ? (Array.isArray(tags) ? tags : tags.replace(/，/g, ',').split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag)) : [];

    const existingRows = await executeQuery('SELECT id FROM slang WHERE phrase = $1', [phrase])

    if (existingRows.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Slang with this phrase already exists'
      }, { status: 400 })
    }

    const slangId = generateUUIDv7();
    const status = 'pending'

    const conn = await beginTransaction()

    try {
      await smartInsert('slang', { 
        id: slangId, phrase, explanation, example: example || null, 
        origin: origin || null, categories: JSON.stringify(categoryList), 
        tags: JSON.stringify(tagList), user_id: user_id || null, status, 
        has_evolution: evolution && evolution.length > 0 ? true : false 
      })

      if (evolution && evolution.length > 0) {
        for (let i = 0; i < evolution.length; i++) {
          const phase = evolution[i]
          await smartInsert('slang_evolution', { 
            slang_id: slangId,
            period: phase.period || null,
            phase: phase.phase || null,
            explanation: phase.explanation || null,
            example: phase.example || null,
            origin: phase.origin || null,
            story: phase.story || null,
            seq: i + 1
          })
        }
      }

      await commitTransaction(conn)
    } catch (error) {
      await rollbackTransaction(conn)
      throw error
    }

    const newSlang = await getQuery(
      `SELECT id, phrase, explanation, example, origin, views, likes, comments_count, favorites, shares, heat, status, user_id, created_at, has_evolution, categories, tags 
       FROM slang WHERE id = $1`, 
      [slangId]
    )

    return NextResponse.json({
      success: true,
      data: newSlang,
      message: 'Slang submitted successfully. It will be reviewed by moderators.'
    }, { status: 201 })

  } catch (error) {
    console.error('Error contributing slang:', error)

    return NextResponse.json({
      success: false,
      error: 'Failed to submit slang',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
