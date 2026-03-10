/**
 * 通用工具函数集合
 * 解决项目中的代码重复问题
 */

import { parseUTCDate as parseUTC, formatRelativeTime as formatRelative } from './date-utils'

// 时间格式化相关 - 使用统一的 date-utils
export const timeFormatter = {
  /**
   * 将数据库返回的时间字符串转换为 Date 对象
   * 数据库存储的是 UTC 时间，但返回的字符串可能没有时区标识
   * @param dateString 时间字符串
   * @returns Date 对象
   */
  parseUTCDate: (dateString: string): Date => {
    return parseUTC(dateString)
  },

  /**
   * 格式化评论时间显示
   * @param createdAt 创建时间字符串 (UTC)
   * @param locale 用户语言环境
   * @returns 格式化后的时间显示文本
   */
  comment: (createdAt: string, locale?: string): string => {
    return formatRelative(createdAt, { locale })
  },

  /**
   * 格式化时间戳显示
   * @param timestamp 时间戳字符串 (UTC)
   * @param locale 用户语言环境
   * @returns 格式化后的日期时间字符串
   */
  timestamp: (timestamp: string, locale?: string): string => {
    const userLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'zh-CN')
    return parseUTC(timestamp).toLocaleString(userLocale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  },

  /**
   * 获取相对时间描述
   * @param date 日期对象或 UTC 时间字符串
   * @param locale 用户语言环境
   * @returns 相对时间描述
   */
  relative: (date: Date | string, locale?: string): string => {
    return formatRelative(date, { locale })
  }
}

// LocalStorage操作相关
export const storageManager = {
  /**
   * 安全获取localStorage值
   * @param key 存储键
   * @param defaultValue 默认值
   * @returns 存储的值或默认值
   */
  getItem: <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue
    
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },

  /**
   * 安全设置localStorage值
   * @param key 存储键
   * @param value 要存储的值
   */
  setItem: (key: string, value: any): void => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn('Failed to set localStorage item:', error)
    }
  },

  /**
   * 删除localStorage项
   * @param key 存储键
   */
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to remove localStorage item:', error)
    }
  },

  /**
   * 检查是否应该执行某个操作（基于时间间隔）
   * @param key 操作标识键
   * @param intervalSeconds 时间间隔（秒）
   * @returns boolean 是否应该执行操作
   */
  shouldExecute: (key: string, intervalSeconds: number = 30): boolean => {
    if (typeof window === 'undefined') return true
    
    const lastTime = localStorage.getItem(key)
    const currentTime = Date.now()
    const intervalMs = intervalSeconds * 1000
    
    if (!lastTime || (currentTime - parseInt(lastTime)) > intervalMs) {
      localStorage.setItem(key, currentTime.toString())
      return true
    }
    return false
  }
}

// 数组和对象操作工具
export const dataUtils = {
  /**
   * 深度克隆对象
   * @param obj 要克隆的对象
   * @returns 克隆后的对象
   */
  deepClone: <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
    if (obj instanceof Array) return obj.map(item => dataUtils.deepClone(item)) as unknown as T
    if (typeof obj === 'object') {
      const clonedObj = {} as T
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = dataUtils.deepClone(obj[key])
        }
      }
      return clonedObj
    }
    return obj
  },

  /**
   * 数组去重（基于指定属性）
   * @param array 数组
   * @param keyProperty 用于比较的属性名
   * @returns 去重后的数组
   */
  uniqueBy: <T>(array: T[], keyProperty: keyof T): T[] => {
    const seen = new Set()
    return array.filter(item => {
      const key = item[keyProperty]
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  },

  /**
   * 分组函数
   * @param array 要分组的数组
   * @param keyFunction 分组键函数
   * @returns 分组后的对象
   */
  groupBy: <T, K extends string | number>(array: T[], keyFunction: (item: T) => K): Record<K, T[]> => {
    return array.reduce((groups, item) => {
      const key = keyFunction(item)
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(item)
      return groups
    }, {} as Record<K, T[]>)
  }
}

// URL和路由工具
export const urlUtils = {
  /**
   * 构建带查询参数的URL
   * @param baseUrl 基础URL
   * @param params 查询参数对象
   * @returns 完整URL
   */
  buildUrl: (baseUrl: string, params: Record<string, string | number | boolean>): string => {
    const url = new URL(baseUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value))
      }
    })
    return url.toString()
  },

  /**
   * 解析URL查询参数
   * @param search URL搜索字符串
   * @returns 参数对象
   */
  parseQuery: (search: string): Record<string, string> => {
    const params = new URLSearchParams(search)
    const result: Record<string, string> = {}
    for (const [key, value] of params.entries()) {
      result[key] = value
    }
    return result
  }
}

// 防抖和节流工具
export const performanceUtils = {
  /**
   * 防抖函数
   * @param func 要防抖的函数
   * @param delay 延迟时间（毫秒）
   * @returns 防抖后的函数
   */
  debounce: <T extends (...args: any[]) => any>(func: T, delay: number): T => {
    let timeoutId: NodeJS.Timeout
    return function (this: any, ...args: Parameters<T>) {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(this, args), delay)
    } as T
  },

  /**
   * 节流函数
   * @param func 要节流的函数
   * @param limit 限制时间（毫秒）
   * @returns 节流后的函数
   */
  throttle: <T extends (...args: any[]) => any>(func: T, limit: number): T => {
    let inThrottle: boolean
    return function (this: any, ...args: Parameters<T>) {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    } as T
  }
}

export const cryptoUtils = {
  sha256: async (message: string): Promise<string> => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder()
      const data = encoder.encode(message)
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } else {
      const crypto = await import('crypto')
      return crypto.createHash('sha256').update(message).digest('hex')
    }
  }
}

export default {
  timeFormatter,
  storageManager,
  dataUtils,
  urlUtils,
  performanceUtils,
  cryptoUtils
}