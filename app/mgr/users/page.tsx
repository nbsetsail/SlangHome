'use client'
import React, { useState, useEffect } from 'react'
import { useMgrSession } from '../layout'
import { formatDate } from '@/lib/date-utils'
import { ContentLoader, ButtonLoader } from '@/components/ui'

export default function UserManagement() {
  const session = useMgrSession()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    role: '',
    status: ''
  })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Fetch users data from API
  const fetchUsers = async () => {
    // Only prevent duplicate requests if we're not on the first load
    if (loading && users.length > 0) return // Prevent duplicate requests
    
    setLoading(true)
    setError('')
    
    try {
      // Build query parameters
      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('limit', pageSize.toString())
      if (searchTerm) params.append('search', searchTerm)
      if (roleFilter) params.append('role', roleFilter)
      if (statusFilter) params.append('status', statusFilter)
      
      const response = await fetch(`/mgr/api/users?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      
      const data = await response.json()
      if (data.success) {
        setUsers(data.data.users)
        setTotalItems(data.data.pagination.totalItems)
        setTotalPages(data.data.pagination.totalPages)
      } else {
        throw new Error(data.error || 'Failed to fetch users')
      }
    } catch (err) {
      setError('Failed to load users')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch users when filters or pagination changes
  useEffect(() => {
    fetchUsers()
  }, [currentPage, pageSize, searchTerm, roleFilter, statusFilter])

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('')
    setRoleFilter('')
    setStatusFilter('')
    setCurrentPage(1)
  }

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-600 bg-red-100'
      case 'moderator': return 'text-blue-600 bg-blue-100'
      case 'user': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'inactive': return 'text-gray-600 bg-gray-100'
      case 'banned': return 'text-red-600 bg-red-100'
      case 'frozen': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Get status display name
  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'active': return 'Active'
      case 'inactive': return 'Inactive'
      case 'banned': return 'Banned'
      case 'frozen': return 'Frozen'
      default: return status
    }
  }

  // State for ban/freeze modals
  const [isBanModalOpen, setIsBanModalOpen] = useState(false)
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [banForm, setBanForm] = useState({
    duration: '1d',
    reason: ''
  })
  const [freezeForm, setFreezeForm] = useState({
    duration: '1d',
    reason: ''
  })
  const [modalLoading, setModalLoading] = useState(false)

  // Open ban modal
  const openBanModal = (userId: number) => {
    setSelectedUserId(userId)
    setBanForm({ duration: '1d', reason: '' })
    setIsBanModalOpen(true)
  }

  // Close ban modal
  const closeBanModal = () => {
    setIsBanModalOpen(false)
    setSelectedUserId(null)
    setBanForm({ duration: '1d', reason: '' })
  }

  // Open freeze modal
  const openFreezeModal = (userId: number) => {
    setSelectedUserId(userId)
    setFreezeForm({ duration: '1d', reason: '' })
    setIsFreezeModalOpen(true)
  }

  // Close freeze modal
  const closeFreezeModal = () => {
    setIsFreezeModalOpen(false)
    setSelectedUserId(null)
    setFreezeForm({ duration: '1d', reason: '' })
  }

  // Handle ban form change
  const handleBanFormChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setBanForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle freeze form change
  const handleFreezeFormChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFreezeForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Calculate expiration date based on duration
  const calculateExpirationDate = (duration: string) => {
    const now = new Date()
    const parts = duration.match(/^(\d+)([hdwm])$/)
    if (!parts) return null

    const [, amount, unit] = parts
    const numAmount = parseInt(amount)

    switch (unit) {
      case 'h': // hours
        now.setHours(now.getHours() + numAmount)
        break
      case 'd': // days
        now.setDate(now.getDate() + numAmount)
        break
      case 'w': // weeks
        now.setDate(now.getDate() + numAmount * 7)
        break
      case 'm': // months
        now.setMonth(now.getMonth() + numAmount)
        break
      default:
        return null
    }

    return now.toISOString()
  }

  // Handle ban user
  const handleBanUser = async () => {
    if (!selectedUserId) return
    
    setModalLoading(true)
    try {
      const expirationDate = calculateExpirationDate(banForm.duration)
      const response = await fetch('/mgr/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: selectedUserId,
          status: 'banned',
          ban_expires_at: expirationDate,
          ban_reason: banForm.reason
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to ban user')
      }
      
      const data = await response.json()
      if (data.success) {
        // Refresh users list
        fetchUsers()
        closeBanModal()
      } else {
        throw new Error(data.error || 'Failed to ban user')
      }
    } catch (err) {
      console.error('Error banning user:', err)
    } finally {
      setModalLoading(false)
    }
  }

  // Handle freeze user
  const handleFreezeUser = async () => {
    if (!selectedUserId) return
    
    setModalLoading(true)
    try {
      const expirationDate = calculateExpirationDate(freezeForm.duration)
      const response = await fetch('/mgr/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: selectedUserId,
          status: 'frozen',
          freeze_expires_at: expirationDate,
          freeze_reason: freezeForm.reason
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to freeze user')
      }
      
      const data = await response.json()
      if (data.success) {
        // Refresh users list
        fetchUsers()
        closeFreezeModal()
      } else {
        throw new Error(data.error || 'Failed to freeze user')
      }
    } catch (err) {
      console.error('Error freezing user:', err)
    } finally {
      setModalLoading(false)
    }
  }

  // Handle user status change (unban/unfreeze)
  const handleStatusChange = async (userId: number, newStatus: string) => {
    try {
      const updateData: any = {
        id: userId,
        status: newStatus
      }
      
      // Clear ban/freeze fields when unbanning/unfreezing
      if (newStatus === 'active') {
        updateData.ban_expires_at = null
        updateData.freeze_expires_at = null
        updateData.ban_reason = null
        updateData.freeze_reason = null
      }
      
      const response = await fetch('/mgr/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update user status')
      }
      
      const data = await response.json()
      if (data.success) {
        // Refresh users list
        fetchUsers()
      } else {
        throw new Error(data.error || 'Failed to update user status')
      }
    } catch (err) {
      console.error('Error updating user status:', err)
    }
  }



  // Open edit modal
  const openEditModal = (user: any) => {
    setEditingUser(user)
    setEditForm({
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status
    })
    setEditError('')
    setIsEditModalOpen(true)
  }

  // Close edit modal
  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditingUser(null)
    setEditForm({ username: '', email: '', role: '', status: '' })
    setEditError('')
  }

  // Handle edit form change
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle edit form submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditLoading(true)
    setEditError('')
    
    try {
      const response = await fetch('/mgr/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: editingUser.id,
          ...editForm
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update user')
      }
      
      const data = await response.json()
      if (data.success) {
        // Refresh users list
        fetchUsers()
        closeEditModal()
      } else {
        throw new Error(data.error || 'Failed to update user')
      }
    } catch (err) {
      setEditError('Failed to update user')
      console.error('Error updating user:', err)
    } finally {
      setEditLoading(false)
    }
  }

  // Open delete modal
  const openDeleteModal = (userId: number) => {
    setDeletingUserId(userId)
    setDeleteError('')
    setIsDeleteModalOpen(true)
  }

  // Close delete modal
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setDeletingUserId(null)
    setDeleteError('')
  }

  // Handle delete
  const handleDelete = async () => {
    if (!deletingUserId) return
    
    setDeleteLoading(true)
    setDeleteError('')
    
    try {
      const response = await fetch('/mgr/api/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: deletingUserId })
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete user')
      }
      
      const data = await response.json()
      if (data.success) {
        // Refresh users list
        fetchUsers()
        closeDeleteModal()
      } else {
        throw new Error(data.error || 'Failed to delete user')
      }
    } catch (err) {
      setDeleteError('Failed to delete user')
      console.error('Error deleting user:', err)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.364-.833-3.132 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Search and filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by username, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            >
              <option value="">All Roles</option>
              {session.user.role === 'admin' && (
                <>
                  <option value="moderator">Moderator</option>
                  <option value="user">User</option>
                </>
              )}
              {session.user.role === 'moderator' && (
                <option value="user">User</option>
              )}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="banned">Banned</option>
              <option value="frozen">Frozen</option>
            </select>
          </div>
        </div>
        
        {/* Reset filters button */}
        {(searchTerm || roleFilter || statusFilter) && (
          <button
            onClick={resetFilters}
            className="mt-4 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset Filters
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <ContentLoader text="Loading users..." minHeight="py-24" />
        ) : users.length === 0 ? (
          <div className="py-16 px-4">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No users found</h3>
              <p className="mt-2 text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {users
                    .filter(user => {
                      // Admin can see all roles except other admins
                      if (session.user.role === 'admin') {
                        return user.role !== 'admin';
                      }
                      // Moderator can only see user role
                      if (session.user.role === 'moderator') {
                        return user.role === 'user';
                      }
                      return true;
                    })
                    .map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative group">
                          <span 
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)} cursor-help`}
                          >
                            {getStatusDisplayName(user.status)}
                          </span>
                          {(user.status === 'banned' || user.status === 'frozen') && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-800 text-white p-3 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                              <div className="text-sm font-medium mb-1">
                                {user.status === 'banned' ? '禁言详情' : '冻结详情'}
                              </div>
                              <div className="text-xs space-y-1">
                                {user.status === 'banned' ? (
                                  <>
                                    <p>到期时间: {user.ban_expires_at ? formatDate(user.ban_expires_at).full : '永久'}</p>
                                    <p>原因: {user.ban_reason || '未提供'}</p>
                                  </>
                                ) : (
                                  <>
                                    <p>到期时间: {user.freeze_expires_at ? formatDate(user.freeze_expires_at).full : '永久'}</p>
                                    <p>原因: {user.freeze_reason || '未提供'}</p>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(user.created_at).date}</div>
                        <div className="text-xs text-gray-500">{formatDate(user.created_at).time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="inline-flex gap-2">
                          <button 
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                            onClick={() => openEditModal(user)}
                          >
                            Edit
                          </button>
                          {(session.user.role === 'admin' || session.user.role === 'moderator') && (
                            <>
                              {user.status !== 'banned' ? (
                                <button 
                                  className="text-orange-600 hover:text-orange-800 transition-colors duration-200"
                                  onClick={() => openBanModal(user.id)}
                                >
                                  Ban
                                </button>
                              ) : (
                                <button 
                                  className="text-green-600 hover:text-green-800 transition-colors duration-200"
                                  onClick={() => handleStatusChange(user.id, 'active')}
                                >
                                  Unban
                                </button>
                              )}
                              {user.status !== 'frozen' ? (
                                <button 
                                  className="text-purple-600 hover:text-purple-800 transition-colors duration-200"
                                  onClick={() => openFreezeModal(user.id)}
                                >
                                  Freeze
                                </button>
                              ) : (
                                <button 
                                  className="text-teal-600 hover:text-teal-800 transition-colors duration-200"
                                  onClick={() => handleStatusChange(user.id, 'active')}
                                >
                                  Unfreeze
                                </button>
                              )}
                            </>
                          )}
                          {session.user.role === 'admin' && (
                            <button 
                              className="text-red-600 hover:text-red-800 transition-colors duration-200"
                              onClick={() => openDeleteModal(user.id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> of <span className="font-medium">{totalItems}</span> users
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = i + 1
                      if (currentPage > 3 && totalPages > 5) {
                        if (i === 0) pageNum = 1
                        else if (i === 1) pageNum = currentPage - 1
                        else if (i === 2) pageNum = currentPage
                        else if (i === 3) pageNum = currentPage + 1
                        else if (i === 4) pageNum = totalPages
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1.5 border rounded-md text-sm font-medium transition-colors duration-200 ${currentPage === pageNum ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Next
                    </button>
                  </div>
                  
                  {/* Page size selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                      className="px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit User</h3>
              <button 
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={closeEditModal}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {editError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.364-.833-3.132 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>{editError}</span>
                </div>
              </div>
            )}
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  value={editForm.username}
                  onChange={handleEditFormChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditFormChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  name="role"
                  value={editForm.role}
                  onChange={handleEditFormChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  required
                >
                  {session.user.role === 'admin' && (
                    <>
                      <option value="moderator">Moderator</option>
                      <option value="user">User</option>
                    </>
                  )}
                  {session.user.role === 'moderator' && (
                    <option value="user">User</option>
                  )}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                    name="status"
                    value={editForm.status}
                    onChange={handleEditFormChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="banned">Banned</option>
                    <option value="frozen">Frozen</option>
                  </select>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  onClick={closeEditModal}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
                  disabled={editLoading}
                >
                  <ButtonLoader 
                    loading={editLoading}
                    loaderText="Updating..."
                  >
                    Update User
                  </ButtonLoader>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ban User Modal */}
      {isBanModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Ban User</h3>
              <button 
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={closeBanModal}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleBanUser(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ban Duration</label>
                <select
                  name="duration"
                  value={banForm.duration}
                  onChange={handleBanFormChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  required
                >
                  <option value="1h">1 Hour</option>
                  <option value="6h">6 Hours</option>
                  <option value="1d">1 Day</option>
                  <option value="3d">3 Days</option>
                  <option value="7d">7 Days</option>
                  <option value="14d">14 Days</option>
                  <option value="30d">30 Days</option>
                  <option value="90d">90 Days</option>
                  <option value="180d">180 Days</option>
                  <option value="365d">365 Days</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ban Reason</label>
                <textarea
                  name="reason"
                  value={banForm.reason}
                  onChange={handleBanFormChange}
                  rows={4}
                  placeholder="Enter the reason for banning this user..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  required
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  onClick={closeBanModal}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 flex items-center gap-2"
                  disabled={modalLoading}
                >
                  <ButtonLoader 
                    loading={modalLoading}
                    loaderText="Banning..."
                  >
                    Ban User
                  </ButtonLoader>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Freeze User Modal */}
      {isFreezeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Freeze User</h3>
              <button 
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={closeFreezeModal}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleFreezeUser(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Freeze Duration</label>
                <select
                  name="duration"
                  value={freezeForm.duration}
                  onChange={handleFreezeFormChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  required
                >
                  <option value="1h">1 Hour</option>
                  <option value="6h">6 Hours</option>
                  <option value="1d">1 Day</option>
                  <option value="3d">3 Days</option>
                  <option value="7d">7 Days</option>
                  <option value="14d">14 Days</option>
                  <option value="30d">30 Days</option>
                  <option value="90d">90 Days</option>
                  <option value="180d">180 Days</option>
                  <option value="365d">365 Days</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Freeze Reason</label>
                <textarea
                  name="reason"
                  value={freezeForm.reason}
                  onChange={handleFreezeFormChange}
                  rows={4}
                  placeholder="Enter the reason for freezing this user..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  required
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  onClick={closeFreezeModal}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center gap-2"
                  disabled={modalLoading}
                >
                  {modalLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {modalLoading ? 'Freezing...' : 'Freeze User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Delete User</h3>
              <button 
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={closeDeleteModal}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.364-.833-3.132 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>{deleteError}</span>
                </div>
              </div>
            )}
            
            <div className="mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.364-.833-3.132 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-1">Are you sure?</h4>
                  <p className="text-gray-600">
                    This action cannot be undone. Deleting this user will remove all their data from the system.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                onClick={closeDeleteModal}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center gap-2"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {deleteLoading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
