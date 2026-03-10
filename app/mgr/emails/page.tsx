'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { formatDate } from '@/lib/date-utils';

const EMAIL_TYPES = [
  { value: 'verification', label: 'Verification' },
  { value: 'reset_password', label: 'Password Reset' },
  { value: 'operation_report', label: 'Operation Report' },
  { value: 'annual_summary', label: 'Annual Summary' },
  { value: 'custom', label: 'Custom' }
];

const TASK_STATUS = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  pending_approval: { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
  sending: { label: 'Sending', color: 'bg-blue-100 text-blue-800' },
  sent: { label: 'Sent', color: 'bg-green-100 text-green-800' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' }
};

const RECIPIENT_ROLES = [
  { value: 'user', label: 'User' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'admin', label: 'Admin' }
];

export default function EmailTasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewTask, setPreviewTask] = useState<any>(null);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0
  });

  const [formData, setFormData] = useState({
    type: 'custom',
    subject: '',
    html_content: '',
    text_content: '',
    recipient_type: 'role',
    recipient_email: '',
    recipient_role: 'user',
    template_id: ''
  });

  useEffect(() => {
    fetchTasks();
    fetchTemplates();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/mgr/api/email-tasks');
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
        const total = data.tasks.length;
        const sent = data.tasks.filter((t: any) => t.status === 'sent').length;
        const failed = data.tasks.filter((t: any) => t.status === 'failed').length;
        const pending = data.tasks.filter((t: any) => ['draft', 'pending_approval', 'approved'].includes(t.status)).length;
        setStats({ total, sent, failed, pending });
      }
    } catch (error) {
      console.error('Fetch tasks error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/mgr/api/email-templates');
      const data = await res.json();
      if (data.templates) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Fetch templates error:', error);
    }
  };

  const handleCreateTask = async () => {
    try {
      const res = await fetch('/mgr/api/email-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        fetchTasks();
        setFormData({
          type: 'custom',
          subject: '',
          html_content: '',
          text_content: '',
          recipient_type: 'role',
          recipient_email: '',
          recipient_role: 'user',
          template_id: ''
        });
      } else {
        alert(data.error || 'Failed to create');
      }
    } catch (error) {
      console.error('Create task error:', error);
      alert('Failed to create');
    }
  };

  const handleAction = async (taskId: number, action: string) => {
    try {
      const res = await fetch('/mgr/api/email-tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, action })
      });

      const data = await res.json();
      if (data.success) {
        fetchTasks();
        setPreviewTask(null);
      } else {
        alert(data.error || 'Action failed');
      }
    } catch (error) {
      console.error('Action error:', error);
      alert('Action failed');
    }
  };

  const loadTemplate = (templateId: string) => {
    const template = templates.find((t: any) => t.id === parseInt(templateId));
    if (template) {
      setFormData({
        ...formData,
        template_id: templateId,
        type: template.type,
        subject: template.subject,
        html_content: template.html_content,
        text_content: template.text_content || ''
      });
    }
  };

  const isAdmin = session?.user?.role === 'admin';
  const isModerator = session?.user?.role === 'moderator' || isAdmin;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Email Management</h1>
        <p className="text-gray-600 mt-1">Manage email templates and tasks</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Tasks</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
          <div className="text-sm text-gray-500">Sent</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          <div className="text-sm text-gray-500">Failed</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tasks'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Email Tasks
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Email Templates
          </button>
        </nav>
      </div>

      {activeTab === 'tasks' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Email Tasks</h2>
            {isModerator && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Create Custom Email
              </button>
            )}
          </div>

          {/* Operation Report Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-blue-800 mb-2">📊 Operation Reports Auto-Generated</h3>
            <p className="text-sm text-blue-700">
              Operation reports are automatically generated by the system. Admin approval required before sending to Moderators and Admins.
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Schedule: Monthly / Quarterly / Semi-annual / Annual
            </p>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipients</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {EMAIL_TYPES.find(t => t.value === task.type)?.label || task.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.recipient_type === 'single' && task.recipient_email}
                      {task.recipient_type === 'role' && `Role: ${task.recipient_role}`}
                      {task.recipient_type === 'all_users' && 'All Users'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${TASK_STATUS[task.status as keyof typeof TASK_STATUS]?.color}`}>
                        {TASK_STATUS[task.status as keyof typeof TASK_STATUS]?.label || task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.sent_count || 0} / {task.recipient_count || 0}
                      {task.failed_count > 0 && <span className="text-red-500 ml-1">({task.failed_count} failed)</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(task.created_at).full}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => setPreviewTask(task)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      {task.status === 'pending_approval' && isAdmin && (
                        <>
                          <button
                            onClick={() => handleAction(task.id, 'approve')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(task.id, 'reject')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {task.status === 'approved' && isAdmin && (
                        <button
                          onClick={() => handleAction(task.id, 'send')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Send
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {template.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {EMAIL_TYPES.find(t => t.value === template.type)?.label || template.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {template.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(template.created_at).full}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Modal */}
      {previewTask && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{previewTask.subject}</h3>
                <p className="text-sm text-gray-500">
                  Type: {EMAIL_TYPES.find((t: any) => t.value === previewTask.type)?.label} | 
                  Status: <span className={TASK_STATUS[previewTask.status as keyof typeof TASK_STATUS]?.color + ' px-2 py-0.5 rounded text-xs'}>
                    {TASK_STATUS[previewTask.status as keyof typeof TASK_STATUS]?.label}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setPreviewTask(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="border rounded-lg p-4 bg-gray-50 mb-4">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: previewTask.html_content }}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setPreviewTask(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              {previewTask.status === 'pending_approval' && isAdmin && (
                <>
                  <button
                    onClick={() => handleAction(previewTask.id, 'reject')}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAction(previewTask.id, 'approve')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Approve
                  </button>
                </>
              )}
              {previewTask.status === 'approved' && isAdmin && (
                <button
                  onClick={() => handleAction(previewTask.id, 'send')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Send Email
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create Custom Email</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Template</label>
                <select
                  value={formData.template_id}
                  onChange={(e) => loadTemplate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">No Template</option>
                  {templates.filter(t => t.is_active && t.type !== 'operation_report').map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Email subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Type</label>
                <select
                  value={formData.recipient_type}
                  onChange={(e) => setFormData({ ...formData, recipient_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="single">Single Email</option>
                  <option value="role">By Role</option>
                  <option value="all_users">All Users</option>
                </select>
              </div>

              {formData.recipient_type === 'single' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={formData.recipient_email}
                    onChange={(e) => setFormData({ ...formData, recipient_email: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="email@example.com"
                  />
                </div>
              )}

              {formData.recipient_type === 'role' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Role</label>
                  <select
                    value={formData.recipient_role}
                    onChange={(e) => setFormData({ ...formData, recipient_role: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {RECIPIENT_ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">HTML Content</label>
                <textarea
                  value={formData.html_content}
                  onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-48 font-mono text-sm"
                  placeholder="HTML email content"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
