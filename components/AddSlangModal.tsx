'use client'
import React, { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks'

interface AddSlangModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  loading: boolean
  session?: any
}

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

export default function AddSlangModal({ isOpen, onClose, onSubmit, loading, session }: AddSlangModalProps) {
  const { cn } = useTheme()
  const { t } = useTranslation()
  const [formData, setFormData] = useState<FormData>({
    phrase: '',
    explanation: '',
    example: '',
    origin: '',
    categories: '',
    tags: '',
    evolution: []
  })
  const [evolutionExpanded, setEvolutionExpanded] = useState(false)
  const [collapsedPhases, setCollapsedPhases] = useState<boolean[]>([])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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
      return
    }

    await onSubmit({
      ...formData,
      user_id: session?.user?.id || null,
      status: 'pending'
    })
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">{t('slang.addSlang')}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('slang.phrase')}
              </label>
              <input
                type="text"
                name="phrase"
                value={formData.phrase}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-md ${cn.input}`}
                placeholder={t('slang.enterPhrase')}
                onInput={(e: React.FormEvent<HTMLInputElement>) => {
                  (e.target as HTMLInputElement).classList.remove('border-red-500');
                }}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('slang.explanation')}
              </label>
              <textarea
                name="explanation"
                value={formData.explanation}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-4 py-2 border rounded-md ${cn.input}`}
                placeholder={t('slang.explainMeaning')}
                onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                  (e.target as HTMLTextAreaElement).classList.remove('border-red-500');
                }}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('slang.example')}
              </label>
              <textarea
                name="example"
                value={formData.example}
                onChange={handleInputChange}
                rows={2}
                className={`w-full px-4 py-2 border rounded-md ${cn.input}`}
                placeholder={t('slang.provideExample')}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('slang.origin')}
              </label>
              <textarea
                name="origin"
                value={formData.origin}
                onChange={handleInputChange}
                rows={2}
                className={`w-full px-4 py-2 border rounded-md ${cn.input}`}
                placeholder={t('slang.describeOrigin')}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('slang.categories')}
              </label>
              <input
                type="text"
                name="categories"
                value={formData.categories}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-md ${cn.input}`}
                placeholder={t('slang.commaCategories')}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('slang.tags')}
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-md ${cn.input}`}
                placeholder={t('slang.commaTags')}
              />
            </div>
            
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setEvolutionExpanded(!evolutionExpanded)}
                className="w-full flex justify-between items-center px-4 py-2 border border-gray-300 rounded-md text-left hover:bg-gray-50"
              >
                <span className="font-medium">{t('slang.evolutionHistory')}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-500 transition-transform ${evolutionExpanded ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {evolutionExpanded && (
                <div className="mt-2 p-4 border border-gray-200 rounded-md bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">{t('slang.addEvolutionPhases')}</h4>
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
                  
                  {(formData.evolution || []).map((phase, index) => (
                    <div 
                      key={phase.id} 
                      className="mb-4 border border-gray-200 rounded-md bg-white"
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
                      <div className="flex justify-between items-start p-3 border-b border-gray-200 cursor-move">
                        <div className="flex items-start gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                          <div className="flex flex-col">
                            <h5 className="font-medium">{t('slang.phase')} {index + 1}</h5>
                            {collapsedPhases[index] && (phase.period || phase.phase) && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {phase.period && phase.phase ? `${phase.period} - ${phase.phase}` : phase.period || phase.phase}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTogglePhase(index)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${collapsedPhases[index] ? '' : 'transform rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePhase(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      {!collapsedPhases[index] && (
                        <div className="p-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">{t('slang.period')}</label>
                              <input
                                type="text"
                                value={phase.period || ''}
                                onChange={(e) => handlePhaseChange(index, 'period', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md ${cn.input}`}
                                placeholder={t('slang.periodPlaceholder')}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">{t('slang.phase')}</label>
                              <input
                                type="text"
                                value={phase.phase || ''}
                                onChange={(e) => handlePhaseChange(index, 'phase', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md ${cn.input}`}
                                placeholder={t('slang.phasePlaceholder')}
                              />
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">{t('slang.explanation')}</label>
                            <textarea
                              value={phase.explanation || ''}
                              onChange={(e) => handlePhaseChange(index, 'explanation', e.target.value)}
                              rows={2}
                              className={`w-full px-3 py-2 border rounded-md ${cn.input}`}
                              placeholder={t('slang.explainPhase')}
                            />
                          </div>
                          
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">{t('slang.example')}</label>
                            <textarea
                              value={phase.example || ''}
                              onChange={(e) => handlePhaseChange(index, 'example', e.target.value)}
                              rows={2}
                              className={`w-full px-3 py-2 border rounded-md ${cn.input}`}
                              placeholder={t('slang.provideExamplePhase')}
                            />
                          </div>
                          
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">{t('slang.origin')}</label>
                            <input
                              type="text"
                              value={phase.origin || ''}
                              onChange={(e) => handlePhaseChange(index, 'origin', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-md ${cn.input}`}
                              placeholder={t('slang.originPlaceholder')}
                            />
                          </div>
                          
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">{t('slang.story')}</label>
                            <textarea
                              value={phase.story || ''}
                              onChange={(e) => handlePhaseChange(index, 'story', e.target.value)}
                              rows={2}
                              className={`w-full px-3 py-2 border rounded-md ${cn.input}`}
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
                    className="w-full mt-2 px-4 py-2 border border-dashed border-gray-400 rounded-md text-gray-600 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>{t('slang.addNewPhase')}</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className={`px-4 py-2 ${cn.primaryButton} rounded-md`}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('slang.submitting')}
                  </div>
                ) : (
                  t('slang.submitForReview')
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
