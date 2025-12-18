/**
 * AuthService - 用户认证服务
 * 
 * 负责处理微信用户身份识别和用户记录管理
 * 使用 OpenID 作为用户唯一标识，实现无感登录
 */

import Taro from '@tarojs/taro'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/supabase'

// 本地存储 key
const STORAGE_KEY_OPENID = 'user_openid'

/**
 * 用户类型定义
 */
export interface User {
  openid: string
  last_seen: string
  created_at: string
  nickname?: string
  avatar_url?: string
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
      // 只有当存储的是真正的 OpenID（不以 temp_ 或 user_ 开头）时才加载
      if (storedOpenID && !storedOpenID.startsWith('temp_') && !storedOpenID.startsWith('user_')) {
        this.openid = storedOpenID
        console.log('[AuthService] 从本地存储加载真实 OpenID:', storedOpenID)
      }
      this.isInitialized = true
    } catch (error) {
      console.error('[AuthService] 初始化失败:', error)
      this.isInitialized = true
    }
  }

  /**
   * 获取当前用户的 OpenID
   * 优先尝试微信云函数（最稳定），失败后回退到本地临时 ID
   * 
   * @returns Promise<string> - 用户的 OpenID
   * @throws AuthError - 登录失败时抛出错误
   */
  async getOpenID(): Promise<string> {
    // 确保已初始化
    if (!this.isInitialized) {
      await this.initialize()
    }

    // 1. 如果内存中已有，直接返回
    if (this.openid) {
      return this.openid
    }

    // 2. 尝试从本地缓存读取（如果是真正的 OpenID，不是以 user_ 或 temp_ 开头）
    const cachedOpenID = Taro.getStorageSync(STORAGE_KEY_OPENID)
    if (cachedOpenID && !cachedOpenID.startsWith('user_') && !cachedOpenID.startsWith('temp_')) {
      this.openid = cachedOpenID
      return cachedOpenID
    }

    try {
      console.log('[AuthService] 正在通过云函数获取 OpenID...')
      
      // 🚀 优先调用微信云函数获取真正的 OpenID
      if (Taro.cloud) {
        const res = await Taro.cloud.callFunction({
          name: 'login',
          data: {}
        })
        
        const result = res.result as any
        if (result && result.openid) {
          const realOpenID = result.openid
          console.log('[AuthService] 云函数获取 OpenID 成功:', realOpenID)
          
          this.openid = realOpenID
          Taro.setStorageSync(STORAGE_KEY_OPENID, realOpenID)
          
          // 确保用户记录存在
          await this.ensureUser(realOpenID)
          return realOpenID
        }
      }
      
      throw new Error('Cloud function failed or returned empty')
      
    } catch (cloudError) {
      console.warn('[AuthService] 云函数获取 OpenID 失败，尝试回退方案:', cloudError)
      
      // 3. 回退方案：执行原有的微信登录获取 code
      try {
        const loginRes = await Taro.login()
        
        if (!loginRes.code) {
          throw new AuthError('微信登录失败：未获取到 code')
        }

        const tempOpenID = `user_${this.hashCode(loginRes.code)}`
        
        this.openid = tempOpenID
        Taro.setStorageSync(STORAGE_KEY_OPENID, tempOpenID)
        
        // 确保用户记录存在
        await this.ensureUser(tempOpenID)
        
        return tempOpenID
      } catch (error: any) {
        console.error('[AuthService] 获取 OpenID 失败:', error)
        
        if (error instanceof AuthError) {
          throw error
        }
        
        throw new AuthError(`获取用户身份失败: ${error.message || error.errMsg || '未知错误'}`)
      }
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
   * 获取当前用户的完整个人资料
   */
  async getUserProfile(): Promise<User | null> {
    const openid = await this.getOpenID()
    try {
      const url = `${SUPABASE_URL}/rest/v1/users?openid=eq.${openid}&select=*`
      const response = await Taro.request({
        url,
        method: 'GET',
        header: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
      })

      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0] as User
      }
      return null
    } catch (error) {
      console.error('[AuthService] 获取个人资料失败:', error)
      return null
    }
  }

  /**
   * 更新当前用户的个人资料
   */
  async updateUserProfile(profile: Partial<Pick<User, 'nickname' | 'avatar_url'>>): Promise<boolean> {
    const openid = await this.getOpenID()
    try {
      const url = `${SUPABASE_URL}/rest/v1/users?openid=eq.${openid}`
      const response = await Taro.request({
        url,
        method: 'PATCH',
        header: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        data: profile
      })

      return response.statusCode >= 200 && response.statusCode < 300
    } catch (error) {
      console.error('[AuthService] 更新个人资料失败:', error)
      return false
    }
  }

  /**
   * 检查用户是否已完成资料设置（是否有昵称）
   */
  async isProfileComplete(): Promise<boolean> {
    const profile = await this.getUserProfile()
    return !!(profile && profile.nickname && profile.nickname !== 'UniFlow 用户')
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
