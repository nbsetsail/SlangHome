/**
 * 统一的翻译工具模块
 * 
 * 使用方法：
 * 1. Client Components: import { t } from '@/i18n/translate'
 * 2. Server Components: import { getT } from '@/i18n/translate'
 * 3. Hooks: import { useTranslation } from '@/hooks'
 */

import messages from '../messages'

type Messages = typeof messages.en

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
}

/**
 * 获取指定语言的翻译函数
 * @param locale 语言代码
 * @returns 翻译函数 t
 */
export function getT(locale: string = 'en') {
  const currentMessages = (messages as Record<string, DeepPartial<Messages>>)[locale] || messages.en
  
  return function t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.')
    let value: any = currentMessages
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // 找不到翻译时返回 key
        return key
      }
    }
    
    if (typeof value !== 'string') {
      return key
    }
    
    // 替换参数
    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
        return String(params[paramKey] ?? `{${paramKey}}`)
      })
    }
    
    return value
  }
}

/**
 * 获取语言的显示名称
 */
export function getLocaleName(locale: string): string {
  const names: Record<string, string> = {
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
  }
  return names[locale] || 'English'
}

/**
 * 检查是否为 RTL 语言
 */
export function isRTL(locale: string): boolean {
  const rtlLocales = ['ar', 'he', 'fa', 'ur']
  return rtlLocales.includes(locale)
}

/**
 * 获取所有支持的语言列表
 */
export function getSupportedLocales(): string[] {
  return Object.keys(messages)
}

/**
 * 获取活跃语言列表（前 4 个）
 */
export function getActiveLocales(): string[] {
  return ['en', 'zh', 'es', 'ar']
}
