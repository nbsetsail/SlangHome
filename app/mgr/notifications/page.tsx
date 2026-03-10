'use client'
import React, { useState, useEffect } from 'react'
import { formatDate } from '@/lib/date-utils'
import { ContentLoader } from '@/components/ui'
import { useMgrSession } from '../layout'

const notificationTypes = [
  { value: '', label: 'All Types' },
  { value: 'comment', label: 'Comment' },
  { value: 'like', label: 'Like' },
  { value: 'favorite', label: 'Favorite' },
  { value: 'reply', label: 'Reply' },
  { value: 'system', label: 'System' },
  { value: 'report_result', label: 'Report Result' }
]

const recipientTypes = [
  { value: 'all', label: 'All Active Users' },
  { value: 'role', label: 'By Role' },
  { value: 'user', label: 'Specific User' }
]

const roles = [
  { value: 'user', label: 'User' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'admin', label: 'Admin' }
]

export default function NotificationsPage() {
  const session = useMgrSession()
  const [notifications, setNotifications] = useState<any[]>([])
  const [typeStats, setTypeStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [typeFilter, setTypeFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  
  const [showSendModal, setShowSendModal] = useState(false)
  const [sendForm, setSendForm] = useState({
    recipientType: 'all',
    role: 'user',
    userId: '',
    username: '',
    type: 'system',
    title: '',
    content: '',
    link: ''
  })
  const [sending, setSending] = useState(false)
  const [userSearchResults, setUserSearchResults] = useState<any[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [sendStats, setSendStats] = useState<any>(null)

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', '20')
      if (typeFilter) params.append('type', typeFilter)
      if (userFilter) params.append('user', userFilter)

      const response = await fetch(`/mgr/api/notifications?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setNotifications(data.data.notifications)
        setTypeStats(data.data.typeStats)
        setTotal(data.data.pagination.totalItems)
        setTotalPages(data.data.pagination.totalPages)
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [page, typeFilter, userFilter])

  const searchUsers = async (keyword: string) => {
    if (!keyword || keyword.length < 2) {
      setUserSearchResults([])
      return
    }
    
    setSearchingUsers(true)
    try {
      const response = await fetch(`/mgr/api/users?search=${encodeURIComponent(keyword)}&limit=10`)
      const data = await response.json()
      if (data.success) {
        setUserSearchResults(data.data.users || [])
      }
    } catch (error) {
      console.error('Search users error:', error)
    } finally {
      setSearchingUsers(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (sendForm.recipientType === 'user' && sendForm.username) {
        searchUsers(sendForm.username)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [sendForm.username, sendForm.recipientType])

  const handleSendNotification = async () => {
    if (!sendForm.title || !sendForm.content) {
      setMessage('Title and content are required')
      return
    }

    if (sendForm.recipientType === 'user' && !sendForm.userId) {
      setMessage('Please select a user')
      return
    }

    setSending(true)
    setSendStats(null)
    
    try {
      const response = await fetch('/mgr/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          recipientType: sendForm.recipientType,
          role: sendForm.role,
          userId: sendForm.userId,
          type: sendForm.type,
          title: sendForm.title,
          content: sendForm.content,
          link: sendForm.link
        })
      })

      const data = await response.json()
      if (data.success) {
        setSendStats({
          sent: data.data.sent,
          total: data.data.total
        })
        setMessage(`Notification sent to ${data.data.sent} users!`)
        setTimeout(() => {
          setShowSendModal(false)
          setSendForm({ recipientType: 'all', role: 'user', userId: '', username: '', type: 'system', title: '', content: '', link: '' })
          setSendStats(null)
          fetchNotifications()
        }, 2000)
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSending(false)
    }
  }

  const handleDeleteNotification = async (notificationId: number) => {
    if (!confirm('Are you sure you want to delete this notification?')) return

    try {
      const response = await fetch('/mgr/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          notificationId
        })
      })

      const data = await response.json()
      if (data.success) {
        setMessage('Notification deleted successfully!')
        fetchNotifications()
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const response = await fetch('/mgr/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          notificationId
        })
      })

      const data = await response.json()
      if (data.success) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Mark as read error:', error)
    }
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      comment: '💬',
      like: '❤️',
      favorite: '⭐',
      reply: '↩️',
      system: '🔔',
      report_result: '✅'
    }
    return icons[type] || '📢'
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications Management</h1>
        <button
          onClick={() => setShowSendModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Send Notification
        </button>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded flex justify-between items-center">
          {message}
          <button onClick={() => setMessage('')} className="text-blue-600 hover:text-blue-800">✕</button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {typeStats.map((stat) => (
          <div key={stat.type} className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-2">
              <span className="text-xl">{getTypeIcon(stat.type)}</span>
              <div>
                <p className="text-xs text-gray-500 capitalize">{stat.type.replace('_', ' ')}</p>
                <p className="text-lg font-bold">{stat.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b flex flex-wrap gap-4">
          <div>
            <label className="text-sm text-gray-600 mr-2">Type:</label>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
              className="border rounded px-2 py-1"
            >
              {notificationTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 mr-2">User:</label>
            <input
              type="text"
              value={userFilter}
              onChange={(e) => { setUserFilter(e.target.value); setPage(1) }}
              placeholder="username or email"
              className="border rounded px-2 py-1"
            />
          </div>
          <div className="ml-auto text-sm text-gray-500">
            Total: {total} notifications
          </div>
        </div>

        {loading ? (
          <div className="p-8"><ContentLoader text="Loading..." /></div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No notifications found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Read</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {notifications.map((n) => (
                  <tr key={n.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{n.id}</td>
                    <td className="px-4 py-3 text-sm">
                      <div>{n.username || 'Unknown'}</div>
                      <div className="text-xs text-gray-400">{n.user_email || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="flex items-center gap-1">
                        {getTypeIcon(n.type)} {n.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{n.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{n.content}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${n.is_read ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'}`}>
                        {n.is_read ? 'Read' : 'Unread'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(n.created_at).full}</td>
                    <td className="px-4 py-3 text-sm space-x-2">
                      {!n.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(n.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => !sending && setShowSendModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Send Notification</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Type</label>
                <select
                  value={sendForm.recipientType}
                  onChange={(e) => setSendForm({ ...sendForm, recipientType: e.target.value, userId: '', username: '', role: 'user' })}
                  className="w-full border rounded px-3 py-2"
                  disabled={sending}
                >
                  {recipientTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {sendForm.recipientType === 'role' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
                  <select
                    value={sendForm.role}
                    onChange={(e) => setSendForm({ ...sendForm, role: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    disabled={sending}
                  >
                    {roles.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {sendForm.recipientType === 'user' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search User</label>
                  <input
                    type="text"
                    value={sendForm.username}
                    onChange={(e) => setSendForm({ ...sendForm, username: e.target.value, userId: '' })}
                    placeholder="Type username or email to search..."
                    className="w-full border rounded px-3 py-2"
                    disabled={sending}
                  />
                  {searchingUsers && (
                    <div className="text-sm text-gray-500 mt-1">Searching...</div>
                  )}
                  {userSearchResults.length > 0 && !sendForm.userId && (
                    <div className="border rounded mt-1 max-h-40 overflow-y-auto">
                      {userSearchResults.map(user => (
                        <div
                          key={user.id}
                          onClick={() => setSendForm({ ...sendForm, userId: user.id, username: user.username })}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          <div className="font-medium">{user.username}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {sendForm.userId && (
                    <div className="mt-2 p-2 bg-green-50 text-green-700 rounded text-sm">
                      Selected: {sendForm.username}
                      <button
                        onClick={() => setSendForm({ ...sendForm, userId: '', username: '' })}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>
              )}

              {sendForm.recipientType === 'all' && (
                <div className="p-3 bg-yellow-50 text-yellow-700 rounded text-sm">
                  ⚠️ This will send notification to all active users.
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={sendForm.type}
                  onChange={(e) => setSendForm({ ...sendForm, type: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  disabled={sending}
                >
                  <option value="system">System</option>
                  <option value="comment">Comment</option>
                  <option value="like">Like</option>
                  <option value="favorite">Favorite</option>
                  <option value="reply">Reply</option>
                  <option value="report_result">Report Result</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={sendForm.title}
                  onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
                  placeholder="Notification title"
                  className="w-full border rounded px-3 py-2"
                  disabled={sending}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  value={sendForm.content}
                  onChange={(e) => setSendForm({ ...sendForm, content: e.target.value })}
                  placeholder="Notification content"
                  rows={4}
                  className="w-full border rounded px-3 py-2"
                  disabled={sending}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link (optional)</label>
                <input
                  type="text"
                  value={sendForm.link}
                  onChange={(e) => setSendForm({ ...sendForm, link: e.target.value })}
                  placeholder="/slang/phrase/example"
                  className="w-full border rounded px-3 py-2"
                  disabled={sending}
                />
              </div>

              {sendStats && (
                <div className="p-3 bg-green-50 text-green-700 rounded">
                  ✅ Sent to {sendStats.sent} of {sendStats.total} users
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSendModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                onClick={handleSendNotification}
                disabled={sending || (sendForm.recipientType === 'user' && !sendForm.userId)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
