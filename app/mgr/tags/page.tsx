'use client'
import React, { useState, useEffect } from 'react'
import { formatDate } from '@/lib/date-utils'
import { ContentLoader, ErrorMessage } from '@/components/ui'
import { useMgrSession } from '../layout'

const TagsPage = () => {
  const session = useMgrSession()
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ keyword: '' });
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const [currentTag, setCurrentTag] = useState<any>({ id: null, name: '', heat: 0, clickCount: 0 });

  // 获取标签列表
  const fetchTags = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // 构建查询参数
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pagination.pageSize.toString(),
      });
      
      // 添加筛选条件
      if (filters.keyword) params.append('keyword', filters.keyword);
      
      const response = await fetch(`/mgr/api/tags?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setTags(data.data.tags);
        setPagination(data.data.pagination);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch tags');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchTags();
  }, []);

  // 当筛选条件变化时重新加载
  useEffect(() => {
    fetchTags();
  }, [filters]);

  // 处理分页
  const handlePageChange = (newPage: number) => {
    fetchTags(newPage);
  };

  // 处理筛选
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // 处理标签选择
  const handleTagSelect = (tagId: number) => {
    setSelectedTags(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  // 处理全选
  const handleSelectAll = () => {
    if (selectedTags.length === tags.length) {
      setSelectedTags([]);
    } else {
      setSelectedTags(tags.map((tag: any) => tag.id));
    }
  };

  // 处理标签操作
  const handleTagAction = async (action: string, tagData: any = null) => {
    try {
      const response = await fetch('/mgr/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          tagId: tagData?.id,
          name: tagData?.name,
          heat: tagData?.heat,
          clickCount: tagData?.clickCount,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // 重新加载标签列表
        fetchTags();
        // 清空选择
        setSelectedTags([]);
        // 关闭模态框
        setActionModalOpen(false);
        // 重置表单
        setCurrentTag({ id: null, name: '', heat: 0, clickCount: 0 });
        alert('Action completed successfully');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Failed to perform action');
    }
  };

  // 打开操作模态框
  const openActionModal = (action: string, tag: any = null) => {
    setSelectedAction(action);
    if (tag) {
      setCurrentTag({
        id: tag.id,
        name: tag.name,
        heat: tag.heat,
        clickCount: tag.click_count,
      });
    } else {
      setCurrentTag({ id: null, name: '', heat: 0, clickCount: 0 });
    }
    setActionModalOpen(true);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tag Management</h1>

      {/* 筛选栏 */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
            <input 
              type="text" 
              name="keyword" 
              value={filters.keyword}
              onChange={handleFilterChange}
              placeholder="Search tag name"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* 操作栏 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button 
            onClick={() => openActionModal('create')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Create Tag
          </button>
          <button 
            onClick={() => {
              if (selectedTags.length === 0) {
                alert('Please select at least one tag');
                return;
              }
              alert('Bulk delete is not implemented yet');
            }}
            disabled={selectedTags.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
          >
            Delete Selected
          </button>
        </div>
      </div>

      {/* 标签列表 */}
      {loading ? (
        <ContentLoader text="Loading tags..." minHeight="py-12" />
      ) : error ? (
        <ErrorMessage message={error} type="error" className="mb-4" />
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input 
                    type="checkbox" 
                    checked={selectedTags.length === tags.length && tags.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Heat
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Click Count
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tags.map((tag) => (
                <tr key={tag.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      checked={selectedTags.includes(tag.id)}
                      onChange={() => handleTagSelect(tag.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tag.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tag.heat}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tag.click_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(tag.created_at).date}</div>
                    <div className="text-xs text-gray-500">{formatDate(tag.created_at).time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => openActionModal('update', tag)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    {session.user.role === 'admin' && (
                      <button 
                        onClick={() => {
                          setCurrentTag(tag);
                          setSelectedAction('delete');
                          setActionModalOpen(true);
                        }}
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
      )}

      {/* 分页 */}
      {!loading && tags.length > 0 && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} tags
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button 
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* 操作模态框 */}
      {actionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {selectedAction === 'create' ? 'Create Tag' : selectedAction === 'update' ? 'Edit Tag' : 'Confirm Delete'}
            </h2>
            
            {selectedAction !== 'delete' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input 
                    type="text" 
                    value={currentTag.name}
                    onChange={(e) => setCurrentTag((prev: any) => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heat</label>
                  <input 
                    type="number" 
                    value={currentTag.heat}
                    onChange={(e) => setCurrentTag((prev: any) => ({ ...prev, heat: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Click Count</label>
                  <input 
                    type="number" 
                    value={currentTag.clickCount}
                    onChange={(e) => setCurrentTag((prev: any) => ({ ...prev, clickCount: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
            )}
            
            {selectedAction === 'delete' && (
              <div className="mb-4">
                <p>Are you sure you want to delete the tag "{currentTag.name}"? This action cannot be undone.</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setActionModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleTagAction(selectedAction, currentTag)}
                className={`px-4 py-2 rounded-md ${selectedAction === 'delete' ? 'bg-red-600 text-white hover:bg-red-700' : selectedAction === 'create' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {selectedAction === 'delete' ? 'Delete' : selectedAction === 'create' ? 'Create' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagsPage;
