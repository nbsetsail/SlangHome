'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import LoginModal from '@/components/LoginModal'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks/useTranslation'
import { storageManager } from '@/lib/utils'

interface EvolutionItem {
  id?: number
  period: string
  phase: string
  explanation: string
  example: string
  origin: string
  story: string
  seq: number
}

interface SlangData {
  id: string
  phrase: string
  explanation: string
  example: string
  origin: string
  categories: string
  tags: string
  evolution?: EvolutionItem[]
}

export default function SlangMaintainPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = params.id as string
  const locale = params?.locale as string || 'en'
  const { data: session } = useSession()
  const { cn } = useTheme()
  const { t } = useTranslation()

  const [slang, setSlang] = useState<SlangData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [autoSaveToast, setAutoSaveToast] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [showDraftPrompt, setShowDraftPrompt] = useState(false)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  const AUTO_SAVE_INTERVAL = 30000

  const [formData, setFormData] = useState({
    phrase: '',
    explanation: '',
    example: '',
    origin: '',
    categories: '',
    tags: '',
    editSummary: ''
  })
  const [evolution, setEvolution] = useState<EvolutionItem[]>([])

  const getStorageKey = useCallback(() => `maintain_draft_${id}`, [id])

  useEffect(() => {
    fetchSlangData()
  }, [id])

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  useEffect(() => {
    const saved = storageManager.getItem<{
      formData: typeof formData
      evolution: EvolutionItem[]
    } | null>(getStorageKey(), null)
    if (saved) {
      setHasDraft(true)
    }
    setIsHydrated(true)
  }, [getStorageKey])

  const restoreDraft = () => {
    const saved = storageManager.getItem<{
      formData: typeof formData
      evolution: EvolutionItem[]
    } | null>(getStorageKey(), null)
    if (saved) {
      setFormData(saved.formData)
      setEvolution(saved.evolution)
    }
    setShowDraftPrompt(false)
  }

  const discardDraft = () => {
    storageManager.removeItem(getStorageKey())
    setHasDraft(false)
    setShowDraftPrompt(false)
  }

  const saveDraft = useCallback(() => {
    const hasChanges = formData.phrase.trim() || 
                       formData.explanation.trim() || 
                       formData.example.trim() || 
                       formData.origin.trim() ||
                       formData.categories.trim() ||
                       formData.tags.trim() ||
                       formData.editSummary.trim() ||
                       evolution.length > 0
    
    if (hasChanges) {
      storageManager.setItem(getStorageKey(), { formData, evolution })
      setAutoSaveToast(true)
      setTimeout(() => {
        setAutoSaveToast(false)
      }, 3000)
    }
  }, [formData, evolution, getStorageKey])

  useEffect(() => {
    if (!isHydrated) return
    
    autoSaveTimerRef.current = setInterval(() => {
      saveDraft()
    }, AUTO_SAVE_INTERVAL)

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
    }
  }, [saveDraft, isHydrated])

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
    }
  }, [])

  const fetchSlangData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/slang/${id}/maintain`)
      const data = await response.json()
      
      if (data.error) {
        setToastMessage(data.error)
        setShowToast(true)
      } else {
        setSlang(data.slang)
        setFormData({
          phrase: data.slang.phrase || '',
          explanation: data.slang.explanation || '',
          example: data.slang.example || '',
          origin: data.slang.origin || '',
          categories: data.slang.categories || '',
          tags: data.slang.tags || '',
          editSummary: ''
        })
        setEvolution(data.slang.evolution || [])
        if (hasDraft) {
          setShowDraftPrompt(true)
        }
      }
    } catch (error) {
      console.error('Error fetching slang:', error)
      setToastMessage(t('errors.generic'))
      setShowToast(true)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleEvolutionChange = (index: number, field: keyof EvolutionItem, value: string) => {
    setEvolution(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addEvolutionPhase = () => {
    setEvolution(prev => [...prev, {
      period: '',
      phase: '',
      explanation: '',
      example: '',
      origin: '',
      story: '',
      seq: prev.length + 1
    }])
  }

  const removeEvolutionPhase = (index: number) => {
    setEvolution(prev => prev.filter((_, i) => i !== index).map((e, i) => ({ ...e, seq: i + 1 })))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user?.id) {
      setShowLoginModal(true)
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/slang/${id}/maintain`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: session.user.id,
          evolution: evolution.filter(e => e.period || e.phase || e.explanation)
        })
      })

      const data = await response.json()
      
      if (data.success) {
        storageManager.removeItem(getStorageKey())
        setToastMessage(t('maintain.saveSuccess'))
        setShowToast(true)
        setTimeout(() => {
          router.push(`/${locale}/slang/${id}/history`)
        }, 1500)
      } else {
        setToastMessage(data.error || t('errors.generic'))
        setShowToast(true)
      }
    } catch (error) {
      console.error('Error saving slang:', error)
      setToastMessage(t('errors.generic'))
      setShowToast(true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${cn.colors.bg.light} flex items-center justify-center`}>
        <div className={cn.loader.replace('h-6 w-6', 'h-12 w-12')}></div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${cn.colors.bg.light}`}>
      <Header showLoginModal={() => setShowLoginModal(true)} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className={`text-2xl font-bold ${cn.title}`}>{t('maintain.title')}</h1>
          <button
            onClick={() => router.push(`/${locale}/slang/${id}/history`)}
            className={`${cn.secondaryButton} px-4 py-2 rounded-md text-sm`}
          >
            {t('maintain.viewHistory')}
          </button>
        </div>

        {showDraftPrompt && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{t('slang.draftFound')}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={restoreDraft}
                  className="px-3 py-1 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700 transition-colors"
                >
                  {t('slang.restoreDraft')}
                </button>
                <button
                  type="button"
                  onClick={discardDraft}
                  className="px-3 py-1 border border-yellow-600 text-yellow-600 dark:text-yellow-400 dark:border-yellow-400 rounded-md text-sm hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
                >
                  {t('slang.discardDraft')}
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className={`${cn.colors.bg.card} rounded-lg shadow-md p-6`}>
            <h2 className={`text-lg font-semibold ${cn.title} mb-4`}>{t('maintain.basicInfo')}</h2>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${cn.colors.text.muted} mb-1`}>
                  {t('slang.phrase')} *
                </label>
                <input
                  type="text"
                  name="phrase"
                  value={formData.phrase}
                  onChange={handleInputChange}
                  required
                  maxLength={100}
                  className={`w-full px-3 py-2 border rounded-md ${cn.input}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${cn.colors.text.muted} mb-1`}>
                  {t('slang.explanation')} *
                </label>
                <textarea
                  name="explanation"
                  value={formData.explanation}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md ${cn.input}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${cn.colors.text.muted} mb-1`}>
                  {t('slang.example')}
                </label>
                <textarea
                  name="example"
                  value={formData.example}
                  onChange={handleInputChange}
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-md ${cn.input}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${cn.colors.text.muted} mb-1`}>
                  {t('slang.origin')}
                </label>
                <textarea
                  name="origin"
                  value={formData.origin}
                  onChange={handleInputChange}
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-md ${cn.input}`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${cn.colors.text.muted} mb-1`}>
                    {t('slang.categories')}
                  </label>
                  <input
                    type="text"
                    name="categories"
                    value={formData.categories}
                    onChange={handleInputChange}
                    placeholder={t('maintain.categoriesPlaceholder')}
                    className={`w-full px-3 py-2 border rounded-md ${cn.input}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${cn.colors.text.muted} mb-1`}>
                    {t('slang.tags')}
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder={t('maintain.tagsPlaceholder')}
                    className={`w-full px-3 py-2 border rounded-md ${cn.input}`}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={`${cn.colors.bg.card} rounded-lg shadow-md p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-lg font-semibold ${cn.title}`}>{t('maintain.evolutionHistory')}</h2>
              <button
                type="button"
                onClick={addEvolutionPhase}
                className={`${cn.secondaryButton} px-3 py-1 rounded-md text-sm`}
              >
                + {t('maintain.addPhase')}
              </button>
            </div>

            {evolution.length === 0 ? (
              <p className={`${cn.colors.text.muted} text-sm`}>{t('maintain.noEvolution')}</p>
            ) : (
              <div className="space-y-4">
                {evolution.map((evo, index) => (
                  <div key={index} className={`p-4 border rounded-md ${cn.colors.border.default}`}>
                    <div className="flex justify-between items-center mb-3">
                      <span className={`text-sm font-medium ${cn.colors.text.muted}`}>
                        {t('maintain.phase')} {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeEvolutionPhase(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder={t('maintain.periodPlaceholder')}
                        value={evo.period}
                        onChange={(e) => handleEvolutionChange(index, 'period', e.target.value)}
                        className={`px-3 py-2 border rounded-md text-sm ${cn.input}`}
                      />
                      <input
                        type="text"
                        placeholder={t('maintain.phasePlaceholder')}
                        value={evo.phase}
                        onChange={(e) => handleEvolutionChange(index, 'phase', e.target.value)}
                        className={`px-3 py-2 border rounded-md text-sm ${cn.input}`}
                      />
                    </div>
                    
                    <textarea
                      placeholder={t('maintain.explanationPlaceholder')}
                      value={evo.explanation}
                      onChange={(e) => handleEvolutionChange(index, 'explanation', e.target.value)}
                      rows={2}
                      className={`w-full mt-2 px-3 py-2 border rounded-md text-sm ${cn.input}`}
                    />
                    
                    <textarea
                      placeholder={t('maintain.examplePlaceholder')}
                      value={evo.example}
                      onChange={(e) => handleEvolutionChange(index, 'example', e.target.value)}
                      rows={1}
                      className={`w-full mt-2 px-3 py-2 border rounded-md text-sm ${cn.input}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`${cn.colors.bg.card} rounded-lg shadow-md p-6`}>
            <h2 className={`text-lg font-semibold ${cn.title} mb-4`}>{t('maintain.editSummary')}</h2>
            <textarea
              name="editSummary"
              value={formData.editSummary}
              onChange={handleInputChange}
              placeholder={t('maintain.editSummaryPlaceholder')}
              rows={2}
              maxLength={500}
              className={`w-full px-3 py-2 border rounded-md ${cn.input}`}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className={`${cn.secondaryButton} px-6 py-2 rounded-md`}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`${cn.primaryButton} px-6 py-2 rounded-md ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </main>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={() => {
          window.location.reload()
        }}
      />

      {showToast && (
        <div className={`fixed bottom-4 right-4 ${cn.successMessage} px-4 py-2 rounded-md shadow-lg z-50`}>
          {toastMessage}
        </div>
      )}

      {autoSaveToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 p-4 rounded-lg shadow-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            <span>{t('slang.autoSaved')}</span>
          </div>
        </div>
      )}
    </div>
  )
}
