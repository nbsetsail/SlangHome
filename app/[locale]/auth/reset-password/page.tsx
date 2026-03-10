'use client'
import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import { cryptoUtils } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks'
import Header from '@/components/Header'
import LoginModal from '@/components/LoginModal'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const params = useParams()
  const locale = params?.locale as string || 'en'
  const { cn } = useTheme()
  const { t } = useTranslation()
  
  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [tokenError, setTokenError] = useState('')
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<{newPassword?: boolean; confirmPassword?: boolean}>({})
  const [success, setSuccess] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  
  useEffect(() => {
    const tokenParam = searchParams.get('token')
    
    if (!tokenParam) {
      setTokenError(t('auth.invalidResetLink'))
      setVerifying(false)
      return
    }
    
    setToken(tokenParam)
    
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/reset-password?token=${tokenParam}`)
        const data = await response.json()
        
        if (response.ok && data.success) {
          setEmail(data.email)
        } else {
          setTokenError(data.error || t('auth.invalidResetLink'))
        }
      } catch (err) {
        setTokenError(t('auth.errorOccurred'))
      } finally {
        setVerifying(false)
      }
    }
    
    verifyToken()
  }, [searchParams, t])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setErrors({})
    
    if (!newPassword.trim()) {
      setError(t('auth.passwordRequired'))
      setErrors({ newPassword: true })
      return
    }
    
    if (newPassword.length < 8) {
      setError(t('auth.passwordMinLengthError'))
      setErrors({ newPassword: true })
      return
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(newPassword)) {
      setError(t('auth.passwordFormatError'))
      setErrors({ newPassword: true })
      return
    }
    
    if (!confirmPassword.trim()) {
      setError(t('auth.allFieldsRequired'))
      setErrors({ confirmPassword: true })
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'))
      setErrors({ confirmPassword: true })
      return
    }
    
    if (!token || !email) {
      setError(t('auth.invalidResetLink'))
      return
    }
    
    setLoading(true)
    
    try {
      const hashedPassword = await cryptoUtils.sha256(newPassword)
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          newPassword: hashedPassword,
          confirmPassword: hashedPassword
        })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push(`/${locale}/login`)
        }, 3000)
      } else {
        setError(data.error || t('auth.resetPasswordFailed'))
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className={`text-2xl font-bold ${cn.colors.text.primary} mb-2`}>{t('auth.resetPasswordSuccess')}</h2>
            <p className={`${cn.colors.text.muted} mb-4`}>{t('auth.passwordResetSuccessful')}</p>
            <p className={`${cn.colors.text.muted} text-sm`}>{t('auth.redirectingToLogin')}</p>
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
          <h2 className={`text-2xl font-bold ${cn.colors.text.primary} mb-6 text-center`}>{t('auth.resetPassword')}</h2>
          
          {verifying ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className={`${cn.colors.text.muted}`}>{t('common.loading')}</p>
            </div>
          ) : tokenError ? (
            <div className="text-center py-4">
              <div className={`${cn.errorMessage} p-4 rounded-md mb-4`}>{tokenError}</div>
              <button
                onClick={() => router.push(`/${locale}/auth/forgot-password`)}
                className={`${cn.primaryButton} px-4 py-2 rounded-md`}
              >
                {t('auth.forgotPassword')}
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className={`${cn.errorMessage} p-3 rounded-md mb-4 text-sm`}>{error}</div>
              )}
              
              <div className="mb-6 text-center">
                <span className={`text-sm ${cn.colors.text.muted}`}>{t('auth.email')}: </span>
                <span className={`text-sm font-medium ${cn.colors.text.primary}`}>{email}</span>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className={`block text-sm font-medium ${cn.colors.text.muted} mb-1`}>{t('auth.newPassword')}</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setErrors({}); setError('') }}
                    className={`w-full px-3 py-2 border rounded-md ${errors.newPassword ? cn.inputError : cn.input}`}
                    placeholder={t('auth.passwordPlaceholder')}
                  />
                </div>
                
                <div className="mb-6">
                  <label className={`block text-sm font-medium ${cn.colors.text.muted} mb-1`}>{t('auth.confirmNewPassword')}</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setErrors({}); setError('') }}
                    className={`w-full px-3 py-2 border rounded-md ${errors.confirmPassword ? cn.inputError : cn.input}`}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading || !newPassword.trim()}
                  className={`w-full py-2 px-4 rounded-md ${loading || !newPassword.trim() ? cn.disabledButton : cn.primaryButton}`}
                >
                  {loading ? t('auth.resetting') : t('auth.resetPassword')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
