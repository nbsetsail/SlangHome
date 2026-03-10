'use client'
import React, { useState, useEffect } from 'react'
import { formatDate } from '@/lib/date-utils'
import { ContentLoader, ErrorMessage } from '@/components/ui'
import { useMgrSession } from '../layout'

const CommentsPage = () => {
  const session = useMgrSession();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ status: '', user: '', slang: '', keyword: '' });
  const [selectedComments, setSelectedComments] = useState<number[]>([]);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const [statusToUpdate, setStatusToUpdate] = useState('');

  if (!session) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Access Denied. Please log in.
        </div>
      </div>
    );
  }

  const fetchComments = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pagination.pageSize.toString(),
      });
      
      if (filters.status) params.append('status', filters.status);
      if (filters.user) params.append('user', filters.user);
      if (filters.slang) params.append('slang', filters.slang);
      if (filters.keyword) params.append('keyword', filters.keyword);
      
      const response = await fetch(`/mgr/api/comments?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setComments(data.data.comments);
        setPagination(data.data.pagination);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchComments();
  }, []);

  // 当筛选条件变化时重新加载
  useEffect(() => {
    fetchComments();
  }, [filters]);

  // 处理分页
  const handlePageChange = (newPage: number) => {
    fetchComments(newPage);
  };

  // 处理筛选
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // 处理评论选择
  const handleCommentSelect = (commentId: number) => {
    setSelectedComments(prev => {
      if (prev.includes(commentId)) {
        return prev.filter(id => id !== commentId);
      } else {
        return [...prev, commentId];
      }
    });
  };

  // 处理全选
  const handleSelectAll = () => {
    if (selectedComments.length === comments.length) {
      setSelectedComments([]);
    } else {
      setSelectedComments(comments.map((comment: any) => comment.id));
    }
  };

  // 处理批量操作
  const handleBulkAction = async (action: string, status: string | null = null) => {
    if (selectedComments.length === 0) {
      alert('Please select at least one comment');
      return;
    }

    try {
      const response = await fetch('/mgr/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          commentIds: selectedComments,
          status: status,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // 重新加载评论列表
        fetchComments();
        // 清空选择
        setSelectedComments([]);
        // 关闭模态框
        setActionModalOpen(false);
        alert('Action completed successfully');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Failed to perform action');
    }
  };

  // 打开操作模态框
  const openActionModal = (action: string) => {
    setSelectedAction(action);
    setActionModalOpen(true);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Comment Management</h1>

      {/* 筛选栏 */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              name="status" 
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <input 
              type="text" 
              name="user" 
              value={filters.user}
              onChange={handleFilterChange}
              placeholder="username or email"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slang</label>
            <input 
              type="text" 
              name="slang" 
              value={filters.slang}
              onChange={handleFilterChange}
              placeholder="slang phrase"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
            <input 
              type="text" 
              name="keyword" 
              value={filters.keyword}
              onChange={handleFilterChange}
              placeholder="Search in content"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* 批量操作栏 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          {session.user?.role === 'admin' && (
            <button 
              onClick={() => openActionModal('delete')}
              disabled={selectedComments.length === 0}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
            >
              Delete Selected
            </button>
          )}
          <button 
            onClick={() => openActionModal('updateStatus')}
            disabled={selectedComments.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            Update Status
          </button>
        </div>
      </div>

      {/* 评论列表 */}
      {loading ? (
        <ContentLoader text="Loading comments..." minHeight="py-12" />
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
                    checked={selectedComments.length === comments.length && comments.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Content
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slang
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
              {comments.map((comment) => (
                <tr key={comment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      checked={selectedComments.includes(comment.id)}
                      onChange={() => handleCommentSelect(comment.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs">
                    {comment.content}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {comment.user_name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {comment.slang_phrase || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${comment.status === 'active' ? 'bg-green-100 text-green-800' : comment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {comment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(comment.created_at).date}</div>
                    <div className="text-xs text-gray-500">{formatDate(comment.created_at).time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {session.user?.role === 'admin' && (
                      <button 
                        onClick={() => {
                          setSelectedComments([comment.id]);
                          openActionModal('delete');
                        }}
                        className="text-red-600 hover:text-red-900 mr-3"
                      >
                        Delete
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setSelectedComments([comment.id]);
                        setStatusToUpdate(comment.status === 'active' ? 'pending' : 'active');
                        openActionModal('updateStatus');
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {comment.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 分页 */}
      {!loading && comments.length > 0 && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} comments
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
              {selectedAction === 'delete' ? 'Confirm Delete' : 'Update Status'}
            </h2>
            {selectedAction === 'updateStatus' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Status</label>
                <select 
                  value={statusToUpdate}
                  onChange={(e) => setStatusToUpdate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="deleted">Deleted</option>
                </select>
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setActionModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleBulkAction(selectedAction, statusToUpdate)}
                className={`px-4 py-2 rounded-md ${selectedAction === 'delete' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {selectedAction === 'delete' ? 'Delete' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentsPage;
