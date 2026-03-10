/**
 * 通用API调用Hooks
 * 解决重复的API请求和错误处理逻辑
 */

import { useCallback } from 'react'
import { useApiState } from './index'

// API配置接口
interface ApiConfig {
  baseUrl?: string
  headers?: Record<string, string>
  timeout?: number
}

// 请求选项
interface RequestOptions extends RequestInit {
  timeout?: number
}

// API响应格式
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// CRUD操作类型
type CrudOperation = 'create' | 'read' | 'update' | 'delete' | 'list'

// 通用API Hook
export const useApi = <T = any>(config: ApiConfig = {}) => {
  const apiState = useApiState<T>()
  const { setLoading, setError, setData } = apiState

  // 基础请求函数
  const request = useCallback(async <R = any>(
    url: string,
    options: RequestOptions = {}
  ): Promise<R | null> => {
    setLoading(true)
    setError(null)

    try {
      // 合并配置
      const finalOptions: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
          ...options.headers
        },
        ...options
      }

      // 构建完整URL
      const fullUrl = config.baseUrl ? `${config.baseUrl}${url}` : url

      // 处理超时
      let timeoutId: NodeJS.Timeout | undefined
      if (options.timeout || config.timeout) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(
            () => reject(new Error('Request timeout')),
            options.timeout || config.timeout || 10000
          )
        })
        
        const fetchPromise = fetch(fullUrl, finalOptions)
        const response = await Promise.race([fetchPromise, timeoutPromise])
        if (timeoutId) clearTimeout(timeoutId)
        return response as R
      }

      const response = await fetch(fullUrl, finalOptions)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data as R
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      console.error('API request failed:', error)
      return null
    } finally {
      setLoading(false)
    }
  }, [config, setLoading, setError])

  // GET请求
  const get = useCallback(async <R = T>(url: string, params?: Record<string, any>) => {
    let finalUrl = url
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      finalUrl += `?${searchParams.toString()}`
    }
    
    const result = await request<R>(finalUrl, { method: 'GET' })
    if (result) {
      setData(result as unknown as T)
    }
    return result
  }, [request, setData])

  // POST请求
  const post = useCallback(async <R = T>(url: string, data?: any) => {
    const result = await request<R>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
    if (result) {
      setData(result as unknown as T)
    }
    return result
  }, [request, setData])

  // PUT请求
  const put = useCallback(async <R = T>(url: string, data?: any) => {
    const result = await request<R>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
    if (result) {
      setData(result as unknown as T)
    }
    return result
  }, [request, setData])

  // DELETE请求
  const del = useCallback(async <R = T>(url: string) => {
    const result = await request<R>(url, { method: 'DELETE' })
    if (result) {
      setData(result as unknown as T)
    }
    return result
  }, [request, setData])

  return {
    ...apiState,
    request,
    get,
    post,
    put,
    delete: del
  }
}

// CRUD API工厂函数
export const createCrudApi = <T = any>(basePath: string, config?: ApiConfig) => {
  const api = useApi<T>(config)

  return {
    // 列表查询
    list: (params?: Record<string, any>) => api.get<T[]>(`${basePath}`, params),
    
    // 单个查询
    getById: (id: string | number) => api.get<T>(`${basePath}/${id}`),
    
    // 创建
    create: (data: Partial<T>) => api.post<T>(`${basePath}`, data),
    
    // 更新
    update: (id: string | number, data: Partial<T>) => api.put<T>(`${basePath}/${id}`, data),
    
    // 删除
    remove: (id: string | number) => api.delete<T>(`${basePath}/${id}`),
    
    // 批量操作
    batchDelete: (ids: (string | number)[]) => api.post(`${basePath}/batch-delete`, { ids }),
    
    // API状态
    ...api
  }
}

// 互动操作API Hook（点赞、收藏、浏览等）
export const useInteractionApi = (config?: ApiConfig) => {
  const api = useApi(config)

  return {
    // 点赞/取消点赞
    toggleLike: async (slangId: string, userId: string) => {
      return await api.post<{ isLiked: boolean }>('/api/like', { slangId, userId })
    },

    // 收藏/取消收藏
    toggleFavorite: async (slangId: string, userId: string) => {
      return await api.post<{ isFavorited: boolean }>('/api/favorite', { slangId, userId })
    },

    // 增加浏览量
    incrementViews: async (slangId: string) => {
      return await api.post<{ views: number }>('/api/views', { slangId })
    },

    // 分享
    share: async (slangId: string, userId?: string) => {
      const data: any = { slangId }
      if (userId) data.userId = userId
      return await api.post('/api/share', data)
    },

    // 评论点赞
    toggleCommentLike: async (commentId: number, userId: string) => {
      return await api.post<{ isLiked: boolean }>('/api/comment/like', { commentId, userId })
    },

    // 提交评论
    submitComment: async (slangId: string, content: string, parentId?: number, userId?: string) => {
      const data: any = { slangId, content }
      if (parentId) data.parentId = parentId
      if (userId) data.userId = userId
      return await api.post('/api/comment/submit', data)
    },

    // API状态
    ...api
  }
}

// 搜索API Hook
export const useSearchApi = (config?: ApiConfig) => {
  const api = useApi(config)

  return {
    // 搜索俚语
    searchSlang: async (keyword: string, filters?: {
      category?: string
      tag?: string
      page?: number
      limit?: number
    }) => {
      const params: Record<string, any> = { keyword }
      if (filters) {
        Object.assign(params, filters)
      }
      return await api.get('/api/search', params)
    },

    // 搜索用户
    searchUsers: async (keyword: string, page = 1, limit = 10) => {
      return await api.get('/mgr/api/users', { search: keyword, page, limit })
    },

    // 搜索评论
    searchComments: async (keyword: string, page = 1, limit = 10) => {
      return await api.get('/mgr/api/comments', { search: keyword, page, limit })
    },

    // API状态
    ...api
  }
}

// 管理API Hook
export const useAdminApi = (config?: ApiConfig) => {
  const api = useApi(config)

  return {
    // 用户管理
    getUsers: (params?: Record<string, any>) => api.get('/mgr/api/users', params),
    getUserById: (id: string) => api.get(`/mgr/api/users/${id}`),
    createUser: (userData: any) => api.post('/mgr/api/users', userData),
    updateUser: (id: string, userData: any) => api.put(`/mgr/api/users/${id}`, userData),
    deleteUser: (id: string) => api.delete(`/mgr/api/users/${id}`),

    // 日志管理
    getLogs: (params?: Record<string, any>) => api.get('/mgr/api/logs', params),

    // 配置管理
    getConfig: () => api.get('/mgr/api/config'),
    updateConfig: (configData: any) => api.post('/mgr/api/config', configData),

    // 统计数据
    getStats: () => api.get('/mgr/api/stats'),

    // API状态
    ...api
  }
}

// 文件上传Hook
export const useFileUpload = (config?: ApiConfig) => {
  const apiState = useApiState<{ url: string }>()
  const { setLoading, setError, setData } = apiState

  const upload = useCallback(async (file: File, endpoint: string = '/api/upload') => {
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          ...config?.headers
        }
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      setData(result)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setError(errorMessage)
      console.error('File upload failed:', error)
      return null
    } finally {
      setLoading(false)
    }
  }, [config?.headers, setLoading, setError, setData])

  return {
    ...apiState,
    upload
  }
}