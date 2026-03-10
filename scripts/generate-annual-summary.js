#!/usr/bin/env node

/**
 * Annual Summary Email Generator
 * Automatically generates personalized annual summary emails for all users
 * Run: node scripts/generate-annual-summary.js [year]
 */

import 'dotenv/config';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { getWriteDb, releaseDb, closePools, smartInsert } = await import('../lib/db-adapter.js');
import { getConfig, loadAllConfigsFromDB, configKeys } from '../lib/system-config';
import { getUTCTimestamp } from '../lib/date-utils';

async function generateAnnualSummary(year = new Date().getFullYear() - 1) {
  await loadAllConfigsFromDB();
  const reportConfig = await getConfig(configKeys.report);
  const annualConfig = reportConfig?.annualSummary || {};
  
  if (annualConfig.enabled === false) {
    console.log('⚠️  Annual summary is disabled in system config');
    return;
  }
  
  const effectiveYear = year || annualConfig.year || (new Date().getFullYear() - 1);
  
  const connection = await getWriteDb();

  try {
    console.log(`\n📊 Generating Annual Summary for ${effectiveYear}...`);

    const startDate = `${effectiveYear}-01-01`;
    const endDate = `${effectiveYear}-12-31`;

    const templatesResult = await connection.query(`
      SELECT * FROM email_templates WHERE type = 'annual_summary' AND is_active = TRUE LIMIT 1
    `);

    if (!templatesResult.rows[0]) {
      console.log('❌ Annual summary template not found');
      return;
    }

    const template = templatesResult.rows[0];

    const existingTasksResult = await connection.query(`
      SELECT id FROM email_tasks 
      WHERE type = 'annual_summary' 
      AND subject LIKE $1
      AND status IN ('pending_approval', 'approved', 'sending', 'sent')
      LIMIT 1
    `, [`%${effectiveYear}%`]);

    if (existingTasksResult.rows.length > 0) {
      console.log(`⚠️  Annual summary for ${effectiveYear} already exists`);
      return;
    }

    const usersResult = await connection.query(`
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
        (SELECT COUNT(*) FROM slang sl WHERE sl.user_id = u.id AND sl.created_at BETWEEN $2 AND $3) as contributions
      FROM users u
      WHERE u.status = 'active'
      ORDER BY u.id
    `, [endDate, startDate, endDate]);

    console.log(`Found ${usersResult.rows.length} active users`);

    const subject = template.subject.replace(/\{\{year\}\}/g, effectiveYear);
    
    const recipientData = usersResult.rows.map(u => ({
      id: u.id,
      email: u.email,
      username: u.username,
      days_member: u.days_member || 0,
      slang_viewed: u.slang_viewed || 0,
      favorites: u.favorites || 0,
      likes_count: u.likes_count || 0,
      comments_count: u.comments_count || 0,
      shares_count: u.shares_count || 0,
      contributions: u.contributions || 0
    }));

    const result = await smartInsert('email_tasks', {
      template_id: template.id,
      type: 'annual_summary',
      subject,
      html_content: template.html_content,
      recipient_type: 'all_users',
      recipient_count: usersResult.rows.length,
      status: 'pending_approval'
    });

    const taskId = result.insertId;

    for (const recipient of recipientData) {
      await smartInsert('email_task_recipients', {
        task_id: taskId,
        user_id: recipient.id,
        email: recipient.email,
        status: 'pending'
      });
    }

    console.log(`✅ Annual summary task created`);
    console.log(`   Task ID: ${taskId}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Recipients: ${usersResult.rows.length} users`);
    console.log(`   Status: Pending Approval (Moderator or Admin required)`);

  } finally {
    await releaseDb(connection);
  }
}

const year = process.argv[2] ? parseInt(process.argv[2]) : new Date().getFullYear() - 1;
generateAnnualSummary(year)
  .then(async () => {
    await closePools();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('❌ Failed:', error);
    await closePools();
    process.exit(1);
  });
