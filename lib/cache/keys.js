const hashKey = (key) => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

export const cacheKeys = {
  heat: {
    slang: (id) => `heat:slang:${id}`,
    category: (id) => `heat:category:${id}`,
    tag: (id) => `heat:tag:${id}`,
    comment: (id) => `heat:comment:${id}`
  },

  slang: {
    detail: (id) => `slang:id:${id}`,
    byPhrase: (phrase, locale = 'en') => `slang:${locale}:phrase:${encodeURIComponent(phrase)}`,
    list: (params) => `slang:list:${hashKey(JSON.stringify(params))}`,
    hot: (limit, locale = 'en') => `slang:${locale}:hot:${limit}`,
    comments: (slangId, page, pageSize) => `comments:slang:${slangId}:page:${page}:size:${pageSize}`
  },

  category: {
    heat: (locale = 'en') => `categories:${locale}:heat`,
    list: (page, limit, locale = 'en') => `categories:${locale}:list:${page}:${limit}`,
    search: (keyword, page, limit, locale = 'en') => `categories:${locale}:search:${keyword}:page:${page}:${limit}`
  },

  tag: {
    heat: (locale = 'en') => `tags:${locale}:heat`,
    list: (page, limit, locale = 'en') => `tags:${locale}:list:${page}:${limit}`,
    search: (keyword, page, limit, locale = 'en') => `tags:${locale}:search:${keyword}:page:${page}:${limit}`
  },

  user: {
    base: (userId) => `user:${userId}`,
    email: (email) => `user:email:${email}`,
    username: (name) => `user:username:${name}`,
    likedSlang: (userId, slangId) => `user:${userId}:liked:slang:${slangId}`,
    favoritedSlang: (userId, slangId) => `user:${userId}:favorited:slang:${slangId}`,
    likedComment: (userId, commentId) => `user:${userId}:liked:comment:${commentId}`,
    profile: (userId) => `user:profile:${userId}`,
    stats: (userId) => `user:stats:${userId}`,
    slang: (userId, page, limit, locale = 'en') => `user:${userId}:${locale}:slang:${page}:${limit}`
  },

  search: {
    results: (query, locale = 'en') => `search:${locale}:${hashKey(query)}`
  },

  config: {
    item: (key) => `config:${key}`,
    all: 'config:all'
  },

  rateLimit: {
    api: (type, identifier) => `rate_limit:${type}:${identifier}`,
    login: (ip) => `login:${ip}`
  },

  ads: {
    position: (pos) => `ads:position:${pos || 'all'}`
  },

  locale: {
    active: 'locales:active'
  },

  lock: {
    acquire: (key) => `lock:${key}`
  }
};

export const cacheTTLs = {
  static: () => {
    try {
      const { getCacheConfig } = require('./health');
      return getCacheConfig().staticDataTTL;
    } catch {
      return 3600;
    }
  },
  hot: () => {
    try {
      const { getCacheConfig } = require('./health');
      return getCacheConfig().hotContentTTL;
    } catch {
      return 300;
    }
  },
  search: () => {
    try {
      const { getCacheConfig } = require('./health');
      return getCacheConfig().searchResultTTL;
    } catch {
      return 600;
    }
  },
  userState: () => {
    try {
      const { getCacheConfig } = require('./health');
      return getCacheConfig().userStateTTL;
    } catch {
      return 1800;
    }
  },
  manage: () => {
    try {
      const { getCacheConfig } = require('./health');
      return getCacheConfig().manageDataTTL;
    } catch {
      return 60;
    }
  },
  null: () => {
    try {
      const { getCacheConfig } = require('./health');
      return getCacheConfig().nullCacheTTL;
    } catch {
      return 60;
    }
  },
  heatCounter: () => {
    try {
      const { getCacheConfig } = require('./health');
      return getCacheConfig().heatCounterTTL || 0;
    } catch {
      return 0;
    }
  }
};

export { hashKey };
