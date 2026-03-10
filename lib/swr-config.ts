import { SWRConfiguration } from 'swr';

export const swrConfig: SWRConfiguration = {
  dedupingInterval: 60000,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  refreshInterval: 300000,
  keepPreviousData: true,
  revalidateIfStale: false,
  shouldRetryOnError: false,
  errorRetryCount: 1,
  errorRetryInterval: 5000,
};

export const swrConfigAggressive: SWRConfiguration = {
  dedupingInterval: 30000,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  refreshInterval: 60000,
  keepPreviousData: true,
  revalidateIfStale: false,
  shouldRetryOnError: false,
};

export const swrConfigRelaxed: SWRConfiguration = {
  dedupingInterval: 120000,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  refreshInterval: 600000,
  keepPreviousData: true,
  revalidateIfStale: false,
  shouldRetryOnError: false,
};

export const swrConfigRealtime: SWRConfiguration = {
  dedupingInterval: 5000,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  refreshInterval: 10000,
  keepPreviousData: true,
  revalidateIfStale: true,
  shouldRetryOnError: true,
  errorRetryCount: 3,
};

export function createSwrConfig(overrides: Partial<SWRConfiguration> = {}): SWRConfiguration {
  return {
    ...swrConfig,
    ...overrides,
  };
}

export const CACHE_KEYS = {
  SLANG_LIST: 'slang:list',
  SLANG_DETAIL: (id: string | number) => `slang:detail:${id}`,
  SLANG_SEARCH: (query: string) => `slang:search:${query}`,
  SLANG_CATEGORY: (category: string) => `slang:category:${category}`,
  SLANG_TAG: (tag: string) => `slang:tag:${tag}`,
  
  USER_PROFILE: (userId: string | number) => `user:profile:${userId}`,
  USER_FAVORITES: (userId: string | number) => `user:favorites:${userId}`,
  USER_COMMENTS: (userId: string | number) => `user:comments:${userId}`,
  
  CATEGORIES: 'categories:all',
  TAGS: 'tags:all',
  TRENDING: 'trending:slangs',
  
  HEAT_RANKING: 'heat:ranking',
  COMMENT_COUNT: (slangId: string | number) => `comment:count:${slangId}`,
};

export const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
  VERY_LONG: 86400,
};

export function getCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return [prefix, ...parts.map(String)].join(':');
}

export function invalidateCachePattern(pattern: string): string[] {
  return [pattern];
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }
  
  return res.json();
};

export const fetcherWithAuth = async (url: string) => {
  const res = await fetch(url, {
    credentials: 'include',
  });
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }
  
  return res.json();
};

export const fetcherWithToken = (token: string) => async (url: string) => {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }
  
  return res.json();
};
