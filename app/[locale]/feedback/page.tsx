'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import LoginModal from '@/components/LoginModal'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation, useLocale } from '@/hooks'
import { ContentLoader, ButtonLoader } from '@/components/ui'
import { LOCALE_NAMES } from '@/components/mgr/LocaleSelector'
import { formatDateTime } from '@/lib/date-utils'

const ALL_LOCALES = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'pt', 'ru', 'ar', 'hi', 'it', 'nl', 'pl', 'tr', 'vi', 'th', 'id', 'ms', 'tl']

const BugIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 2l1.88 1.88M14.12 3.88L16 2M9 7.13v-1a3.003 3.003 0 116 0v1"/>
    <path d="M12 20c-4.4 0-8-3.6-8-8v-2a4 4 0 014-4h8a4 4 0 014 4v2c0 4.4-3.6 8-8 8z"/>
    <path d="M4 11h16M8 15h.01M12 15h.01M16 15h.01"/>
  </svg>
)

const FeatureIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
  </svg>
)

const ImprovementIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
  </svg>
)

const ModeratorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
  </svg>
)

const OtherIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
  </svg>
)

const FEEDBACK_TYPES = [
  { 
    id: 'bug', 
    icon: BugIcon, 
    titleKey: 'feedback.types.bug',
    descKey: 'feedback.types.bugDesc'
  },
  { 
    id: 'feature', 
    icon: FeatureIcon, 
    titleKey: 'feedback.types.feature',
    descKey: 'feedback.types.featureDesc'
  },
  { 
    id: 'improvement', 
    icon: ImprovementIcon, 
    titleKey: 'feedback.types.improvement',
    descKey: 'feedback.types.improvementDesc'
  },
  { 
    id: 'moderator', 
    icon: ModeratorIcon, 
    titleKey: 'feedback.types.moderator',
    descKey: 'feedback.types.moderatorDesc'
  },
  { 
    id: 'other', 
    icon: OtherIcon, 
    titleKey: 'feedback.types.other',
    descKey: 'feedback.types.otherDesc'
  }
]

export default function FeedbackPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const locale = useLocale()
  const { cn } = useTheme()
  const { t } = useTranslation()
  
  const [selectedType, setSelectedType] = useState<string>('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedLocales, setSelectedLocales] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [checkingApplication, setCheckingApplication] = useState(true)
  const [existingApplication, setExistingApplication] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      checkExistingApplication()
      setUserRole((session.user as any)?.role || 'user')
    } else if (status !== 'loading') {
      setCheckingApplication(false)
    }
  }, [status, session])

  const checkExistingApplication = async () => {
    try {
      const response = await fetch('/mgr/api/moderators?action=applications')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data?.applications) {
          const myApp = data.data.applications.find(
            (app: any) => app.user_id === (session?.user as any)?.id && app.status === 'pending'
          )
          if (myApp) {
            setExistingApplication(myApp)
          }
        }
      }
    } catch (err) {
      console.error('Error checking application:', err)
    } finally {
      setCheckingApplication(false)
    }
  }

  const handleToggleLocale = (localeCode: string) => {
    setSelectedLocales(prev => 
      prev.includes(localeCode) 
        ? prev.filter(l => l !== localeCode)
        : [...prev, localeCode]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!selectedType) {
      setError(t('feedback.selectType') || 'Please select a feedback type')
      return
    }

    if (selectedType === 'moderator') {
      if (selectedLocales.length === 0) {
        setError(t('moderator.selectAtLeastOne') || 'Please select at least one locale')
        return
      }
      await submitModeratorApplication()
    } else {
      if (!title.trim() || !content.trim()) {
        setError(t('feedback.fillRequired') || 'Please fill in all required fields')
        return
      }
      await submitFeedback()
    }
  }

  const submitModeratorApplication = async () => {
    setLoading(true)
    try {
      const response = await fetch('/mgr/api/moderators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          requestedLocales: selectedLocales,
          reason
        })
      })

      const data = await response.json()
      if (data.success) {
        setSuccess(true)
        setExistingApplication({
          requested_locales: selectedLocales,
          reason,
          status: 'pending',
          created_at: new Date().toISOString()
        })
      } else {
        setError(data.error || t('errors.generic'))
      }
    } catch (err) {
      setError(t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  const submitFeedback = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          title: title.trim(),
          content: content.trim(),
          userId: session?.user ? (session.user as any).id : null
        })
      })

      const data = await response.json()
      if (data.success) {
        setSuccess(true)
      } else {
        setError(data.error || t('errors.generic'))
      }
    } catch (err) {
      setError(t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || checkingApplication) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header showLoginModal={() => setShowLoginModal(true)} />
        <ContentLoader text={t('common.loading')} minHeight="py-32" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header showLoginModal={() => setShowLoginModal(true)} />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {selectedType === 'moderator' 
                ? (t('moderator.applicationSubmitted') || 'Application Submitted')
                : (t('feedback.submitted') || 'Feedback Submitted')
              }
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {selectedType === 'moderator'
                ? (t('moderator.applicationSubmittedDesc') || 'Your application has been submitted and is pending review')
                : (t('feedback.submittedDesc') || 'Thank you for your feedback! We will review it carefully.')
              }
            </p>
            <a
              href={`/${locale}`}
              className={`inline-block px-6 py-3 ${cn.primaryButton} rounded-lg font-medium`}
            >
              {t('nav.home')}
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (selectedType === 'moderator' && existingApplication) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header showLoginModal={() => setShowLoginModal(true)} />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {t('moderator.applicationPending') || 'Application Pending'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {t('moderator.applicationPendingDesc') || 'Your application is being reviewed'}
              </p>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                {t('moderator.requestedLocales') || 'Requested Locales'}
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {(existingApplication.requested_locales || []).map((loc: string) => (
                  <span key={loc} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                    {LOCALE_NAMES[loc] || loc}
                  </span>
                ))}
              </div>
              
              {existingApplication.reason && (
                <>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    {t('moderator.reason') || 'Reason'}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    {existingApplication.reason}
                  </p>
                </>
              )}
              
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                {t('moderator.appliedAt') || 'Applied at'}: {formatDateTime(existingApplication.created_at)}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (selectedType === 'moderator' && userRole === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header showLoginModal={() => setShowLoginModal(true)} />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t('moderator.alreadyAdmin') || 'You are an Admin'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {t('moderator.alreadyAdminDesc') || 'Admins have full access to all features and do not need to apply for moderator'}
            </p>
            <a
              href="/mgr"
              className={`inline-block px-6 py-3 ${cn.primaryButton} rounded-lg font-medium`}
            >
              {t('nav.adminPanel')}
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (selectedType === 'moderator' && userRole === 'moderator') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header showLoginModal={() => setShowLoginModal(true)} />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t('moderator.alreadyModerator') || 'You are already a Moderator'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {t('moderator.alreadyModeratorDesc') || 'You already have moderator privileges'}
            </p>
            <a
              href="/mgr"
              className={`inline-block px-6 py-3 ${cn.primaryButton} rounded-lg font-medium`}
            >
              {t('nav.moderatorPanel')}
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header showLoginModal={() => setShowLoginModal(true)} />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('feedback.title') || 'Feedback & Suggestions'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t('feedback.subtitle') || 'Help us improve SlangHome'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('feedback.selectTypeLabel') || 'Select feedback type'}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {FEEDBACK_TYPES.map(type => {
                const IconComponent = type.icon
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setSelectedType(type.id)
                      setError('')
                    }}
                    className={`flex flex-col items-center gap-2 p-4 border rounded-xl cursor-pointer transition-all text-center ${
                      selectedType === type.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <span className="text-2xl"><IconComponent /></span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t(type.titleKey)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {selectedType === 'moderator' && (
            <>
              {status === 'unauthenticated' ? (
                <div className="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {t('moderator.loginRequiredDesc') || 'Please login to apply for moderator position'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowLoginModal(true)}
                    className={`px-6 py-2 ${cn.primaryButton} rounded-lg font-medium`}
                  >
                    {t('nav.signIn')}
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      {t('moderator.selectLocales') || 'Select locales you want to manage'}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ALL_LOCALES.map(loc => (
                        <label
                          key={loc}
                          className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedLocales.includes(loc)
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedLocales.includes(loc)}
                            onChange={() => handleToggleLocale(loc)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {LOCALE_NAMES[loc] || loc}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('moderator.whyApply') || 'Why do you want to be a moderator?'}
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={4}
                      maxLength={500}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                      placeholder={t('moderator.whyApplyPlaceholder') || 'Tell us about yourself and why you would be a good moderator...'}
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      {reason.length}/500
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('moderator.responsibilities') || 'Moderator Responsibilities'}
                    </h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {t('moderator.responsibility1') || 'Review and manage slang submissions in your assigned locales'}
                      </li>
                      <li className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {t('moderator.responsibility2') || 'Handle user reports and moderate comments'}
                      </li>
                      <li className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {t('moderator.responsibility3') || 'Help maintain content quality and community standards'}
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </>
          )}

          {selectedType && selectedType !== 'moderator' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('feedback.titleLabel') || 'Title'}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder={t('feedback.titlePlaceholder') || 'Brief summary of your feedback'}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('feedback.contentLabel') || 'Description'}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  maxLength={2000}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  placeholder={t('feedback.contentPlaceholder') || 'Please describe your feedback in detail...'}
                />
                <p className="mt-1 text-xs text-gray-400">
                  {content.length}/2000
                </p>
              </div>
            </>
          )}

          {selectedType && (
            <div className="flex gap-3">
              <a
                href={`/${locale}`}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-center font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('common.cancel')}
              </a>
              <button
                type="submit"
                disabled={loading || (selectedType === 'moderator' && selectedLocales.length === 0)}
                className={`flex-1 px-4 py-3 ${cn.primaryButton} rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                <ButtonLoader loading={loading} loaderText={t('common.submitting') || 'Submitting...'}>
                  {selectedType === 'moderator' 
                    ? (t('moderator.submitApplication') || 'Submit Application')
                    : (t('feedback.submit') || 'Submit Feedback')
                  }
                </ButtonLoader>
              </button>
            </div>
          )}
        </form>
      </div>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLoginSuccess={() => router.refresh()} />
    </div>
  )
}
