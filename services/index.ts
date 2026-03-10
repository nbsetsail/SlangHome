/**
 * 业务API服务
 * 基于统一API客户端封装具体业务逻辑
 */

import { api, apiClient } from '@/lib/apiClient'
import type { ApiResponse } from '@/lib/apiClient'

// 用户相关API
export const userService = {
  // 获取用户信息
  async getUser(id: string): Promise<any> {
    return api.get(`/api/user/${id}`)
  },

  // 获取用户创建的俚语
  async getUserSlang(userId: string, page = 1, limit = 10, locale = 'en'): Promise<any> {
    return api.get(`/api/user/${userId}/slang`, { page, limit, locale })
  },

  // 获取用户评论
  async getUserComments(userId: string, page = 1, limit = 10): Promise<any> {
    return api.get(`/api/user/${userId}/comments`, { page, limit })
  },

  // 获取用户点赞
  async getUserLikes(userId: string, page = 1, limit = 10): Promise<any> {
    return api.get(`/api/user/${userId}/likes`, { page, limit })
  },

  // 获取用户收藏
  async getUserFavorites(userId: string, page = 1, limit = 10, locale = 'en'): Promise<any> {
    return api.get(`/api/user/${userId}/favorites`, { page, limit, locale })
  },

  // 获取用户浏览记录
  async getUserViews(userId: string, page = 1, limit = 10, locale = 'en'): Promise<any> {
    return api.get(`/api/user/${userId}/views`, { page, limit, locale })
  },

  // 获取用户统计信息
  async getUserStats(userId: string): Promise<any> {
    return api.get(`/api/user/${userId}/stats`)
  }
}

// 俚语相关API
export const slangService = {
  // 获取俚语列表
  async getSlangList(params: {
    sort?: string
    page?: number
    limit?: number
    userId?: string
    category?: string
    tag?: string
    search?: string
  } = {}): Promise<any> {
    return api.get('/api/slang', params)
  },

  // 获取单个俚语详情
  async getSlang(id: string, userId?: string): Promise<any> {
    const params = userId ? { userId } : undefined
    return api.get(`/api/slang/${id}`, params)
  },

  // 获取俚语评论
  async getSlangComments(slangId: string, page = 1, userId?: string): Promise<any> {
    const params: any = { slangId, page }
    if (userId) params.userId = userId
    return api.get('/api/slang/comments', params)
  },

  // 获取俚语演变历史
  async getSlangEvolution(slangId: string): Promise<any> {
    return api.get(`/api/slang/evolution?slangId=${slangId}`)
  },

  // 获取基于短语的俚语
  async getSlangByPhrase(phrase: string, userId?: string): Promise<any> {
    const params = userId ? { userId } : undefined
    return api.get(`/api/slang/phrase/${encodeURIComponent(phrase)}`, params)
  },

  // 增加浏览量
  async incrementViews(slangId: string): Promise<any> {
    return api.post('/api/slang/views', { slangId })
  },

  // 分享俚语
  async shareSlang(slangId: string, userId?: string): Promise<any> {
    const data: any = { slangId }
    if (userId) data.userId = userId
    return api.post('/api/slang/share', data)
  }
}

// 互动相关API
export const interactionService = {
  // 点赞/取消点赞
  async toggleLike(slangId: string, userId: string): Promise<any> {
    return api.post('/api/like', { slangId, userId })
  },

  // 收藏/取消收藏
  async toggleFavorite(slangId: string, userId: string): Promise<any> {
    return api.post('/api/favorite', { slangId, userId })
  },

  // 增加浏览量
  async incrementViews(slangId: string): Promise<any> {
    return api.post('/api/views', { slangId })
  },

  // 分享
  async share(slangId: string, userId?: string): Promise<any> {
    const data: any = { slangId }
    if (userId) data.userId = userId
    return api.post('/api/share', data)
  }
}

// 评论相关API
export const commentService = {
  // 提交评论
  async submitComment(data: {
    slangId: string
    content: string
    parentId?: number
    userId?: string
  }): Promise<any> {
    return api.post('/api/comment/submit', data)
  },

  // 点赞/取消点赞评论
  async toggleCommentLike(commentId: number, userId: string): Promise<any> {
    return api.post('/api/comment/like', { commentId, userId })
  },

  // 获取评论回复
  async getCommentReplies(commentId: number, page = 1, userId?: string): Promise<any> {
    const params: any = { commentId, page }
    if (userId) params.userId = userId
    return api.get('/api/comment/replies', params)
  }
}

// 分类和标签API
export const categoryService = {
  // 获取分类列表
  async getCategories(): Promise<any> {
    return api.get('/api/categories')
  },

  // 记录分类点击
  async recordCategoryClick(name: string): Promise<any> {
    return api.post('/api/category/click', { name })
  }
}

export const tagService = {
  // 获取标签列表
  async getTags(): Promise<any> {
    return api.get('/api/tags')
  },

  // 记录标签点击
  async recordTagClick(name: string): Promise<any> {
    return api.post('/api/tag/click', { name })
  }
}

// 搜索API
export const searchService = {
  // 搜索俚语
  async searchSlang(keyword: string, params: {
    page?: number
    limit?: number
    category?: string
    tag?: string
  } = {}): Promise<any> {
    return api.get('/api/search', { keyword, ...params })
  }
}

// 管理后台API
export const adminService = {
  // 用户管理
  async getUsers(params: {
    page?: number
    limit?: number
    search?: string
    status?: string
    role?: string
  } = {}): Promise<ApiResponse<any>> {
    return apiClient.get('/mgr/api/users', params)
  },

  async createUser(userData: any): Promise<ApiResponse<any>> {
    return apiClient.post('/mgr/api/users', userData)
  },

  async updateUser(id: number, userData: any): Promise<ApiResponse<any>> {
    return apiClient.put('/mgr/api/users', { id, ...userData })
  },

  async deleteUser(id: number): Promise<ApiResponse<any>> {
    return apiClient.delete(`/mgr/api/users/${id}`)
  },

  // 日志管理
  async getLogs(params: {
    page?: number
    limit?: number
    type?: string
    search?: string
    startDate?: string
    endDate?: string
  } = {}): Promise<ApiResponse<any>> {
    return apiClient.get('/mgr/api/logs', params)
  },

  // 配置管理
  async getConfig(): Promise<ApiResponse<any>> {
    return apiClient.get('/mgr/api/config')
  },

  async updateConfig(configData: any): Promise<ApiResponse<any>> {
    return apiClient.post('/mgr/api/config', configData)
  },

  // 统计数据
  async getStats(timeDimension: string = 'day'): Promise<ApiResponse<any>> {
    return apiClient.get('/mgr/api/stats', { timeDimension })
  },

  // 俚语管理
  async getSlangList(params: {
    page?: number
    limit?: number
    search?: string
    status?: string
  } = {}): Promise<ApiResponse<any>> {
    return apiClient.get('/mgr/api/slang', params)
  }
}

// 认证相关API
export const authService = {
  // 检查用户名是否可用
  async checkUsername(username: string): Promise<any> {
    return api.get(`/api/auth/check-username?username=${encodeURIComponent(username)}`)
  },

  // 检查邮箱是否可用
  async checkEmail(email: string): Promise<any> {
    return api.get(`/api/auth/check-email?email=${encodeURIComponent(email)}`)
  },

  // 用户注册
  async register(userData: {
    username: string
    email: string
    password: string
  }): Promise<any> {
    return api.post('/api/auth/register', userData)
  },

  // 忘记密码
  async forgotPassword(email: string): Promise<any> {
    return api.post('/api/auth/forgot-password', { email })
  },

  // 重置密码
  async resetPassword(data: {
    token: string
    password: string
  }): Promise<any> {
    return api.post('/api/auth/reset-password', data)
  }
}

// 导出所有服务的聚合对象
export const services = {
  user: userService,
  slang: slangService,
  interaction: interactionService,
  comment: commentService,
  category: categoryService,
  tag: tagService,
  search: searchService,
  admin: adminService,
  auth: authService
}

export default services