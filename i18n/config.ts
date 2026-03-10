export const defaultLocale = 'en';

export const locales: string[] = [
  'en', 'zh', 'es', 'ar',
  'ru', 'fr', 'de', 'ja', 'ko', 'hi', 'pt', 'tr',
  'it', 'vi', 'th', 'id', 'ms', 'pl', 'nl', 'sv'
];

export const localeNames: Record<string, string> = {
  en: 'English',
  zh: '中文',
  es: 'Español',
  ar: 'العربية',
  ru: 'Русский',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  ko: '한국어',
  hi: 'हिन्दी',
  pt: 'Português',
  tr: 'Türkçe',
  it: 'Italiano',
  vi: 'Tiếng Việt',
  th: 'ไทย',
  id: 'Bahasa Indonesia',
  ms: 'Bahasa Melayu',
  pl: 'Polski',
  nl: 'Nederlands',
  sv: 'Svenska'
};

export const localeColors: Record<string, string> = {
  en: '#3B82F6',
  zh: '#DE2910',
  es: '#FFC300',
  ar: '#006C35',
  ru: '#8B5CF6',
  fr: '#0055A4',
  de: '#FBBF24',
  ja: '#BC002D',
  ko: '#C60C30',
  hi: '#FF9933',
  pt: '#009739',
  tr: '#E30A17',
  it: '#009246',
  vi: '#DA251D',
  th: '#00247D',
  id: '#FF0000',
  ms: '#010066',
  pl: '#DC143C',
  nl: '#FF6600',
  sv: '#006AA7'
};

export const rtlLocales: string[] = ['ar'];

export const defaultActiveLocales: string[] = ['en', 'zh', 'es', 'ar'];

let cachedActiveLocales: string[] | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 5 * 60 * 1000;

export function getCachedActiveLocales(): string[] {
  if (cachedActiveLocales && (Date.now() - cacheTime) < CACHE_TTL) {
    return cachedActiveLocales;
  }
  return defaultActiveLocales;
}

export function setCachedActiveLocales(locales: string[]): void {
  cachedActiveLocales = locales;
  cacheTime = Date.now();
}

export function clearActiveLocalesCache(): void {
  cachedActiveLocales = null;
  cacheTime = 0;
}
