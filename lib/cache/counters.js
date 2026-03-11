import { cacheGet, cacheSet, cacheDel, cacheHIncrBy, cacheHGetAll, cacheHDel } from './core.js';
import { cacheKeys } from './keys.js';
import { getMemoryStore, getEnvPrefix } from './health.js';

const heat = cacheKeys.heat;

const getCounter = async (key) => {
  const value = await cacheGet(key);
  return parseInt(value || '0', 10);
};

export const heatCounters = {
  incrSlangViews: async (slangId) => {
    const key = heat.slang(slangId);
    return await cacheHIncrBy(key, 'views', 1);
  },

  incrSlangLikes: async (slangId, delta = 1) => {
    const key = heat.slang(slangId);
    return await cacheHIncrBy(key, 'likes', delta);
  },

  incrSlangComments: async (slangId, delta = 1) => {
    const key = heat.slang(slangId);
    return await cacheHIncrBy(key, 'comments', delta);
  },

  incrSlangFavorites: async (slangId, delta = 1) => {
    const key = heat.slang(slangId);
    return await cacheHIncrBy(key, 'favorites', delta);
  },

  incrSlangShares: async (slangId) => {
    const key = heat.slang(slangId);
    return await cacheHIncrBy(key, 'shares', 1);
  },

  incrCategoryClicks: async (categoryId) => {
    const key = heat.category(categoryId);
    return await cacheHIncrBy(key, 'clicks', 1);
  },

  incrTagClicks: async (tagId) => {
    const key = heat.tag(tagId);
    return await cacheHIncrBy(key, 'clicks', 1);
  },

  incrCommentReplies: async (commentId, delta = 1) => {
    const key = heat.comment(commentId);
    return await cacheHIncrBy(key, 'replies', delta);
  },

  getCommentReplies: async (commentId) => {
    const key = heat.comment(commentId);
    const data = await cacheHGetAll(key);
    return parseInt(data.replies || '0', 10);
  },

  getSlangCounters: async (slangId) => {
    const key = heat.slang(slangId);
    const data = await cacheHGetAll(key);
    
    return {
      views: parseInt(data.views || '0', 10),
      likes: parseInt(data.likes || '0', 10),
      comments: parseInt(data.comments || '0', 10),
      favorites: parseInt(data.favorites || '0', 10),
      shares: parseInt(data.shares || '0', 10)
    };
  },

  getMultipleSlangCounters: async (slangIds) => {
    if (!slangIds || slangIds.length === 0) {
      return {};
    }

    const results = {};
    await Promise.all(slangIds.map(async (id) => {
      try {
        const counters = await heatCounters.getSlangCounters(id);
        if (counters.views > 0 || counters.likes > 0 || counters.comments > 0 ||
            counters.favorites > 0 || counters.shares > 0) {
          results[id] = counters;
        }
      } catch (err) {
        console.error(`Error getting counters for slang ${id}:`, err);
      }
    }));
    
    return results;
  },

  flushSlangCountersToDb: async () => {
    const startTime = Date.now();
    let slangCount = 0;

    const { getConfig, configKeys } = await import('../system-config');
    const batchConfig = await getConfig(configKeys.batchUpdate);
    const maxBatchSize = batchConfig?.slang?.maxBatchSize || 100;

    try {
      const memoryStore = getMemoryStore();
      const ENV_PREFIX = getEnvPrefix();

      const slangIds = new Set();

      for (const key of memoryStore.keys()) {
        const fullKey = key.startsWith(`${ENV_PREFIX}:`) ? key : `${ENV_PREFIX}:${key}`;
        const keyWithoutPrefix = fullKey.replace(`${ENV_PREFIX}:`, '');

        const slangMatch = keyWithoutPrefix.match(/heat:slang:([^:]+)$/);
        if (slangMatch) {
          slangIds.add(slangMatch[1]);
        }
      }

      if (slangIds.size === 0) {
        return { success: true, slangCount: 0, duration: '0.00' };
      }

      console.log('📊 Writing slang counters to database...');

      const pendingSlangUpdates = [];

      for (const slangId of slangIds) {
        const counters = await heatCounters.getSlangCounters(slangId);
        if (counters.views === 0 && counters.likes === 0 && counters.comments === 0 &&
          counters.favorites === 0 && counters.shares === 0) {
          continue;
        }

        pendingSlangUpdates.push({
          slangId,
          counters
        });

        if (pendingSlangUpdates.length >= maxBatchSize) {
          await flushSlangBatch(pendingSlangUpdates);
          slangCount += pendingSlangUpdates.length;
          pendingSlangUpdates.length = 0;
        }
      }

      if (pendingSlangUpdates.length > 0) {
        await flushSlangBatch(pendingSlangUpdates);
        slangCount += pendingSlangUpdates.length;
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Slang counters written - ${duration}s, ${slangCount} items`);

      return { success: true, slangCount, duration };
    } catch (error) {
      console.error('❌ Slang counters write failed:', error);
      return { success: false, error: error.message };
    }
  },

  flushCommentCountersToDb: async () => {
    const startTime = Date.now();
    let commentCount = 0;

    const { getConfig, configKeys } = await import('../system-config');
    const batchConfig = await getConfig(configKeys.batchUpdate);
    const maxBatchSize = batchConfig?.comment?.maxBatchSize || 50;

    try {
      const memoryStore = getMemoryStore();
      const ENV_PREFIX = getEnvPrefix();

      const commentIds = new Set();

      for (const key of memoryStore.keys()) {
        const fullKey = key.startsWith(`${ENV_PREFIX}:`) ? key : `${ENV_PREFIX}:${key}`;
        const keyWithoutPrefix = fullKey.replace(`${ENV_PREFIX}:`, '');

        const commentMatch = keyWithoutPrefix.match(/heat:comment:([^:]+)$/);
        if (commentMatch) {
          commentIds.add(commentMatch[1]);
        }
      }

      if (commentIds.size === 0) {
        return { success: true, commentCount: 0, duration: '0.00' };
      }

      console.log('📊 Writing comment reply counters to database...');

      const pendingCommentUpdates = [];

      for (const commentId of commentIds) {
        const replies = await heatCounters.getCommentReplies(commentId);
        if (replies > 0) {
          pendingCommentUpdates.push({ commentId, replies });

          if (pendingCommentUpdates.length >= maxBatchSize) {
            await flushCommentBatch(pendingCommentUpdates);
            commentCount += pendingCommentUpdates.length;
            pendingCommentUpdates.length = 0;
          }
        }
      }

      if (pendingCommentUpdates.length > 0) {
        await flushCommentBatch(pendingCommentUpdates);
        commentCount += pendingCommentUpdates.length;
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Comment reply counters written - ${duration}s, ${commentCount} items`);

      return { success: true, commentCount, duration };
    } catch (error) {
      console.error('❌ Comment reply counters write failed:', error);
      return { success: false, error: error.message };
    }
  },

  flushCategoryCountersToDb: async () => {
    const startTime = Date.now();
    let categoryCount = 0;

    const { getConfig, configKeys } = await import('../system-config');
    const batchConfig = await getConfig(configKeys.batchUpdate);
    const maxBatchSize = batchConfig?.category?.maxBatchSize || 200;

    try {
      const memoryStore = getMemoryStore();
      const ENV_PREFIX = getEnvPrefix();

      const categoryIds = new Set();

      for (const key of memoryStore.keys()) {
        const fullKey = key.startsWith(`${ENV_PREFIX}:`) ? key : `${ENV_PREFIX}:${key}`;
        const keyWithoutPrefix = fullKey.replace(`${ENV_PREFIX}:`, '');

        const categoryMatch = keyWithoutPrefix.match(/heat:category:([^:]+)$/);
        if (categoryMatch) {
          categoryIds.add(categoryMatch[1]);
        }
      }

      if (categoryIds.size === 0) {
        return { success: true, categoryCount: 0, duration: '0.00' };
      }

      console.log('📊 Writing category click counters to database...');

      const pendingCategoryUpdates = [];

      for (const categoryId of categoryIds) {
        const key = heat.category(categoryId);
        const data = await cacheHGetAll(key);
        const clicks = parseInt(data.clicks || '0', 10);
        if (clicks > 0) {
          pendingCategoryUpdates.push({ categoryId, clicks });

          if (pendingCategoryUpdates.length >= maxBatchSize) {
            await flushCategoryBatch(pendingCategoryUpdates);
            categoryCount += pendingCategoryUpdates.length;
            pendingCategoryUpdates.length = 0;
          }
        }
      }

      if (pendingCategoryUpdates.length > 0) {
        await flushCategoryBatch(pendingCategoryUpdates);
        categoryCount += pendingCategoryUpdates.length;
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Category click counters written - ${duration}s, ${categoryCount} items`);

      return { success: true, categoryCount, duration };
    } catch (error) {
      console.error('❌ Category click counters write failed:', error);
      return { success: false, error: error.message };
    }
  },

  flushTagCountersToDb: async () => {
    const startTime = Date.now();
    let tagCount = 0;

    const { getConfig, configKeys } = await import('../system-config');
    const batchConfig = await getConfig(configKeys.batchUpdate);
    const maxBatchSize = batchConfig?.tag?.maxBatchSize || 200;

    try {
      const memoryStore = getMemoryStore();
      const ENV_PREFIX = getEnvPrefix();

      const tagIds = new Set();

      for (const key of memoryStore.keys()) {
        const fullKey = key.startsWith(`${ENV_PREFIX}:`) ? key : `${ENV_PREFIX}:${key}`;
        const keyWithoutPrefix = fullKey.replace(`${ENV_PREFIX}:`, '');

        const tagMatch = keyWithoutPrefix.match(/heat:tag:([^:]+)$/);
        if (tagMatch) {
          tagIds.add(tagMatch[1]);
        }
      }

      if (tagIds.size === 0) {
        return { success: true, tagCount: 0, duration: '0.00' };
      }

      console.log('📊 Writing tag click counters to database...');

      const pendingTagUpdates = [];

      for (const tagId of tagIds) {
        const key = heat.tag(tagId);
        const data = await cacheHGetAll(key);
        const clicks = parseInt(data.clicks || '0', 10);
        if (clicks > 0) {
          pendingTagUpdates.push({ tagId, clicks });

          if (pendingTagUpdates.length >= maxBatchSize) {
            await flushTagBatch(pendingTagUpdates);
            tagCount += pendingTagUpdates.length;
            pendingTagUpdates.length = 0;
          }
        }
      }

      if (pendingTagUpdates.length > 0) {
        await flushTagBatch(pendingTagUpdates);
        tagCount += pendingTagUpdates.length;
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Tag click counters written - ${duration}s, ${tagCount} items`);

      return { success: true, tagCount, duration };
    } catch (error) {
      console.error('❌ Tag click counters write failed:', error);
      return { success: false, error: error.message };
    }
  },

  flushAllCountersToDb: async () => {
    const startTime = Date.now();
    
    const [slangResult, commentResult, categoryResult, tagResult] = await Promise.all([
      heatCounters.flushSlangCountersToDb(),
      heatCounters.flushCommentCountersToDb(),
      heatCounters.flushCategoryCountersToDb(),
      heatCounters.flushTagCountersToDb()
    ]);
    
    const slangCount = slangResult.slangCount || 0;
    const commentCount = commentResult.commentCount || 0;
    const categoryCount = categoryResult.categoryCount || 0;
    const tagCount = tagResult.tagCount || 0;
    
    const totalCount = slangCount + commentCount + categoryCount + tagCount;
    
    if (totalCount > 0) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ All counters written - ${duration}s`);
      console.log(`   Slang: ${slangCount} items`);
      console.log(`   Comments: ${commentCount} items`);
      console.log(`   Categories: ${categoryCount} items`);
      console.log(`   Tags: ${tagCount} items`);
    }

    return { success: true, slangCount, commentCount, categoryCount, tagCount, duration: ((Date.now() - startTime) / 1000).toFixed(2) };
  }
};

async function flushSlangBatch(updates) {
  if (updates.length === 0) return;

  const { getWriteDb, releaseDb } = await import('../db-adapter');
  const connection = await getWriteDb();

  try {
    await connection.query('BEGIN');

    for (const update of updates) {
      await connection.query(
        `UPDATE slang SET views = views + $1, likes = likes + $2, comments_count = comments_count + $3, favorites = favorites + $4, shares = shares + $5 WHERE id = $6`,
        [update.counters.views, update.counters.likes, update.counters.comments, update.counters.favorites, update.counters.shares, update.slangId]
      );
    }

    await connection.query('COMMIT');

    await Promise.all(updates.map(u => cacheDel(heat.slang(u.slangId))));
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    await releaseDb(connection);
  }
}

async function flushCategoryBatch(updates) {
  if (updates.length === 0) return;

  const { getWriteDb, releaseDb } = await import('../db-adapter');
  const connection = await getWriteDb();

  try {
    await connection.query('BEGIN');

    for (const update of updates) {
      await connection.query(
        'UPDATE categories SET click_count = click_count + $1 WHERE id = $2',
        [update.clicks, update.categoryId]
      );
    }

    await connection.query('COMMIT');

    await Promise.all(updates.map(u => cacheDel(heat.category(u.categoryId))));
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    await releaseDb(connection);
  }
}

async function flushTagBatch(updates) {
  if (updates.length === 0) return;

  const { getWriteDb, releaseDb } = await import('../db-adapter');
  const connection = await getWriteDb();

  try {
    await connection.query('BEGIN');

    for (const update of updates) {
      await connection.query(
        'UPDATE tags SET click_count = click_count + $1 WHERE id = $2',
        [update.clicks, update.tagId]
      );
    }

    await connection.query('COMMIT');

    await Promise.all(updates.map(u => cacheDel(heat.tag(u.tagId))));
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    await releaseDb(connection);
  }
}

async function flushCommentBatch(updates) {
  if (updates.length === 0) return;

  const { getWriteDb, releaseDb } = await import('../db-adapter');
  const connection = await getWriteDb();

  try {
    await connection.query('BEGIN');

    for (const update of updates) {
      await connection.query(
        'UPDATE comments SET reply_count = reply_count + $1 WHERE id = $2',
        [update.replies, update.commentId]
      );
    }

    await connection.query('COMMIT');

    await Promise.all(updates.map(u => cacheDel(heat.comment(u.commentId))));
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    await releaseDb(connection);
  }
}
