import { randomBytes } from 'crypto';

const requiredEnvVars = [
  'NEXTAUTH_SECRET',
];

const recommendedEnvVars = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
];

let generatedSecret: string | null = null;

export const FEATURES = {
  PK_ENABLED: process.env.NEXT_PUBLIC_PK_ENABLED !== 'false',
  COMMENT_IMAGE_UPLOAD_ENABLED: process.env.NEXT_PUBLIC_COMMENT_IMAGE_UPLOAD_ENABLED === 'true',
};

export function validateEnv() {
  const missing: string[] = [];
  const warnings: string[] = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  for (const envVar of recommendedEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(envVar);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Please check .env.local file');
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️ Missing recommended environment variables:', warnings.join(', '));
  }
  
  if (missing.length === 0) {
    console.log('✅ Environment variables validated');
  }
  
  return {
    valid: missing.length === 0,
    missing,
    warnings
  };
}

export function getAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  
  if (secret) {
    if (secret.length < 32) {
      console.warn('⚠️ NEXTAUTH_SECRET should be at least 32 characters long');
    }
    return secret;
  }
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXTAUTH_SECRET environment variable is required in production');
  }
  
  if (!generatedSecret) {
    generatedSecret = randomBytes(32).toString('hex');
    console.log('🔑 Auto-generated NEXTAUTH_SECRET (development only)');
  }
  
  return generatedSecret;
}

export function getAuthSecrets(): string[] {
  const currentSecret = getAuthSecret();
  const previousSecret = process.env.NEXTAUTH_PREVIOUS_SECRET;
  
  return previousSecret ? [currentSecret, previousSecret] : [currentSecret];
}

if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  validateEnv();
}
