import { cacheGet, cacheSet } from './core.js';
import { cacheKeys, cacheTTLs } from './keys.js';

const user = cacheKeys.user;

export const userStateCache = {
  setUserLikedSlang: async (userId, slangId, isLiked) => {
    const key = user.likedSlang(userId, slangId);
    return await cacheSet(key, isLiked ? '1' : '0', cacheTTLs.userState());
  },

  getUserLikedSlang: async (userId, slangId) => {
    const key = user.likedSlang(userId, slangId);
    const value = await cacheGet(key);
    if (value === null) return null;
    return value === '1';
  },

  setUserFavoritedSlang: async (userId, slangId, isFavorited) => {
    const key = user.favoritedSlang(userId, slangId);
    return await cacheSet(key, isFavorited ? '1' : '0', cacheTTLs.userState());
  },

  getUserFavoritedSlang: async (userId, slangId) => {
    const key = user.favoritedSlang(userId, slangId);
    const value = await cacheGet(key);
    if (value === null) return null;
    return value === '1';
  },

  setUserLikedComment: async (userId, commentId, isLiked) => {
    const key = user.likedComment(userId, commentId);
    return await cacheSet(key, isLiked ? '1' : '0', cacheTTLs.userState());
  },

  getUserLikedComment: async (userId, commentId) => {
    const key = user.likedComment(userId, commentId);
    const value = await cacheGet(key);
    if (value === null) return null;
    return value === '1';
  },

  getMultipleUserLikedSlang: async (userId, slangIds) => {
    if (!userId || !slangIds || slangIds.length === 0) return {};

    const result = {};
    await Promise.all(slangIds.map(async (id) => {
      const value = await userStateCache.getUserLikedSlang(userId, id);
      if (value !== null) {
        result[id] = value;
      }
    }));

    return result;
  },

  getMultipleUserFavoritedSlang: async (userId, slangIds) => {
    if (!userId || !slangIds || slangIds.length === 0) return {};

    const result = {};
    await Promise.all(slangIds.map(async (id) => {
      const value = await userStateCache.getUserFavoritedSlang(userId, id);
      if (value !== null) {
        result[id] = value;
      }
    }));

    return result;
  }
};
