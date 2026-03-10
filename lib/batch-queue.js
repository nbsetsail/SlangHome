import { getWriteDb, getQuery } from './db-adapter';
import { cacheIncr, cacheGet, cacheSet } from './cache.js';
import { getConfig, configKeys, defaultConfigs } from './system-config';

let batchConfig = null;
let configLoaded = false;

const counters = new Map();
let isFlushing = false;
let flushTimer = null;

export const loadBatchConfig = async (forceRefresh = false) => {
  if (configLoaded && !forceRefresh && batchConfig) {
    return batchConfig;
  }
  
  try {
    const config = await getConfig(configKeys.batchUpdate);
    batchConfig = config || defaultConfigs[configKeys.batchUpdate];
    configLoaded = true;
  } catch (error) {
    console.error('Failed to load batch config:', error);
    batchConfig = defaultConfigs[configKeys.batchUpdate];
  }
  
  return batchConfig;
};

export const getBatchConfig = () => batchConfig || defaultConfigs[configKeys.batchUpdate];

const startFlushTimer = () => {
  if (flushTimer) return;
  
  const config = getBatchConfig();
  flushTimer = setInterval(async () => {
    await flushAllCounters();
  }, config.flushInterval);
};

const stopFlushTimer = () => {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
};

const flushAllCounters = async () => {
  if (isFlushing || counters.size === 0) return;
  
  isFlushing = true;
  const config = getBatchConfig();
  
  try {
    const db = getWriteDb();
    
    for (const [key, data] of counters.entries()) {
      if (data.count >= config.batchSize) {
        const { table, idField, id, field } = data;
        
        await db.query(
          `UPDATE ${table} SET ${field} = ${field} + $1 WHERE ${idField} = $2`,
          [data.count, id]
        );
        
        counters.delete(key);
      }
    }
  } catch (error) {
    console.error('Error flushing counters:', error);
  } finally {
    isFlushing = false;
  }
};

export const incrementCounter = async (table, idField, id, field, increment = 1) => {
  const key = `${table}:${idField}:${id}:${field}`;
  
  if (!counters.has(key)) {
    counters.set(key, {
      table,
      idField,
      id,
      field,
      count: 0
    });
  }
  
  const data = counters.get(key);
  data.count += increment;
  
  const config = getBatchConfig();
  if (data.count >= config.batchSize) {
    await flushAllCounters();
  }
  
  startFlushTimer();
  
  return data.count;
};

export const getCounter = (table, idField, id, field) => {
  const key = `${table}:${idField}:${id}:${field}`;
  return counters.get(key)?.count || 0;
};

export const flushCounter = async (table, idField, id, field) => {
  const key = `${table}:${idField}:${id}:${field}`;
  const data = counters.get(key);
  
  if (!data || data.count === 0) return;
  
  const db = getWriteDb();
  await db.query(
    `UPDATE ${table} SET ${field} = ${field} + $1 WHERE ${idField} = $2`,
    [data.count, id]
  );
  
  counters.delete(key);
};

export const shutdown = async () => {
  stopFlushTimer();
  await flushAllCounters();
};
