import { getWriteDb, smartInsert } from './db-adapter';
import { getConfig, configKeys, defaultConfigs } from './system-config';

const ENV_PREFIX = process.env.REDIS_ENV_PREFIX || 'slanghome';
const NOTIFICATION_QUEUE_KEY = `${ENV_PREFIX}:notification:queue`;

let cachedConfig: any = null;

export const getNotificationConfig = async () => {
  if (cachedConfig) {
    return cachedConfig;
  }
  const config = await getConfig(configKeys.notification);
  cachedConfig = { ...defaultConfigs[configKeys.notification], ...config };
  return cachedConfig;
};

export const reloadConfigCache = async () => {
  cachedConfig = null;
  await getNotificationConfig();
};

let notificationQueue: Map<string, any[]> = new Map();
let isFlushing = false;
let flushTimer: NodeJS.Timeout | null = null;

export const addNotificationToQueue = async (notification: {
  userId: string;
  type: string;
  title: string;
  content: string;
  link: string;
}) => {
  const config = await getNotificationConfig();
  
  if (!config.enabled) {
    return directInsertNotification(notification);
  }
  
  const key = `${notification.userId}:${notification.type}`;
  
  if (!notificationQueue.has(key)) {
    notificationQueue.set(key, []);
  }
  
  notificationQueue.get(key)!.push({
    ...notification,
    createdAt: Date.now()
  });
  
  return true;
};

const directInsertNotification = async (notification: any) => {
  try {
    await smartInsert('notifications', {
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      link: notification.link,
      is_read: false
    });
    return true;
  } catch (error) {
    console.error('Error inserting notification:', error);
    return false;
  }
};

export const flushNotificationQueue = async () => {
  if (notificationQueue.size === 0 || isFlushing) return;
  
  isFlushing = true;
  
  const allNotifications: any[] = [];
  notificationQueue.forEach((notifications) => {
    allNotifications.push(...notifications);
  });
  notificationQueue.clear();
  
  if (allNotifications.length === 0) {
    isFlushing = false;
    return;
  }
  
  try {
    for (const notification of allNotifications) {
      await smartInsert('notifications', {
        user_id: notification.userId,
        type: notification.type,
        title: notification.title,
        content: notification.content,
        link: notification.link,
        is_read: false
      });
    }
    
    console.log(`✅ Processed ${allNotifications.length} notifications`);
  } catch (error) {
    console.error('Error flushing notification queue:', error);
  } finally {
    isFlushing = false;
  }
};

export const startNotificationFlushTimer = async () => {
  if (flushTimer) return;
  
  const config = await getNotificationConfig();
  const intervalMs = (config.flushIntervalHours || 1) * 60 * 60 * 1000;
  
  flushTimer = setInterval(async () => {
    await flushNotificationQueue();
  }, intervalMs);
  
  console.log(`✅ Notification queue timer started, interval: ${config.flushIntervalHours || 1} hours`);
};

export const stopNotificationFlushTimer = () => {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
};

export const getPendingNotificationCount = () => {
  let count = 0;
  notificationQueue.forEach((notifications) => {
    count += notifications.length;
  });
  return count;
};

export const initNotificationQueue = async () => {
  await getNotificationConfig();
  await startNotificationFlushTimer();
  console.log('✅ Notification queue initialized');
};

export const shutdownNotificationQueue = async () => {
  stopNotificationFlushTimer();
  await flushNotificationQueue();
  console.log('✅ Notification queue shutdown');
};
