'use client'
import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import LoginModal from '@/components/LoginModal'
import Header from '@/components/Header'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation, useLocale } from '@/hooks'

export default function SubmitSlang() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [formData, setFormData] = useState({
    phrase: '',
    explanation: '',
    example: '',
    origin: '',
    categories: '',
    tags: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const locale = useLocale()
  const { data: session, status } = useSession()
  const { cn } = useTheme()
  const { t } = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user) {
      setShowLoginModal(true)
      return
    }

    if (!formData.phrase.trim() || !formData.explanation.trim()) {
      setError(t('common.phraseAndExplanationRequired'))
      return
    }

    if (formData.explanation.length < 10) {
      setError(t('common.explanationMinLength'))
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/slang/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          locale,
          userId: (session.user as any).id
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        setSuccess(t('slang.submitSuccess'))
        setFormData({
          phrase: '',
          explanation: '',
          example: '',
          origin: '',
          categories: '',
          tags: ''
        })
        setTimeout(() => {
          router.push(`/${locale}`)
        }, 3000)
      } else {
        setError(data.error || t('slang.submitFailed'))
      }
    } catch (err) {
      setError(t('slang.submitFailedTryAgain'))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('slang.submitSlangTitle')}</h2>
          <p className="text-gray-600 mb-6">{t('slang.loginToSubmit')}</p>
          <button
            onClick={() => setShowLoginModal(true)}
            className={`${cn.colors.bg.secondary} text-white px-6 py-2 rounded-md ${cn.colors.bg.secondaryHover} transition-colors`}
          >
            {t('auth.signIn')}
          </button>
          <LoginModal 
            isOpen={showLoginModal} 
            onClose={() => setShowLoginModal(false)} 
          />
        </div>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className={cn.loader}></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header showLoginModal={() => setShowLoginModal(true)} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('slang.submitSlangTitle')}</h1>
          <p className="text-gray-600">{t('slang.shareWithCommunity')}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{success}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className={`${cn.colors.info.bg} border ${cn.colors.info.border} rounded-lg p-4 mb-6`}>
            <h3 className={`font-semibold ${cn.colors.info.text} mb-2`}>{t('slang.submissionGuidelines')}</h3>
            <ul className={`${cn.colors.info.text} text-sm space-y-1`}>
              <li>• {t('slang.guideline1')}</li>
              <li>• {t('slang.guideline2')}</li>
              <li>• {t('slang.guideline3')}</li>
              <li>• {t('slang.guideline4')}</li>
              <li>• {t('slang.guideline5')}</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('slang.slangPhraseLabel')} *
              </label>
              <input
                type="text"
                name="phrase"
                value={formData.phrase}
                onChange={handleChange}
                placeholder={t('slang.slangPhrasePlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('slang.explanationLabel')} *
              </label>
              <textarea
                name="explanation"
                value={formData.explanation}
                onChange={handleChange}
                placeholder={t('slang.explanationPlaceholder')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('slang.example')}
              </label>
              <input
                type="text"
                name="example"
                value={formData.example}
                onChange={handleChange}
                placeholder={t('slang.examplePlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('slang.origin')}
              </label>
              <input
                type="text"
                name="origin"
                value={formData.origin}
                onChange={handleChange}
                placeholder={t('slang.originPlaceholder2')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('slang.categoriesLabel')}
              </label>
              <input
                type="text"
                name="categories"
                value={formData.categories}
                onChange={handleChange}
                placeholder={t('slang.categoriesPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('slang.tagsLabel')}
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder={t('slang.tagsPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => router.push(`/${locale}`)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 ${cn.colors.bg.secondary} text-white rounded-md ${cn.colors.bg.secondaryHover} disabled:opacity-50`}
              >
                {loading ? t('slang.submitting') : t('slang.submitForReview')}
              </button>
            </div>
          </form>
        </div>
      </main>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  )
}
