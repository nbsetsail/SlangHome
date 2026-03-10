/**
 * Date formatting utility functions for internationalization
 * Database stores UTC time, frontend handles timezone conversion
 * 
 * Architecture:
 * - Database: Always stores timestamps in UTC (+00:00 timezone)
 * - Cache: Uses timestamps (timezone-independent)
 * - API: Returns UTC ISO strings
 * - Frontend: Converts to user's local timezone and locale
 */

export interface FormattedDate {
  date: string
  time: string
  full: string
  iso: string
}

export interface RelativeTimeOptions {
  locale?: string
  fallbackToAbsolute?: boolean
}

const RELATIVE_TIME_TRANSLATIONS: Record<string, {
  justNow: string
  minutesAgo: (n: number) => string
  hoursAgo: (n: number) => string
  daysAgo: (n: number) => string
  monthsAgo: (n: number) => string
}> = {
  // Phase 1: 核心语言
  'en': {
    justNow: 'just now',
    minutesAgo: (n) => `${n} minute${n > 1 ? 's' : ''} ago`,
    hoursAgo: (n) => `${n} hour${n > 1 ? 's' : ''} ago`,
    daysAgo: (n) => `${n} day${n > 1 ? 's' : ''} ago`,
    monthsAgo: (n) => `${n} month${n > 1 ? 's' : ''} ago`
  },
  'zh': {
    justNow: '刚刚',
    minutesAgo: (n) => `${n}分钟前`,
    hoursAgo: (n) => `${n}小时前`,
    daysAgo: (n) => `${n}天前`,
    monthsAgo: (n) => `${n}个月前`
  },
  'es': {
    justNow: 'ahora mismo',
    minutesAgo: (n) => `hace ${n} minuto${n > 1 ? 's' : ''}`,
    hoursAgo: (n) => `hace ${n} hora${n > 1 ? 's' : ''}`,
    daysAgo: (n) => `hace ${n} día${n > 1 ? 's' : ''}`,
    monthsAgo: (n) => `hace ${n} mes${n > 1 ? 'es' : ''}`
  },
  'ar': {
    justNow: 'الآن',
    minutesAgo: (n) => `منذ ${n} دقيقة`,
    hoursAgo: (n) => `منذ ${n} ساعة`,
    daysAgo: (n) => `منذ ${n} يوم`,
    monthsAgo: (n) => `منذ ${n} شهر`
  },
  // Phase 2: 重要语言
  'ru': {
    justNow: 'только что',
    minutesAgo: (n) => `${n} мин. назад`,
    hoursAgo: (n) => `${n} ч. назад`,
    daysAgo: (n) => `${n} дн. назад`,
    monthsAgo: (n) => `${n} мес. назад`
  },
  'fr': {
    justNow: "à l'instant",
    minutesAgo: (n) => `il y a ${n} minute${n > 1 ? 's' : ''}`,
    hoursAgo: (n) => `il y a ${n} heure${n > 1 ? 's' : ''}`,
    daysAgo: (n) => `il y a ${n} jour${n > 1 ? 's' : ''}`,
    monthsAgo: (n) => `il y a ${n} mois`
  },
  'de': {
    justNow: 'gerade eben',
    minutesAgo: (n) => `vor ${n} Minute${n > 1 ? 'n' : ''}`,
    hoursAgo: (n) => `vor ${n} Stunde${n > 1 ? 'n' : ''}`,
    daysAgo: (n) => `vor ${n} Tag${n > 1 ? 'en' : ''}`,
    monthsAgo: (n) => `vor ${n} Monat${n > 1 ? 'en' : ''}`
  },
  'ja': {
    justNow: 'たった今',
    minutesAgo: (n) => `${n}分前`,
    hoursAgo: (n) => `${n}時間前`,
    daysAgo: (n) => `${n}日前`,
    monthsAgo: (n) => `${n}ヶ月前`
  },
  'ko': {
    justNow: '방금',
    minutesAgo: (n) => `${n}분 전`,
    hoursAgo: (n) => `${n}시간 전`,
    daysAgo: (n) => `${n}일 전`,
    monthsAgo: (n) => `${n}개월 전`
  },
  'hi': {
    justNow: 'अभी',
    minutesAgo: (n) => `${n} मिनट पहले`,
    hoursAgo: (n) => `${n} घंटे पहले`,
    daysAgo: (n) => `${n} दिन पहले`,
    monthsAgo: (n) => `${n} महीने पहले`
  },
  'pt': {
    justNow: 'agora mesmo',
    minutesAgo: (n) => `há ${n} minuto${n > 1 ? 's' : ''}`,
    hoursAgo: (n) => `há ${n} hora${n > 1 ? 's' : ''}`,
    daysAgo: (n) => `há ${n} dia${n > 1 ? 's' : ''}`,
    monthsAgo: (n) => `há ${n} ${n > 1 ? 'meses' : 'mês'}`
  },
  'tr': {
    justNow: 'az önce',
    minutesAgo: (n) => `${n} dakika önce`,
    hoursAgo: (n) => `${n} saat önce`,
    daysAgo: (n) => `${n} gün önce`,
    monthsAgo: (n) => `${n} ay önce`
  },
  // Phase 3: 区域语言
  'it': {
    justNow: 'poco fa',
    minutesAgo: (n) => `${n} minut${n > 1 ? 'i' : 'o'} fa`,
    hoursAgo: (n) => `${n} or${n > 1 ? 'e' : 'a'} fa`,
    daysAgo: (n) => `${n} giorn${n > 1 ? 'i' : 'o'} fa`,
    monthsAgo: (n) => `${n} mes${n > 1 ? 'i' : 'e'} fa`
  },
  'vi': {
    justNow: 'vừa xong',
    minutesAgo: (n) => `${n} phút trước`,
    hoursAgo: (n) => `${n} giờ trước`,
    daysAgo: (n) => `${n} ngày trước`,
    monthsAgo: (n) => `${n} tháng trước`
  },
  'th': {
    justNow: 'เมื่อกี้',
    minutesAgo: (n) => `${n} นาทีที่แล้ว`,
    hoursAgo: (n) => `${n} ชั่วโมงที่แล้ว`,
    daysAgo: (n) => `${n} วันที่แล้ว`,
    monthsAgo: (n) => `${n} เดือนที่แล้ว`
  },
  'id': {
    justNow: 'baru saja',
    minutesAgo: (n) => `${n} menit yang lalu`,
    hoursAgo: (n) => `${n} jam yang lalu`,
    daysAgo: (n) => `${n} hari yang lalu`,
    monthsAgo: (n) => `${n} bulan yang lalu`
  },
  'ms': {
    justNow: 'baru sahaja',
    minutesAgo: (n) => `${n} minit yang lalu`,
    hoursAgo: (n) => `${n} jam yang lalu`,
    daysAgo: (n) => `${n} hari yang lalu`,
    monthsAgo: (n) => `${n} bulan yang lalu`
  },
  'pl': {
    justNow: 'przed chwilą',
    minutesAgo: (n) => `${n} minut${n === 1 ? 'a' : n < 5 ? 'y' : ' temu'}`,
    hoursAgo: (n) => `${n} godzin${n === 1 ? 'a' : n < 5 ? 'y' : ' temu'}`,
    daysAgo: (n) => `${n} dni temu`,
    monthsAgo: (n) => `${n} miesięc${n === 1 ? '' : 'y'} temu`
  },
  'nl': {
    justNow: 'zojuist',
    minutesAgo: (n) => `${n} minu${n > 1 ? 'ten' : 'ut'} geleden`,
    hoursAgo: (n) => `${n} ${n > 1 ? 'uren' : 'uur'} geleden`,
    daysAgo: (n) => `${n} dag${n > 1 ? 'en' : ''} geleden`,
    monthsAgo: (n) => `${n} maand${n > 1 ? 'en' : ''} geleden`
  },
  'sv': {
    justNow: 'just nu',
    minutesAgo: (n) => `för ${n} minut${n > 1 ? 'er' : ''} sedan`,
    hoursAgo: (n) => `för ${n} timm${n > 1 ? 'ar' : 'e'} sedan`,
    daysAgo: (n) => `för ${n} dag${n > 1 ? 'ar' : ''} sedan`,
    monthsAgo: (n) => `för ${n} månad${n > 1 ? 'er' : ''} sedan`
  }
}

function getRelativeTimeTranslations(locale: string) {
  const langCode = locale.split('-')[0]
  return RELATIVE_TIME_TRANSLATIONS[langCode] || RELATIVE_TIME_TRANSLATIONS['en']
}

/**
 * Parse UTC date string to Date object
 * Database returns time without timezone info, need to treat as UTC
 */
export function parseUTCDate(dateString: string | Date): Date {
  if (!dateString) return new Date()
  if (dateString instanceof Date) return dateString
  
  if (dateString.includes('T') && (dateString.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateString))) {
    return new Date(dateString)
  }
  
  const normalizedString = dateString.includes('T') 
    ? dateString 
    : dateString.replace(' ', 'T')
  
  if (!normalizedString.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(normalizedString)) {
    return new Date(normalizedString + 'Z')
  }
  
  return new Date(normalizedString)
}

/**
 * Get current UTC time in ISO format
 */
export function getCurrentUTCTime(): string {
  return new Date().toISOString();
}

/**
 * Get UTC time from local time
 */
export function toUTCTime(dateString: string | Date): string {
  const date = new Date(dateString);
  return date.toISOString();
}

/**
 * Format UTC date to local time display
 */
export function formatDate(dateString: string | Date, locale?: string): FormattedDate {
  const date = parseUTCDate(dateString);
  const userLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
  
  return {
    date: date.toLocaleDateString(userLocale),
    time: date.toLocaleTimeString(userLocale),
    full: date.toLocaleString(userLocale),
    iso: date.toISOString()
  }
}

/**
 * Format UTC date to relative time with internationalization support
 * @param dateString UTC date string or Date object
 * @param options Options for formatting
 * @returns Relative time string in user's locale
 */
export function formatRelativeTime(
  dateString: string | Date, 
  options: RelativeTimeOptions = {}
): string {
  const { locale, fallbackToAbsolute = true } = options
  const date = parseUTCDate(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const userLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US')
  const translations = getRelativeTimeTranslations(userLocale)

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)

  if (seconds < 0) {
    return translations.justNow
  }

  if (seconds < 60) {
    return translations.justNow
  } else if (minutes < 60) {
    return translations.minutesAgo(minutes)
  } else if (hours < 24) {
    return translations.hoursAgo(hours)
  } else if (days < 30) {
    return translations.daysAgo(days)
  } else if (months < 12) {
    return translations.monthsAgo(months)
  } else {
    if (fallbackToAbsolute) {
      return date.toLocaleDateString(userLocale)
    }
    return translations.monthsAgo(months)
  }
}

/**
 * Check if a UTC timestamp has expired
 */
export function isExpired(utcTimestamp: string): boolean {
  const expirationTime = parseUTCDate(utcTimestamp);
  const currentTime = new Date();
  return currentTime > expirationTime;
}

/**
 * Add minutes to current UTC time
 */
export function addMinutesToUTC(minutes: number): string {
  const now = new Date();
  const expirationTime = new Date(now.getTime() + minutes * 60 * 1000);
  return expirationTime.toISOString();
}

const US_LOCALE = 'en-US'
const US_TIMEZONE = 'America/New_York'

/**
 * Format date to simple date (MM/DD/YYYY only)
 */
export function formatSimpleDate(dateString: string | Date): string {
  return parseUTCDate(dateString).toLocaleDateString(US_LOCALE, { timeZone: US_TIMEZONE })
}

/**
 * Format UTC date to datetime string for display
 * @param dateString UTC date string
 * @param locale User's locale
 * @returns Formatted datetime string
 */
export function formatDateTime(dateString: string | Date, locale?: string): string {
  const date = parseUTCDate(dateString)
  const userLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US')
  return date.toLocaleString(userLocale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format UTC date to short date string
 * @param dateString UTC date string
 * @param locale User's locale
 * @returns Formatted short date string
 */
export function formatShortDate(dateString: string | Date, locale?: string): string {
  const date = parseUTCDate(dateString)
  const userLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US')
  return date.toLocaleDateString(userLocale, {
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format UTC date to time only
 * @param dateString UTC date string
 * @param locale User's locale
 * @returns Formatted time string
 */
export function formatTimeOnly(dateString: string | Date, locale?: string): string {
  const date = parseUTCDate(dateString)
  const userLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US')
  return date.toLocaleTimeString(userLocale, {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Server-side helper: Get current UTC timestamp for database insertion
 * @returns PostgreSQL-compatible ISO 8601 UTC string 'YYYY-MM-DDTHH:MM:SSZ'
 */
export function getUTCTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Server-side helper: Convert local date to UTC for database queries
 * @param date Local date
 * @returns UTC ISO string
 */
export function toUTC(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString()
}

/**
 * Server-side helper: Get date range for queries (e.g., last N days)
 * @param days Number of days
 * @returns Object with start and end UTC timestamps
 */
export function getDateRange(days: number): { start: string; end: string } {
  const end = new Date()
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
  return {
    start: start.toISOString(),
    end: end.toISOString()
  }
}

/**
 * Check if a date is today (in user's timezone)
 * @param dateString UTC date string
 * @returns boolean
 */
export function isToday(dateString: string | Date): boolean {
  const date = parseUTCDate(dateString)
  const now = new Date()
  return date.toLocaleDateString() === now.toLocaleDateString()
}

/**
 * Check if a date is yesterday (in user's timezone)
 * @param dateString UTC date string
 * @returns boolean
 */
export function isYesterday(dateString: string | Date): boolean {
  const date = parseUTCDate(dateString)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return date.toLocaleDateString() === yesterday.toLocaleDateString()
}

/**
 * Get user's timezone offset in hours
 * @returns Timezone offset (e.g., -5 for EST, +8 for CST)
 */
export function getTimezoneOffset(): number {
  return -new Date().getTimezoneOffset() / 60
}

/**
 * Get user's timezone name
 * @returns Timezone name (e.g., 'America/New_York')
 */
export function getTimezoneName(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
