'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import LoginModal from '@/components/LoginModal'
import Header from '@/components/Header'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation, useLocale } from '@/hooks'
import { storageManager } from '@/lib/utils'

interface EvolutionItem {
  id: number
  period: string
  phase: string
  explanation: string
  example: string
  origin: string
  story: string
}

interface FormData {
  phrase: string
  explanation: string
  example: string
  origin: string
  categories: string
  tags: string
  evolution: EvolutionItem[]
}

export default function ContributeSlangPage() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    phrase: '',
    explanation: '',
    example: '',
    origin: '',
    categories: '',
    tags: '',
    evolution: []
  })
  const [collapsedPhases, setCollapsedPhases] = useState<boolean[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [autoSaveToast, setAutoSaveToast] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const locale = useLocale()
  const { data: session } = useSession()
  const { cn } = useTheme()
  const { t } = useTranslation()

  const AUTO_SAVE_INTERVAL = 30000
  const STORAGE_KEY = 'contribute_draft'

  useEffect(() => {
    const saved = storageManager.getItem<FormData | null>(STORAGE_KEY, null)
    if (saved) {
      setFormData(saved)
      if (saved.evolution && saved.evolution.length > 0) {
        setCollapsedPhases(new Array(saved.evolution.length).fill(true))
      }
    }
    setIsHydrated(true)
  }, [])

  const saveDraft = useCallback(() => {
    const hasContent = formData.phrase.trim() || 
                       formData.explanation.trim() || 
                       formData.example.trim() || 
                       formData.origin.trim() ||
                       formData.categories.trim() ||
                       formData.tags.trim() ||
                       (formData.evolution && formData.evolution.length > 0)
    
    if (hasContent) {
      storageManager.setItem(STORAGE_KEY, formData)
      setAutoSaveToast(true)
      setTimeout(() => {
        setAutoSaveToast(false)
      }, 3000)
    }
  }, [formData])

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddPhase = () => {
    const newPhase = {
      id: Date.now() + Math.random(),
      period: '',
      phase: '',
      explanation: '',
      example: '',
      origin: '',
      story: ''
    }
    setFormData(prev => ({
      ...prev,
      evolution: [
        ...(prev.evolution || []),
        newPhase
      ]
    }))
    setCollapsedPhases(prev => [...prev, true])
  }

  const handleRemovePhase = (index: number) => {
    const newEvolution = [...(formData.evolution || [])]
    newEvolution.splice(index, 1)
    setFormData(prev => ({ ...prev, evolution: newEvolution }))
    const newCollapsed = [...collapsedPhases]
    newCollapsed.splice(index, 1)
    setCollapsedPhases(newCollapsed)
  }

  const handlePhaseChange = (index: number, field: string, value: string) => {
    const newEvolution = [...(formData.evolution || [])]
    newEvolution[index] = {
      ...newEvolution[index],
      [field]: value
    }
    setFormData(prev => ({ ...prev, evolution: newEvolution }))
  }

  const handleTogglePhase = (index: number) => {
    const newCollapsed = [...collapsedPhases]
    newCollapsed[index] = !newCollapsed[index]
    setCollapsedPhases(newCollapsed)
  }

  const handleToggleAllPhases = () => {
    const allCollapsed = collapsedPhases.every(collapsed => collapsed)
    const newCollapsedState = Array(formData.evolution.length).fill(!allCollapsed)
    setCollapsedPhases(newCollapsedState)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const phraseInput = document.querySelector('input[name="phrase"]') as HTMLInputElement
    const explanationInput = document.querySelector('textarea[name="explanation"]') as HTMLTextAreaElement
    let isValid = true
    let firstEmptyField: HTMLInputElement | HTMLTextAreaElement | null = null

    if (!formData.phrase.trim()) {
      if (phraseInput) {
        phraseInput.classList.add('border-red-500')
        if (!firstEmptyField) firstEmptyField = phraseInput
      }
      isValid = false
    }

    if (!formData.explanation.trim()) {
      if (explanationInput) {
        explanationInput.classList.add('border-red-500')
        if (!firstEmptyField) firstEmptyField = explanationInput
      }
      isValid = false
    }

    if (!isValid) {
      if (firstEmptyField) {
        firstEmptyField.focus()
      }
      setError(t('common.phraseAndExplanationRequired'))
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/mgr/api/slang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          user_id: session ? (session.user as any)?.id || null : null,
          status: 'pending',
          locale
        })
      })
      const result = await response.json()
      
      if (result.success) {
        setSuccess(t('common.slangSubmittedSuccess'))
        storageManager.removeItem(STORAGE_KEY)
        setFormData({
          phrase: '',
          explanation: '',
          example: '',
          origin: '',
          categories: '',
          tags: '',
          evolution: []
        })
        setCollapsedPhases([])
        setTimeout(() => {
          router.push(`/${locale}`)
        }, 2000)
      } else {
        setError(result.error || t('common.failedToSubmit'))
      }
    } catch (err) {
      setError(t('common.failedToSubmitTryAgain'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header showLoginModal={() => setShowLoginModal(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${cn.colors.text.primary}`}>{t('nav.addSlang')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('slang.shareWithCommunity')}</p>
        </div>

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {autoSaveToast && (
          <div className="fixed bottom-4 right-4 z-50 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 p-4 rounded-lg shadow-lg animate-fade-in">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              <span>{t('slang.autoSaved')}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
              <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6`}>
                <h2 className={`text-lg font-semibold ${cn.colors.text.primary} mb-4 flex items-center gap-2`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {t('slang.basicInfo')}
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${cn.colors.text.secondary} mb-2`}>
                      {t('slang.phrase')} *
                    </label>
                    <input
                      type="text"
                      name="phrase"
                      value={formData.phrase}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2.5 border rounded-lg ${cn.input}`}
                      placeholder={t('slang.enterPhrase')}
                      onInput={(e: React.FormEvent<HTMLInputElement>) => {
                        (e.target as HTMLInputElement).classList.remove('border-red-500');
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${cn.colors.text.secondary} mb-2`}>
                      {t('slang.explanation')} *
                    </label>
                    <textarea
                      name="explanation"
                      value={formData.explanation}
                      onChange={handleInputChange}
                      rows={4}
                      className={`w-full px-4 py-2.5 border rounded-lg ${cn.input}`}
                      placeholder={t('slang.explainMeaning')}
                      onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                        (e.target as HTMLTextAreaElement).classList.remove('border-red-500');
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${cn.colors.text.secondary} mb-2`}>
                      {t('slang.example')}
                    </label>
                    <textarea
                      name="example"
                      value={formData.example}
                      onChange={handleInputChange}
                      rows={2}
                      className={`w-full px-4 py-2.5 border rounded-lg ${cn.input}`}
                      placeholder={t('slang.provideExample')}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${cn.colors.text.secondary} mb-2`}>
                      {t('slang.origin')}
                    </label>
                    <textarea
                      name="origin"
                      value={formData.origin}
                      onChange={handleInputChange}
                      rows={2}
                      className={`w-full px-4 py-2.5 border rounded-lg ${cn.input}`}
                      placeholder={t('slang.describeOrigin')}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${cn.colors.text.secondary} mb-2`}>
                        {t('slang.categories')}
                      </label>
                      <input
                        type="text"
                        name="categories"
                        value={formData.categories}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 border rounded-lg ${cn.input}`}
                        placeholder={t('slang.commaCategories')}
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium ${cn.colors.text.secondary} mb-2`}>
                        {t('slang.tags')}
                      </label>
                      <input
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2.5 border rounded-lg ${cn.input}`}
                        placeholder={t('slang.commaTags')}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 lg:hidden">
                  <button
                    type="button"
                    onClick={() => router.push(`/${locale}`)}
                    className={`px-5 py-2.5 border rounded-lg ${cn.colors.text.primary} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2.5 rounded-lg ${cn.primaryButton} disabled:opacity-50 transition-colors flex items-center gap-2`}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {t('slang.submitting')}
                      </>
                    ) : (
                      t('slang.submitForReview')
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:w-[400px] lg:flex-shrink-0">
              <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 lg:sticky lg:top-20`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className={`text-lg font-semibold ${cn.colors.text.primary} flex items-center gap-2`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('slang.evolutionHistory')}
                  </h2>
                  {formData.evolution.length > 0 && (
                    <button
                      type="button"
                      onClick={handleToggleAllPhases}
                      className={`text-sm ${cn.link}`}
                    >
                      {collapsedPhases.every(collapsed => collapsed) ? t('slang.expandAll') : t('slang.collapseAll')}
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {(formData.evolution || []).map((phase, index) => (
                    <div 
                      key={phase.id} 
                      className={`border rounded-lg ${cn.colors.border.default} bg-gray-50 dark:bg-gray-700/50`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', index.toString());
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
                        if (draggedIndex !== index) {
                          const newEvolution = [...(formData.evolution || [])];
                          const [draggedPhase] = newEvolution.splice(draggedIndex, 1);
                          newEvolution.splice(index, 0, draggedPhase);
                          setFormData(prev => ({ ...prev, evolution: newEvolution }));
                          
                          const newCollapsed = [...collapsedPhases];
                          const [draggedCollapsed] = newCollapsed.splice(draggedIndex, 1);
                          newCollapsed.splice(index, 0, draggedCollapsed);
                          setCollapsedPhases(newCollapsed);
                        }
                      }}
                    >
                      <div className={`flex justify-between items-start p-3 border-b cursor-move ${cn.colors.border.default}`}>
                        <div className="flex items-start gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                          <div className="flex flex-col">
                            <h5 className={`font-medium ${cn.colors.text.primary}`}>{t('slang.phase')} {index + 1}</h5>
                            {collapsedPhases[index] && (phase.period || phase.phase) && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {phase.period && phase.phase ? `${phase.period} - ${phase.phase}` : phase.period || phase.phase}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTogglePhase(index)}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${collapsedPhases[index] ? '' : 'transform rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePhase(index)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {!collapsedPhases[index] && (
                        <div className="p-3 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={`block text-xs font-medium ${cn.colors.text.secondary} mb-1`}>{t('slang.period')}</label>
                              <input
                                type="text"
                                value={phase.period || ''}
                                onChange={(e) => handlePhaseChange(index, 'period', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md text-sm ${cn.input}`}
                                placeholder={t('slang.periodPlaceholder')}
                              />
                            </div>
                            <div>
                              <label className={`block text-xs font-medium ${cn.colors.text.secondary} mb-1`}>{t('slang.phase')}</label>
                              <input
                                type="text"
                                value={phase.phase || ''}
                                onChange={(e) => handlePhaseChange(index, 'phase', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md text-sm ${cn.input}`}
                                placeholder={t('slang.phasePlaceholder')}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className={`block text-xs font-medium ${cn.colors.text.secondary} mb-1`}>{t('slang.explanation')}</label>
                            <textarea
                              value={phase.explanation || ''}
                              onChange={(e) => handlePhaseChange(index, 'explanation', e.target.value)}
                              rows={2}
                              className={`w-full px-3 py-2 border rounded-md text-sm ${cn.input}`}
                              placeholder={t('slang.explainPhase')}
                            />
                          </div>
                          
                          <div>
                            <label className={`block text-xs font-medium ${cn.colors.text.secondary} mb-1`}>{t('slang.example')}</label>
                            <textarea
                              value={phase.example || ''}
                              onChange={(e) => handlePhaseChange(index, 'example', e.target.value)}
                              rows={2}
                              className={`w-full px-3 py-2 border rounded-md text-sm ${cn.input}`}
                              placeholder={t('slang.provideExamplePhase')}
                            />
                          </div>
                          
                          <div>
                            <label className={`block text-xs font-medium ${cn.colors.text.secondary} mb-1`}>{t('slang.origin')}</label>
                            <input
                              type="text"
                              value={phase.origin || ''}
                              onChange={(e) => handlePhaseChange(index, 'origin', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-md text-sm ${cn.input}`}
                              placeholder={t('slang.originPlaceholder')}
                            />
                          </div>
                          
                          <div>
                            <label className={`block text-xs font-medium ${cn.colors.text.secondary} mb-1`}>{t('slang.story')}</label>
                            <textarea
                              value={phase.story || ''}
                              onChange={(e) => handlePhaseChange(index, 'story', e.target.value)}
                              rows={2}
                              className={`w-full px-3 py-2 border rounded-md text-sm ${cn.input}`}
                              placeholder={t('slang.storyPlaceholder')}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={handleAddPhase}
                    className={`w-full px-4 py-3 border-2 border-dashed rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>{t('slang.addNewPhase')}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => router.push(`/${locale}`)}
              className={`px-5 py-2.5 border rounded-lg ${cn.colors.text.primary} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-lg ${cn.primaryButton} disabled:opacity-50 transition-colors flex items-center gap-2`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t('slang.submitting')}
                </>
              ) : (
                t('slang.submitForReview')
              )}
            </button>
          </div>
        </form>
      </main>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  )
}
