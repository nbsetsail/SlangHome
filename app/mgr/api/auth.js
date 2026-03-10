import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getQuery } from '@/lib/db-adapter';

export const ALL_LOCALES = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'pt', 'ru', 'ar', 'hi', 'it', 'nl', 'pl', 'tr', 'vi', 'th', 'id', 'ms', 'tl'];

export async function checkMgrAuth(
  allowedRoles = ['admin', 'moderator'],
  locale
) {
  const session = await auth();
  
  if (!session?.user) {
    return { authorized: false, error: 'Unauthorized - Please login', status: 401 };
  }
  
  if (!allowedRoles.includes(session.user.role)) {
    return { authorized: false, error: 'Forbidden - Insufficient permissions', status: 403 };
  }

  const user = session.user;
  
  if (user.role === 'admin') {
    return { 
      authorized: true, 
      user,
      managedLocales: ALL_LOCALES
    };
  }

  if (user.role === 'moderator') {
    let managedLocales = user.managed_locales || [];
    
    if (!Array.isArray(managedLocales) || managedLocales.length === 0) {
      const dbUser = await getQuery(
        'SELECT managed_locales FROM users WHERE id = $1',
        [user.id]
      );
      managedLocales = dbUser?.managed_locales || [];
    }

    if (locale && !managedLocales.includes(locale)) {
      return { 
        authorized: false, 
        error: 'Forbidden - You do not have permission to manage this locale', 
        status: 403 
      };
    }

    return { 
      authorized: true, 
      user,
      managedLocales
    };
  }
  
  return { authorized: true, user };
}

export async function checkMgrAuthWithLocale(
  allowedRoles = ['admin', 'moderator'],
  locale
) {
  return checkMgrAuth(allowedRoles, locale);
}

export function unauthorizedResponse(error, status = 401) {
  return NextResponse.json({ success: false, error }, { status });
}

export function getLocaleFilter(authResult) {
  if (authResult.user?.role === 'admin') {
    return null;
  }
  return authResult.managedLocales || [];
}

export function buildLocaleWhereClause(
  authResult,
  fieldName = 'locale',
  paramIndex
) {
  const allowedLocales = getLocaleFilter(authResult);
  
  if (!allowedLocales) {
    return { clause: '', params: [] };
  }
  
  const placeholders = allowedLocales.map((_, i) => `$${paramIndex + i}`).join(', ');
  return {
    clause: `${fieldName} IN (${placeholders})`,
    params: allowedLocales
  };
}
