'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks/useTranslation'
import { useToast } from '@/components/ui/Notifications'

interface UsernameChangeModalProps {
  isOpen: boolean
  onClose: () => void
  currentUsername: string
  usernameUpdatedAt: string | null
  onSuccess: (newUsername: string) => void
}

export default function UsernameChangeModal({
  isOpen,
  onClose,
  currentUsername,
  usernameUpdatedAt,
  onSuccess
}: UsernameChangeModalProps) {
  const { cn } = useTheme()
  const { t } = useTranslation()
  const { showSuccess, showError } = useToast()
  const { data: session } = useSession()
  
  const [newUsername, setNewUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000
  
  const canChangeUsername = () => {
    if (!usernameUpdatedAt) return true
    const lastUpdate = new Date(usernameUpdatedAt).getTime()
    return Date.now() - lastUpdate >= ONE_YEAR_MS
  }
  
  const getNextChangeDate = () => {
    if (!usernameUpdatedAt) return null
    const lastUpdate = new Date(usernameUpdatedAt).getTime()
    const nextChange = new Date(lastUpdate + ONE_YEAR_MS)
    return nextChange.toLocaleDateString()
  }
  
  const getRemainingDays = () => {
    if (!usernameUpdatedAt) return 0
    const lastUpdate = new Date(usernameUpdatedAt).getTime()
    const remaining = ONE_YEAR_MS - (Date.now() - lastUpdate)
    return Math.ceil(remaining / (24 * 60 * 60 * 1000))
  }
  
  useEffect(() => {
    if (isOpen) {
      setNewUsername('')
      setError('')
    }
  }, [isOpen])
  
  const validateUsername = (username: string): string | null => {
    if (!username.trim()) {
      return t('profile.usernameRequired') || 'Username is required'
    }
    if (username.length < 3) {
      return t('profile.usernameTooShort') || 'Username must be at least 3 characters'
    }
    if (username.length > 20) {
      return t('profile.usernameTooLong') || 'Username must be at most 20 characters'
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return t('profile.usernameFormatError') || 'Username can only contain letters, numbers, and underscores'
    }
    if (username.toLowerCase() === currentUsername.toLowerCase()) {
      return t('profile.usernameSameAsCurrent') || 'New username must be different from current'
    }
    return null
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateUsername(newUsername)
    if (validationError) {
      setError(validationError)
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/user/username', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: (session?.user as any)?.id,
          newUsername: newUsername.trim()
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        showSuccess(t('profile.usernameChanged'), t('profile.usernameChangedDesc'))
        onSuccess(newUsername.trim())
        onClose()
      } else {
        setError(data.error || t('profile.usernameChangeFailed'))
      }
    } catch (err) {
      console.error('Error changing username:', err)
      setError(t('profile.usernameChangeFailed'))
    } finally {
      setLoading(false)
    }
  }
  
  if (!isOpen) return null
  
  const canChange = canChangeUsername()
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${cn.colors.bg.card} rounded-2xl shadow-xl max-w-md w-full overflow-hidden`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className={`text-xl font-bold ${cn.colors.text.primary}`}>
            {t('profile.changeUsername')}
          </h2>
        </div>
        
        <div className="p-6">
          {!canChange ? (
            <div className="text-center py-4">
              <div className="text-amber-500 text-5xl mb-4">⏳</div>
              <p className={`${cn.colors.text.primary} mb-2`}>
                {t('profile.usernameChangeCooldown')}
              </p>
              <p className={`${cn.colors.text.muted} text-sm`}>
                {t('profile.usernameChangeCooldownDesc', { days: getRemainingDays(), date: getNextChangeDate() || '-' })}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className={`block text-sm font-medium ${cn.colors.text.muted} mb-2`}>
                  {t('profile.currentUsername')}
                </label>
                <div className={`px-4 py-3 rounded-xl ${cn.colors.bg.secondary} ${cn.colors.text.muted}`}>
                  @{currentUsername}
                </div>
              </div>
              
              <div className="mb-4">
                <label className={`block text-sm font-medium ${cn.colors.text.muted} mb-2`}>
                  {t('profile.newUsername')}
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => { setNewUsername(e.target.value); setError('') }}
                  maxLength={20}
                  className={`w-full border rounded-xl px-4 py-3 ${cn.colors.bg.card} ${cn.colors.text.primary} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
                  placeholder={t('profile.enterNewUsername')}
                />
                <p className="text-xs text-gray-500 mt-1">{t('auth.usernameHint')}</p>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
              
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ {t('profile.usernameChangeWarning')}
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium border border-gray-300 dark:border-gray-600 ${cn.colors.text.primary}`}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading || !newUsername.trim()}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium ${loading || !newUsername.trim() ? cn.disabledButton : cn.primaryButton}`}
                >
                  {loading ? t('common.processing') : t('common.confirm')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
