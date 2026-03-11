'use client'
import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useTheme } from '@/contexts/ThemeContext'
import { useToast } from '@/components/ui/Notifications'
import { cryptoUtils } from '@/lib/utils'
import { useTranslation, useLocale } from '@/hooks'

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess?: () => void
}) {
  const { cn } = useTheme()
  const { t } = useTranslation()
  const locale = useLocale()
  const { showSuccess, showError } = useToast()
  
  const [isRegister, setIsRegister] = useState(false)
  const [registerStep, setRegisterStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loginFailed, setLoginFailed] = useState(false)
  const [account, setAccount] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [errors, setErrors] = useState<{[key: string]: boolean}>({})
  const [isVerificationSent, setIsVerificationSent] = useState(false)
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [enabledProviders, setEnabledProviders] = useState<string[]>([])
  const [emailExistsPrompt, setEmailExistsPrompt] = useState(false)
  
  const accountRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const usernameRef = useRef<HTMLInputElement>(null)
  const displayNameRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const verificationCodeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
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
  }, [isOpen])

  useEffect(() => {
    if (isRegister && email) {
      const emailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '')
      if (emailPrefix) {
        setUsername(emailPrefix)
      }
    }
  }, [isRegister, email])

  useEffect(() => {
    if (isOpen) {
      setIsRegister(false)
      resetForm()
      setTimeout(() => {
        accountRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const sendVerificationCode = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: true })
      return
    }

    setVerificationLoading(true)
    
    try {
      const emailExists = await checkEmailExists(email)
      if (emailExists) {
        setVerificationLoading(false)
        setIsRegister(false)
        setRegisterStep(1)
        setAccount(email)
        setEmailExistsPrompt(true)
        setVerificationCode('')
        setIsVerificationSent(false)
        setCountdown(0)
        setTimeout(() => passwordRef.current?.focus(), 100)
        return
      }

      setCountdown(60)
      
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username })
      })

      if (response.ok) {
        setIsVerificationSent(true)
        setVerificationCode('')
        setTimeout(() => verificationCodeRef.current?.focus(), 100)
        showSuccess(t('auth.verificationCodeSent'), t('auth.pleaseCheckEmail'))
      } else {
        const data = await response.json()
        setErrors({ email: true })
        showError(t('common.failedToSubmit'), data.error || t('auth.failedToSendVerification'))
        setCountdown(0)
      }
    } catch (err) {
      console.error('Error sending verification code:', err)
      setErrors({ email: true })
      showError(t('common.failedToSubmit'), t('auth.failedToSendVerification'))
      setCountdown(0)
    } finally {
      setVerificationLoading(false)
    }
  }

  const checkEmailExists = async (email: string) => {
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await response.json()
      return data.exists
    } catch (error) {
      console.error('Error checking email:', error)
      return false
    }
  }

  const checkUsernameExists = async (username: string) => {
    try {
      const response = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      })
      const data = await response.json()
      return data.exists
    } catch (error) {
      console.error('Error checking username:', error)
      return false
    }
  }

  const handleStepOneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: true })
      setLoading(false)
      return
    }

    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setErrors({ verificationCode: true })
      setLoading(false)
      return
    }

    setRegisterStep(2)
    setLoading(false)
    setTimeout(() => usernameRef.current?.focus(), 100)
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    const newErrors: {[key: string]: boolean} = {}
    if (!username.trim()) {
      newErrors.username = true
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = true
      setLoginError(t('auth.usernameFormatError') || 'Username can only contain letters, numbers, and underscores')
    } else if (username.length > 20) {
      newErrors.username = true
      setLoginError(t('auth.usernameTooLong') || 'Username must be at most 20 characters')
    }
    if (!displayName.trim()) {
      newErrors.displayName = true
    } else if (displayName.length > 25) {
      newErrors.displayName = true
      setLoginError(t('auth.displayNameTooLong') || 'Display name must be at most 25 characters')
    }
    if (!password.trim()) {
      newErrors.password = true
      setLoginError(t('auth.passwordRequired') || '请输入密码')
    } else if (password.length < 8) {
      newErrors.password = true
      setLoginError(t('auth.passwordMinLengthError') || '密码至少需要8个字符')
    } else if (!/^[a-zA-Z0-9]+$/.test(password)) {
      newErrors.password = true
      setLoginError(t('auth.passwordFormatError') || '密码只能包含字母和数字')
    }
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = true
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = true
      setLoginError(t('auth.passwordMismatch') || '两次输入的密码不一致')
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setLoading(false)
      return
    }

    const usernameExists = await checkUsernameExists(username)
    if (usernameExists) {
      const randomSuffix = Math.floor(Math.random() * 900) + 100
      setUsername(`${username}${randomSuffix}`)
      setLoading(false)
      return
    }

    try {
      const hashedPassword = await cryptoUtils.sha256(password)
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, displayName, email, password: hashedPassword, verificationCode })
      })

      if (response.ok) {
        showSuccess(t('auth.registerSuccess'), t('auth.loginWithNewAccount'))
        setIsRegister(false)
        setRegisterStep(1)
        setAccount(email)
        setPassword('')
        setConfirmPassword('')
        setDisplayName('')
      } else {
        const data = await response.json()
        showError(t('common.failedToSubmit'), data.error || t('common.failedToSubmit'))
      }
    } catch (err) {
      console.error('Registration error:', err)
      showError(t('common.failedToSubmit'), t('common.failedToSubmit'))
    }
    setLoading(false)
  }

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
        passwordRef.current?.focus()
        
        const errorCode = result.error
        if (errorCode === 'RateLimited' || result.status === 429) {
          setLoginError(t('auth.tooManyAttempts') || '登录尝试过于频繁，请稍后再试')
        } else if (errorCode === 'Banned') {
          setLoginError(t('auth.accountBanned') || '账号已被封禁')
        } else if (errorCode === 'Frozen') {
          setLoginError(t('auth.accountFrozen') || '账号已被冻结')
        } else if (errorCode === 'Inactive') {
          setLoginError(t('auth.accountInactive') || '账号未激活')
        } else {
          setLoginError(t('auth.loginFailed'))
        }
        setLoginFailed(true)
      } else {
        onClose()
        onLoginSuccess?.()
      }
    } catch (err) {
      console.error('Sign in exception:', err)
      setPassword('')
      passwordRef.current?.focus()
      setLoginError(t('auth.loginFailed'))
      setLoginFailed(true)
    }
    setLoading(false)
  }

  const resetForm = () => {
    setErrors({})
    setLoginError('')
    setLoginFailed(false)
    setAccount('')
    setEmail('')
    setUsername('')
    setPassword('')
    setConfirmPassword('')
    setVerificationCode('')
    setIsVerificationSent(false)
    setCountdown(0)
    setRegisterStep(1)
    setEmailExistsPrompt(false)
  }

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 ${cn.modalOverlay} flex items-center justify-center z-50 p-4`}>
      <div className={`${cn.modalBg} p-6 rounded-lg shadow-md w-full max-w-sm`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-lg font-bold ${cn.title}`}>
            {isRegister ? (registerStep === 1 ? t('auth.verifyEmail') : t('auth.setPassword')) : t('auth.signIn')}
          </h2>
          <button onClick={onClose} className={`p-1.5 rounded-full ${cn.colors.text.muted} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isRegister && (
          <div className="flex items-center justify-center mb-4 gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${registerStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
            <div className={`w-12 h-1 ${registerStep >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${registerStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
          </div>
        )}

        {loginError && (
          <div className={`${cn.errorMessage} p-2 rounded-md mb-3 text-sm`}>{loginError}</div>
        )}

        {!isRegister && (
          <form onSubmit={handleLoginSubmit}>
            {emailExistsPrompt && (
              <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">{t('auth.emailExists')}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">{t('auth.emailExistsLoginHint')}</p>
              </div>
            )}
            <div className="mb-3">
              <input
                ref={accountRef}
                type="text"
                placeholder={t('auth.enterUsernameOrEmail')}
                value={account}
                onChange={(e) => { setAccount(e.target.value); setLoginFailed(false); setErrors({}); setEmailExistsPrompt(false) }}
                className={`w-full px-3 py-2 border rounded-md text-sm ${errors.account ? cn.inputError : cn.input}`}
              />
            </div>
            <div className="mb-3">
              <div className="relative">
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.enterPassword')}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLoginFailed(false); setErrors({}) }}
                  className={`w-full px-3 py-2 pr-10 border rounded-md text-sm ${errors.password ? cn.inputError : cn.input}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button type="submit" className={`w-full py-2 px-4 rounded-md text-sm ${loading || !account.trim() || !password.trim() ? cn.disabledButton : cn.primaryButton}`} disabled={loading || !account.trim() || !password.trim()}>
              {loading ? t('common.processing') : t('auth.signIn')}
            </button>
            <div className="mt-2 text-center">
              <Link href={`/${locale}/auth/forgot-password`} prefetch={false} onClick={onClose} className={`text-xs ${cn.link}`}>
                {t('auth.forgotPassword')}
              </Link>
            </div>
          </form>
        )}

        {isRegister && registerStep === 1 && (
          <form onSubmit={handleStepOneSubmit}>
            <div className="mb-3">
              <div className="flex gap-2">
                <input
                  ref={emailRef}
                  type="email"
                  placeholder={t('auth.enterEmail')}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors({}) }}
                  className={`flex-1 px-3 py-2 border rounded-md text-sm ${errors.email ? cn.inputError : cn.input}`}
                />
                <button
                  type="button"
                  onClick={sendVerificationCode}
                  disabled={!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || verificationLoading || countdown > 0}
                  className={`px-3 py-2 rounded-md text-xs whitespace-nowrap ${!email.trim() || verificationLoading || countdown > 0 ? cn.disabledButton : cn.primaryButton}`}
                >
                  {verificationLoading ? t('auth.sending') : countdown > 0 ? `${countdown}s` : t('auth.verify')}
                </button>
              </div>
            </div>
            {isVerificationSent && (
              <div className="mb-3">
                <input
                  ref={verificationCodeRef}
                  type="text"
                  placeholder={t('auth.enterVerificationCode')}
                  value={verificationCode}
                  onChange={(e) => { setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrors({}) }}
                  className={`w-full px-3 py-2 border rounded-md text-sm ${errors.verificationCode ? cn.inputError : cn.input}`}
                />
              </div>
            )}
            <button type="submit" className={`w-full py-2 px-4 rounded-md text-sm ${loading || !isVerificationSent || verificationCode.length !== 6 ? cn.disabledButton : cn.primaryButton}`} disabled={loading || !isVerificationSent || verificationCode.length !== 6}>
              {loading ? t('common.processing') : t('common.next')}
            </button>
          </form>
        )}

        {isRegister && registerStep === 2 && (
          <form onSubmit={handleRegisterSubmit}>
            <div className="mb-3">
              <input
                ref={usernameRef}
                type="text"
                placeholder={t('auth.enterUsername')}
                value={username}
                onChange={(e) => { setUsername(e.target.value); setErrors({}) }}
                maxLength={20}
                className={`w-full px-3 py-2 border rounded-md text-sm ${errors.username ? cn.inputError : cn.input}`}
              />
              <p className="text-xs text-gray-500 mt-1">{t('auth.usernameHint')}</p>
            </div>
            <div className="mb-3">
              <input
                ref={displayNameRef}
                type="text"
                placeholder={t('auth.enterDisplayName')}
                value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); setErrors({}) }}
                maxLength={25}
                className={`w-full px-3 py-2 border rounded-md text-sm ${errors.displayName ? cn.inputError : cn.input}`}
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                placeholder={t('auth.passwordMinLength')}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors({}) }}
                className={`w-full px-3 py-2 border rounded-md text-sm ${errors.password ? cn.inputError : cn.input}`}
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                placeholder={t('auth.enterPasswordAgain')}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrors({}) }}
                className={`w-full px-3 py-2 border rounded-md text-sm ${errors.confirmPassword ? cn.inputError : cn.input}`}
              />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setRegisterStep(1)} className={`flex-1 py-2 px-4 rounded-md text-sm border border-gray-300 dark:border-gray-600 ${cn.colors.text.primary}`}>
                {t('common.back')}
              </button>
              <button type="submit" className={`flex-1 py-2 px-4 rounded-md text-sm ${loading ? cn.disabledButton : cn.primaryButton}`} disabled={loading}>
                {loading ? t('common.processing') : t('auth.signUp')}
              </button>
            </div>
          </form>
        )}

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className={`px-2 ${cn.modalBg} text-gray-500`}>{t('auth.or')}</span>
          </div>
        </div>

        {enabledProviders.length > 0 && (
          <div className={`grid ${enabledProviders.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
            {enabledProviders.map(provider => (
              <button 
                key={provider}
                onClick={() => signIn(provider, { callbackUrl: `/${locale}` })} 
                className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <img 
                  src={`/thirdpart/${provider}.svg`} 
                  alt={provider}
                  className="h-4 w-4"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                <span className="text-gray-700 dark:text-gray-300 text-xs font-medium">
                  {provider.charAt(0).toUpperCase() + provider.slice(1)}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={() => { setIsRegister(!isRegister); resetForm() }}
            className={`${cn.link} focus:outline-none text-sm`}
          >
            {isRegister ? t('auth.hasAccountSignIn') : t('auth.noAccountCreate')}
          </button>
        </div>
      </div>
    </div>
  )
}
