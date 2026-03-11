import { Pool } from 'pg';
import { getUTCTimestamp } from './date-utils';

function getNeonConnectionString(): string {
  // 优先级：连接池 URL > 直接连接 URL
  // 1. 手动配置的连接池 URL
  const pooledUrl = process.env.DATABASE_URL_POOLED || process.env.POSTGRES_URL_POOLED;
  if (pooledUrl) {
    console.log('[db] Using DATABASE_URL_POOLED or POSTGRES_URL_POOLED');
    return pooledUrl;
  }
  
  // 2. Neon 自动注入的连接池 URL (Vercel Integration)
  const neonPooledUrl = process.env.POSTGRES_URL;
  if (neonPooledUrl && neonPooledUrl.includes('pooler')) {
    console.log('[db] Using POSTGRES_URL (pooler detected)');
    return neonPooledUrl;
  }
  
  // 3. 直接连接 (警告：不适合 Serverless)
  const directUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
  if (directUrl) {
    console.warn('[db] ⚠️ Using direct connection. Consider using pooled connection for Vercel/Serverless.');
    return directUrl;
  }
  
  console.error('[db] ❌ No database connection string found!');
  console.error('[db] Available env vars:', {
    DATABASE_URL_POOLED: !!process.env.DATABASE_URL_POOLED,
    POSTGRES_URL_POOLED: !!process.env.POSTGRES_URL_POOLED,
    POSTGRES_URL: !!process.env.POSTGRES_URL,
    DATABASE_URL: !!process.env.DATABASE_URL,
    POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
  });
  
  return '';
}

const USE_NEON = !!getNeonConnectionString();

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = getNeonConnectionString();
    if (connectionString) {
      pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        max: 1,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 10000,
      });
      console.log('[db] ✅ Neon PostgreSQL connection pool created (Serverless optimized)');
    } else {
      pool = new Pool({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DATABASE || 'slanghome',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || '',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
      console.log('[db] ✅ Local PostgreSQL connection pool created');
    }
  }
  return pool;
}

async function executeQueryInternal(sqlQuery: string, params: any[] = []) {
  const p = getPool();
  const result = await p.query(sqlQuery, params);
  return result;
}

export async function getWriteDb() {
  return getPool();
}

export async function getReadDb() {
  return getPool();
}

export async function releaseDb(_connection: any) {
}

export async function withReadDb<T>(fn: (db: any) => Promise<T>): Promise<T> {
  const p = getPool();
  const client = await p.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function withWriteDb<T>(fn: (db: any) => Promise<T>): Promise<T> {
  const p = getPool();
  const client = await p.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  try {
    const result = await executeQueryInternal(query, params);
    return result.rows;
  } catch (error) {
    console.error('❌ PostgreSQL query error (read):', error);
    console.error('SQL:', query);
    console.error('Params:', params);
    throw error;
  }
}

export async function executeUpdate(query: string, params: any[] = []) {
  try {
    return await executeQueryInternal(query, params);
  } catch (error) {
    console.error('❌ PostgreSQL query error (write):', error);
    console.error('SQL:', query);
    console.error('Params:', params);
    throw error;
  }
}

export async function getQuery<T = any>(query: string, params: any[] = []): Promise<T | null> {
  const rows = await executeQuery<T>(query, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function allQuery(query: string, params: any[] = []) {
  return await executeQuery(query, params);
}

export async function runQuery(query: string, params: any[] = []) {
  try {
    const result = await executeQueryInternal(query, params);
    return {
      lastID: result.rows[0]?.id || null,
      changes: result.rowCount || 0
    };
  } catch (error) {
    console.error('❌ PostgreSQL query error (write):', error);
    console.error('SQL:', query);
    console.error('Params:', params);
    throw error;
  }
}

export async function smartInsert(
  tableName: string, 
  data: Record<string, any>
): Promise<{ insertId: number | string; affectedRows: number }> {
  const now = getUTCTimestamp();
  const finalData = { ...data };
  
  if (!finalData.created_at) finalData.created_at = now;
  if (!finalData.updated_at) finalData.updated_at = now;
  
  const keys = Object.keys(finalData);
  const values = Object.values(finalData);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  
  const query = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING id`;
  
  const result = await executeQueryInternal(query, values);
    
  return { 
    insertId: result.rows[0]?.id || 0, 
    affectedRows: result.rowCount || 0 
  };
}

export async function smartInsertIgnore(
  tableName: string, 
  data: Record<string, any>
): Promise<{ insertId: number | string; affectedRows: number }> {
  const now = getUTCTimestamp();
  const finalData = { ...data };
  
  if (!finalData.created_at) finalData.created_at = now;
  if (!finalData.updated_at) finalData.updated_at = now;
  
  const keys = Object.keys(finalData);
  const values = Object.values(finalData);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  
  const query = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING RETURNING id`;
  
  const result = await executeQueryInternal(query, values);
    
  return { 
    insertId: result.rows[0]?.id || 0, 
    affectedRows: result.rowCount || 0 
  };
}

export async function smartUpdate(
  tableName: string,
  data: Record<string, any>,
  whereClause: string,
  whereParams: any[]
): Promise<{ affectedRows: number }> {
  const now = getUTCTimestamp();
  const finalData = { ...data };
  
  if (!finalData.updated_at) finalData.updated_at = now;
  
  const keys = Object.keys(finalData);
  const dataValues = Object.values(finalData);
  const dataParamCount = keys.length;
  
  const setClauses = keys.map((key, i) => `${key} = $${i + 1}`);
  
  const finalWhereClause = whereClause.replace(/\$(\d+)/g, (_, num) => `$${parseInt(num) + dataParamCount}`);
  
  const values = [...dataValues, ...whereParams];
  
  const query = `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE ${finalWhereClause}`;
  
  const result = await executeQueryInternal(query, values);
    
  return { affectedRows: result.rowCount || 0 };
}

export async function smartUpsert(
  tableName: string,
  data: Record<string, any>,
  uniqueKeys: string[]
): Promise<{ insertId: number | string; affectedRows: number }> {
  const now = getUTCTimestamp();
  const finalData = { ...data };
  
  if (!finalData.created_at) finalData.created_at = now;
  if (!finalData.updated_at) finalData.updated_at = now;
  
  const keys = Object.keys(finalData);
  const values = Object.values(finalData);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  
  const updateClauses = keys
    .filter(key => !uniqueKeys.includes(key))
    .map((key) => `${key} = EXCLUDED.${key}`);
  
  let query = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
  
  if (updateClauses.length > 0) {
    query += ` ON CONFLICT (${uniqueKeys.join(', ')}) DO UPDATE SET ${updateClauses.join(', ')}`;
  } else {
    query += ` ON CONFLICT (${uniqueKeys.join(', ')}) DO NOTHING`;
  }
  
  query += ' RETURNING id';
  
  const result = await executeQueryInternal(query, values);
    
  return { 
    insertId: result.rows[0]?.id || 0, 
    affectedRows: result.rowCount || 0 
  };
}

export async function beginTransaction() {
  const p = getPool();
  const client = await p.connect();
  await client.query('BEGIN');
  return client;
}

export async function commitTransaction(connection: any) {
  await connection.query('COMMIT');
  connection.release();
}

export async function rollbackTransaction(connection: any) {
  await connection.query('ROLLBACK');
  connection.release();
}

export async function closePools() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ PostgreSQL connection pool closed');
  }
}

export async function ping() {
  try {
    const p = getPool();
    await p.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('❌ Database ping failed:', error);
    return false;
  }
}

export function getPoolStats() {
  return {
    type: USE_NEON ? 'neon-postgres' : 'local-postgres',
    status: 'active'
  };
}

function validatePagination(page: any, pageSize: any, maxPageSize = 100) {
  const validPage = Math.max(1, parseInt(page) || 1);
  const validPageSize = Math.min(maxPageSize, Math.max(1, parseInt(pageSize) || 10));
  const offset = (validPage - 1) * validPageSize;
  return { page: validPage, pageSize: validPageSize, offset };
}

export async function getEvolutionById(slangId: string) {
  const query = 'SELECT * FROM slang_evolution WHERE slang_id = $1 ORDER BY seq ASC';
  return await executeQuery(query, [slangId]);
}

export async function getCommentsBySlangId(slangId: string, page = 1, pageSize = 10, userId: string | null = null) {
  const { pageSize: validPageSize, offset } = validatePagination(page, pageSize);
  
  if (userId) {
    const query = `
      SELECT c.*, COALESCE(u.username, 'Anonymous') as user_name, u.username as username, u.avatar,
             CASE WHEN cl.user_id IS NOT NULL THEN 1 ELSE 0 END as is_liked
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN comment_likes cl ON c.id = cl.comment_id AND cl.user_id = $1
      WHERE c.slang_id = $2
      ORDER BY c.created_at DESC
      LIMIT $3 OFFSET $4
    `;
    return await executeQuery(query, [userId, slangId, validPageSize, offset]);
  } else {
    const query = `
      SELECT c.*, COALESCE(u.username, 'Anonymous') as user_name, u.username as username, u.avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.slang_id = $1
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    return await executeQuery(query, [slangId, validPageSize, offset]);
  }
}

export async function getCommentsCountBySlangId(slangId: string) {
  const query = 'SELECT COUNT(*) as count FROM comments WHERE slang_id = $1';
  const rows = await executeQuery(query, [slangId]);
  return Number(rows[0]?.count) || 0;
}

export async function getTopLevelCommentsCountBySlangId(slangId: string) {
  const query = 'SELECT COUNT(*) as count FROM comments WHERE slang_id = $1 AND parent_id IS NULL';
  const rows = await executeQuery(query, [slangId]);
  return Number(rows[0]?.count) || 0;
}

export async function getRepliesByCommentId(commentId: string, userId: string | null = null, page = 1, pageSize = 20) {
  const { pageSize: validPageSize, offset } = validatePagination(page, pageSize);
  
  if (userId) {
    const query = `
      SELECT c.*, COALESCE(u.username, 'Anonymous') as user_name, u.username as username, u.avatar,
             CASE WHEN cl.user_id IS NOT NULL THEN 1 ELSE 0 END as is_liked
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN comment_likes cl ON c.id = cl.comment_id AND cl.user_id = $1
      WHERE c.parent_id = $2
      ORDER BY c.created_at ASC
      LIMIT $3 OFFSET $4
    `;
    return await executeQuery(query, [userId, commentId, validPageSize, offset]);
  } else {
    const query = `
      SELECT c.*, COALESCE(u.username, 'Anonymous') as user_name, u.username as username, u.avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.parent_id = $1
      ORDER BY c.created_at ASC
      LIMIT $2 OFFSET $3
    `;
    return await executeQuery(query, [commentId, validPageSize, offset]);
  }
}

export async function getRepliesCountByCommentId(commentId: string) {
  const query = 'SELECT COUNT(*) as count FROM comments WHERE parent_id = $1';
  const rows = await executeQuery(query, [commentId]);
  return Number(rows[0]?.count) || 0;
}

export const sql = getPool();
