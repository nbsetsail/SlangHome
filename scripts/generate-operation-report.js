#!/usr/bin/env node

/**
 * Operation Report Generator
 * Automatically generates operation report email tasks
 * Run: node scripts/generate-operation-report.js [monthly|quarterly|semiannual|annual]
 */

import 'dotenv/config';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { getWriteDb, releaseDb, closePools, smartInsert } = await import('../lib/db-adapter.js');
import { getConfig, loadAllConfigsFromDB, configKeys } from '../lib/system-config';
import { getUTCTimestamp } from '../lib/date-utils';

const PERIODS = {
  monthly: { label: 'Monthly', months: 1 },
  quarterly: { label: 'Quarterly', months: 3 },
  semiannual: { label: 'Semi-annual', months: 6 },
  annual: { label: 'Annual', months: 12 }
};

function calcGrowth(current, previous) {
  if (previous === 0) {
    return { growth: current, percentage: current > 0 ? 100 : 0 };
  }
  const growth = current - previous;
  const percentage = Math.round((growth / previous) * 100);
  return { growth, percentage };
}

async function generateReport(periodType = 'monthly') {
  await loadAllConfigsFromDB();
  const reportConfig = await getConfig(configKeys.report);
  const operationConfig = reportConfig?.operationReport || {};
  
  if (operationConfig.enabled === false) {
    console.log('⚠️  Operation report is disabled in system config');
    return;
  }
  
  const effectivePeriod = periodType || operationConfig.defaultPeriod || 'monthly';
  
  const connection = await getWriteDb();

  try {
    console.log(`\n📊 Generating ${PERIODS[effectivePeriod]?.label || effectivePeriod} Operation Report...`);

    const now = new Date();
    const months = PERIODS[effectivePeriod]?.months || 1;
    
    const currentStart = new Date(now);
    currentStart.setMonth(currentStart.getMonth() - months);
    
    const previousStart = new Date(currentStart);
    previousStart.setMonth(previousStart.getMonth() - months);
    
    const periodLabel = `${currentStart.toISOString().split('T')[0]} - ${now.toISOString().split('T')[0]}`;

    const currentActiveUsersResult = await connection.query(`
      SELECT COUNT(DISTINCT user_id) as count FROM views 
      WHERE created_at >= $1 AND created_at <= $2
    `, [currentStart, now]);
    const activeUsersCurrent = currentActiveUsersResult.rows[0].count;

    const currentNewUsersResult = await connection.query(`
      SELECT COUNT(*) as count FROM users 
      WHERE created_at >= $1 AND created_at <= $2
    `, [currentStart, now]);
    const newUsersCurrent = currentNewUsersResult.rows[0].count;

    const currentViewsResult = await connection.query(`
      SELECT COUNT(*) as count FROM views 
      WHERE created_at >= $1 AND created_at <= $2
    `, [currentStart, now]);
    const viewsCurrent = currentViewsResult.rows[0].count;

    const currentLikesResult = await connection.query(`
      SELECT COUNT(*) as count FROM likes 
      WHERE created_at >= $1 AND created_at <= $2
    `, [currentStart, now]);
    const likesCurrent = currentLikesResult.rows[0].count;

    const currentFavoritesResult = await connection.query(`
      SELECT COUNT(*) as count FROM favorites 
      WHERE created_at >= $1 AND created_at <= $2
    `, [currentStart, now]);
    const favoritesCurrent = currentFavoritesResult.rows[0].count;

    const currentCommentsResult = await connection.query(`
      SELECT COUNT(*) as count FROM comments 
      WHERE created_at >= $1 AND created_at <= $2
    `, [currentStart, now]);
    const commentsCurrent = currentCommentsResult.rows[0].count;

    const currentSharesResult = await connection.query(`
      SELECT COUNT(*) as count FROM shares 
      WHERE created_at >= $1 AND created_at <= $2
    `, [currentStart, now]);
    const sharesCurrent = currentSharesResult.rows[0].count;

    const currentSlangResult = await connection.query(`
      SELECT COUNT(*) as count FROM slang 
      WHERE created_at >= $1 AND created_at <= $2
    `, [currentStart, now]);
    const slangCurrent = currentSlangResult.rows[0].count;

    const prevActiveUsersResult = await connection.query(`
      SELECT COUNT(DISTINCT user_id) as count FROM views 
      WHERE created_at >= $1 AND created_at <= $2
    `, [previousStart, currentStart]);
    const activeUsersPrev = prevActiveUsersResult.rows[0].count;

    const prevNewUsersResult = await connection.query(`
      SELECT COUNT(*) as count FROM users 
      WHERE created_at >= $1 AND created_at <= $2
    `, [previousStart, currentStart]);
    const newUsersPrev = prevNewUsersResult.rows[0].count;

    const prevViewsResult = await connection.query(`
      SELECT COUNT(*) as count FROM views 
      WHERE created_at >= $1 AND created_at <= $2
    `, [previousStart, currentStart]);
    const viewsPrev = prevViewsResult.rows[0].count;

    const prevLikesResult = await connection.query(`
      SELECT COUNT(*) as count FROM likes 
      WHERE created_at >= $1 AND created_at <= $2
    `, [previousStart, currentStart]);
    const likesPrev = prevLikesResult.rows[0].count;

    const prevFavoritesResult = await connection.query(`
      SELECT COUNT(*) as count FROM favorites 
      WHERE created_at >= $1 AND created_at <= $2
    `, [previousStart, currentStart]);
    const favoritesPrev = prevFavoritesResult.rows[0].count;

    const prevCommentsResult = await connection.query(`
      SELECT COUNT(*) as count FROM comments 
      WHERE created_at >= $1 AND created_at <= $2
    `, [previousStart, currentStart]);
    const commentsPrev = prevCommentsResult.rows[0].count;

    const prevSharesResult = await connection.query(`
      SELECT COUNT(*) as count FROM shares 
      WHERE created_at >= $1 AND created_at <= $2
    `, [previousStart, currentStart]);
    const sharesPrev = prevSharesResult.rows[0].count;

    const prevSlangResult = await connection.query(`
      SELECT COUNT(*) as count FROM slang 
      WHERE created_at >= $1 AND created_at <= $2
    `, [previousStart, currentStart]);
    const slangPrev = prevSlangResult.rows[0].count;

    const activeUsersGrowth = calcGrowth(activeUsersCurrent, activeUsersPrev);
    const newUsersGrowth = calcGrowth(newUsersCurrent, newUsersPrev);
    const viewsGrowth = calcGrowth(viewsCurrent, viewsPrev);
    const likesGrowth = calcGrowth(likesCurrent, likesPrev);
    const favoritesGrowth = calcGrowth(favoritesCurrent, favoritesPrev);
    const commentsGrowth = calcGrowth(commentsCurrent, commentsPrev);
    const sharesGrowth = calcGrowth(sharesCurrent, sharesPrev);
    const slangGrowth = calcGrowth(slangCurrent, slangPrev);

    const topLocalesResult = await connection.query(`
      SELECT s.locale, COUNT(v.id) as view_count 
      FROM slang s 
      LEFT JOIN views v ON s.id = v.slang_id AND v.created_at >= $1 AND v.created_at <= $2
      WHERE s.status = 'active'
      GROUP BY s.locale 
      ORDER BY view_count DESC 
      LIMIT 5
    `, [currentStart, now]);

    const topLocalesList = topLocalesResult.rows.map((l, i) => 
      `<li><strong>${l.locale.toUpperCase()}</strong> - ${l.view_count} views</li>`
    ).join('\n        ');

    const templatesResult = await connection.query(`
      SELECT * FROM email_templates WHERE type = 'operation_report' AND is_active = TRUE LIMIT 1
    `);

    if (!templatesResult.rows[0]) {
      console.log('❌ Operation report template not found');
      return;
    }

    const template = templatesResult.rows[0];

    let htmlContent = template.html_content
      .replace(/\{\{period\}\}/g, periodLabel)
      .replace(/\{\{active_users_current\}\}/g, activeUsersCurrent)
      .replace(/\{\{active_users_growth\}\}/g, activeUsersGrowth.growth)
      .replace(/\{\{active_users_percentage\}\}/g, activeUsersGrowth.percentage)
      .replace(/\{\{new_users_current\}\}/g, newUsersCurrent)
      .replace(/\{\{new_users_growth\}\}/g, newUsersGrowth.growth)
      .replace(/\{\{new_users_percentage\}\}/g, newUsersGrowth.percentage)
      .replace(/\{\{views_current\}\}/g, viewsCurrent)
      .replace(/\{\{views_growth\}\}/g, viewsGrowth.growth)
      .replace(/\{\{views_percentage\}\}/g, viewsGrowth.percentage)
      .replace(/\{\{likes_current\}\}/g, likesCurrent)
      .replace(/\{\{likes_growth\}\}/g, likesGrowth.growth)
      .replace(/\{\{likes_percentage\}\}/g, likesGrowth.percentage)
      .replace(/\{\{favorites_current\}\}/g, favoritesCurrent)
      .replace(/\{\{favorites_growth\}\}/g, favoritesGrowth.growth)
      .replace(/\{\{favorites_percentage\}\}/g, favoritesGrowth.percentage)
      .replace(/\{\{comments_current\}\}/g, commentsCurrent)
      .replace(/\{\{comments_growth\}\}/g, commentsGrowth.growth)
      .replace(/\{\{comments_percentage\}\}/g, commentsGrowth.percentage)
      .replace(/\{\{shares_current\}\}/g, sharesCurrent)
      .replace(/\{\{shares_growth\}\}/g, sharesGrowth.growth)
      .replace(/\{\{shares_percentage\}\}/g, sharesGrowth.percentage)
      .replace(/\{\{slang_current\}\}/g, slangCurrent)
      .replace(/\{\{slang_growth\}\}/g, slangGrowth.growth)
      .replace(/\{\{slang_percentage\}\}/g, slangGrowth.percentage)
      .replace(/\{\{top_locales_list\}\}/g, topLocalesList);

    let subject = template.subject
      .replace(/\{\{period\}\}/g, periodLabel);

    const existingTasksResult = await connection.query(`
      SELECT id FROM email_tasks 
      WHERE type = 'operation_report' 
      AND subject = $1 
      AND status IN ('pending_approval', 'approved', 'sending', 'sent')
      LIMIT 1
    `, [subject]);

    if (existingTasksResult.rows.length > 0) {
      console.log(`⚠️  Report already exists for this period: ${subject}`);
      return;
    }

    const recipientCountResult = await connection.query(`
      SELECT COUNT(*) as count FROM users WHERE role IN ('moderator', 'admin') AND status = 'active'
    `);
    const recipientCount = recipientCountResult.rows[0].count;

    const result = await smartInsert('email_tasks', {
      template_id: template.id,
      type: 'operation_report',
      subject,
      html_content: htmlContent,
      recipient_type: 'role',
      recipient_role: 'moderator',
      recipient_count: recipientCount,
      status: 'pending_approval'
    });

    console.log(`✅ Operation report generated, pending approval`);
    console.log(`   Task ID: ${result.insertId}`);
    console.log(`   Subject: ${subject}`);
    console.log(`\n   Statistics (Current / Growth / %):`);
    console.log(`   Active Users: ${activeUsersCurrent} / ${activeUsersGrowth.growth} / ${activeUsersGrowth.percentage}%`);
    console.log(`   New Users:    ${newUsersCurrent} / ${newUsersGrowth.growth} / ${newUsersGrowth.percentage}%`);
    console.log(`   Views:        ${viewsCurrent} / ${viewsGrowth.growth} / ${viewsGrowth.percentage}%`);
    console.log(`   Likes:        ${likesCurrent} / ${likesGrowth.growth} / ${likesGrowth.percentage}%`);
    console.log(`   Favorites:    ${favoritesCurrent} / ${favoritesGrowth.growth} / ${favoritesGrowth.percentage}%`);
    console.log(`   Comments:     ${commentsCurrent} / ${commentsGrowth.growth} / ${commentsGrowth.percentage}%`);
    console.log(`   Shares:       ${sharesCurrent} / ${sharesGrowth.growth} / ${sharesGrowth.percentage}%`);
    console.log(`   New Slang:    ${slangCurrent} / ${slangGrowth.growth} / ${slangGrowth.percentage}%`);

  } finally {
    await releaseDb(connection);
  }
}

const periodType = process.argv[2] || 'monthly';
generateReport(periodType)
  .then(async () => {
    await closePools();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('❌ Failed:', error);
    await closePools();
    process.exit(1);
  });
