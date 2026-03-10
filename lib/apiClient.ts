/**
 * 统一API客户端
 * 解决项目中大量重复的fetch调用和错误处理
 */

// API响应类型定义
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// API配置
interface ApiConfig {
  baseUrl?: string
  timeout?: number
  headers?: Record<string, string>
}

// 请求选项
interface RequestOptions extends RequestInit {
  timeout?: number
  showError?: boolean // 是否显示错误提示
}

class ApiClient {
  private config: ApiConfig
  
  constructor(config: ApiConfig = {}) {
    this.config = {
      baseUrl: '',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      ...config
    }
  }

  // 构建完整URL
  private buildUrl(endpoint: string): string {
    if (this.config.baseUrl && !endpoint.startsWith('http')) {
      return `${this.config.baseUrl}${endpoint}`
    }
    return endpoint
  }

  // 处理超时
  private async withTimeout<T>(
    promise: Promise<T>, 
    timeout: number
  ): Promise<T> {
    let timeoutId: NodeJS.Timeout | undefined
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Request timeout'))
      }, timeout)
    })

    try {
      const result = await Promise.race([promise, timeoutPromise])
      if (timeoutId) clearTimeout(timeoutId)
      return result
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId)
      throw error
    }
  }

  // 标准化错误处理
  private handleError(error: unknown, showError: boolean = true): Error {
    let errorMessage: string
    
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    } else {
      errorMessage = 'Unknown error occurred'
    }

    if (showError) {
      console.error('API Error:', errorMessage)
      // 这里可以集成全局错误提示系统
      // toast.showError(errorMessage)
    }

    return new Error(errorMessage)
  }

  // 通用请求方法
  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.config.timeout,
      showError = true,
      headers = {},
      ...fetchOptions
    } = options

    try {
      const url = this.buildUrl(endpoint)
      const finalHeaders = {
        ...this.config.headers,
        ...headers
      }

      const fetchPromise = fetch(url, {
        headers: finalHeaders,
        ...fetchOptions
      })

      const response = timeout 
        ? await this.withTimeout(fetchPromise, timeout)
        : await fetchPromise

      // 检查HTTP状态
      if (!response.ok) {
        const errorText = await response.text()
        let errorData: any
        
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
      }

      // 解析响应数据
      const contentType = response.headers.get('content-type')
      let data: any
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      // 标准化响应格式
      if (typeof data === 'object' && data !== null) {
        if ('success' in data) {
          return data as ApiResponse<T>
        } else {
          return {
            success: true,
            data: data as T
          }
        }
      } else {
        return {
          success: true,
          data: data as T
        }
      }

    } catch (error) {
      const standardizedError = this.handleError(error, showError)
      return {
        success: false,
        error: standardizedError.message
      }
    }
  }

  // GET请求
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      url += (url.includes('?') ? '&' : '?') + searchParams.toString()
    }
    
    return this.request<T>(url, { method: 'GET' })
  }

  // POST请求
  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  // PUT请求
  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    })
  }

  // DELETE请求
  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  // PATCH请求
  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
  }
}

// 创建默认API客户端实例
export const apiClient = new ApiClient({
  baseUrl: typeof window !== 'undefined' ? '' : 'http://localhost:3000'
})

// 便利方法 - 直接返回数据或抛出错误
export const api = {
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const response = await apiClient.get<T>(endpoint, params)
    if (response.success) {
      return response.data as T
    }
    throw new Error(response.error || 'API request failed')
  },

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await apiClient.post<T>(endpoint, data)
    if (response.success) {
      return response.data as T
    }
    throw new Error(response.error || 'API request failed')
  },

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await apiClient.put<T>(endpoint, data)
    if (response.success) {
      return response.data as T
    }
    throw new Error(response.error || 'API request failed')
  },

  async delete<T = any>(endpoint: string): Promise<T> {
    const response = await apiClient.delete<T>(endpoint)
    if (response.success) {
      return response.data as T
    }
    throw new Error(response.error || 'API request failed')
  },

  async patch<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await apiClient.patch<T>(endpoint, data)
    if (response.success) {
      return response.data as T
    }
    throw new Error(response.error || 'API request failed')
  }
}

export default apiClient