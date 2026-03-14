import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { defaultLocale, locales } from './i18n/config';
import { checkRateLimit, createRateLimitResponse } from './lib/rate-limit';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

const MAX_LIST_LIMIT = 10;
const LIST_LIMIT_PARAMS = ['limit', 'pageSize', 'size'];

function getClientIP(request) {
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

function isReadMethod(method) {
  return method === 'GET' || method === 'HEAD';
}

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;
  
  if (pathname.startsWith('/api/')) {
    if (method === 'OPTIONS') {
      return new NextResponse(null, { status: 200 });
    }
    
    const clientIP = getClientIP(request);
    const rateLimitType = pathname.startsWith('/mgr/api/') 
      ? (isReadMethod(method) ? 'admin-read' : 'admin-write')
      : (isReadMethod(method) ? 'api-read' : 'api-write');
    
    const rateResult = await checkRateLimit(rateLimitType, clientIP);
    if (!rateResult.success) {
      return createRateLimitResponse(rateResult);
    }
    
    let url = request.nextUrl.clone();
    let limitModified = false;
    
    LIST_LIMIT_PARAMS.forEach(param => {
      const value = url.searchParams.get(param);
      if (value !== null) {
        const parsed = parseInt(value, 10);
        if (!isNaN(parsed) && parsed > MAX_LIST_LIMIT) {
          url.searchParams.set(param, MAX_LIST_LIMIT.toString());
          limitModified = true;
        }
      }
    });
    
    const response = limitModified 
      ? NextResponse.rewrite(url)
      : NextResponse.next();
    
    const origin = request.headers.get('origin');
    const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080'];
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    response.headers.set('X-RateLimit-Limit', rateResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateResult.reset.toString());
    
    return response;
  }
  
  if (
    pathname.startsWith('/_next/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json'
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/mgr')) {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    return response;
  }
  
  if (pathname === '/') {
    const locale = request.cookies.get('preferred_locale')?.value || 
                   getLocaleFromHeader(request.headers.get('accept-language')) ||
                   defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }
  
  const response = intlMiddleware(request);
  response.headers.set('x-pathname', pathname);
  return response;
}

function getLocaleFromHeader(acceptLanguage) {
  if (!acceptLanguage) return null;
  const preferred = acceptLanguage.split(',')[0].split('-')[0];
  return locales.includes(preferred) ? preferred : null;
}

export const config = {
  matcher: '/:path*'
};
