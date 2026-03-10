'use client'
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import LoginModal from '@/components/LoginModal'
import { useTheme } from '@/contexts/ThemeContext'
import { useTranslation } from '@/hooks/useTranslation'
import { formatDateTime } from '@/lib/date-utils'

interface Version {
  id: string
  slang_id: string
  version_number: number
  is_current: boolean
  editor_id: string | null
  editor_name: string | null
  edit_summary: string | null
  edit_type: string
  phrase: string
  explanation: string
  example: string | null
  origin: string | null
  categories: string | null
  tags: string | null
  created_at: string
}

interface VersionDiff {
  field: string
  oldValue: string | null
  newValue: string | null
}

export default function SlangHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const locale = params?.locale as string || 'en'
  const { data: session } = useSession()
  const { cn } = useTheme()
  const { t } = useTranslation()

  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [diffData, setDiffData] = useState<{ v1: Version; v2: Version; diff: VersionDiff[] } | null>(null)
  const [showDiffModal, setShowDiffModal] = useState(false)
  const [slangPhrase, setSlangPhrase] = useState('')

  useEffect(() => {
    fetchVersions()
  }, [id])

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  const fetchVersions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/slang/${id}/versions?limit=50`)
      const data = await response.json()
      
      if (data.error) {
        setToastMessage(data.error)
        setShowToast(true)
      } else {
        setVersions(data.versions)
        if (data.versions.length > 0) {
          setSlangPhrase(data.versions[0].phrase)
        }
      }
    } catch (error) {
      console.error('Error fetching versions:', error)
      setToastMessage(t('errors.generic'))
      setShowToast(true)
    } finally {
      setLoading(false)
    }
  }

  const handleVersionSelect = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(v => v !== versionId)
      }
      if (prev.length >= 2) {
        return [prev[1], versionId]
      }
      return [...prev, versionId]
    })
  }

  const handleCompare = async () => {
    if (selectedVersions.length !== 2) {
      setToastMessage(t('history.selectTwoVersions'))
      setShowToast(true)
      return
    }

    try {
      const response = await fetch(
        `/api/slang/${id}/versions?versionId=${selectedVersions[0]}&compareWith=${selectedVersions[1]}`
      )
      const data = await response.json()
      
      if (data.error) {
        setToastMessage(data.error)
        setShowToast(true)
      } else {
        setDiffData(data)
        setShowDiffModal(true)
      }
    } catch (error) {
      console.error('Error comparing versions:', error)
      setToastMessage(t('errors.generic'))
      setShowToast(true)
    }
  }

  const handleRollback = async (versionId: string, versionNumber: number) => {
    if (!session?.user?.id) {
      setShowLoginModal(true)
      return
    }

    if (!confirm(t('history.rollbackConfirm', { version: versionNumber }))) {
      return
    }

    try {
      const response = await fetch(`/api/slang/${id}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId,
          userId: session.user.id,
          editSummary: `Rolled back to version ${versionNumber}`
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setToastMessage(t('history.rollbackSuccess'))
        setShowToast(true)
        fetchVersions()
      } else {
        setToastMessage(data.error || t('errors.generic'))
        setShowToast(true)
      }
    } catch (error) {
      console.error('Error rolling back:', error)
      setToastMessage(t('errors.generic'))
      setShowToast(true)
    }
  }

  const formatDate = (dateString: string) => {
    return formatDateTime(dateString, locale)
  }

  const getEditTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      create: 'bg-green-100 text-green-800',
      edit: 'bg-blue-100 text-blue-800',
      rollback: 'bg-yellow-100 text-yellow-800',
      restore: 'bg-purple-100 text-purple-800'
    }
    return styles[type] || 'bg-gray-100 text-gray-800'
  }

  const fieldNames: Record<string, string> = {
    phrase: t('slang.phrase'),
    explanation: t('slang.explanation'),
    example: t('slang.example'),
    origin: t('slang.origin'),
    categories: t('slang.categories'),
    tags: t('slang.tags')
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
          <div>
            <h1 className={`text-2xl font-bold ${cn.title}`}>{t('history.title')}</h1>
            {slangPhrase && (
              <p className={`${cn.colors.text.muted} mt-1`}>{slangPhrase}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleCompare}
              disabled={selectedVersions.length !== 2}
              className={`${cn.secondaryButton} px-4 py-2 rounded-md text-sm ${selectedVersions.length !== 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {t('history.compare')} ({selectedVersions.length}/2)
            </button>
            <button
              onClick={() => router.push(`/${locale}/slang/${id}/maintain`)}
              className={`${cn.primaryButton} px-4 py-2 rounded-md text-sm`}
            >
              {t('maintain.title')}
            </button>
          </div>
        </div>

        {versions.length === 0 ? (
          <div className={`${cn.colors.bg.card} rounded-lg shadow-md p-6 text-center`}>
            <p className={cn.colors.text.muted}>{t('history.noVersions')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {versions.map((version) => (
              <div
                key={version.id}
                className={`${cn.colors.bg.card} rounded-lg shadow-md p-4 ${
                  selectedVersions.includes(version.id) ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedVersions.includes(version.id)}
                      onChange={() => handleVersionSelect(version.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-semibold ${cn.title}`}>
                          v{version.version_number}
                        </span>
                        {version.is_current && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                            {t('history.current')}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getEditTypeBadge(version.edit_type)}`}>
                          {t(`history.editTypes.${version.edit_type}`)}
                        </span>
                      </div>
                      <p className={`text-sm ${cn.colors.text.muted} mt-1`}>
                        {version.edit_summary || t('history.noSummary')}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>
                          {version.editor_name || t('history.anonymous')}
                        </span>
                        <span>{formatDate(version.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {!version.is_current && (
                    <button
                      onClick={() => handleRollback(version.id, version.version_number)}
                      className={`${cn.secondaryButton} px-3 py-1 rounded text-xs`}
                    >
                      {t('history.rollback')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showDiffModal && diffData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${cn.colors.bg.card} rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold ${cn.title}`}>
                  {t('history.comparison')}: v{diffData.v1.version_number} vs v{diffData.v2.version_number}
                </h2>
                <button
                  onClick={() => setShowDiffModal(false)}
                  className={`p-1 rounded-full ${cn.colors.text.muted} hover:bg-gray-100`}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {diffData.diff.length === 0 ? (
                <p className={cn.colors.text.muted}>{t('history.noChanges')}</p>
              ) : (
                <div className="space-y-4">
                  {diffData.diff.map((change, index) => (
                    <div key={index} className={`p-4 rounded-md ${cn.colors.bg.light}`}>
                      <h3 className={`font-semibold mb-2 ${cn.title}`}>
                        {fieldNames[change.field] || change.field}
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className={`text-xs font-medium mb-1 ${cn.colors.text.muted}`}>
                            v{diffData.v1.version_number}
                          </p>
                          <p className={`text-sm p-2 rounded bg-red-50 ${cn.colors.text.muted}`}>
                            {change.oldValue || <span className="italic text-gray-400">{t('history.empty')}</span>}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs font-medium mb-1 ${cn.colors.text.muted}`}>
                            v{diffData.v2.version_number}
                          </p>
                          <p className={`text-sm p-2 rounded bg-green-50 ${cn.colors.text.muted}`}>
                            {change.newValue || <span className="italic text-gray-400">{t('history.empty')}</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={() => window.location.reload()}
      />

      {showToast && (
        <div className={`fixed bottom-4 right-4 ${cn.successMessage} px-4 py-2 rounded-md shadow-lg z-50`}>
          {toastMessage}
        </div>
      )}
    </div>
  )
}
