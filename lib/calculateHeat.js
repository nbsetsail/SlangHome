import { getQuery, allQuery, runQuery } from './db-adapter';
import { cacheDelPattern, cacheDel, heatCounters, cacheKeys } from './cache.js';
import { getConfig, configKeys, defaultConfigs } from './system-config';

export async function calculateSlangHeat() {
  try {
    console.log('Calculating slang heat...');
    
    await heatCounters.flushAllCountersToDb();
    
    const configResult = await getQuery(
      'SELECT value FROM config WHERE item = $1',
      ['slang_heat_config']
    );
    
    const weights = configResult?.value 
      ? JSON.parse(configResult.value)
      : { like_weight: 0.1, comment_weight: 0.2, favorite_weight: 0.25, share_weight: 0.4, view_weight: 0.05 };
    
    console.log('Using slang heat weights:', weights);
    
    const slangList = await allQuery(`
      SELECT id, views, likes, comments_count, favorites, shares
      FROM slang
      WHERE status = 'active'
    `);
    
    for (const slang of slangList) {
      const heat = 
        (slang.likes * weights.like_weight) +
        (slang.comments_count * weights.comment_weight) +
        (slang.favorites * weights.favorite_weight) +
        (slang.shares * weights.share_weight) +
        (slang.views * weights.view_weight);
      
      await runQuery(
        'UPDATE slang SET heat = $1 WHERE id = $2',
        [heat.toFixed(2), slang.id]
      );
    }
    
    console.log(`Updated heat for ${slangList.length} slang entries`);
    return slangList.length;
  } catch (error) {
    console.error('Error calculating slang heat:', error);
    return 0;
  }
}

export async function calculateCategoryHeat() {
  try {
    console.log('Calculating category heat...');
    
    const configResult = await getQuery(
      'SELECT value FROM config WHERE item = $1',
      ['category_heat_config']
    );
    
    const weights = configResult?.value
      ? JSON.parse(configResult.value)
      : { slang_heat_weight: 0.5, click_weight: 0.25, search_weight: 0.25 };
    
    console.log('Using category heat weights:', weights);
    
    const categories = await allQuery('SELECT id, name, click_count FROM categories');
    
    for (const category of categories) {
      const slangList = await allQuery(
        "SELECT heat FROM slang WHERE categories @> $1::jsonb AND status = 'active'",
        [JSON.stringify([category.name])]
      );
      
      const totalSlangHeat = slangList.reduce((sum, s) => sum + parseFloat(s.heat || 0), 0);
      
      const heat = 
        (totalSlangHeat * weights.slang_heat_weight) +
        ((category.click_count || 0) * weights.click_weight);
      
      await runQuery(
        'UPDATE categories SET heat = $1 WHERE id = $2',
        [heat.toFixed(2), category.id]
      );
    }
    
    console.log(`Updated heat for ${categories.length} categories`);
    return categories.length;
  } catch (error) {
    console.error('Error calculating category heat:', error);
    return 0;
  }
}

export async function calculateTagHeat() {
  try {
    console.log('Calculating tag heat...');
    
    const configResult = await getQuery(
      'SELECT value FROM config WHERE item = $1',
      ['tag_heat_config']
    );
    
    const weights = configResult?.value
      ? JSON.parse(configResult.value)
      : { slang_heat_weight: 0.5, click_weight: 0.25, search_weight: 0.25 };
    
    console.log('Using tag heat weights:', weights);
    
    const tags = await allQuery('SELECT id, name, click_count FROM tags');
    
    for (const tag of tags) {
      const slangList = await allQuery(
        "SELECT heat FROM slang WHERE tags @> $1::jsonb AND status = 'active'",
        [JSON.stringify([tag.name])]
      );
      
      const totalSlangHeat = slangList.reduce((sum, s) => sum + parseFloat(s.heat || 0), 0);
      
      const heat = 
        (totalSlangHeat * weights.slang_heat_weight) +
        ((tag.click_count || 0) * weights.click_weight);
      
      await runQuery(
        'UPDATE tags SET heat = $1 WHERE id = $2',
        [heat.toFixed(2), tag.id]
      );
    }
    
    console.log(`Updated heat for ${tags.length} tags`);
    return tags.length;
  } catch (error) {
    console.error('Error calculating tag heat:', error);
    return 0;
  }
}

export async function calculateAllHeat() {
  console.log('Starting full heat calculation...');
  const startTime = Date.now();
  
  await heatCounters.flushAllCountersToDb();
  
  const slangCount = await calculateSlangHeat();
  const categoryCount = await calculateCategoryHeat();
  const tagCount = await calculateTagHeat();
  
  await cacheDelPattern('slang:*');
  await cacheDelPattern('categories:*');
  await cacheDelPattern('tags:*');
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Heat calculation completed in ${duration}s`);
  console.log(`Updated: ${slangCount} slang, ${categoryCount} categories, ${tagCount} tags`);
  
  return {
    slangCount,
    categoryCount,
    tagCount,
    duration
  };
}

let slangHeatTimer = null;
let categoryTagHeatTimer = null;
let slangCounterTimer = null;
let commentCounterTimer = null;
let categoryCounterTimer = null;
let tagCounterTimer = null;
let cachedHeatConfig = null;
let cachedBatchConfig = null;

export async function loadHeatConfig() {
  const config = await getConfig(configKeys.heatCalc);
  cachedHeatConfig = config || defaultConfigs[configKeys.heatCalc];
  return cachedHeatConfig;
}

export async function loadBatchConfig() {
  const config = await getConfig(configKeys.batchUpdate);
  cachedBatchConfig = config || defaultConfigs[configKeys.batchUpdate];
  return cachedBatchConfig;
}

export async function reloadConfigCache() {
  cachedHeatConfig = null;
  cachedBatchConfig = null;
  await loadHeatConfig();
  await loadBatchConfig();
  
  await startCounterFlushTimer();
  console.log('Counter flush timers reloaded with new config');
}

function getHeatConfigSync() {
  return cachedHeatConfig || defaultConfigs[configKeys.heatCalc];
}

function getBatchConfigSync() {
  return cachedBatchConfig || defaultConfigs[configKeys.batchUpdate];
}

export async function startHeatTimers() {
  const heatConfig = await loadHeatConfig();
  const slangIntervalMs = (heatConfig.slangInterval || 60) * 60 * 1000;
  const categoryTagIntervalMs = (heatConfig.categoryTagInterval || 600) * 60 * 1000;
  
  if (slangHeatTimer) {
    clearInterval(slangHeatTimer);
  }
  if (categoryTagHeatTimer) {
    clearInterval(categoryTagHeatTimer);
  }
  
  calculateSlangHeat().catch(console.error);
  slangHeatTimer = setInterval(() => {
    calculateSlangHeat().catch(console.error);
  }, slangIntervalMs);
  console.log(`Slang heat timer started (runs every ${slangIntervalMs / 60000} minutes)`);
  
  calculateCategoryHeat().catch(console.error);
  calculateTagHeat().catch(console.error);
  categoryTagHeatTimer = setInterval(() => {
    calculateCategoryHeat().catch(console.error);
    calculateTagHeat().catch(console.error);
  }, categoryTagIntervalMs);
  console.log(`Category/Tag heat timer started (runs every ${categoryTagIntervalMs / 60000} minutes)`);
}

export function stopHeatTimers() {
  if (slangHeatTimer) {
    clearInterval(slangHeatTimer);
    slangHeatTimer = null;
    console.log('Slang heat timer stopped');
  }
  if (categoryTagHeatTimer) {
    clearInterval(categoryTagHeatTimer);
    categoryTagHeatTimer = null;
    console.log('Category/Tag heat timer stopped');
  }
}

export function getHeatTimerStatus() {
  return {
    slangHeatRunning: slangHeatTimer !== null,
    categoryTagHeatRunning: categoryTagHeatTimer !== null
  };
}

export async function startCounterFlushTimer() {
  const batchConfig = await loadBatchConfig();
  
  if (!batchConfig.enabled) {
    stopCounterFlushTimer();
    console.log('Counter flush timers disabled (batch_update_config.enabled = false)');
    return;
  }
  
  stopCounterFlushTimer();
  
  const { heatCounters } = await import('./cache/index.js');
  
  if (batchConfig.slang?.enabled) {
    const interval = batchConfig.slang.flushInterval || 30000;
    slangCounterTimer = setInterval(() => {
      heatCounters.flushSlangCountersToDb().catch(console.error);
    }, interval);
    console.log(`Slang counter flush timer started (runs every ${interval / 1000} seconds)`);
  }
  
  if (batchConfig.comment?.enabled) {
    const interval = batchConfig.comment.flushInterval || 10000;
    commentCounterTimer = setInterval(() => {
      heatCounters.flushCommentCountersToDb().catch(console.error);
    }, interval);
    console.log(`Comment counter flush timer started (runs every ${interval / 1000} seconds)`);
  }
  
  if (batchConfig.category?.enabled) {
    const interval = batchConfig.category.flushInterval || 60000;
    categoryCounterTimer = setInterval(() => {
      heatCounters.flushCategoryCountersToDb().catch(console.error);
    }, interval);
    console.log(`Category counter flush timer started (runs every ${interval / 1000} seconds)`);
  }
  
  if (batchConfig.tag?.enabled) {
    const tagInterval = batchConfig.tag.flushInterval || 60000;
    tagCounterTimer = setInterval(() => {
      heatCounters.flushTagCountersToDb().catch(console.error);
    }, tagInterval);
    console.log(`Tag counter flush timer started (runs every ${tagInterval / 1000} seconds)`);
  }
}

export function stopCounterFlushTimer() {
  if (slangCounterTimer) {
    clearInterval(slangCounterTimer);
    slangCounterTimer = null;
    console.log('Slang counter flush timer stopped');
  }
  if (commentCounterTimer) {
    clearInterval(commentCounterTimer);
    commentCounterTimer = null;
    console.log('Comment counter flush timer stopped');
  }
  if (categoryCounterTimer) {
    clearInterval(categoryCounterTimer);
    categoryCounterTimer = null;
    console.log('Category counter flush timer stopped');
  }
  if (tagCounterTimer) {
    clearInterval(tagCounterTimer);
    tagCounterTimer = null;
    console.log('Tag counter flush timer stopped');
  }
}

export function getCounterFlushTimerStatus() {
  return {
    slang: slangCounterTimer !== null,
    comment: commentCounterTimer !== null,
    category: categoryCounterTimer !== null,
    tag: tagCounterTimer !== null
  };
}

export async function updateSlangHeatOnAction(slangId, action) {
  try {
    switch (action) {
      case 'like':
        await heatCounters.incrSlangLikes(slangId, 1);
        break;
      case 'unlike':
        await heatCounters.incrSlangLikes(slangId, -1);
        break;
      case 'comment':
        await heatCounters.incrSlangComments(slangId, 1);
        break;
      case 'delete_comment':
        await heatCounters.incrSlangComments(slangId, -1);
        break;
      case 'favorite':
        await heatCounters.incrSlangFavorites(slangId, 1);
        break;
      case 'unfavorite':
        await heatCounters.incrSlangFavorites(slangId, -1);
        break;
      case 'share':
        await heatCounters.incrSlangShares(slangId, 1);
        break;
      case 'view':
        await heatCounters.incrSlangViews(slangId);
        break;
    }
    
    await cacheDel(cacheKeys.slang.detail(slangId));
  } catch (error) {
    console.error('Error updating slang heat:', error);
  }
}

export async function startHeatCalculationTimer(intervalMs = 60 * 60 * 1000) {
  await startHeatTimers();
}

export function stopHeatCalculationTimer() {
  stopHeatTimers();
}
