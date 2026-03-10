import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { defaultLocale, locales } from './i18n/config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export function middleware(request) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;
  
  if (pathname.startsWith('/api/')) {
    if (method === 'OPTIONS') {
      return new NextResponse(null, { status: 200 });
    }
    
    const response = NextResponse.next();
    const origin = request.headers.get('origin');
    const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080'];
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
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
