/**
 * 权限管理配置
 * 定义三种角色(user, moderator, admin)的具体权限
 */

export type UserRole = 'user' | 'moderator' | 'admin'

export interface Permission {
  key: string
  name: string
  description: string
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    { key: 'view_profile', name: '查看个人资料', description: '查看和编辑自己的个人资料' },
    { key: 'submit_slang', name: '提交俚语', description: '提交新的俚语等待审核' },
    { key: 'view_slang', name: '查看俚语', description: '浏览和搜索所有已发布的俚语' },
    { key: 'add_comment', name: '发表评论', description: '对俚语发表评论' },
    { key: 'like_content', name: '点赞内容', description: '对俚语和评论进行点赞' },
    { key: 'favorite_slang', name: '收藏俚语', description: '收藏喜欢的俚语' },
    { key: 'apply_moderator', name: '申请版主', description: '申请成为版主' }
  ],
  
  moderator: [
    { key: 'view_profile', name: '查看个人资料', description: '查看和编辑自己的个人资料' },
    { key: 'submit_slang', name: '提交俚语', description: '提交新的俚语等待审核' },
    { key: 'view_slang', name: '查看俚语', description: '浏览和搜索所有已发布的俚语' },
    { key: 'add_comment', name: '发表评论', description: '对俚语发表评论' },
    { key: 'like_content', name: '点赞内容', description: '对俚语和评论进行点赞' },
    { key: 'favorite_slang', name: '收藏俚语', description: '收藏喜欢的俚语' },
    { key: 'manage_users', name: '管理用户', description: '查看用户列表，编辑用户状态（仅限 user 角色）' },
    { key: 'review_slang', name: '审核俚语', description: '审核用户提交的俚语（仅限管理的语种）' },
    { key: 'manage_categories', name: '管理分类', description: '添加、编辑、删除分类（仅限管理的语种）' },
    { key: 'manage_tags', name: '管理标签', description: '添加、编辑、删除标签（仅限管理的语种）' },
    { key: 'moderate_comments', name: '管理评论', description: '删除不当评论（仅限管理的语种）' },
    { key: 'view_statistics', name: '查看统计', description: '查看网站使用统计（仅限管理的语种）' },
    { key: 'manage_reports', name: '管理举报', description: '处理用户举报的内容（仅限管理的语种）' }
  ],
  
  admin: [
    { key: 'view_profile', name: '查看个人资料', description: '查看和编辑自己的个人资料' },
    { key: 'submit_slang', name: '提交俚语', description: '提交新的俚语等待审核' },
    { key: 'view_slang', name: '查看俚语', description: '浏览和搜索所有已发布的俚语' },
    { key: 'add_comment', name: '发表评论', description: '对俚语发表评论' },
    { key: 'like_content', name: '点赞内容', description: '对俚语和评论进行点赞' },
    { key: 'favorite_slang', name: '收藏俚语', description: '收藏喜欢的俚语' },
    { key: 'manage_users', name: '管理用户', description: '查看用户列表，编辑用户状态' },
    { key: 'review_slang', name: '审核俚语', description: '审核用户提交的俚语' },
    { key: 'manage_categories', name: '管理分类', description: '添加、编辑、删除分类' },
    { key: 'manage_tags', name: '管理标签', description: '添加、编辑、删除标签' },
    { key: 'moderate_comments', name: '管理评论', description: '删除不当评论' },
    { key: 'view_statistics', name: '查看统计', description: '查看网站使用统计' },
    { key: 'view_logs', name: '查看日志', description: '查看系统操作日志' },
    { key: 'system_config', name: '系统配置', description: '修改系统配置参数' },
    { key: 'manage_moderators', name: '管理版主', description: '审核版主申请、管理版主权限' },
    { key: 'manage_locales', name: '管理语种', description: '添加、编辑、删除支持的语种' },
    { key: 'manage_advertisements', name: '管理广告', description: '创建、编辑、删除广告内容' },
    { key: 'full_access', name: '完全访问', description: '访问所有系统功能' }
  ]
}

export type SlangStatus = 'pending' | 'approved' | 'rejected' | 'draft'

export const SLANG_STATUS_CONFIG: Record<SlangStatus, {
  label: string
  color: string
  description: string
  canEdit: boolean
}> = {
  pending: {
    label: '待审核',
    color: 'bg-yellow-100 text-yellow-800',
    description: '等待管理员审核',
    canEdit: true
  },
  approved: {
    label: '已发布',
    color: 'bg-green-100 text-green-800',
    description: '已通过审核并发布',
    canEdit: false
  },
  rejected: {
    label: '已拒绝',
    color: 'bg-red-100 text-red-800',
    description: '审核未通过',
    canEdit: true
  },
  draft: {
    label: '草稿',
    color: 'bg-gray-100 text-gray-800',
    description: '用户保存的草稿',
    canEdit: true
  }
}

export const hasPermission = (userRole: UserRole, permissionKey: string): boolean => {
  const permissions = ROLE_PERMISSIONS[userRole]
  return permissions.some(permission => permission.key === permissionKey)
}

export const inheritsRole = (userRole: UserRole, targetRole: UserRole): boolean => {
  if (userRole === targetRole) return true
  if (userRole === 'admin') return true
  if (userRole === 'moderator' && targetRole === 'user') return true
  return false
}

export const getAccessibleMenuItems = (userRole: UserRole) => {
  const dashboardItem = [
    { name: 'Dashboard', href: '/mgr', icon: '📊', roles: ['moderator', 'admin'] }
  ]
  
  const managerItems = [
    { name: 'Users', href: '/mgr/users', icon: '👥', roles: ['moderator', 'admin'] },
    { name: 'Slangs', href: '/mgr/slang', icon: '📝', roles: ['moderator', 'admin'] },
    { name: 'Categories', href: '/mgr/categories', icon: '📁', roles: ['moderator', 'admin'] },
    { name: 'Tags', href: '/mgr/tags', icon: '🏷️', roles: ['moderator', 'admin'] },
    { name: 'Comments', href: '/mgr/comments', icon: '💬', roles: ['moderator', 'admin'] },
    { name: 'Reports', href: '/mgr/reports', icon: '🚩', roles: ['moderator', 'admin'] },
    { name: 'Stats', href: '/mgr/stats', icon: '📈', roles: ['moderator', 'admin'] },
    { name: 'Notifications', href: '/mgr/notifications', icon: '🔔', roles: ['moderator', 'admin'] },
    { name: 'Emails', href: '/mgr/emails', icon: '📧', roles: ['moderator', 'admin'] }
  ]
  
  const adminItems = [
    { name: 'Moderators', href: '/mgr/moderators', icon: '👑', roles: ['admin'] },
    { name: 'Locales', href: '/mgr/locales', icon: '🌍', roles: ['admin'] },
    { name: 'Logs', href: '/mgr/logs', icon: '🔍', roles: ['admin'] },
    { name: 'Advertisements', href: '/mgr/advertisements', icon: '📢', roles: ['admin'] },
    { name: 'Ad Slots', href: '/mgr/advertisement-slots', icon: '📺', roles: ['admin'] },
    { name: 'Ad Stats', href: '/mgr/ad-stats', icon: '📊', roles: ['admin'] },
    { name: 'Configuration', href: '/mgr/config', icon: '⚙️', roles: ['admin'] }
  ]
  
  return [
    ...dashboardItem,
    ...managerItems.filter(item => item.roles.includes(userRole)),
    ...adminItems.filter(item => item.roles.includes(userRole))
  ]
}

export default {
  ROLE_PERMISSIONS,
  SLANG_STATUS_CONFIG,
  hasPermission,
  inheritsRole,
  getAccessibleMenuItems
}
