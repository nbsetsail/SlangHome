import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import Apple from 'next-auth/providers/apple'
import Twitter from 'next-auth/providers/twitter'
import { getOAuthConfig, isOAuthProviderEnabled, isOAuthProvider } from './oauth-config'
import * as bcrypt from 'bcryptjs'
import { getQuery, getWriteDb, smartInsert } from './db-adapter'
import { getAuthSecret } from './env'
import { logLogin } from './logger'
import { rateLimitStore } from './kv-store'
import { cacheKeys } from './cache/keys'

const RATE_LIMIT_WINDOW = 60000
const RATE_LIMIT_MAX = 5

function getClientIPFromRequest(request: Request | undefined): string {
  if (!request) return 'unknown'
  const forwarded = request.headers?.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIP = request.headers?.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  return 'unknown'
}

function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const key = cacheKeys.rateLimit.login(ip)
  const now = Date.now()
  const entry = rateLimitStore.getSync(key)
  
  if (!entry) {
    rateLimitStore.setSync(key, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW })
    return { allowed: true }
  }
  
  if (entry.expiresAt < now) {
    rateLimitStore.setSync(key, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW })
    return { allowed: true }
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((entry.expiresAt - now) / 1000) }
  }
  
  rateLimitStore.incrementSync(key)
  return { allowed: true }
}

function recordFailedLogin(ip: string) {
  const key = cacheKeys.rateLimit.login(ip)
  const now = Date.now()
  const entry = rateLimitStore.getSync(key)
  
  if (!entry || entry.expiresAt < now) {
    rateLimitStore.setSync(key, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW })
  } else {
    rateLimitStore.incrementSync(key)
  }
}

/**
 * 密码处理流程:
 * 1. 前端: 用户输入密码 -> SHA-256(plain) -> 发送到后端
 * 2. 后端存储: bcrypt.hash(SHA-256_hash, salt) -> 存储到数据库
 * 3. 后端验证: bcrypt.compare(SHA-256_hash, stored_bcrypt_hash)
 */

/**
 * 对前端传来的 SHA-256 哈希密码进行 bcrypt 加密
 * @param passwordSha256 前端传来的 SHA-256 哈希值 (hex string)
 * @returns bcrypt 加密后的密码
 */
export async function hashPassword(passwordSha256: string) {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(passwordSha256, salt)
}

/**
 * 验证前端传来的 SHA-256 哈希密码与数据库存储的 bcrypt 哈希是否匹配
 * @param passwordSha256 前端传来的 SHA-256 哈希值 (hex string)
 * @param hashedPassword 数据库存储的 bcrypt 哈希
 * @returns 是否匹配
 */
export async function comparePassword(passwordSha256: string, hashedPassword: string) {
  return await bcrypt.compare(passwordSha256, hashedPassword)
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  secret: getAuthSecret(),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID ? [Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    })] : []),
    ...(process.env.GITHUB_CLIENT_ID ? [GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    })] : []),
    ...(process.env.APPLE_ID ? [Apple({
      clientId: process.env.APPLE_ID,
      clientSecret: process.env.APPLE_PRIVATE_KEY_PATH || '',
    })] : []),
    ...(process.env.TWITTER_CLIENT_ID ? [Twitter({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET || '',
    })] : []),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'text',
          placeholder: 'username or email@example.com'
        },
        password: {
          label: 'Password',
          type: 'password'
        }
      },
      async authorize(credentials) {
        try {
          const { email, password } = credentials || {}
          
          console.log('[auth] Authorize called, email:', email ? 'provided' : 'missing', 'password:', password ? 'provided' : 'missing')
          
          if (!email || !password) {
            console.log('[auth] Missing email or password')
            return null
          }
          
          const emailStr = String(email)
          const rateLimitResult = checkLoginRateLimit(emailStr)
          
          if (!rateLimitResult.allowed) {
            console.log('[auth] Rate limited for:', emailStr)
            throw new Error('RATE_LIMITED')
          }
          
          console.log('[auth] Querying database for user:', emailStr)
          
          let user = await getQuery(
            `SELECT u.id, u.username, u.display_name, u.email, u.password, u.role, u.status, 
                    u.ban_expires_at, u.freeze_expires_at, u.avatar,
                    u.show_rank, u.show_achievement, u.equipped_achievement,
                    u.rank_name, u.rank_level, u.achievement_type, u.achievement_value
             FROM users u WHERE u.email = $1`,
            [emailStr]
          )
          
          console.log('[auth] User found by email:', !!user)
          
          if (!user) {
            user = await getQuery(
              `SELECT u.id, u.username, u.display_name, u.email, u.password, u.role, u.status, 
                      u.ban_expires_at, u.freeze_expires_at, u.avatar,
                      u.show_rank, u.show_achievement, u.equipped_achievement,
                      u.rank_name, u.rank_level, u.achievement_type, u.achievement_value
               FROM users u WHERE u.username = $1`,
              [emailStr]
            )
            console.log('[auth] User found by username:', !!user)
          }
          
          if (!user) {
            console.log('[auth] User not found:', emailStr)
            recordFailedLogin(emailStr)
            await logLogin({
              username: emailStr,
              action: 'login_failed',
              details: 'User not found'
            }).catch(() => {})
            return null
          }
          
          console.log('[auth] Comparing password for user:', user.username)
          const passwordMatch = await bcrypt.compare(String(password), user.password)
          console.log('[auth] Password match:', passwordMatch)
          
          if (!passwordMatch) {
            console.log('[auth] Invalid password for user:', user.username)
            recordFailedLogin(emailStr)
            await logLogin({
              userId: user.id,
              username: user.username,
              action: 'login_failed',
              details: 'Invalid password'
            }).catch(() => {})
            return null
          }

          if (user.status === 'banned') {
            if (user.ban_expires_at && new Date(user.ban_expires_at) < new Date()) {
              // Ban has expired, reactivate user
            } else {
              throw new Error('ACCOUNT_BANNED')
            }
          }

          if (user.status === 'frozen') {
            if (user.freeze_expires_at && new Date(user.freeze_expires_at) < new Date()) {
              // Freeze has expired, reactivate user
            } else {
              throw new Error('ACCOUNT_FROZEN')
            }
          }

          if (user.status === 'inactive') {
            throw new Error('ACCOUNT_INACTIVE')
          }
          
          console.log('[auth] Login successful for user:', user.username)
          
          await logLogin({
            userId: user.id,
            username: user.username,
            action: 'login'
          }).catch(() => {})
          
          return {
            id: user.id.toString(),
            name: user.display_name || user.username,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            showRank: user.show_rank === 1,
            showAchievement: user.show_achievement === 1,
            equippedAchievement: user.equipped_achievement,
            rankName: user.rank_name,
            rankLevel: user.rank_level,
            achievementType: user.achievement_type,
            achievementValue: user.achievement_value
          }
        } catch (error) {
          if (error instanceof Error && (
              error.message === 'ACCOUNT_BANNED' || 
              error.message === 'ACCOUNT_FROZEN' || 
              error.message === 'ACCOUNT_INACTIVE' ||
              error.message === 'RATE_LIMITED')) {
            throw error
          }
          console.error('[auth] Authorization error:', error)
          console.error('[auth] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
          console.error('[auth] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
          return null
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider && account.provider !== 'credentials') {
        const isOAuth = await isOAuthProvider(account.provider)
        if (isOAuth) {
          const providerEnabled = await isOAuthProviderEnabled(account.provider)
          if (!providerEnabled) {
            console.log(`OAuth provider ${account.provider} is disabled`)
            return '/login?error=OAuthDisabled'
          }
        }
        
        try {
          let existingUser = await getQuery(
            'SELECT id FROM users WHERE email = $1',
            [user.email]
          )
          
          if (!existingUser) {
            const username = user.name?.replace(/\s+/g, '_').toLowerCase() || `user_${Date.now()}`
            
            await smartInsert('users', {
              username,
              email: user.email,
              avatar: user.image || null,
              role: 'user',
              status: 'active'
            })
          }
          
          return true
        } catch (error) {
          console.error('OAuth sign in error:', error)
          return false
        }
      }
      
      return true
    },
    jwt({ token, user, account }) {
      if (user) {
        token.role = user.role as string
        token.id = user.id as string
        token.name = user.name as string
        token.username = user.username as string
        token.avatar = user.avatar as string
        token.showRank = user.showRank as boolean
        token.showAchievement = user.showAchievement as boolean
        token.equippedAchievement = user.equippedAchievement as string | null
        token.rankName = user.rankName as string | null
        token.rankLevel = user.rankLevel as number | null
        token.achievementType = user.achievementType as string | null
        token.achievementValue = user.achievementValue as number | null
      }
      if (account) {
        token.provider = account.provider
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.username = token.username as string
        session.user.provider = token.provider as string
        session.user.avatar = token.avatar as string
        session.user.showRank = token.showRank as boolean
        session.user.showAchievement = token.showAchievement as boolean
        session.user.equippedAchievement = token.equippedAchievement as string | null
        session.user.rankName = token.rankName as string | null
        session.user.rankLevel = token.rankLevel as number | null
        session.user.achievementType = token.achievementType as string | null
        session.user.achievementValue = token.achievementValue as number | null
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  }
})
