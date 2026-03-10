'use client'
import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useTheme } from '@/contexts/ThemeContext'
import { useToast } from '@/components/ui/Notifications'
import { cryptoUtils } from '@/lib/utils'
import { useTranslation, useLocale } from '@/hooks'
import Header from '@/components/Header'
import LoginModal from '@/components/LoginModal'

export default function RegisterPage() {
  const { cn } = useTheme()
  const { t } = useTranslation()
  const locale = useLocale()
  const { showSuccess, showError } = useToast()
  
  const [registerStep, setRegisterStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [errors, setErrors] = useState<{[key: string]: boolean}>({})
  const [isVerificationSent, setIsVerificationSent] = useState(false)
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [enabledProviders, setEnabledProviders] = useState<string[]>([])
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [emailExistsPrompt, setEmailExistsPrompt] = useState(false)
  const [redirectToLogin, setRedirectToLogin] = useState(false)

  const emailRef = useRef<HTMLInputElement>(null)
  const usernameRef = useRef<HTMLInputElement>(null)
  const displayNameRef = useRef<HTMLInputElement>(null)
  const verificationCodeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

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

  useEffect(() => {
    if (isVerificationSent) {
      setTimeout(() => verificationCodeRef.current?.focus(), 100)
    }
  }, [isVerificationSent])

  useEffect(() => {
    if (registerStep === 2) {
      setTimeout(() => usernameRef.current?.focus(), 100)
    }
  }, [registerStep])

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
        setEmailExistsPrompt(true)
        setRedirectToLogin(true)
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
      showError(t('common.failedToSubmit'), t('auth.usernameFormatError') || 'Username can only contain letters, numbers, and underscores')
    } else if (username.length > 20) {
      newErrors.username = true
      showError(t('common.failedToSubmit'), t('auth.usernameTooLong') || 'Username must be at most 20 characters')
    }
    if (!displayName.trim()) {
      newErrors.displayName = true
    } else if (displayName.length > 25) {
      newErrors.displayName = true
      showError(t('common.failedToSubmit'), t('auth.displayNameTooLong') || 'Display name must be at most 25 characters')
    }
    if (!password.trim() || password.length < 8 || !/^[a-zA-Z0-9]+$/.test(password)) newErrors.password = true
    if (!confirmPassword.trim() || password !== confirmPassword) newErrors.confirmPassword = true

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
        window.location.href = `/${locale}/login`
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

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <Header 
        showLoginModal={() => setShowLoginModal(true)} 
      />
      <div className="flex items-center justify-center px-4 py-12 min-h-[calc(100vh-80px)]">
        <div className={`${cn.colors.bg.card} p-6 md:p-8 rounded-lg shadow-md w-full max-w-3xl`}>
          <h1 className={`text-2xl font-bold ${cn.title} text-center mb-6`}>
            {t('auth.signUp')}
          </h1>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            <div className="flex-1">
              <div className="flex items-center justify-center mb-6 gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${registerStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
                <div className={`w-12 h-1 ${registerStep >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`} />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${registerStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
              </div>

              {registerStep === 1 && (
                <form onSubmit={handleStepOneSubmit}>
                  {emailExistsPrompt && (
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">{t('auth.emailExists')}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">{t('auth.emailExistsLoginHint')}</p>
                      <div className="flex gap-2">
                        <Link
                          href={`/${locale}/login?email=${encodeURIComponent(email)}`}
                          className="flex-1 py-2 px-4 bg-blue-500 text-white text-sm rounded-md text-center hover:bg-blue-600 transition-colors"
                        >
                          {t('auth.signIn')}
                        </Link>
                        <button
                          type="button"
                          onClick={() => { setEmailExistsPrompt(false); setEmail('') }}
                          className="py-2 px-4 border border-gray-300 dark:border-gray-600 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          {t('common.back')}
                        </button>
                      </div>
                    </div>
                  )}
                  {!emailExistsPrompt && (
                    <>
                      <div className="mb-4">
                        <label className={`block text-sm font-medium ${cn.colors.text.muted} mb-1`}>
                          {t('auth.email')}
                        </label>
                        <div className="flex gap-2">
                          <input
                            ref={emailRef}
                            type="email"
                            placeholder={t('auth.enterEmail')}
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setErrors({}) }}
                            className={`flex-1 px-4 py-3 border rounded-md ${errors.email ? cn.inputError : cn.input}`}
                          />
                          <button
                            type="button"
                            onClick={sendVerificationCode}
                            disabled={!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || verificationLoading || countdown > 0}
                            className={`px-4 py-3 rounded-md text-sm whitespace-nowrap ${!email.trim() || verificationLoading || countdown > 0 ? cn.disabledButton : cn.primaryButton}`}
                          >
                            {verificationLoading ? t('auth.sending') : countdown > 0 ? `${countdown}s` : t('auth.verify')}
                          </button>
                        </div>
                      </div>
                      {isVerificationSent && (
                        <div className="mb-4">
                          <label className={`block text-sm font-medium ${cn.colors.text.muted} mb-1`}>
                            {t('auth.verificationCode')}
                          </label>
                          <input
                            ref={verificationCodeRef}
                            type="text"
                            placeholder={t('auth.enterVerificationCode')}
                            value={verificationCode}
                            onChange={(e) => { setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrors({}) }}
                            className={`w-full px-4 py-3 border rounded-md ${errors.verificationCode ? cn.inputError : cn.input}`}
                          />
                        </div>
                      )}
                      <button 
                        type="submit" 
                        className={`w-full py-3 px-4 rounded-md font-medium ${loading || !isVerificationSent || verificationCode.length !== 6 ? cn.disabledButton : cn.primaryButton}`} 
                        disabled={loading || !isVerificationSent || verificationCode.length !== 6}
                      >
                        {loading ? t('common.processing') : t('common.next')}
                      </button>
                    </>
                  )}
                </form>
              )}

              {registerStep === 2 && (
                <form onSubmit={handleRegisterSubmit}>
                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${cn.colors.text.muted} mb-1`}>
                      {t('auth.username')}
                    </label>
                    <input
                      ref={usernameRef}
                      type="text"
                      placeholder={t('auth.enterUsername')}
                      value={username}
                      onChange={(e) => { setUsername(e.target.value); setErrors({}) }}
                      maxLength={20}
                      className={`w-full px-4 py-3 border rounded-md ${errors.username ? cn.inputError : cn.input}`}
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('auth.usernameHint')}</p>
                  </div>
                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${cn.colors.text.muted} mb-1`}>
                      {t('auth.displayName')}
                    </label>
                    <input
                      ref={displayNameRef}
                      type="text"
                      placeholder={t('auth.enterDisplayName')}
                      value={displayName}
                      onChange={(e) => { setDisplayName(e.target.value); setErrors({}) }}
                      maxLength={25}
                      className={`w-full px-4 py-3 border rounded-md ${errors.displayName ? cn.inputError : cn.input}`}
                    />
                  </div>
                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${cn.colors.text.muted} mb-1`}>
                      {t('auth.password')}
                    </label>
                    <input
                      type="password"
                      placeholder={t('auth.passwordMinLength')}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrors({}) }}
                      className={`w-full px-4 py-3 border rounded-md ${errors.password ? cn.inputError : cn.input}`}
                    />
                  </div>
                  <div className="mb-6">
                    <label className={`block text-sm font-medium ${cn.colors.text.muted} mb-1`}>
                      {t('auth.confirmPassword')}
                    </label>
                    <input
                      type="password"
                      placeholder={t('auth.enterPasswordAgain')}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setErrors({}) }}
                      className={`w-full px-4 py-3 border rounded-md ${errors.confirmPassword ? cn.inputError : cn.input}`}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setRegisterStep(1)} 
                      className={`flex-1 py-3 px-4 rounded-md font-medium border border-gray-300 dark:border-gray-600 ${cn.colors.text.primary}`}
                    >
                      {t('common.back')}
                    </button>
                    <button 
                      type="submit" 
                      className={`flex-1 py-3 px-4 rounded-md font-medium ${loading ? cn.disabledButton : cn.primaryButton}`} 
                      disabled={loading}
                    >
                      {loading ? t('common.processing') : t('auth.signUp')}
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-4 text-center md:hidden">
                <Link href={`/${locale}/login`} className={`${cn.link} text-sm`}>
                  {t('auth.hasAccountSignIn')}
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
                        onClick={() => signIn(provider, { callbackUrl: `/${locale}` })} 
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

          <div className="hidden md:block mt-6 text-center">
            <Link href={`/${locale}/login`} className={`${cn.link} text-sm`}>
              {t('auth.hasAccountSignIn')}
            </Link>
          </div>
        </div>
      </div>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  )
}
