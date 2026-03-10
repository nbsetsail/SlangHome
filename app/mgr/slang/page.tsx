'use client'
import React, { useState, useEffect } from 'react'
import { useMgrSession } from '../layout'
import { useSearchParams } from 'next/navigation'
import AddSlangModal from '../../../components/AddSlangModal'
import Tooltip from '../../../components/Tooltip'
import LocaleSelector, { LOCALE_NAMES } from '../../../components/mgr/LocaleSelector'
import { formatDate, formatDateTime } from '@/lib/date-utils'
import { PageLoader, ContentLoader, ButtonLoader } from '@/components/ui'

type TabType = 'new-review' | 'edit-review' | 'normal'

export default function SlangManagement() {
  const session = useMgrSession()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabType>('new-review')
  
  const [slangList, setSlangList] = useState<any[]>([])
  const [editReviews, setEditReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [localeFilter, setLocaleFilter] = useState('')
  const [managedLocales, setManagedLocales] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [importError, setImportError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [currentSlang, setCurrentSlang] = useState<any>(null)
  const [currentReview, setCurrentReview] = useState<any>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewComment, setReviewComment] = useState('')

  useEffect(() => {
    const statusParam = searchParams.get('status')
    if (statusParam === 'pending') {
      setActiveTab('new-review')
    } else if (statusParam === 'approved' || statusParam === 'active') {
      setActiveTab('normal')
    }
  }, [searchParams])

  useEffect(() => {
    if (activeTab === 'new-review') {
      fetchSlangList('pending')
    } else if (activeTab === 'edit-review') {
      fetchEditReviews()
    } else {
      fetchSlangList('approved')
    }
  }, [activeTab, currentPage, pageSize, searchTerm, localeFilter, sortBy, sortOrder])

  const fetchSlangList = async (status: string) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(status && { status }),
        ...(searchTerm && { search: searchTerm }),
        ...(localeFilter && { locale: localeFilter }),
        sortBy,
        sortOrder
      })
      
      const response = await fetch(`/api/mgr/slang?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setSlangList(data.data.slang)
        setTotalItems(data.data.pagination.total)
        setTotalPages(data.data.pagination.totalPages)
        setManagedLocales(data.data.managedLocales || [])
      } else {
        setError(data.error || 'Failed to fetch slang list')
      }
    } catch (err) {
      setError('Failed to fetch slang list')
    } finally {
      setLoading(false)
    }
  }

  const fetchEditReviews = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        status: 'pending',
        ...(localeFilter && { locale: localeFilter })
      })
      
      const response = await fetch(`/api/mgr/edit-reviews?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setEditReviews(data.data.reviews)
        setTotalItems(data.data.pagination.total)
        setTotalPages(data.data.pagination.totalPages)
        setManagedLocales(data.data.managedLocales || [])
      } else {
        setError(data.error || 'Failed to fetch edit reviews')
      }
    } catch (err) {
      setError('Failed to fetch edit reviews')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setCurrentPage(1)
    setSearchTerm('')
    setError('')
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setCurrentSlang((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleOpenEditModal = (slang: any) => {
    setCurrentSlang({
      ...slang,
      categories: Array.isArray(slang.categories) ? slang.categories.join(', ') : (slang.categories || ''),
      tags: Array.isArray(slang.tags) ? slang.tags.join(', ') : (slang.tags || '')
    })
    setIsEditModalOpen(true)
  }

  const handleSaveSlang = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditLoading(true)
    setEditError('')
    
    try {
      const response = await fetch('/api/mgr/slang', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentSlang.id,
          phrase: currentSlang.phrase,
          explanation: currentSlang.explanation,
          example: currentSlang.example,
          origin: currentSlang.origin,
          locale: currentSlang.locale,
          categories: currentSlang.categories,
          tags: currentSlang.tags,
          status: currentSlang.status
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setIsEditModalOpen(false)
        if (activeTab === 'normal') {
          fetchSlangList('approved')
        } else {
          fetchSlangList('pending')
        }
      } else {
        setEditError(data.error || 'Failed to update slang')
      }
    } catch (err) {
      setEditError('Failed to update slang')
    } finally {
      setEditLoading(false)
    }
  }

  const handleOpenDeleteModal = (slang: any) => {
    setCurrentSlang(slang)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/mgr/slang?id=${currentSlang.id}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      
      if (data.success) {
        setIsDeleteModalOpen(false)
        if (activeTab === 'normal') {
          fetchSlangList('approved')
        } else {
          fetchSlangList('pending')
        }
      } else {
        setError(data.error || 'Failed to delete slang')
      }
    } catch (err) {
      setError('Failed to delete slang')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleApproveSlang = async (slang: any) => {
    try {
      const response = await fetch('/api/mgr/slang', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: slang.id,
          status: 'approved'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchSlangList('pending')
      } else {
        setError(data.error || 'Failed to approve slang')
      }
    } catch (err) {
      setError('Failed to approve slang')
    }
  }

  const handleRejectSlang = async (slang: any) => {
    try {
      const response = await fetch('/api/mgr/slang', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: slang.id,
          status: 'rejected'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchSlangList('pending')
      } else {
        setError(data.error || 'Failed to reject slang')
      }
    } catch (err) {
      setError('Failed to reject slang')
    }
  }

  const handleOpenReviewModal = (review: any) => {
    setCurrentReview(review)
    setReviewComment('')
    setIsReviewModalOpen(true)
  }

  const handleReviewEdit = async (action: 'approve' | 'reject') => {
    if (!currentReview) return
    
    setReviewLoading(true)
    try {
      const response = await fetch('/api/mgr/edit-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId: currentReview.version_id,
          action,
          reviewComment
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setIsReviewModalOpen(false)
        fetchEditReviews()
      } else {
        setError(data.error || 'Failed to process review')
      }
    } catch (err) {
      setError('Failed to process review')
    } finally {
      setReviewLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        setImportError('Please select a JSON file')
        return
      }
      setSelectedFile(file)
      setImportError('')
    }
  }

  const getSampleJson = () => {
    const sampleData = [
      {
        phrase: "Example Slang",
        explanation: "This is an example explanation",
        example: "This is an example usage",
        origin: "This is the origin",
        categories: ["category1", "category2"],
        tags: ["tag1", "tag2"],
        locale: "en",
        status: "approved"
      }
    ]
    
    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'slang-sample.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportSlang = async () => {
    if (!selectedFile) return
    
    setImportLoading(true)
    setImportError('')
    setImportResult(null)
    
    try {
      const text = await selectedFile.text()
      const data = JSON.parse(text)
      
      const response = await fetch('/api/mgr/slang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import', data })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setImportResult(result.data)
        if (activeTab === 'normal') {
          fetchSlangList('approved')
        }
      } else {
        setImportError(result.error || 'Import failed')
      }
    } catch (err) {
      setImportError('Invalid JSON file')
    } finally {
      setImportLoading(false)
    }
  }

  const resetImportForm = () => {
    setIsImportModalOpen(false)
    setSelectedFile(null)
    setImportResult(null)
    setImportError('')
  }

  const handleSubmitAddSlang = async (formData: any) => {
    setAddLoading(true)
    setAddError('')
    setAddSuccess('')
    
    try {
      const response = await fetch('/api/mgr/slang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...formData })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setAddSuccess('Slang created successfully!')
        setTimeout(() => {
          setIsAddModalOpen(false)
          setAddSuccess('')
          if (activeTab === 'normal') {
            fetchSlangList('approved')
          } else {
            fetchSlangList('pending')
          }
        }, 1500)
      } else {
        setAddError(data.error || 'Failed to create slang')
      }
    } catch (err) {
      setAddError('Failed to create slang')
    } finally {
      setAddLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      active: 'bg-green-100 text-green-800'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }

  const getEditTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      create: 'bg-blue-100 text-blue-800',
      update: 'bg-purple-100 text-purple-800',
      delete: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[type] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </span>
    )
  }

  const renderPagination = () => (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-gray-500">
        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} items
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border border-gray-300 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          First
        </button>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border border-gray-300 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="px-3 py-1">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border border-gray-300 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          Next
        </button>
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border border-gray-300 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          Last
        </button>
      </div>
      <div className="flex justify-end mt-4">
        <select
          value={pageSize}
          onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
          className="px-3 py-1 border border-gray-300 rounded-md"
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>
    </div>
  )

  if (!session) return <PageLoader />

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Slang Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Import
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add New
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange('new-review')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'new-review'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              New Slang Review
              <span className="ml-2 bg-yellow-100 text-yellow-800 py-0.5 px-2.5 rounded-full text-xs font-medium">
                Pending
              </span>
            </button>
            <button
              onClick={() => handleTabChange('edit-review')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'edit-review'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Edit Review
              <span className="ml-2 bg-purple-100 text-purple-800 py-0.5 px-2.5 rounded-full text-xs font-medium">
                Edits
              </span>
            </button>
            <button
              onClick={() => handleTabChange('normal')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'normal'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Normal Management
              <span className="ml-2 bg-green-100 text-green-800 py-0.5 px-2.5 rounded-full text-xs font-medium">
                Active
              </span>
            </button>
          </nav>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-4">
        {activeTab !== 'edit-review' && (
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by phrase or explanation..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
        <div>
          <select
            value={localeFilter}
            onChange={(e) => {
              setLocaleFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Locales</option>
            {managedLocales.map(locale => (
              <option key={locale} value={locale}>
                {LOCALE_NAMES[locale] || locale}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <ContentLoader />
      ) : (
        <>
          {activeTab === 'new-review' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phrase</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Explanation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Locale</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {slangList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No pending slang to review
                      </td>
                    </tr>
                  ) : (
                    slangList.map((slang) => (
                      <tr key={slang.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{slang.phrase}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-xs truncate">{slang.explanation}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {LOCALE_NAMES[slang.locale] || slang.locale}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(slang.created_at).full}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApproveSlang(slang)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectSlang(slang)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(slang)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'edit-review' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Phrase</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Phrase</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edit Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Editor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {editReviews.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No pending edit reviews
                      </td>
                    </tr>
                  ) : (
                    editReviews.map((review) => (
                      <tr key={review.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{review.current_phrase}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{review.phrase}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getEditTypeBadge(review.edit_type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {review.editor_name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(review.created_at).full}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenReviewModal(review)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Review
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'normal' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('phrase')}
                    >
                      Phrase {sortBy === 'phrase' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Explanation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Locale</th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('heat')}
                    >
                      Heat {sortBy === 'heat' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('created_at')}
                    >
                      Created {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {slangList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No slang found
                      </td>
                    </tr>
                  ) : (
                    slangList.map((slang) => (
                      <tr key={slang.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{slang.phrase}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-xs truncate">{slang.explanation}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {LOCALE_NAMES[slang.locale] || slang.locale}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {slang.heat || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(slang.created_at).full}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(slang)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(slang)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {renderPagination()}
        </>
      )}

      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Slang</h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Download sample JSON format:
                </p>
                <button 
                  onClick={getSampleJson}
                  className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                >
                  Download Sample JSON
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select JSON file
                </label>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {selectedFile && (
                  <p className="text-sm text-green-600 mt-2">
                    Selected: {selectedFile.name}
                  </p>
                )}
                {importError && (
                  <p className="text-sm text-red-600 mt-2">
                    {importError}
                  </p>
                )}
              </div>
              
              {importResult && (
                <div className="mb-4 p-3 bg-gray-100 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">Import Result:</h4>
                  <p className="text-sm">Total processed: {importResult.totalProcessed}</p>
                  <p className="text-sm text-green-600">Imported: {importResult.importedCount}</p>
                  <p className="text-sm text-red-600">Failed: {importResult.failedCount}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={resetImportForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={importLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportSlang}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  disabled={importLoading || !selectedFile}
                >
                  <ButtonLoader loading={importLoading} loaderText="Importing...">
                    Import
                  </ButtonLoader>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && currentSlang && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Edit Slang</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100"
                  disabled={editLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSaveSlang}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phrase</label>
                  <input
                    type="text"
                    name="phrase"
                    value={currentSlang.phrase}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Explanation</label>
                  <textarea
                    name="explanation"
                    value={currentSlang.explanation}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Example</label>
                  <textarea
                    name="example"
                    value={currentSlang.example || ''}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Origin</label>
                  <textarea
                    name="origin"
                    value={currentSlang.origin || ''}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Locale</label>
                  <select
                    name="locale"
                    value={currentSlang.locale || 'en'}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(LOCALE_NAMES).map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
                  <input
                    type="text"
                    name="categories"
                    value={currentSlang.categories || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Comma-separated categories"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <input
                    type="text"
                    name="tags"
                    value={currentSlang.tags || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Comma-separated tags"
                  />
                </div>
                
                {activeTab === 'normal' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      name="status"
                      value={currentSlang.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                )}
                
                {editError && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                    {editError}
                  </div>
                )}
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={editLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    disabled={editLoading}
                  >
                    <ButtonLoader loading={editLoading} loaderText="Saving...">
                      Save Changes
                    </ButtonLoader>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && currentSlang && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Delete Slang</h3>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100"
                  disabled={deleteLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete the slang "{currentSlang.phrase}"?
                This action cannot be undone.
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  disabled={deleteLoading}
                >
                  <ButtonLoader loading={deleteLoading} loaderText="Deleting...">
                    Delete
                  </ButtonLoader>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isReviewModalOpen && currentReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Review Edit</h3>
                <button
                  onClick={() => setIsReviewModalOpen(false)}
                  className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100"
                  disabled={reviewLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Original</h4>
                  <p className="text-lg font-semibold text-gray-900">{currentReview.current_phrase}</p>
                  <p className="text-sm text-gray-600 mt-2">{currentReview.current_explanation}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-500 mb-2">Proposed Change</h4>
                  <p className="text-lg font-semibold text-gray-900">{currentReview.phrase}</p>
                  <p className="text-sm text-gray-600 mt-2">{currentReview.explanation}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Edit Summary</h4>
                <p className="text-sm text-gray-600">{currentReview.edit_summary || 'No summary provided'}</p>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Editor</h4>
                <p className="text-sm text-gray-600">{currentReview.editor_name || 'Unknown'}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Review Comment (optional)</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a comment about this review..."
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={reviewLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReviewEdit('reject')}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  disabled={reviewLoading}
                >
                  <ButtonLoader loading={reviewLoading} loaderText="Rejecting...">
                    Reject
                  </ButtonLoader>
                </button>
                <button
                  onClick={() => handleReviewEdit('approve')}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                  disabled={reviewLoading}
                >
                  <ButtonLoader loading={reviewLoading} loaderText="Approving...">
                    Approve
                  </ButtonLoader>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AddSlangModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleSubmitAddSlang}
        loading={addLoading}
        session={session}
      />
    </div>
  )
}
