import { getReadDb, getWriteDb, releaseDb } from '@/lib/db-adapter';
import { smartInsert, smartUpdate } from '@/lib/db-adapter';
import { NextResponse } from 'next/server';
import { checkMgrAuth, unauthorizedResponse } from '../auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  const authResult = await checkMgrAuth(['admin', 'moderator']);
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status);
  }

  let connection = null;
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const isActive = searchParams.get('is_active');

    connection = await getReadDb();
    
    let query = 'SELECT * FROM email_templates WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (isActive !== null) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(isActive === 'true' ? 1 : 0);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await connection.query(query, params);

    return NextResponse.json({ success: true, templates: result.rows });
  } catch (error) {
    console.error('Get email templates error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (connection) await releaseDb(connection);
  }
}

export async function POST(request) {
  const authResult = await checkMgrAuth(['admin', 'moderator']);
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status);
  }

  let connection = null;
  try {
    connection = await getWriteDb();
    
    const data = await request.json();
    const { name, type, subject, html_content, text_content, variables, description } = data;

    if (!name || !type || !subject || !html_content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await smartInsert('email_templates', {
      name,
      type,
      subject,
      html_content,
      text_content: text_content || null,
      variables: variables ? JSON.stringify(variables) : null,
      description: description || null,
      created_by: authResult.user.id
    });

    return NextResponse.json({ 
      success: true, 
      templateId: result.insertId 
    });
  } catch (error) {
    console.error('Create email template error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Template name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (connection) await releaseDb(connection);
  }
}

export async function PUT(request) {
  const authResult = await checkMgrAuth(['admin', 'moderator']);
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status);
  }

  let connection = null;
  try {
    connection = await getWriteDb();
    
    const data = await request.json();
    const { id, name, type, subject, html_content, text_content, variables, description, is_active } = data;

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (subject !== undefined) updateData.subject = subject;
    if (html_content !== undefined) updateData.html_content = html_content;
    if (text_content !== undefined) updateData.text_content = text_content;
    if (variables !== undefined) updateData.variables = variables ? JSON.stringify(variables) : null;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active ? 1 : 0;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    await smartUpdate('email_templates', updateData, 'id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update email template error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (connection) await releaseDb(connection);
  }
}

export async function DELETE(request) {
  const authResult = await checkMgrAuth(['admin']);
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status);
  }

  let connection = null;
  try {
    connection = await getWriteDb();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    await connection.query('DELETE FROM email_templates WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete email template error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (connection) await releaseDb(connection);
  }
}
