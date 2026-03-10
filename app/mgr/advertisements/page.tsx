'use client'
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ContentLoader } from '@/components/ui'

// 广告状态配置
const AD_STATUS = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800' },
  paused: { label: 'Paused', color: 'bg-gray-100 text-gray-800' }
}

export default function AdvertisementsPage() {
  const { data: session, status } = useSession({ required: true })
  const router = useRouter()
  
  const [advertisements, setAdvertisements] = useState<any[]>([])
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingAd, setEditingAd] = useState<any>(null)
  const [filter, setFilter] = useState({ status: '', slotId: '' })
  
  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    linkUrl: '',
    slotId: '',
    status: 'active',
    startDate: '',
    endDate: '',
    priority: 0
  })

  // 权限检查
  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.push('/')
      }
    }
  }, [session, status, router])

  // 加载数据
  const fetchData = async () => {
    setLoading(true)
    setError('')
    
    try {
      // 获取广告列表
      const params = new URLSearchParams()
      if (filter.status) params.append('status', filter.status)
      if (filter.slotId) params.append('slotId', filter.slotId)
      
      const queryString = params.toString()
      const adsRes = await fetch(`/mgr/api/advertisements${queryString ? '?' + queryString : ''}`)
      const adsData = await adsRes.json()
      
      // 获取广告位列表
      const slotsRes = await fetch('/mgr/api/advertisement-slots?isActive=true')
      const slotsData = await slotsRes.json()
      
      if (adsData.success && slotsData.success) {
        setAdvertisements(adsData.data.advertisements)
        setSlots(slotsData.data.slots || [])
      } else {
        throw new Error(adsData.error || slotsData.error || 'Failed to fetch data')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchData()
    }
  }, [session, status, filter])

  // 切换广告状态
  const toggleStatus = async (ad: any) => {
    try {
      const newStatus = ad.status === 'active' ? 'paused' : 'active'
      
      const response = await fetch(`/mgr/api/advertisements`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ad.id,
          title: ad.title,
          content: ad.content,
          imageUrl: ad.image_url,
          linkUrl: ad.link_url,
          slotId: ad.slot_id,
          status: newStatus,
          startDate: ad.start_date,
          endDate: ad.end_date,
          priority: ad.priority
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setAdvertisements(prev => 
          prev.map(a => a.id === ad.id ? { ...a, status: newStatus } : a)
        )
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  // 删除广告
  const deleteAd = async (id: number) => {
    if (!confirm('Are you sure you want to delete this advertisement?')) return
    
    try {
      const response = await fetch(`/mgr/api/advertisements?id=${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setAdvertisements(prev => prev.filter(a => a.id !== id))
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  // 打开编辑弹窗
  const openEditModal = (ad?: any) => {
    if (ad) {
      setEditingAd(ad)
      setFormData({
        title: ad.title || '',
        content: ad.content || '',
        imageUrl: ad.image_url || '',
        linkUrl: ad.link_url || '',
        slotId: ad.slot_id?.toString() || '',
        status: ad.status || 'active',
        startDate: ad.start_date || '',
        endDate: ad.end_date || '',
        priority: ad.priority || 0
      })
    } else {
      setEditingAd(null)
      setFormData({
        title: '',
        content: '',
        imageUrl: '',
        linkUrl: '',
        slotId: '',
        status: 'active',
        startDate: '',
        endDate: '',
        priority: 0
      })
    }
    setShowModal(true)
  }

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const method = editingAd ? 'PUT' : 'POST'
      const body = editingAd 
        ? { id: editingAd.id, ...formData }
        : { ...formData, createdBy: session?.user?.id }
      
      const response = await fetch('/mgr/api/advertisements', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setShowModal(false)
        fetchData()
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100">
        <ContentLoader text="Loading..." />
      </div>
    )
  }

  if (session?.user?.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Advertisements</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex gap-4">
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="border rounded px-3 py-2"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
              
              <select
                value={filter.slotId}
                onChange={(e) => setFilter({ ...filter, slotId: e.target.value })}
                className="border rounded px-3 py-2"
              >
                <option value="">All Slots</option>
                {slots.map(slot => (
                  <option key={slot.id} value={slot.id}>{slot.name}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => openEditModal()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + New Advertisement
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8">
              <ContentLoader text="Loading advertisements..." />
            </div>
          ) : advertisements.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No advertisements found
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slot</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {advertisements.map(ad => (
                  <tr key={ad.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{ad.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{ad.content}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {ad.slot_name || 'No slot'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${AD_STATUS[ad.status as keyof typeof AD_STATUS]?.color || 'bg-gray-100'}`}>
                        {AD_STATUS[ad.status as keyof typeof AD_STATUS]?.label || ad.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{ad.views || 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{ad.clicks || 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleStatus(ad)}
                          className={`text-sm px-2 py-1 rounded ${
                            ad.status === 'active' 
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {ad.status === 'active' ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          onClick={() => openEditModal(ad)}
                          className="text-sm px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteAd(ad.id)}
                          className="text-sm px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingAd ? 'Edit Advertisement' : 'New Advertisement'}
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link URL *</label>
                    <input
                      type="url"
                      required
                      value={formData.linkUrl}
                      onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ad Slot</label>
                    <select
                      value={formData.slotId}
                      onChange={(e) => setFormData({ ...formData, slotId: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">Select slot</option>
                      {slots.map(slot => (
                        <option key={slot.id} value={slot.id}>{slot.name} ({slot.position})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {editingAd ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
