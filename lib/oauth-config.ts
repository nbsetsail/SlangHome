/**
 * OAuth Provider 配置管理
 * 控制各个第三方登录 provider 的启用/禁用状态
 */

import { getConfig } from './system-config';

export interface OAuthProviderConfig {
  enabled: boolean
  clientId?: string
  clientSecret?: string
}

export interface OAuthConfig {
  [key: string]: OAuthProviderConfig
}

const defaultOAuthConfig: OAuthConfig = {
  google: {
    enabled: false,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  github: {
    enabled: true,
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  },
  apple: {
    enabled: false,
    clientId: process.env.APPLE_ID,
    clientSecret: process.env.APPLE_PRIVATE_KEY_PATH,
  },
  twitter: {
    enabled: false,
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
  },
}

function getEnvCredentials(provider: string): { clientId?: string; clientSecret?: string } {
  const envKey = provider.toUpperCase().replace(/[^A-Z0-9]/g, '_')
  return {
    clientId: process.env[`${envKey}_CLIENT_ID`],
    clientSecret: process.env[`${envKey}_CLIENT_SECRET`],
  }
}

export async function getOAuthConfig(): Promise<OAuthConfig> {
  const config = await getConfig('oauth_config');
  
  if (!config) {
    return defaultOAuthConfig;
  }
  
  const result: OAuthConfig = {}
  
  for (const [provider, providerConfig] of Object.entries(config)) {
    if (typeof providerConfig === 'object' && providerConfig !== null) {
      const envCreds = getEnvCredentials(provider)
      result[provider] = {
        enabled: (providerConfig as any).enabled ?? false,
        clientId: envCreds.clientId,
        clientSecret: envCreds.clientSecret,
      }
    }
  }
  
  return result
}

export async function isOAuthProviderEnabled(provider: string): Promise<boolean> {
  const config = await getOAuthConfig();
  const providerConfig = config[provider.toLowerCase()]
  
  if (!providerConfig) {
    return false
  }
  
  const envCreds = getEnvCredentials(provider)
  return providerConfig.enabled && !!envCreds.clientId
}

export async function getEnabledOAuthProviders(): Promise<string[]> {
  const config = await getOAuthConfig();
  const enabled: string[] = []
  
  for (const [provider, providerConfig] of Object.entries(config)) {
    const envCreds = getEnvCredentials(provider)
    if (providerConfig.enabled && !!envCreds.clientId) {
      enabled.push(provider)
    }
  }
  
  return enabled
}

export async function isOAuthProvider(provider: string): Promise<boolean> {
  const config = await getOAuthConfig()
  return provider.toLowerCase() in config
}

export default {
  getOAuthConfig,
  isOAuthProviderEnabled,
  getEnabledOAuthProviders,
  isOAuthProvider,
}
