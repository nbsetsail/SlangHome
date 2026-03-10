'use client'

import React, { useState, useEffect } from 'react'
import { useMgrSession } from '../layout'
import { LOCALE_NAMES } from '@/components/mgr/LocaleSelector'
import { formatDate } from '@/lib/date-utils'
import { ContentLoader, ButtonLoader } from '@/components/ui'

interface Moderator {
  id: number
  name: string
  username?: string
  email: string
  role: string
  managed_locales: string[]
  created_at: string
  slang_count?: number
  comment_count?: number
}

interface Application {
  id: number
  user_id: number
  user_name: string
  username?: string
  user_email: string
  email?: string
  status: string
  reason: string
  created_at: string
  requested_locales?: string[]
  reviewer_name?: string
  review_note?: string
  reviewed_at?: string
}

const TABS = [
  { id: 'moderators', label: 'Moderators' },
  { id: 'applications', label: 'Applications' }
]

export default function ModeratorManagement() {
  const session = useMgrSession()
  const [activeTab, setActiveTab] = useState('moderators')
  const [moderators, setModerators] = useState<Moderator[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [modPage, setModPage] = useState(1)
  const [modTotalPages, setModTotalPages] = useState(1)
  const [appPage, setAppPage] = useState(1)
  const [appTotalPages, setAppTotalPages] = useState(1)
  const [appStatusFilter, setAppStatusFilter] = useState('')
  
  const [selectedMod, setSelectedMod] = useState<Moderator | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editLocales, setEditLocales] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewNote, setReviewNote] = useState('')
  const [reviewing, setReviewing] = useState(false)

  useEffect(() => {
    if (activeTab === 'moderators') {
      fetchModerators()
    } else {
      fetchApplications()
    }
  }, [activeTab, modPage, appPage, appStatusFilter])

  const fetchModerators = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ action: 'moderators', page: String(modPage), limit: '10' })
      const response = await fetch(`/mgr/api/moderators?${params}`)
      const data = await response.json()
      if (data.success) {
        setModerators(data.data.moderators)
        setModTotalPages(data.data.pagination.totalPages)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to fetch moderators')
    } finally {
      setLoading(false)
    }
  }

  const fetchApplications = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ action: 'applications', page: String(appPage), limit: '10' })
      if (appStatusFilter) params.append('status', appStatusFilter)
      const response = await fetch(`/mgr/api/moderators?${params}`)
      const data = await response.json()
      if (data.success) {
        setApplications(data.data.applications)
        setAppTotalPages(data.data.pagination.totalPages)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to fetch applications')
    } finally {
      setLoading(false)
    }
  }

  const handleEditLocales = (moderator: Moderator) => {
    setSelectedMod(moderator)
    setEditLocales(moderator.managed_locales || [])
    setShowEditModal(true)
  }

  const handleToggleLocale = (locale: string) => {
    setEditLocales(prev => 
      prev.includes(locale) 
        ? prev.filter(l => l !== locale)
        : [...prev, locale]
    )
  }

  const handleSaveLocales = async () => {
    if (!selectedMod) return
    setSaving(true)
    try {
      const response = await fetch('/mgr/api/moderators', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateLocales',
          userId: selectedMod.id,
          managedLocales: editLocales
        })
      })
      const data = await response.json()
      if (data.success) {
        setShowEditModal(false)
        fetchModerators()
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert('Failed to update locales')
    } finally {
      setSaving(false)
    }
  }

  const handleRevoke = async (moderator: Moderator) => {
    if (!confirm(`Are you sure you want to revoke moderator role from ${moderator.name}?`)) return
    
    try {
      const response = await fetch('/mgr/api/moderators', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke',
          userId: moderator.id
        })
      })
      const data = await response.json()
      if (data.success) {
        fetchModerators()
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert('Failed to revoke moderator')
    }
  }

  const handleReviewApplication = (application: Application) => {
    setSelectedApp(application)
    setReviewNote('')
    setShowReviewModal(true)
  }

  const handleApprove = async () => {
    if (!selectedApp) return
    setReviewing(true)
    try {
      const response = await fetch('/mgr/api/moderators', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          applicationId: selectedApp.id
        })
      })
      const data = await response.json()
      if (data.success) {
        setShowReviewModal(false)
        fetchApplications()
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert('Failed to approve application')
    } finally {
      setReviewing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedApp) return
    setReviewing(true)
    try {
      const response = await fetch('/mgr/api/moderators', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          applicationId: selectedApp.id,
          reviewNote
        })
      })
      const data = await response.json()
      if (data.success) {
        setShowReviewModal(false)
        fetchApplications()
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert('Failed to reject application')
    } finally {
      setReviewing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (session?.user?.role !== 'admin') {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-md">
        Access denied. Admin only.
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Moderator Management</h2>

      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">{error}</div>
      )}

      {loading ? (
        <ContentLoader text="Loading..." />
      ) : activeTab === 'moderators' ? (
        <div>
          {moderators.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No moderators found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Managed Locales</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {moderators.map(mod => (
                    <tr key={mod.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{mod.username || mod.name}</div>
                        <div className="text-sm text-gray-500">{mod.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(mod.managed_locales || []).map(locale => (
                            <span key={locale} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {LOCALE_NAMES[locale] || locale}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>Slang: {mod.slang_count || 0}</div>
                        <div>Comments: {mod.comment_count || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(mod.created_at).date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleEditLocales(mod)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit Locales
                        </button>
                        <button
                          onClick={() => handleRevoke(mod)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {modTotalPages > 1 && (
            <div className="flex justify-center mt-4 gap-2">
              <button
                onClick={() => setModPage(p => Math.max(1, p - 1))}
                disabled={modPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1">Page {modPage} of {modTotalPages}</span>
              <button
                onClick={() => setModPage(p => Math.min(modTotalPages, p + 1))}
                disabled={modPage === modTotalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <select
              value={appStatusFilter}
              onChange={(e) => { setAppStatusFilter(e.target.value); setAppPage(1) }}
              className="px-4 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {applications.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No applications found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested Locales</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map(app => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{app.username || app.user_name}</div>
                        <div className="text-sm text-gray-500">{app.email || app.user_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(app.requested_locales || []).map(locale => (
                            <span key={locale} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {LOCALE_NAMES[locale] || locale}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {app.reason || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(app.created_at).date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {app.status === 'pending' ? (
                          <button
                            onClick={() => handleReviewApplication(app)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Review
                          </button>
                        ) : (
                          <span className="text-gray-400">
                            by {app.reviewer_name || 'Unknown'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {appTotalPages > 1 && (
            <div className="flex justify-center mt-4 gap-2">
              <button
                onClick={() => setAppPage(p => Math.max(1, p - 1))}
                disabled={appPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1">Page {appPage} of {appTotalPages}</span>
              <button
                onClick={() => setAppPage(p => Math.min(appTotalPages, p + 1))}
                disabled={appPage === appTotalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {showEditModal && selectedMod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Managed Locales</h3>
            <p className="text-sm text-gray-600 mb-4">
              User: {selectedMod.username}
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto mb-4">
              {Object.entries(LOCALE_NAMES).map(([code, name]) => (
                <label key={code} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editLocales.includes(code)}
                    onChange={() => handleToggleLocale(code)}
                    className="rounded"
                  />
                  <span className="text-sm">{name}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLocales}
                className="px-4 py-2 bg-blue-500 text-white rounded-md"
                disabled={saving}
              >
                <ButtonLoader loading={saving} loaderText="Saving...">Save</ButtonLoader>
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Review Application</h3>
            <div className="mb-4">
              <p className="text-sm"><strong>Applicant:</strong> {selectedApp.username}</p>
              <p className="text-sm"><strong>Email:</strong> {selectedApp.email}</p>
              <p className="text-sm mt-2"><strong>Requested Locales:</strong></p>
              <div className="flex flex-wrap gap-1 mt-1">
                {(selectedApp.requested_locales || []).map(locale => (
                  <span key={locale} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {LOCALE_NAMES[locale] || locale}
                  </span>
                ))}
              </div>
              {selectedApp.reason && (
                <div className="mt-2">
                  <p className="text-sm"><strong>Reason:</strong></p>
                  <p className="text-sm text-gray-600 mt-1">{selectedApp.reason}</p>
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Review Note (optional)</label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Add a note for rejection..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md"
                disabled={reviewing}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-500 text-white rounded-md"
                disabled={reviewing}
              >
                <ButtonLoader loading={reviewing} loaderText="Rejecting...">Reject</ButtonLoader>
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-500 text-white rounded-md"
                disabled={reviewing}
              >
                <ButtonLoader loading={reviewing} loaderText="Approving...">Approve</ButtonLoader>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
