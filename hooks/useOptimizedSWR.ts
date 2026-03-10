import useSWR from 'swr';
import { swrConfig, swrConfigAggressive, swrConfigRelaxed, CACHE_KEYS, fetcher } from '@/lib/swr-config';

export function useSlangList(locale: string = 'en') {
  const { data, error, isLoading, mutate } = useSWR(
    `${CACHE_KEYS.SLANG_LIST}:${locale}`,
    () => fetcher(`/api/slangs?locale=${locale}`),
    swrConfig
  );

  return {
    slangs: data?.slangs || [],
    total: data?.total || 0,
    isLoading,
    error,
    mutate,
  };
}

export function useSlangDetail(id: string | number) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? CACHE_KEYS.SLANG_DETAIL(id) : null,
    () => fetcher(`/api/slang/${id}`),
    swrConfig
  );

  return {
    slang: data,
    isLoading,
    error,
    mutate,
  };
}

export function useSlangSearch(query: string, locale: string = 'en') {
  const { data, error, isLoading } = useSWR(
    query ? CACHE_KEYS.SLANG_SEARCH(query) : null,
    () => fetcher(`/api/search?q=${encodeURIComponent(query)}&locale=${locale}`),
    swrConfigAggressive
  );

  return {
    results: data?.results || [],
    total: data?.total || 0,
    isLoading,
    error,
  };
}

export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR(
    CACHE_KEYS.CATEGORIES,
    () => fetcher('/api/categories'),
    swrConfigRelaxed
  );

  return {
    categories: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useTags() {
  const { data, error, isLoading, mutate } = useSWR(
    CACHE_KEYS.TAGS,
    () => fetcher('/api/tags'),
    swrConfigRelaxed
  );

  return {
    tags: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useTrendingSlangs(locale: string = 'en') {
  const { data, error, isLoading } = useSWR(
    `${CACHE_KEYS.TRENDING}:${locale}`,
    () => fetcher(`/api/slangs?sort=heat&limit=20&locale=${locale}`),
    swrConfigAggressive
  );

  return {
    slangs: data?.slangs || [],
    isLoading,
    error,
  };
}

export function useUserProfile(userId: string | number) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? CACHE_KEYS.USER_PROFILE(userId) : null,
    () => fetcher(`/api/user/${userId}`),
    swrConfig
  );

  return {
    user: data,
    isLoading,
    error,
    mutate,
  };
}

export function useUserFavorites(userId: string | number, page: number = 1) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `${CACHE_KEYS.USER_FAVORITES(userId)}:page:${page}` : null,
    () => fetcher(`/api/user/${userId}/favorites?page=${page}`),
    swrConfig
  );

  return {
    favorites: data?.favorites || [],
    total: data?.total || 0,
    isLoading,
    error,
    mutate,
  };
}

export function useHeatRanking() {
  const { data, error, isLoading } = useSWR(
    CACHE_KEYS.HEAT_RANKING,
    () => fetcher('/api/slangs?sort=heat&limit=100'),
    swrConfigAggressive
  );

  return {
    ranking: data?.slangs || [],
    isLoading,
    error,
  };
}

export function useCommentCount(slangId: string | number) {
  const { data, error, isLoading, mutate } = useSWR(
    slangId ? CACHE_KEYS.COMMENT_COUNT(slangId) : null,
    () => fetcher(`/api/slang/${slangId}/comments/count`),
    swrConfigAggressive
  );

  return {
    count: data?.count || 0,
    isLoading,
    error,
    mutate,
  };
}
