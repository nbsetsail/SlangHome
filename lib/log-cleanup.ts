import { getQuery, executeQuery } from './db-adapter';
import { logAction, getLogStats, cleanLogs } from './logger';

interface LogCleanupConfig {
  enabled: boolean;
  retentionDays: number;
  cleanupInterval: number;
  lastCleanup: string | null;
}

let logCleanupConfig: LogCleanupConfig = {
  enabled: true,
  retentionDays: 30,
  cleanupInterval: 86400000,
  lastCleanup: null
};

export async function getLogCleanupConfig(): Promise<LogCleanupConfig> {
  return logCleanupConfig;
}

export async function setLogCleanupConfig(config: Partial<LogCleanupConfig>): Promise<LogCleanupConfig> {
  logCleanupConfig = { ...logCleanupConfig, ...config };
  return logCleanupConfig;
}

export async function runLogCleanup(): Promise<{ success: boolean; cleaned?: number; error?: string }> {
  if (!logCleanupConfig.enabled) {
    return { success: true, cleaned: 0 };
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - logCleanupConfig.retentionDays);

    const result = await executeQuery(
      'DELETE FROM action_logs WHERE created_at < $1',
      [cutoffDate.toISOString()]
    );

    logCleanupConfig.lastCleanup = new Date().toISOString();

    return {
      success: true,
      cleaned: (result as any).rowCount || 0
    };
  } catch (error) {
    console.error('Log cleanup failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export function startCleanupScheduler(): void {
  setInterval(async () => {
    await runLogCleanup();
  }, logCleanupConfig.cleanupInterval);
}
