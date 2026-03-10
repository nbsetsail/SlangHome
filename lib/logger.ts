import { getWriteDb, smartInsert, executeQuery } from './db-adapter';
import { getUTCTimestamp } from './date-utils';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export type LoginLogAction = 'login' | 'logout' | 'login_failed' | 'token_refresh';
export type ActionLogAction = 
  | 'create' | 'update' | 'delete' 
  | 'approve' | 'reject' 
  | 'password_change' | 'username_change' | 'profile_update'
  | 'avatar_upload' | 'email_verify' | 'password_reset'
  | 'slang_submit' | 'slang_edit' | 'slang_delete'
  | 'comment_create' | 'comment_delete'
  | 'report_submit' | 'report_resolve'
  | 'user_ban' | 'user_unban' | 'role_change'
  | 'config_change';
export type SystemLogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  level: LogLevel;
  consoleOutput: boolean;
  dbOutput: boolean;
}

const defaultConfig: LogConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  consoleOutput: true,
  dbOutput: process.env.NODE_ENV === 'production'
};

let config = { ...defaultConfig };

export function configureLogger(newConfig: Partial<LogConfig>) {
  config = { ...config, ...newConfig };
}

function formatMessage(level: string, message: string, data?: any): string {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${level}] ${message}${dataStr}`;
}

function logToConsole(level: LogLevel, message: string, data?: any) {
  if (!config.consoleOutput) return;
  
  const formattedMessage = formatMessage(LogLevel[level], message, data);
  
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(formattedMessage);
      break;
    case LogLevel.INFO:
      console.info(formattedMessage);
      break;
    case LogLevel.WARN:
      console.warn(formattedMessage);
      break;
    case LogLevel.ERROR:
      console.error(formattedMessage);
      break;
  }
}

async function writeToDb(table: string, data: Record<string, any>) {
  if (!config.dbOutput) return;
  
  try {
    await smartInsert(table, data);
  } catch (error) {
    console.error(`Failed to write to ${table}:`, error);
  }
}

export const logger = {
  debug(message: string, data?: any) {
    if (config.level <= LogLevel.DEBUG) {
      logToConsole(LogLevel.DEBUG, message, data);
    }
  },

  info(message: string, data?: any) {
    if (config.level <= LogLevel.INFO) {
      logToConsole(LogLevel.INFO, message, data);
    }
  },

  warn(message: string, data?: any) {
    if (config.level <= LogLevel.WARN) {
      logToConsole(LogLevel.WARN, message, data);
    }
  },

  error(message: string, data?: any) {
    if (config.level <= LogLevel.ERROR) {
      logToConsole(LogLevel.ERROR, message, data);
    }
  }
};

export async function logLogin(params: {
  userId?: string;
  username?: string;
  action: LoginLogAction;
  status?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}) {
  const { userId, username, action, status, ipAddress, userAgent, details } = params;
  
  logger.info(`Login: ${action}`, { userId, username });
  
  await writeToDb('login_logs', {
    user_id: userId || null,
    username: username || null,
    action,
    status: status || 'success',
    ip: ipAddress || null,
    user_agent: userAgent || null,
    details: details || null
  });
}

export async function logAccess(params: {
  userId?: string;
  username?: string;
  method: string;
  path: string;
  statusCode: number;
  ipAddress?: string;
  device?: string;
  userAgent?: string;
  details?: string;
}) {
  const { userId, username, method, path, statusCode, ipAddress, device, userAgent, details } = params;
  
  if (statusCode >= 400) {
    logger.warn(`Access: ${method} ${path} ${statusCode}`, { userId });
  } else {
    logger.debug(`Access: ${method} ${path} ${statusCode}`, { userId });
  }
  
  await writeToDb('access_logs', {
    user_id: userId || null,
    username: username || null,
    action: `${method} ${path}`,
    path,
    method,
    status: statusCode,
    ip: ipAddress || null,
    device: device || null,
    user_agent: userAgent || null,
    details: details || null
  });
}

export async function logAction(params: {
  userId: string;
  username?: string;
  action: ActionLogAction;
  targetType: string;
  targetId?: string;
  ipAddress?: string;
  device?: string;
  userAgent?: string;
  details?: string;
}) {
  const { userId, username, action, targetType, targetId, ipAddress, device, userAgent, details } = params;
  
  logger.info(`Action: ${action} on ${targetType}`, { userId, targetId });
  
  await writeToDb('action_logs', {
    user_id: userId,
    username: username || null,
    action,
    target_type: targetType,
    target_id: targetId || null,
    ip: ipAddress || null,
    device: device || null,
    user_agent: userAgent || null,
    details: details || null
  });
}

export async function logSystem(params: {
  level: SystemLogLevel;
  action: string;
  details?: string;
  ipAddress?: string;
}) {
  const { level, action, details, ipAddress } = params;
  
  const logLevelMap = {
    debug: LogLevel.DEBUG,
    info: LogLevel.INFO,
    warn: LogLevel.WARN,
    error: LogLevel.ERROR
  };
  
  if (config.level <= logLevelMap[level]) {
    logToConsole(logLevelMap[level], action, { details });
  }
  
  await writeToDb('system_logs', {
    action,
    severity: level,
    ip: ipAddress || null,
    details: details || null
  });
}

export async function getLogStats() {
  try {
    const loginCount = await executeQuery('SELECT COUNT(*) as count FROM login_logs');
    const accessCount = await executeQuery('SELECT COUNT(*) as count FROM access_logs');
    const actionCount = await executeQuery('SELECT COUNT(*) as count FROM action_logs');
    const systemCount = await executeQuery('SELECT COUNT(*) as count FROM system_logs');
    
    const loginSize = await executeQuery(
      "SELECT ROUND(data_length / 1024 / 1024, 2) as size_mb FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'login_logs'"
    );
    const accessSize = await executeQuery(
      "SELECT ROUND(data_length / 1024 / 1024, 2) as size_mb FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'access_logs'"
    );
    const actionSize = await executeQuery(
      "SELECT ROUND(data_length / 1024 / 1024, 2) as size_mb FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'action_logs'"
    );
    const systemSize = await executeQuery(
      "SELECT ROUND(data_length / 1024 / 1024, 2) as size_mb FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'system_logs'"
    );
    
    return {
      counts: {
        login: (loginCount as any)[0]?.count || 0,
        access: (accessCount as any)[0]?.count || 0,
        action: (actionCount as any)[0]?.count || 0,
        system: (systemCount as any)[0]?.count || 0
      },
      sizes: {
        login: (loginSize as any)[0]?.size_mb || 0,
        access: (accessSize as any)[0]?.size_mb || 0,
        action: (actionSize as any)[0]?.size_mb || 0,
        system: (systemSize as any)[0]?.size_mb || 0
      },
      totalSize: (
        ((loginSize as any)[0]?.size_mb || 0) +
        ((accessSize as any)[0]?.size_mb || 0) +
        ((actionSize as any)[0]?.size_mb || 0) +
        ((systemSize as any)[0]?.size_mb || 0)
      ).toFixed(2)
    };
  } catch (error) {
    logger.error('Failed to get log stats', error);
    return null;
  }
}

export async function cleanLogs(params: {
  logType: 'login' | 'access' | 'action' | 'system' | 'all';
  olderThanDays: number;
}) {
  const { logType, olderThanDays } = params;
  const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  
  try {
    const db = await getWriteDb();
    let deletedCount = 0;
    
    const tables = logType === 'all' 
      ? ['login_logs', 'access_logs', 'action_logs', 'system_logs']
      : [`${logType}_logs`];
    
    for (const table of tables) {
      const result = await db.query(
        `DELETE FROM ${table} WHERE created_at < $1`,
        [cutoffDate]
      );
      deletedCount += result.rowCount || 0;
    }
    
    await logSystem({
      level: 'info',
      action: 'Logs cleaned',
      details: JSON.stringify({ logType, olderThanDays, deletedCount })
    });
    
    return { success: true, deletedCount };
  } catch (error) {
    logger.error('Failed to clean logs', error);
    return { success: false, error: String(error) };
  }
}

export default logger;
