export function getCacheConfig(): any;
export function loadCacheConfig(): Promise<void>;
export function reloadConfigCache(): Promise<void>;
export function isCacheUsingRedis(): boolean;
export function getCacheStats(): any;
export function getCacheHealthStatus(): any;
export function getCacheStatus(): Promise<any>;
export function initCacheHealthCheck(): void;
export function stopCacheHealthCheck(): void;
export function resetCacheStats(): void;
export function getRedisClient(): Promise<any>;
export function invalidateConfigCache(key: string): Promise<void>;

export function cacheGet<T = any>(key: string): Promise<T | null>;
export function cacheSet(key: string, value: any, ttl?: number | null): Promise<boolean>;
export function cacheDel(key: string): Promise<boolean>;
export function cacheDelPattern(pattern: string): Promise<number>;
export function cacheExists(key: string): Promise<boolean>;
export function cacheTTL(key: string): Promise<number>;
export function cacheIncr(key: string, amount?: number): Promise<number>;
export function cacheExpire(key: string, ttl: number): Promise<boolean>;
export function cacheMGet<T = any>(keys: string[]): Promise<(T | null)[]>;
export function cacheHIncrBy(key: string, field: string, amount?: number): Promise<number>;
export function cacheHGetAll(key: string): Promise<Record<string, string>>;
export function cacheHDel(key: string, field: string): Promise<boolean>;
export function clearAllCache(): Promise<void>;
export function warmupCache(): Promise<void>;

export function getOrSet<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T>;
export function acquireLock(key: string, ttl?: number): Promise<boolean>;
export function releaseLock(key: string): Promise<boolean>;

export const cacheKeys: {
  heat: {
    slang: (id: number | string) => string;
    category: (id: number | string) => string;
    tag: (id: number | string) => string;
    comment: (id: number | string) => string;
  };
  slang: {
    detail: (id: number | string) => string;
    byPhrase: (phrase: string, locale?: string) => string;
    list: (params: any) => string;
    hot: (limit: number, locale?: string) => string;
    comments: (slangId: number | string, page: number, pageSize: number) => string;
  };
  category: {
    heat: (locale?: string) => string;
    list: (page: number, limit: number, locale?: string) => string;
    search: (keyword: string, page: number, limit: number, locale?: string) => string;
  };
  tag: {
    heat: (locale?: string) => string;
    list: (page: number, limit: number, locale?: string) => string;
    search: (keyword: string, page: number, limit: number, locale?: string) => string;
  };
  user: {
    base: (userId: string | number) => string;
    email: (email: string) => string;
    username: (name: string) => string;
    likedSlang: (userId: string | number, slangId: number | string) => string;
    favoritedSlang: (userId: string | number, slangId: number | string) => string;
    likedComment: (userId: string | number, commentId: number | string) => string;
    profile: (userId: string | number) => string;
    stats: (userId: string | number) => string;
    slang: (userId: string | number, page: number, limit: number, locale?: string) => string;
  };
  search: {
    results: (query: string, locale?: string) => string;
  };
  config: {
    item: (key: string) => string;
    all: string;
  };
  rateLimit: {
    api: (type: string, identifier: string) => string;
    login: (ip: string) => string;
  };
  ads: {
    position: (pos?: string) => string;
  };
  locale: {
    active: string;
  };
  lock: {
    acquire: (key: string) => string;
  };
};

export const cacheTTLs: {
  hot: () => number;
  normal: () => number;
  static: () => number;
  userState: () => number;
  default: () => number;
  search: () => number;
};

export function hashKey(key: string): string;

export const heatCounters: {
  incrementSlangViews: (slangId: number) => Promise<void>;
  incrementSlangLikes: (slangId: number) => Promise<void>;
  flushCounters: () => Promise<void>;
};

export const userStateCache: {
  setLikeState: (userId: string, slangId: number, isLiked: boolean) => Promise<void>;
  getLikeState: (userId: string, slangId: number) => Promise<boolean | null>;
  setFavoriteState: (userId: string, slangId: number, isFavorited: boolean) => Promise<void>;
  getFavoriteState: (userId: string, slangId: number) => Promise<boolean | null>;
};
