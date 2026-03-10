'use client'
import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslation } from '@/hooks'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  targetType: 'comment' | 'slang'
  targetId: number | undefined
}

const REPORT_REASONS = [
  { value: 'spam', labelKey: 'comments.spamMisleading' },
  { value: 'inappropriate', labelKey: 'comments.inappropriateContent' },
  { value: 'harassment', labelKey: 'comments.harassmentHate' },
  { value: 'violence', labelKey: 'comments.violenceThreats' },
  { value: 'other', labelKey: 'slang.other' }
]

export default function ReportModal({ isOpen, onClose, targetType, targetId }: ReportModalProps) {
  const { data: session } = useSession()
  const { t } = useTranslation()
  
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

  const handleSubmit = async () => {
    if (!reason) {
      setToast(t('slang.selectReason'))
      return
    }
    
    if (!session?.user?.id) {
      setToast(t('auth.pleaseLoginReport'))
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          description,
          reporterId: session.user.id
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setToast(t('slang.reportSubmitted'))
        setTimeout(() => {
          onClose()
          setReason('')
          setDescription('')
          setToast('')
        }, 1500)
      } else {
        setToast(data.error || t('slang.reportFailed'))
      }
    } catch (error) {
      setToast(t('slang.reportFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setReason('')
    setDescription('')
    setToast('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">
          {targetType === 'comment' ? t('comments.reportComment') : t('slang.reportThisSlang')}
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          {targetType === 'comment' ? t('comments.reportDescription') : t('slang.reportDescription')}
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('slang.reason')} *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="">{t('slang.selectAReason')}</option>
              {REPORT_REASONS.map(r => (
                <option key={r.value} value={r.value}>{t(r.labelKey)}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('comments.additionalDetails')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('comments.provideMoreDetails')}
              rows={3}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
        </div>

        {toast && (
          <p className={`mt-3 text-sm ${toast.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
            {toast}
          </p>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleClose}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? t('common.submitting') : t('slang.submitReport')}
          </button>
        </div>
      </div>
    </div>
  )
}
