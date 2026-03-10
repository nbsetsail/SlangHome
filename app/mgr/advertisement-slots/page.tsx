'use client'
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ContentLoader } from '@/components/ui'

// 广告位预设
const SLOT_POSITIONS = [
  { value: 'home_top', label: 'Home - Top Banner', size: '728x90' },
  { value: 'home_sidebar', label: 'Home - Sidebar', size: '300x250' },
  { value: 'detail_bottom', label: 'Detail - Bottom', size: '728x90' },
  { value: 'search_result', label: 'Search Result', size: '728x90' }
]

export default function AdvertisementSlotsPage() {
  const { data: session, status } = useSession({ required: true })
  const router = useRouter()
  
  const [slots, setSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSlot, setEditingSlot] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    size: '',
    width: '',
    height: '',
    priority: 1,
    isActive: true
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
      const response = await fetch('/mgr/api/advertisement-slots')
      const data = await response.json()
      
      if (data.success) {
        setSlots(data.data.slots || [])
      } else {
        throw new Error(data.error)
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
  }, [session, status])

  // 切换广告位状态
  const toggleActive = async (slot: any) => {
    try {
      const response = await fetch('/mgr/api/advertisement-slots', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: slot.id,
          name: slot.name,
          position: slot.position,
          size: slot.size,
          width: slot.width,
          height: slot.height,
          priority: slot.priority,
          isActive: !slot.is_active
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSlots(prev => 
          prev.map(s => s.id === slot.id ? { ...s, is_active: slot.is_active ? 0 : 1 } : s)
        )
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  // 删除广告位
  const deleteSlot = async (id: number) => {
    if (!confirm('Are you sure you want to delete this ad slot?')) return
    
    try {
      const response = await fetch(`/mgr/api/advertisement-slots?id=${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSlots(prev => prev.filter(s => s.id !== id))
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  // 打开编辑弹窗
  const openEditModal = (slot?: any) => {
    if (slot) {
      setEditingSlot(slot)
      setFormData({
        name: slot.name || '',
        position: slot.position || '',
        size: slot.size || '',
        width: slot.width?.toString() || '',
        height: slot.height?.toString() || '',
        priority: slot.priority || 1,
        isActive: slot.is_active === 1
      })
    } else {
      setEditingSlot(null)
      setFormData({
        name: '',
        position: '',
        size: '',
        width: '',
        height: '',
        priority: 1,
        isActive: true
      })
    }
    setShowModal(true)
  }

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const method = editingSlot ? 'PUT' : 'POST'
      const body = editingSlot 
        ? { id: editingSlot.id, ...formData }
        : formData
      
      const response = await fetch('/mgr/api/advertisement-slots', {
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

  // 选择预设位置
  const handlePositionChange = (position: string) => {
    const preset = SLOT_POSITIONS.find(p => p.value === position)
    setFormData({
      ...formData,
      position,
      size: preset?.size || '',
      width: preset?.size?.split('x')[0] || '',
      height: preset?.size?.split('x')[1] || ''
    })
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
          <h1 className="text-2xl font-bold text-gray-900">Advertisement Slots</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">Manage ad placement positions</p>
            <button
              onClick={() => openEditModal()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + New Slot
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
              <ContentLoader text="Loading ad slots..." />
            </div>
          ) : slots.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No ad slots found
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {slots.map(slot => (
                  <tr key={slot.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{slot.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{slot.position}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {slot.size || `${slot.width}x${slot.height}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{slot.priority}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        slot.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {slot.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleActive(slot)}
                          className={`text-sm px-2 py-1 rounded ${
                            slot.is_active 
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {slot.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => openEditModal(slot)}
                          className="text-sm px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteSlot(slot.id)}
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingSlot ? 'Edit Ad Slot' : 'New Ad Slot'}
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      placeholder="e.g., Homepage Banner"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position Preset</label>
                    <select
                      value={formData.position}
                      onChange={(e) => handlePositionChange(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">Select position</option>
                      {SLOT_POSITIONS.map(pos => (
                        <option key={pos.value} value={pos.value}>
                          {pos.label} ({pos.size})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position Key</label>
                    <input
                      type="text"
                      required
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      placeholder="e.g., home_top"
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                      <input
                        type="number"
                        value={formData.width}
                        onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                      <input
                        type="number"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Size (WxH format)</label>
                    <input
                      type="text"
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      placeholder="e.g., 728x90"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
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
                    {editingSlot ? 'Update' : 'Create'}
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
