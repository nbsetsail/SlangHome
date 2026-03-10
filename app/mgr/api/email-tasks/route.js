import { NextResponse } from 'next/server'
import { getQuery, allQuery, runQuery, executeQuery, beginTransaction, commitTransaction, rollbackTransaction, smartInsert, smartUpdate, smartUpsert } from '@/lib/db-adapter'
import { checkMgrAuth, unauthorizedResponse } from '../auth'
import { emailService, isEmailEnabled } from '@/lib/email'
import { getConfig, configKeys } from '@/lib/system-config'
import { getUTCTimestamp } from '@/lib/date-utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request) {
  const authResult = await checkMgrAuth()
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status)
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const offset = (page - 1) * limit

    const conditions = ['1=1']
    const params = []
    let paramIndex = 1

    if (status) {
      conditions.push(`t.status = $${paramIndex++}`)
      params.push(status)
    }

    if (type) {
      conditions.push(`t.type = $${paramIndex++}`)
      params.push(type)
    }

    const whereClause = conditions.join(' AND ')

    const countSql = `SELECT COUNT(*) as total FROM email_tasks t WHERE ${whereClause}`
    const countResult = await getQuery(countSql, params.slice(0, -2))
    const total = countResult?.total || 0

    const tasksSql = `
      SELECT t.*, u.username as creator_name, a.username as approver_name 
      FROM email_tasks t 
      LEFT JOIN users u ON t.created_by = u.id 
      LEFT JOIN users a ON t.approved_by = a.id 
      WHERE ${whereClause}
      ORDER BY t.created_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `
    params.push(limit, offset)

    const tasks = await allQuery(tasksSql, params)

    return NextResponse.json({ 
      success: true,
      tasks, 
      total,
      page,
      limit 
    })
  } catch (error) {
    console.error('Get email tasks error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  const authResult = await checkMgrAuth()
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status)
  }

  try {
    const data = await request.json()
    const { 
      template_id, 
      type, 
      subject, 
      html_content, 
      text_content,
      recipient_type,
      recipient_email,
      recipient_role,
      scheduled_at
    } = data

    if (!type || !subject || !html_content) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    let recipientCount = 0

    if (recipient_type === 'single' && recipient_email) {
      recipientCount = 1
    } else if (recipient_type === 'role' && recipient_role) {
      const roleCount = await getQuery(
        'SELECT COUNT(*) as count FROM users WHERE role = $1 AND status = $2',
        [recipient_role, 'active']
      )
      recipientCount = roleCount?.count || 0
    } else if (recipient_type === 'all_users') {
      const allCount = await getQuery(
        'SELECT COUNT(*) as count FROM users WHERE status = $1',
        ['active']
      )
      recipientCount = allCount?.count || 0
    }

    const status = (type === 'operation_report' || type === 'annual_summary') ? 'pending_approval' : 'approved'

    const result = await smartInsert('email_tasks', {
      template_id: template_id || null,
      type,
      subject,
      html_content,
      text_content: text_content || null,
      recipient_type: recipient_type || 'single',
      recipient_email: recipient_email || null,
      recipient_role: recipient_role || null,
      recipient_count: recipientCount,
      status,
      scheduled_at: scheduled_at || null,
      created_by: authResult.user.id
    })

    return NextResponse.json({ 
      success: true, 
      taskId: result.insertId,
      recipientCount 
    })
  } catch (error) {
    console.error('Create email task error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  const authResult = await checkMgrAuth()
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult.error, authResult.status)
  }

  try {
    const data = await request.json()
    const { id, action, subject, html_content, text_content, scheduled_at } = data

    if (!id) {
      return NextResponse.json({ success: false, error: 'Task ID is required' }, { status: 400 })
    }

    if (action === 'send') {
      return await sendEmailTask(id, authResult.user.id)
    }

    if (action === 'approve') {
      const task = await getQuery('SELECT * FROM email_tasks WHERE id = $1', [id])

      if (!task || task.status !== 'pending_approval') {
        return NextResponse.json({ success: false, error: 'Task not found or not pending approval' }, { status: 400 })
      }

      if (task.type === 'operation_report' && authResult.user.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Only admin can approve operation reports' }, { status: 403 })
      }

      const now = getUTCTimestamp()
      await smartUpdate('email_tasks', 
        { status: 'approved', approved_by: authResult.user.id, approved_at: now }, 
        'id = $1', 
        [id]
      )

      return NextResponse.json({ success: true, message: 'Task approved' })
    }

    if (action === 'reject') {
      const task = await getQuery('SELECT type FROM email_tasks WHERE id = $1', [id])

      if (!task) {
        return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
      }

      if (task.type === 'operation_report' && authResult.user.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Only admin can reject operation reports' }, { status: 403 })
      }

      await executeQuery('UPDATE email_tasks SET status = $1 WHERE id = $2', ['cancelled', id])

      return NextResponse.json({ success: true, message: 'Task rejected' })
    }

    const updates = []
    const params = []
    let paramIndex = 1

    if (subject !== undefined) {
      updates.push(`subject = $${paramIndex++}`)
      params.push(subject)
    }
    if (html_content !== undefined) {
      updates.push(`html_content = $${paramIndex++}`)
      params.push(html_content)
    }
    if (text_content !== undefined) {
      updates.push(`text_content = $${paramIndex++}`)
      params.push(text_content)
    }
    if (scheduled_at !== undefined) {
      updates.push(`scheduled_at = $${paramIndex++}`)
      params.push(scheduled_at)
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 })
    }

    params.push(id)
    await executeQuery(`UPDATE email_tasks SET ${updates.join(', ')} WHERE id = $${paramIndex}`, params)

    return NextResponse.json({ success: true, message: 'Task updated' })
  } catch (error) {
    console.error('Update email task error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

async function sendEmailTask(taskId, userId) {
  if (!isEmailEnabled()) {
    return NextResponse.json({ success: false, error: 'Email service is disabled' }, { status: 400 })
  }

  const batchConfig = await getConfig(configKeys.batchUpdate) || { enabled: true, maxBatchSize: 100 }
  const dbWriteBatchSize = batchConfig.maxBatchSize || 100

  const task = await getQuery('SELECT * FROM email_tasks WHERE id = $1', [taskId])

  if (!task) {
    return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
  }

  if (task.status !== 'approved') {
    return NextResponse.json({ success: false, error: 'Task is not approved' }, { status: 400 })
  }

  await executeQuery('UPDATE email_tasks SET status = $1 WHERE id = $2', ['sending', taskId])

  let recipients = []

  if (task.recipient_type === 'single') {
    recipients = [{ email: task.recipient_email }]
  } else if (task.recipient_type === 'role') {
    recipients = await allQuery(
      'SELECT id, email, username FROM users WHERE role = $1 AND status = $2',
      [task.recipient_role, 'active']
    )
  } else if (task.recipient_type === 'all_users') {
    if (task.type === 'annual_summary') {
      const year = new Date().getFullYear() - 1
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`
      
      recipients = await allQuery(`
        SELECT 
          u.id,
          u.email,
          u.username,
          DATE_PART('day', $1::timestamp - u.created_at) as days_member,
          (SELECT COUNT(*) FROM views v WHERE v.user_id = u.id AND v.created_at BETWEEN $2 AND $3) as slang_viewed,
          (SELECT COUNT(*) FROM favorites f WHERE f.user_id = u.id AND f.created_at BETWEEN $2 AND $3) as favorites,
          (SELECT COUNT(*) FROM likes l WHERE l.user_id = u.id AND l.created_at BETWEEN $2 AND $3) as likes_count,
          (SELECT COUNT(*) FROM comments c WHERE c.user_id = u.id AND c.created_at BETWEEN $2 AND $3) as comments_count,
          (SELECT COUNT(*) FROM shares s WHERE s.user_id = u.id AND s.created_at BETWEEN $2 AND $3) as shares_count,
          (SELECT COUNT(*) FROM slang sl WHERE sl.created_by = u.id AND sl.created_at BETWEEN $2 AND $3) as contributions
        FROM users u
        WHERE u.status = 'active'
      `, [endDate, startDate, endDate])
    } else {
      recipients = await allQuery('SELECT id, email, username FROM users WHERE status = $1', ['active'])
    }
  }

  let sentCount = 0
  let failedCount = 0
  const batchSize = 100
  const delayBetweenBatches = 30000

  const pendingResults = []

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize)

    for (const recipient of batch) {
      try {
        let personalizedHtml = task.html_content

        personalizedHtml = personalizedHtml
          .replace(/\{\{email\}\}/g, recipient.email)
          .replace(/\{\{username\}\}/g, recipient.username || 'User')

        if (task.type === 'annual_summary') {
          const year = new Date().getFullYear() - 1
          personalizedHtml = personalizedHtml
            .replace(/\{\{year\}\}/g, year)
            .replace(/\{\{days_member\}\}/g, recipient.days_member || 0)
            .replace(/\{\{slang_viewed\}\}/g, recipient.slang_viewed || 0)
            .replace(/\{\{favorites\}\}/g, recipient.favorites || 0)
            .replace(/\{\{likes_count\}\}/g, recipient.likes_count || 0)
            .replace(/\{\{comments_count\}\}/g, recipient.comments_count || 0)
            .replace(/\{\{shares_count\}\}/g, recipient.shares_count || 0)
            .replace(/\{\{contributions\}\}/g, recipient.contributions || 0)
        }

        const success = await emailService.sendEmail(
          recipient.email,
          task.subject,
          personalizedHtml,
          task.text_content
        )

        if (success) {
          sentCount++
          pendingResults.push({
            userId: recipient.id || null,
            email: recipient.email,
            status: 'sent',
            errorMessage: null
          })
        } else {
          failedCount++
          pendingResults.push({
            userId: recipient.id || null,
            email: recipient.email,
            status: 'failed',
            errorMessage: 'Send failed'
          })
        }
      } catch (error) {
        failedCount++
        pendingResults.push({
          userId: recipient.id || null,
          email: recipient.email,
          status: 'failed',
          errorMessage: error.message
        })
      }

      if (pendingResults.length >= dbWriteBatchSize) {
        await flushPendingResults(taskId, pendingResults)
        pendingResults.length = 0
      }
    }

    if (pendingResults.length > 0) {
      await flushPendingResults(taskId, pendingResults)
      pendingResults.length = 0
    }

    await executeQuery(
      'UPDATE email_tasks SET sent_count = $1, failed_count = $2 WHERE id = $3',
      [sentCount, failedCount, taskId]
    )

    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
    }
  }

  if (pendingResults.length > 0) {
    await flushPendingResults(taskId, pendingResults)
    pendingResults.length = 0
  }

  const finalStatus = failedCount === 0 ? 'sent' : (sentCount > 0 ? 'sent' : 'failed')

  const now = getUTCTimestamp()
  await smartUpdate('email_tasks', { status: finalStatus, sent_at: now }, 'id = $1', [taskId])

  return NextResponse.json({ 
    success: true, 
    sentCount, 
    failedCount,
    total: recipients.length 
  })
}

async function flushPendingResults(taskId, results) {
  if (results.length === 0) return

  const now = getUTCTimestamp()
  for (const result of results) {
    if (result.status === 'sent') {
      await smartUpsert('email_task_recipients', {
        task_id: taskId,
        user_id: result.userId,
        email: result.email,
        status: 'sent',
        sent_at: now
      }, ['task_id', 'email'])
    } else {
      await smartUpsert('email_task_recipients', {
        task_id: taskId,
        user_id: result.userId,
        email: result.email,
        status: 'failed',
        error_message: result.errorMessage
      }, ['task_id', 'email'])
    }
  }
}
