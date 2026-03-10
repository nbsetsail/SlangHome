'use client'
import React, { useState, useEffect } from 'react'
import { useMgrSession } from '../layout'
import { formatDate } from '@/lib/date-utils'
import { ContentLoader } from '@/components/ui'

// Report reason labels
const reasonLabels: Record<string, string> = {
  spam: 'Spam',
  inappropriate: 'Inappropriate',
  misinformation: 'Misinformation',
  harassment: 'Harassment',
  violence: 'Violence',
  other: 'Other'
}

// Status labels
const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  reviewed: { label: 'Reviewed', color: 'bg-blue-100 text-blue-800' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
  dismissed: { label: 'Dismissed', color: 'bg-gray-100 text-gray-800' }
}

export default function ReportsManagement() {
  const session = useMgrSession()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [targetTypeFilter, setTargetTypeFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  // Fetch report list
  const fetchReports = async () => {
    setLoading(true)
    setError('')
    
    try {
      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('limit', '20')
      if (statusFilter) params.append('status', statusFilter)
      if (targetTypeFilter) params.append('targetType', targetTypeFilter)
      
      const response = await fetch(`/mgr/api/reports?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setReports(data.data.reports)
        setTotalItems(data.data.pagination.totalItems)
      } else {
        throw new Error(data.error || 'Failed to fetch reports')
      }
    } catch (err) {
      setError('Failed to load reports')
      console.error('Error fetching reports:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [currentPage, statusFilter, targetTypeFilter])

  // Process report
  const handleProcessReport = async (resolution: string) => {
    if (!selectedReport) return
    
    setActionLoading(true)
    setActionError('')
    setActionSuccess('')
    try {
      const response = await fetch('/mgr/api/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: selectedReport.id,
          status: resolution === 'dismissed' ? 'dismissed' : 'resolved',
          reviewerId: session?.user?.id,
          resolution
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setActionSuccess('Report processed successfully')
        setTimeout(() => {
          setActionModalOpen(false)
          setSelectedReport(null)
          setActionSuccess('')
          fetchReports()
        }, 1500)
      } else {
        throw new Error(data.error || 'Failed to process report')
      }
    } catch (err) {
      setActionError('Failed to process report')
      console.error('Error processing report:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const totalPages = Math.ceil(totalItems / 20)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reports Management</h1>
        <div className="text-sm text-gray-600">
          Total: {totalItems} reports
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
          className="px-4 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        
        <select
          value={targetTypeFilter}
          onChange={(e) => { setTargetTypeFilter(e.target.value); setCurrentPage(1) }}
          className="px-4 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Types</option>
          <option value="slang">Slang</option>
          <option value="comment">Comment</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <ContentLoader text="Loading reports..." minHeight="py-12" />
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No reports found
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reporter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                      {report.target_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {reasonLabels[report.reason] || report.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {report.reporter_username || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${statusLabels[report.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                      {statusLabels[report.status]?.label || report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(report.created_at).date}</div>
                    <div className="text-xs text-gray-500">{formatDate(report.created_at).time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {report.status === 'pending' && (
                      <button
                        onClick={() => { setSelectedReport(report); setActionModalOpen(true) }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Action Modal */}
      {actionModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Review Report #{selectedReport.id}</h3>
            
            {actionSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{actionSuccess}</span>
              </div>
            )}
            
            {actionError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{actionError}</span>
              </div>
            )}
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">Type: {selectedReport.target_type}</p>
              <p className="text-sm text-gray-600">Target ID: <a href={`/slang/${selectedReport.target_id}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 underline">{selectedReport.target_id}</a></p>
              <p className="text-sm text-gray-600">Reason: {reasonLabels[selectedReport.reason] || selectedReport.reason}</p>
              {selectedReport.description && (
                <p className="text-sm text-gray-600 mt-2">Description: {selectedReport.description}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Choose action:</p>
              <button
                onClick={() => handleProcessReport('content_removed')}
                disabled={actionLoading}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Remove Content'}
              </button>
              <button
                onClick={() => handleProcessReport('warning_issued')}
                disabled={actionLoading}
                className="w-full px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Issue Warning'}
              </button>
              <button
                onClick={() => handleProcessReport('dismissed')}
                disabled={actionLoading}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Dismiss Report'}
              </button>
            </div>
            
            <button
              onClick={() => { setActionModalOpen(false); setSelectedReport(null); setActionError(''); setActionSuccess('') }}
              className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-md"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
