/**
 * AuthService - 用户认证服务
 * 
 * 负责处理微信用户身份识别和用户记录管理
 * 使用 OpenID 作为用户唯一标识，实现无感登录
 */

import Taro from '@tarojs/taro'

// Supabase 配置
const SUPABASE_URL = 'https://civlywqsdzzrvsutlrxx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpdmx5d3FzZHp6cnZzdXRscnh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NTkzODUsImV4cCI6MjA4MDMzNTM4NX0.vHueW-6OoZg1srGLzMvRGS1Cwy1bpyX-isVtJ_z6SbQ'

// 本地存储 key
const STORAGE_KEY_OPENID = 'user_openid'

/**
 * 用户类型定义
 */
export interface User {
  openid: string
  last_seen: string
  created_at: string
}

/**
 * 认证错误类
 */
export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * 网络错误类
 */
export class NetworkError extends Error {
  public isTimeout: boolean

  constructor(message: string, isTimeout: boolean = false) {
    super(message)
    this.name = 'NetworkError'
    this.isTimeout = isTimeout
  }
}

/**
 * AuthService 类
 * 提供用户认证和管理功能
 */
class AuthService {
  private openid: string | null = null
  private isInitialized: boolean = false

  /**
   * 初始化认证服务
   * 从本地存储加载已保存的 OpenID
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      const storedOpenID = Taro.getStorageSync(STORAGE_KEY_OPENID)
      if (storedOpenID) {
        this.openid = storedOpenID
        console.log('[AuthService] 从本地存储加载 OpenID:', storedOpenID)
      }
      this.isInitialized = true
    } catch (error) {
      console.error('[AuthService] 初始化失败:', error)
      this.isInitialized = true
    }
  }

  /**
   * 获取当前用户的 OpenID
   * 如果未登录，自动调用 wx.login() 获取
   * 
   * @returns Promise<string> - 用户的 OpenID
   * @throws AuthError - 登录失败时抛出错误
   */
  async getOpenID(): Promise<string> {
    // 确保已初始化
    if (!this.isInitialized) {
      await this.initialize()
    }

    // 如果已有 OpenID，直接返回
    if (this.openid) {
      return this.openid
    }

    try {
      // 调用微信登录接口获取 code
      const loginRes = await Taro.login()
      
      if (!loginRes.code) {
        throw new AuthError('微信登录失败：未获取到 code')
      }

      console.log('[AuthService] 微信登录成功，code:', loginRes.code)

      // TODO: 生产环境需要将 code 发送到后端换取真实的 openid
      // 当前使用临时方案：使用 code 的 hash 作为用户标识
      // 这样可以确保同一个用户在不同会话中使用相同的 ID
      const tempOpenID = `temp_${this.hashCode(loginRes.code)}`
      
      // 保存到内存和本地存储
      this.openid = tempOpenID
      Taro.setStorageSync(STORAGE_KEY_OPENID, tempOpenID)
      
      console.log('[AuthService] 生成临时 OpenID:', tempOpenID)
      
      // 确保用户记录存在
      await this.ensureUser(tempOpenID)
      
      return tempOpenID
    } catch (error: any) {
      console.error('[AuthService] 获取 OpenID 失败:', error)
      
      // 如果是 AuthError，直接抛出
      if (error instanceof AuthError) {
        throw error
      }
      
      // 其他错误包装为 AuthError
      throw new AuthError(`获取用户身份失败: ${error.message || error.errMsg || '未知错误'}`)
    }
  }

  /**
   * 确保用户记录存在于数据库中
   * 如果不存在则创建，如果存在则更新 last_seen
   * 
   * @param openid - 用户的 OpenID
   * @returns Promise<void>
   * @throws NetworkError - 网络请求失败时抛出
   */
  async ensureUser(openid: string): Promise<void> {
    try {
      // 先检查用户是否存在
      const checkUrl = `${SUPABASE_URL}/rest/v1/users?openid=eq.${openid}&select=openid`
      
      const checkResponse = await Taro.request({
        url: checkUrl,
        method: 'GET',
        header: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        dataType: 'json',
      })

      const userExists = Array.isArray(checkResponse.data) && checkResponse.data.length > 0

      if (userExists) {
        // 用户存在，更新 last_seen
        console.log('[AuthService] 用户已存在，更新 last_seen')
        await this.updateUserLastSeen(openid)
      } else {
        // 用户不存在，创建新用户
        console.log('[AuthService] 用户不存在，创建新用户')
        await this.createUser(openid)
      }
    } catch (error: any) {
      console.error('[AuthService] 确保用户记录失败:', error)
      throw new NetworkError(
        `用户记录操作失败: ${error.message || error.errMsg || '未知错误'}`,
        error.errMsg?.includes('timeout') || false
      )
    }
  }

  /**
   * 创建新用户记录
   * 
   * @param openid - 用户的 OpenID
   * @private
   */
  private async createUser(openid: string): Promise<void> {
    const url = `${SUPABASE_URL}/rest/v1/users`
    
    const response = await Taro.request({
      url,
      method: 'POST',
      header: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      data: {
        openid,
        last_seen: new Date().toISOString(),
      },
      dataType: 'json',
    })

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(`创建用户失败: HTTP ${response.statusCode}`)
    }

    console.log('[AuthService] 用户创建成功:', openid)
  }

  /**
   * 更新用户的 last_seen 时间戳
   * 
   * @param openid - 用户的 OpenID
   * @private
   */
  private async updateUserLastSeen(openid: string): Promise<void> {
    const url = `${SUPABASE_URL}/rest/v1/users?openid=eq.${openid}`
    
    const response = await Taro.request({
      url,
      method: 'PATCH',
      header: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      data: {
        last_seen: new Date().toISOString(),
      },
      dataType: 'json',
    })

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(`更新用户失败: HTTP ${response.statusCode}`)
    }

    console.log('[AuthService] 用户 last_seen 更新成功:', openid)
  }

  /**
   * 检查用户是否已认证
   * 
   * @returns boolean - 是否已有 OpenID
   */
  isAuthenticated(): boolean {
    return this.openid !== null
  }

  /**
   * 清除认证信息（用于登出）
   */
  clearAuth(): void {
    this.openid = null
    try {
      Taro.removeStorageSync(STORAGE_KEY_OPENID)
      console.log('[AuthService] 认证信息已清除')
    } catch (error) {
      console.error('[AuthService] 清除认证信息失败:', error)
    }
  }

  /**
   * 获取当前缓存的 OpenID（不触发登录）
   * 
   * @returns string | null - 当前的 OpenID，如果未登录则返回 null
   */
  getCurrentOpenID(): string | null {
    return this.openid
  }

  /**
   * 简单的字符串 hash 函数
   * 用于将 code 转换为一致的标识符
   * 
   * @param str - 输入字符串
   * @returns string - hash 值（16进制字符串）
   * @private
   */
  private hashCode(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0')
  }
}

// 导出单例实例
export const authService = new AuthService()

// 导出类型和错误类
export default authService
