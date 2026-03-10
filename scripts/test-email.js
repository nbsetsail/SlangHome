#!/usr/bin/env node

/**
 * Email Testing Script
 * 
 * Tests the email functionality by sending a test email.
 * Usage: node scripts/test-email.js
 */

import { emailService, isEmailEnabled } from '../lib/email.js';

// 颜色输出工具
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

async function testEmail() {
  console.log('🧪 Testing Email Functionality\n');

  // Check if email is enabled
  if (!isEmailEnabled()) {
    console.log('❌ Email functionality is disabled');
    console.log('   Set EMAIL_ENABLED=true in your environment variables');
    return;
  }

  console.log('✅ Email functionality is enabled');

  // Test email connection
  console.log('\n🔌 Testing email server connection...');
  try {
    const connected = await emailService.verifyConnection();
    
    if (!connected) {
      console.log('❌ Email server connection failed');
      console.log('   Please check your Postfix configuration');
      return;
    }

    console.log('✅ Email server connection successful');
  } catch (error) {
    console.log('❌ Error testing email connection:', error.message);
    return;
  }

  // Test welcome email
  console.log('\n📧 Testing welcome email...');
  try {
    const testEmail = 'test@example.com';
    const testUsername = 'Test User';
    
    const sent = await emailService.sendWelcomeEmail(testEmail, testUsername);
    
    if (sent) {
      console.log('✅ Welcome email sent successfully');
      console.log(`   To: ${testEmail}`);
      console.log(`   Username: ${testUsername}`);
    } else {
      console.log('❌ Failed to send welcome email');
    }
  } catch (error) {
    console.log('❌ Error sending welcome email:', error.message);
  }

  // Test password reset email
  console.log('\n🔐 Testing password reset email...');
  try {
    const testEmail = 'test@example.com';
    const testUsername = 'Test User';
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=test-token&email=test@example.com`;
    
    const sent = await emailService.sendPasswordResetEmail(testEmail, testUsername, resetLink);
    
    if (sent) {
      console.log('✅ Password reset email sent successfully');
      console.log(`   To: ${testEmail}`);
      console.log(`   Reset Link: ${resetLink}`);
    } else {
      console.log('❌ Failed to send password reset email');
    }
  } catch (error) {
    console.log('❌ Error sending password reset email:', error.message);
  }

  console.log('\n📊 Email testing completed!');
  console.log('\n💡 Next steps:');
  console.log('   1. Check /var/log/mail.log for email delivery status');
  console.log('   2. Verify DNS records (SPF, MX) if emails are marked as spam');
  console.log('   3. Test with real email addresses in production');
}

// Run the test
testEmail().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});