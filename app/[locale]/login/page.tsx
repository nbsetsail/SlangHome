'use client'
import React, { useState, useEffect, useRef, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { useToast } from '@/components/ui/Notifications'
import { cryptoUtils } from '@/lib/utils'
import { useTranslation, useLocale } from '@/hooks'
import Header from '@/components/Header'
import LoginModal from '@/components/LoginModal'

function LoginContent() {
  const { cn } = useTheme()
  const { t } = useTranslation()
  const locale = useLocale()
  const { showSuccess, showError } = useToast()
  const searchParams = useSearchParams()
  
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: boolean}>({})
  const [enabledProviders, setEnabledProviders] = useState<string[]>([])
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [emailFromRegister, setEmailFromRegister] = useState(false)

  const accountRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setAccount(emailParam)
      setEmailFromRegister(true)
      setTimeout(() => passwordRef.current?.focus(), 100)
    } else {
      accountRef.current?.focus()
    }
  }, [searchParams])

  useEffect(() => {
    const fetchOAuthConfig = async () => {
      try {
        const res = await fetch('/api/oauth/providers')
        const data = await res.json()
        if (data.providers) {
          setEnabledProviders(data.providers)
        }
      } catch (e) {
        console.error('Failed to fetch OAuth providers:', e)
      }
    }
    fetchOAuthConfig()
  }, [])

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoginError('')
    setLoading(true)

    const newErrors: {[key: string]: boolean} = {}
    if (!account.trim()) newErrors.account = true
    if (!password.trim()) newErrors.password = true

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setLoading(false)
      return
    }

    try {
      const hashedPassword = await cryptoUtils.sha256(password)
      const result = await signIn('credentials', {
        email: account,
        password: hashedPassword,
        redirect: false
      })

      if (result?.error) {
        setPassword('')
        
        const errorCode = result.error
        if (errorCode === 'RateLimited' || result.status === 429) {
          setLoginError(t('auth.tooManyAttempts') || '登录尝试过于频繁，请稍后再试')
        } else if (errorCode === 'Banned') {
          setLoginError(t('auth.accountBanned') || '账号已被封禁')
        } else if (errorCode === 'Frozen') {
          setLoginError(t('auth.accountFrozen') || '账号已被冻结')
        } else if (errorCode === 'Inactive') {
          setLoginError(t('auth.accountInactive') || '账号未激活')
        } else if (errorCode === 'OAuthDisabled') {
          setLoginError(t('auth.oauthDisabled') || '该登录方式已被禁用')
        } else {
          setLoginError(t('auth.loginFailed'))
        }
      } else {
        showSuccess(t('auth.loginSuccess'), t('common.welcomeBack'))
        window.location.href = `/${locale}`
      }
    } catch (err) {
      console.error('Sign in exception:', err)
      setPassword('')
      setLoginError(t('auth.loginFailed'))
    }
    setLoading(false)
  }

  const handleOAuthSignIn = (provider: string) => {
    signIn(provider, { callbackUrl: `/${locale}` })
  }

  return (
    <div className="flex items-center justify-center px-4 py-12 min-h-[calc(100vh-80px)]">
      <div className={`${cn.colors.bg.card} p-6 md:p-8 rounded-lg shadow-md w-full max-w-3xl`}>
        <h1 className={`text-2xl font-bold ${cn.title} text-center mb-6`}>
          {t('auth.signIn')}
        </h1>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <div className="flex-1">
            {emailFromRegister && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-sm text-blue-700 dark:text-blue-300">{t('auth.emailExists')}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{t('auth.emailExistsLoginHint')}</p>
              </div>
            )}
            {loginError && (
              <div className={`${cn.errorMessage} p-3 rounded-md mb-4 text-sm`}>{loginError}</div>
            )}

            <form onSubmit={handleLoginSubmit}>
              <div className="mb-4">
                <label className={`block text-sm font-medium ${cn.colors.text.muted} mb-1`}>
                  {t('auth.usernameOrEmail')}
                </label>
                <input
                  ref={accountRef}
                  type="text"
                  placeholder={t('auth.enterUsernameOrEmail')}
                  value={account}
                  onChange={(e) => { setAccount(e.target.value); setErrors({}); setEmailFromRegister(false) }}
                  className={`w-full px-4 py-3 border rounded-md ${errors.account ? cn.inputError : cn.input}`}
                />
              </div>
              <div className="mb-6">
                <label className={`block text-sm font-medium ${cn.colors.text.muted} mb-1`}>
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <input
                    ref={passwordRef}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.enterPassword')}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors({}) }}
                    className={`w-full px-4 py-3 pr-12 border rounded-md ${errors.password ? cn.inputError : cn.input}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <button 
                type="submit" 
                className={`w-full py-3 px-4 rounded-md font-medium ${loading || !account.trim() || !password.trim() ? cn.disabledButton : cn.primaryButton}`} 
                disabled={loading || !account.trim() || !password.trim()}
              >
                {loading ? t('common.processing') : t('auth.signIn')}
              </button>
            </form>

            <div className="mt-4 text-center space-y-2 md:hidden">
              <Link href={`/${locale}/register`} prefetch={false} className={`${cn.link} text-sm block`}>
                {t('auth.noAccountCreate')}
              </Link>
              <Link href={`/${locale}/auth/forgot-password`} prefetch={false} className={`${cn.link} text-sm block text-gray-500`}>
                {t('auth.forgotPassword')}
              </Link>
            </div>
          </div>

          {enabledProviders.length > 0 && (
            <>
              <div className="hidden md:flex flex-col items-center justify-center">
                <div className="w-px h-full bg-gray-300 dark:bg-gray-600 relative">
                  <span className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${cn.colors.bg.card} px-2 text-gray-500 text-sm`}>
                    {t('auth.or')}
                  </span>
                </div>
              </div>

              <div className="w-full md:w-auto md:min-w-[200px]">
                <div className="hidden md:block text-center text-gray-500 text-sm mb-4">
                  {t('auth.continueWith')}
                </div>
                <div className="flex flex-row md:flex-col gap-3">
                  {enabledProviders.map(provider => (
                    <button 
                      key={provider}
                      onClick={() => handleOAuthSignIn(provider)} 
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <img 
                        src={`/thirdpart/${provider}.svg`} 
                        alt={provider}
                        className="h-5 w-5"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                      <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                        {provider.charAt(0).toUpperCase() + provider.slice(1)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="hidden md:block mt-6 text-center space-y-2">
          <Link href={`/${locale}/register`} prefetch={false} className={`${cn.link} text-sm`}>
            {t('auth.noAccountCreate')}
          </Link>
          <span className="text-gray-400 mx-2">|</span>
          <Link href={`/${locale}/auth/forgot-password`} prefetch={false} className={`${cn.link} text-sm text-gray-500`}>
            {t('auth.forgotPassword')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const { cn } = useTheme()
  const [showLoginModal, setShowLoginModal] = useState(false)

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <Header 
        showLoginModal={() => setShowLoginModal(true)} 
      />
      <Suspense fallback={
        <div className="flex items-center justify-center px-4 py-12 min-h-[calc(100vh-80px)]">
          <div className={`${cn.colors.bg.card} p-6 md:p-8 rounded-lg shadow-md w-full max-w-3xl animate-pulse`}>
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-6"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      }>
        <LoginContent />
      </Suspense>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  )
}
