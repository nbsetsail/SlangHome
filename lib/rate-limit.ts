import { NextResponse } from 'next/server';
import { rateLimitStore } from './kv-store';
import { getConfig, configKeys } from './system-config';

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  keyPrefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

interface DbRateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

type RateLimitConfigs = Record<string, DbRateLimitConfig>;

const defaultConfigs: RateLimitConfigs = {
  verification: { windowMs: 60000, maxRequests: 3 },
  'password-reset': { windowMs: 60000, maxRequests: 3 },
  register: { windowMs: 60000, maxRequests: 3 },
  auth: { windowMs: 60000, maxRequests: 5 },
  'api-read': { windowMs: 60000, maxRequests: 120 },
  'api-write': { windowMs: 60000, maxRequests: 30 },
  'admin-read': { windowMs: 60000, maxRequests: 300 },
  'admin-write': { windowMs: 60000, maxRequests: 100 },
  default: { windowMs: 60000, maxRequests: 60 },
  deleteAccount: { windowMs: 3600000, maxRequests: 3 },
  upload: { windowMs: 60000, maxRequests: 10 },
};

export type RateLimitType = keyof typeof defaultConfigs;

function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) {
    return cfIP;
  }
  
  return 'unknown';
}

export async function checkRateLimit(
  type: RateLimitType,
  identifier: string,
  customConfig?: Partial<RateLimitConfig>
): Promise<RateLimitResult> {
  const configs = await getConfig<RateLimitConfigs>(configKeys.rateLimit);
  const dbConfig = configs?.[type] || defaultConfigs[type] || defaultConfigs.default;
  const config = {
    windowMs: dbConfig.windowMs,
    max: dbConfig.maxRequests,
    ...customConfig,
  };
  const key = `${config.keyPrefix || type}:${identifier}`;
  const now = Date.now();

  const entry = rateLimitStore.getSync(key);
  
  if (!entry || entry.expiresAt < now) {
    rateLimitStore.setSync(key, {
      count: 1,
      expiresAt: now + config.windowMs,
    });
    
    return {
      success: true,
      limit: config.max,
      remaining: config.max - 1,
      reset: Math.ceil((now + config.windowMs) / 1000),
    };
  }
  
  if (entry.count >= config.max) {
    return {
      success: false,
      limit: config.max,
      remaining: 0,
      reset: Math.ceil(entry.expiresAt / 1000),
    };
  }
  
  rateLimitStore.incrementSync(key);
  
  return {
    success: true,
    limit: config.max,
    remaining: config.max - entry.count - 1,
    reset: Math.ceil(entry.expiresAt / 1000),
  };
}

export function createRateLimitResponse(
  result: RateLimitResult,
  message?: string
): NextResponse {
  return NextResponse.json(
    {
      error: message || 'Too many requests, please try again later.',
      retryAfter: result.reset,
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': Math.ceil((result.reset * 1000 - Date.now()) / 1000).toString(),
      },
    }
  );
}

export async function withRateLimit(
  request: Request,
  type: RateLimitType,
  customIdentifier?: string,
  customConfig?: Partial<RateLimitConfig>
): Promise<{ allowed: true } | { allowed: false; response: NextResponse }> {
  const identifier = customIdentifier || getClientIdentifier(request);
  const result = await checkRateLimit(type, identifier, customConfig);
  
  if (!result.success) {
    return {
      allowed: false,
      response: createRateLimitResponse(result),
    };
  }
  
  return { allowed: true };
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
}

export { defaultConfigs };
