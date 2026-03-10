import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, locales } from './config';
import path from 'path';
import fs from 'fs';

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale: string = (locale && locales.includes(locale)) ? locale : defaultLocale;
  
  const messagesPath = path.join(process.cwd(), 'messages', `${resolvedLocale}.json`);
  let messages: Record<string, unknown> = {};
  
  try {
    const content = fs.readFileSync(messagesPath, 'utf-8');
    messages = JSON.parse(content);
  } catch (e) {
    console.error(`Failed to load messages for locale ${resolvedLocale}:`, e);
  }
  
  return {
    locale: resolvedLocale,
    messages
  };
});
