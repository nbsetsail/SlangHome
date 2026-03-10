import { getQuery, allQuery } from './db-adapter';
import { defaultLocale, locales, defaultActiveLocales, setCachedActiveLocales, getCachedActiveLocales, clearActiveLocalesCache } from '../i18n/config.ts';
import { cacheGet, cacheSet, cacheKeys } from './cache.js';

export async function getLocale(request) {
  const urlLocale = request.nextUrl?.searchParams?.get('locale');
  if (urlLocale && await isLocaleActive(urlLocale)) {
    return urlLocale;
  }
  
  const cookieLocale = request.cookies?.get('preferred_locale')?.value;
  if (cookieLocale && await isLocaleActive(cookieLocale)) {
    return cookieLocale;
  }
  
  const acceptLanguage = request.headers?.get('accept-language');
  if (acceptLanguage) {
    const preferred = acceptLanguage.split(',')[0].split('-')[0];
    if (await isLocaleActive(preferred)) {
      return preferred;
    }
  }
  
  return await getDefaultLocale();
}

export async function isLocaleActive(code) {
  if (!code) return false;
  
  const activeLocales = await getActiveLocaleCodes();
  return activeLocales.includes(code);
}

export async function getDefaultLocale() {
  try {
    const result = await getQuery(
      "SELECT code FROM locales WHERE is_default = TRUE AND status = 'active' LIMIT 1"
    );
    return result?.code || defaultLocale;
  } catch {
    return defaultLocale;
  }
}

export async function getActiveLocales() {
  const cacheKey = cacheKeys.locale.active;
  
  try {
    const cached = await cacheGet(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      const codes = cached.map(l => l.code);
      setCachedActiveLocales(codes);
      return cached;
    }
  } catch (err) {
    console.error('Cache read error for activeLocales:', err);
  }
  
  try {
    const results = await allQuery(`
      SELECT code, name, native_name, bg_color, rtl, is_default
      FROM locales 
      WHERE status = 'active' 
      ORDER BY priority DESC
    `);
    
    if (results && results.length > 0) {
      await cacheSet(cacheKey, results, 300);
      const codes = results.map(l => l.code);
      setCachedActiveLocales(codes);
      return results;
    }
  } catch (err) {
    console.error('Database error fetching active locales:', err);
  }
  
  const fallback = defaultActiveLocales.map(code => ({
    code,
    name: code === 'en' ? 'English' : code === 'zh' ? 'Chinese' : code === 'es' ? 'Spanish' : 'Arabic',
    native_name: code === 'en' ? 'English' : code === 'zh' ? '中文' : code === 'es' ? 'Español' : 'العربية',
    bg_color: code === 'en' ? '#3B82F6' : code === 'zh' ? '#DE2910' : code === 'es' ? '#FFC300' : '#006C35',
    rtl: code === 'ar' ? 1 : 0,
    is_default: code === 'en' ? 1 : 0
  }));
  
  setCachedActiveLocales(defaultActiveLocales);
  return fallback;
}

export async function getActiveLocaleCodes() {
  const cached = getCachedActiveLocales();
  if (cached && cached !== defaultActiveLocales) {
    return cached;
  }
  
  try {
    const results = await allQuery(`
      SELECT code FROM locales 
      WHERE status = 'active' 
      ORDER BY priority DESC
    `);
    
    if (results && results.length > 0) {
      const codes = results.map(r => r.code);
      setCachedActiveLocales(codes);
      return codes;
    }
  } catch (err) {
    console.error('Error fetching active locale codes:', err);
  }
  
  return defaultActiveLocales;
}

export async function getLocalesWithStats() {
  return await allQuery(`
    SELECT 
      l.code, l.name, l.native_name, l.bg_color, l.rtl, l.priority, l.is_default, l.status,
      (SELECT COUNT(*) FROM slang WHERE locale = l.code AND status = 'active') as slang_count,
      (SELECT COUNT(*) FROM comments c JOIN slang s ON c.slang_id = s.id WHERE s.locale = l.code) as comment_count,
      (SELECT COUNT(*) FROM categories WHERE locale = l.code) as category_count,
      (SELECT COUNT(*) FROM tags WHERE locale = l.code) as tag_count
    FROM locales l
    ORDER BY l.priority DESC
  `);
}

export async function getLocaleInfo(code) {
  try {
    const result = await getQuery(
      'SELECT * FROM locales WHERE code = $1',
      [code]
    );
    return result;
  } catch {
    return null;
  }
}

export function isValidLocale(code) {
  return locales.includes(code);
}

export async function refreshActiveLocalesCache() {
  clearActiveLocalesCache();
  return await getActiveLocales();
}
