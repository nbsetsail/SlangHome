/**
 * Email Verification Utilities
 * 
 * Provides functions for generating and managing email verification codes.
 */

import { generateUUIDv7 } from './uuid.js';
import { getUTCTimestamp } from './date-utils';
import { smartInsert, smartUpdate } from './db-adapter';

/**
 * Generate a random verification code
 * @param {number} length - Length of the verification code (default: 6)
 * @returns {string} - Generated verification code
 */
export function generateVerificationCode(length = 6) {
  const chars = '0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

/**
 * Generate a verification code with expiration time
 * @param {number} length - Length of the verification code (default: 6)
 * @param {number} minutes - Expiration time in minutes (default: 10)
 * @returns {object} - Object containing code and expiration time
 */
export function generateVerificationCodeWithExpiry(length = 6, minutes = 10) {
  const code = generateVerificationCode(length);
  const expiresAtDate = new Date(Date.now() + minutes * 60 * 1000);
  const expiresAt = expiresAtDate.toISOString();
  
  console.log('Debug - generateVerificationCodeWithExpiry:', {
    code: code,
    expiresAt: expiresAt,
    expiresInMinutes: minutes
  });
  
  return {
    code,
    expiresAt: expiresAt,
    expiresInMinutes: minutes
  };
}

/**
 * Store verification code in database
 * @param {object} db - Database connection
 * @param {string} userId - User ID
 * @param {string} email - Email address
 * @param {string} code - Verification code
 * @param {string} expiresAt - Expiration time (ISO string)
 * @returns {string} - Verification code ID
 */
export async function storeVerificationCode(db, userId, userEmail, verificationCode, expirationTime) {
  console.log('Debug - storeVerificationCode parameters:', {
    userId: userId,
    userIdType: typeof userId,
    userEmail: userEmail,
    userEmailType: typeof userEmail,
    verificationCode: verificationCode,
    verificationCodeType: typeof verificationCode,
    expirationTime: expirationTime,
    expirationTimeType: typeof expirationTime
  });
  
  const verificationId = generateUUIDv7();
  
  console.log('Debug - verificationId:', verificationId);
  
  await smartInsert('email_verification_codes', {
    id: verificationId,
    user_id: userId,
    email: userEmail,
    code: verificationCode,
    expires_at: expirationTime,
    used: false
  }, db);
  
  console.log('Debug - verificationId:', verificationId);
  
  return verificationId;
}

/**
 * Validate verification code
 * @param {object} db - Database connection
 * @param {string} email - Email address
 * @param {string} code - Verification code
 * @returns {object} - Validation result
 */
export async function validateVerificationCode(db, email, code) {
  const now = getUTCTimestamp();
  
  const result = await db.query(`
    SELECT id, user_id, email, code, expires_at, used, created_at
    FROM email_verification_codes
    WHERE email = $1 AND code = $2 AND used = false AND expires_at > $3
    LIMIT 1
  `, [email, code, now]);
  
  const verification = result.rows.length > 0 ? result.rows[0] : null;
  
  if (!verification) {
    return { valid: false, error: 'Invalid or expired verification code' };
  }
  
  await db.query(`
    UPDATE email_verification_codes
    SET used = true
    WHERE id = $1
  `, [verification.id]);
  
  return {
    valid: true,
    userId: verification.user_id,
    email: verification.email,
    codeId: verification.id
  };
}

/**
 * Check if user has pending verification codes
 * @param {object} db - Database connection
 * @param {string} email - Email address
 * @returns {boolean} - True if pending codes exist
 */
export async function hasPendingVerification(db, email) {
  const now = getUTCTimestamp();
  
  const result = await db.query(`
    SELECT id
    FROM email_verification_codes
    WHERE email = $1 AND used = false AND expires_at > $2
    LIMIT 1
  `, [email, now]);
  
  return result.rows.length > 0;
}

/**
 * Clean up expired verification codes
 * @param {object} db - Database connection
 */
export async function cleanupExpiredVerificationCodes(db) {
  const now = getUTCTimestamp();
  
  const result = await db.query(`
    DELETE FROM email_verification_codes
    WHERE expires_at <= $1
  `, [now]);
  
  console.log('Expired verification codes cleaned up');
}

/**
 * Invalidate all active verification codes for an email
 * @param {object} db - Database connection
 * @param {string} email - Email address
 */
export async function invalidateActiveVerificationCodes(db, email) {
  const now = getUTCTimestamp();
  
  const result = await db.query(`
    UPDATE email_verification_codes
    SET expires_at = $1
    WHERE email = $2 AND used = false AND expires_at > $3
  `, [now, email, now]);
  
  const affectedRows = result.rowCount || 0;
  if (affectedRows > 0) {
    console.log(`Invalidated ${affectedRows} active verification codes for ${email}`);
  }
  
  return affectedRows;
}

/**
 * Get verification code statistics
 * @param {object} db - Database connection
 * @param {string} email - Email address
 * @returns {object} - Statistics
 */
export async function getVerificationStats(db, email) {
  const now = getUTCTimestamp();
  
  const result = await db.query(`
    SELECT 
      COUNT(*) as total_codes,
      SUM(CASE WHEN used = true THEN 1 ELSE 0 END) as used_codes,
      SUM(CASE WHEN used = false AND expires_at > $1 THEN 1 ELSE 0 END) as active_codes
    FROM email_verification_codes
    WHERE email = $2
  `, [now, email]);
  
  const stats = result.rows.length > 0 ? result.rows[0] : null;
  return stats || { total_codes: 0, used_codes: 0, active_codes: 0 };
}
