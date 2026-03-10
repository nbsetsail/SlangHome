'use client'
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface LocaleItem {
  code: string
  name: string
  native_name: string
  bg_color: string
  rtl: number | boolean
  priority: number
  is_default: number | boolean
  status: string
  slang_count?: number
  category_count?: number
  tag_count?: number
}

export default function LocalesManagePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [locales, setLocales] = useState<LocaleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingLocale, setEditingLocale] = useState<LocaleItem | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    native_name: '',
    bg_color: '#3B82F6',
    rtl: false,
    priority: 0,
    is_default: false,
    status: 'inactive'
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (session && !['admin'].includes(session.user?.role)) {
      router.push('/mgr')
    }
  }, [session, status, router])

  useEffect(() => {
    fetchLocales()
  }, [])

  const fetchLocales = async () => {
    setLoading(true)
    try {
      const response = await fetch('/mgr/api/locales')
      const data = await response.json()
      if (data.locales) {
        setLocales(data.locales)
      }
    } catch (err) {
      setError('Failed to fetch locales')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (locale: LocaleItem | null = null) => {
    if (locale) {
      setEditingLocale(locale)
      setFormData({
        code: locale.code,
        name: locale.name,
        native_name: locale.native_name || '',
        bg_color: locale.bg_color || '#3B82F6',
        rtl: !!locale.rtl,
        priority: locale.priority || 0,
        is_default: !!locale.is_default,
        status: locale.status || 'inactive'
      })
    } else {
      setEditingLocale(null)
      setFormData({
        code: '',
        name: '',
        native_name: '',
        bg_color: '#3B82F6',
        rtl: false,
        priority: 0,
        is_default: false,
        status: 'inactive'
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingLocale(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement
    const { name, value, type, checked } = target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const method = editingLocale ? 'PUT' : 'POST'
      const response = await fetch('/mgr/api/locales', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      if (data.success) {
        fetchLocales()
        handleCloseModal()
      } else {
        setError(data.error || 'Failed to save locale')
      }
    } catch (err) {
      setError('Failed to save locale')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (code: string) => {
    if (!confirm(`Are you sure you want to delete locale "${code}"?`)) return
    
    try {
      const response = await fetch(`/mgr/api/locales?code=${code}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      if (data.success) {
        fetchLocales()
      } else {
        setError(data.error || 'Failed to delete locale')
      }
    } catch (err) {
      setError('Failed to delete locale')
    }
  }

  const handleToggleStatus = async (locale: LocaleItem) => {
    const newStatus = locale.status === 'active' ? 'inactive' : 'active'
    
    try {
      const response = await fetch('/mgr/api/locales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...locale,
          status: newStatus
        })
      })
      
      const data = await response.json()
      if (data.success) {
        fetchLocales()
      }
    } catch (err) {
      setError('Failed to update status')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Locale Management</h1>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add Locale
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Native Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {locales.map(locale => (
                <tr key={locale.code} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span 
                        className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold mr-3"
                        style={{ backgroundColor: locale.bg_color }}
                      >
                        {locale.code.toUpperCase()}
                      </span>
                      <span className="font-medium text-gray-900">{locale.code}</span>
                      {locale.is_default && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">Default</span>
                      )}
                      {locale.rtl && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">RTL</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{locale.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{locale.native_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>Slang: {locale.slang_count || 0}</div>
                    <div>Categories: {locale.category_count || 0}</div>
                    <div>Tags: {locale.tag_count || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{locale.priority}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(locale)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        locale.status === 'active' 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {locale.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleOpenModal(locale)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    {!locale.is_default && (
                      <button
                        onClick={() => handleDelete(locale.code)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingLocale ? 'Edit Locale' : 'Add Locale'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  disabled={!!editingLocale}
                  className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
                  placeholder="e.g., en, zh, ja"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (English)</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., English, Chinese"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Native Name</label>
                <input
                  type="text"
                  name="native_name"
                  value={formData.native_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., English, 中文"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    name="bg_color"
                    value={formData.bg_color}
                    onChange={handleInputChange}
                    className="h-10 w-10 border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    name="bg_color_text"
                    value={formData.bg_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, bg_color: e.target.value }))}
                    className="flex-1 px-3 py-2 border rounded-md"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <input
                  type="number"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                  min="0"
                />
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="rtl"
                    checked={formData.rtl}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  RTL (Right-to-Left)
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Default
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
