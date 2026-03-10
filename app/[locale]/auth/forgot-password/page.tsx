'use client'
import React, { useState, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks'
import Header from '@/components/Header'
import LoginModal from '@/components/LoginModal'

function ForgotPasswordContent() {
  const router = useRouter()
  const params = useParams()
  const locale = params?.locale as string || 'en'
  const { cn } = useTheme()
  const { t } = useTranslation()
  
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<{email?: boolean}>({})
  const [success, setSuccess] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setErrors({})
    
    if (!email.trim()) {
      setError(t('auth.allFieldsRequired'))
      setErrors({ email: true })
      return
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('auth.emailInvalid'))
      setErrors({ email: true })
      return
    }
    
    setLoading(true)
    
    try {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, locale })
    })
    
    const data = await response.json()
    
    if (response.ok && data.success) {
      setSuccess(true)
    } else {
      setError(data.error || t('auth.errorOccurred'))
    }
  } catch (err) {
    setError(t('auth.errorOccurred'))
  } finally {
    setLoading(false)
  }
  }
  
  if (success) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900">
        <Header showLoginModal={() => setShowLoginModal(true)} />
        <div className="flex items-center justify-center px-4 py-12 min-h-[calc(100vh-80px)]">
          <div className={`${cn.colors.bg.card} p-8 rounded-lg shadow-md max-w-md w-full text-center`}>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className={`text-2xl font-bold ${cn.colors.text.primary} mb-2`}>{t('auth.checkYourEmail')}</h2>
            <p className={`${cn.colors.text.muted} mb-4`}>{t('auth.resetLinkSent')}</p>
            <button
              onClick={() => router.push(`/${locale}/login`)}
              className={`${cn.primaryButton} px-4 py-2 rounded-md`}
            >
              {t('auth.backToLogin')}
            </button>
          </div>
        </div>
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
        />
      </div>
    )
  }
  
  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <Header showLoginModal={() => setShowLoginModal(true)} />
      <div className="flex items-center justify-center px-4 py-12 min-h-[calc(100vh-80px)]">
        <div className={`${cn.colors.bg.card} p-8 rounded-lg shadow-md max-w-md w-full`}>
          <h2 className={`text-2xl font-bold ${cn.colors.text.primary} mb-6 text-center`}>{t('auth.forgotPassword')}</h2>
          
          {error && (
            <div className={`${cn.errorMessage} p-3 rounded-md mb-4 text-sm`}>{error}</div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className={`block text-sm font-medium ${cn.colors.text.muted} mb-1`}>{t('auth.email')}</label>
              <input
                type="text"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors({}); setError('') }}
                className={`w-full px-3 py-2 border rounded-md ${errors.email ? cn.inputError : cn.input}`}
                placeholder={t('auth.enterEmail')}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className={`w-full py-2 px-4 rounded-md ${loading || !email.trim() ? cn.disabledButton : cn.primaryButton}`}
            >
              {loading ? t('auth.sending') : t('auth.sendResetLink')}
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push(`/${locale}/login`)}
              className={`${cn.link} text-sm`}
            >
              {t('auth.backToLogin')}
            </button>
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

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>}>
      <ForgotPasswordContent />
    </Suspense>
  )
}
