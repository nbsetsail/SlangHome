'use client'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface CacheOptions {
  duration?: number
  key?: string
}

const DEFAULT_CACHE_DURATION = 5 * 60 * 1000

export class ClientCache {
  private prefix: string

  constructor(prefix: string = 'slanghome_') {
    this.prefix = prefix
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  get<T>(key: string): { data: T | null; expired: boolean; isEmpty: boolean } {
    try {
      const cached = localStorage.getItem(this.getKey(key))
      if (!cached) {
        return { data: null, expired: true, isEmpty: true }
      }

      const entry: CacheEntry<T> = JSON.parse(cached)
      const now = Date.now()
      const expired = now > entry.expiresAt
      const isEmpty = Array.isArray(entry.data)
        ? entry.data.length === 0
        : entry.data === null || entry.data === undefined

      return {
        data: entry.data,
        expired,
        isEmpty
      }
    } catch (e) {
      console.error('Cache read error:', e)
      return { data: null, expired: true, isEmpty: true }
    }
  }

  set<T>(key: string, data: T, duration: number = DEFAULT_CACHE_DURATION): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + duration
      }
      localStorage.setItem(this.getKey(key), JSON.stringify(entry))
    } catch (e) {
      if (e instanceof Error && e.name === 'QuotaExceededError') {
        this.cleanup()
        try {
          this.set(key, data, duration)
        } catch {
          console.error('Cache write failed even after cleanup')
        }
      } else {
        console.error('Cache write error:', e)
      }
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key))
    } catch (e) {
      console.error('Cache remove error:', e)
    }
  }

  clear(): void {
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    } catch (e) {
      console.error('Cache clear error:', e)
    }
  }

  cleanup(): void {
    try {
      const now = Date.now()
      const keysToRemove: string[] = []

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.prefix)) {
          try {
            const cached = localStorage.getItem(key)
            if (cached) {
              const entry: CacheEntry<unknown> = JSON.parse(cached)
              if (now > entry.expiresAt) {
                keysToRemove.push(key)
              }
            }
          } catch {
            keysToRemove.push(key)
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key))
      console.log(`Cache cleanup: removed ${keysToRemove.length} expired entries`)
    } catch (e) {
      console.error('Cache cleanup error:', e)
    }
  }

  getWithFallback<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { duration = DEFAULT_CACHE_DURATION } = options
    const cached = this.get<T>(key)

    if (cached.data && !cached.expired && !cached.isEmpty) {
      return Promise.resolve(cached.data)
    }

    return fetcher()
      .then(data => {
        this.set(key, data, duration)
        return data
      })
      .catch(err => {
        if (cached.data) {
          console.warn('Fetch failed, using stale cache:', err)
          return cached.data
        }
        throw err
      })
  }

  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { duration = DEFAULT_CACHE_DURATION } = options
    const cached = this.get<T>(key)

    if (cached.data && !cached.expired) {
      return cached.data
    }

    try {
      const data = await fetcher()
      this.set(key, data, duration)
      return data
    } catch (err) {
      if (cached.data) {
        console.warn('Fetch failed, using stale cache:', err)
        return cached.data
      }
      throw err
    }
  }
}

export const slangCache = new ClientCache('slanghome_slang_')
export const listCache = new ClientCache('slanghome_list_')
export const userCache = new ClientCache('slanghome_user_')

export function useClientCache(prefix?: string) {
  return new ClientCache(prefix)
}
