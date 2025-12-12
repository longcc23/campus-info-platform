/**
 * FavoritesService - 收藏服务
 * 
 * 负责处理用户收藏功能的所有操作
 * 包括添加收藏、取消收藏、查询收藏状态等
 */

import Taro from '@tarojs/taro'
import authService, { AuthError, NetworkError } from './auth'

// Supabase 配置
const SUPABASE_URL = 'https://civlywqsdzzrvsutlrxx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpdmx5d3FzZHp6cnZzdXRscnh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NTkzODUsImV4cCI6MjA4MDMzNTM4NX0.vHueW-6OoZg1srGLzMvRGS1Cwy1bpyX-isVtJ_z6SbQ'

/**
 * Event 类型定义（从 supabase-rest.ts 复用）
 */
export interface Event {
  id: number
  title: string
  type: 'recruit' | 'activity' | 'lecture'
  source_group: string
  publish_time: string
  tags: string[]
  key_info: {
    date?: string
    time?: string
    location?: string
    deadline?: string
    company?: string
    position?: string
    education?: string
    link?: string
    registration_link?: string  // 活动/讲座报名链接
    referral?: boolean
  }
  summary?: string
  raw_content?: string
  is_top: boolean
  status: 'active' | 'inactive' | 'archived' | 'new' | 'urgent'
  poster_color: string
  created_at?: string
  updated_at?: string
  // 前端扩展字段
  isFavorited?: boolean
}

/**
 * Favorite 类型定义
 */
export interface Favorite {
  id: number
  user_id: string
  event_id: number
  created_at: string
}

/**
 * 收藏操作结果
 */
export interface FavoriteResult {
  success: boolean
  error?: string
}

/**
 * 数据不存在错误类
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

/**
 * FavoritesService 类
 * 提供收藏功能的所有操作
 */
class FavoritesService {
  /**
   * 切换事件的收藏状态
   * 
   * @param eventId - 事件 ID
   * @param isFavorite - true 表示收藏，false 表示取消收藏
   * @returns Promise<boolean> - 操作是否成功
   */
  async toggleFavorite(eventId: number, isFavorite: boolean): Promise<boolean> {
    try {
      // 1. 检查认证
      const userId = await authService.getOpenID()
      if (!userId) {
        throw new AuthError('未登录')
      }

      // 2. 确保用户记录存在
      await authService.ensureUser(userId)

      // 3. 执行操作（带重试）
      const result = await this.retryOnce(async () => {
        if (isFavorite) {
          return await this.addFavorite(userId, eventId)
        } else {
          return await this.removeFavorite(userId, eventId)
        }
      })

      // 4. 显示成功反馈
      Taro.showToast({
        title: isFavorite ? '已收藏' : '已取消收藏',
        icon: 'success',
        duration: 1500,
      })

      return true
    } catch (error: any) {
      // 5. 处理错误
      console.error('[FavoritesService] 收藏操作失败:', error)
      
      let errorMessage = '操作失败，请稍后重试'
      
      if (error instanceof AuthError) {
        errorMessage = '请先登录'
      } else if (error instanceof NetworkError) {
        errorMessage = '收藏失败，请检查网络连接'
      } else if (error instanceof NotFoundError) {
        errorMessage = '该活动已不存在'
      }

      Taro.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 2000,
      })

      return false
    }
  }

  /**
   * 添加收藏
   * 
   * @param userId - 用户 ID
   * @param eventId - 事件 ID
   * @returns Promise<void>
   * @private
   */
  private async addFavorite(userId: string, eventId: number): Promise<void> {
    const url = `${SUPABASE_URL}/rest/v1/favorites`

    try {
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
          user_id: userId,
          event_id: eventId,
        },
        dataType: 'json',
      })

      // 检查响应状态
      if (response.statusCode === 409) {
        // 409 Conflict - 已经收藏过了（幂等性）
        console.log('[FavoritesService] 活动已收藏，跳过')
        return
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        // 检查是否是外键约束错误（活动不存在）
        if (response.data?.message?.includes('foreign key')) {
          throw new NotFoundError('该活动已不存在')
        }
        throw new Error(`添加收藏失败: HTTP ${response.statusCode}`)
      }

      console.log('[FavoritesService] 收藏添加成功')
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error
      }
      
      // 检查是否是网络超时
      const isTimeout = error.errMsg?.includes('timeout') || error.errMsg?.includes('超时')
      throw new NetworkError(
        `添加收藏失败: ${error.message || error.errMsg || '未知错误'}`,
        isTimeout
      )
    }
  }

  /**
   * 取消收藏
   * 
   * @param userId - 用户 ID
   * @param eventId - 事件 ID
   * @returns Promise<void>
   * @private
   */
  private async removeFavorite(userId: string, eventId: number): Promise<void> {
    const url = `${SUPABASE_URL}/rest/v1/favorites?user_id=eq.${userId}&event_id=eq.${eventId}`

    try {
      const response = await Taro.request({
        url,
        method: 'DELETE',
        header: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      })

      // DELETE 操作即使记录不存在也会返回 204（幂等性）
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw new Error(`取消收藏失败: HTTP ${response.statusCode}`)
      }

      console.log('[FavoritesService] 收藏取消成功')
    } catch (error: any) {
      // 检查是否是网络超时
      const isTimeout = error.errMsg?.includes('timeout') || error.errMsg?.includes('超时')
      throw new NetworkError(
        `取消收藏失败: ${error.message || error.errMsg || '未知错误'}`,
        isTimeout
      )
    }
  }

  /**
   * 获取当前用户的所有收藏
   * 
   * @returns Promise<Event[]> - 收藏的事件列表，按收藏时间倒序
   */
  async getFavorites(): Promise<Event[]> {
    try {
      // 1. 获取用户 ID
      const userId = await authService.getOpenID()
      if (!userId) {
        throw new AuthError('未登录')
      }

      // 2. 查询收藏记录（按收藏时间倒序）
      const favoritesUrl = `${SUPABASE_URL}/rest/v1/favorites?user_id=eq.${userId}&select=event_id,created_at&order=created_at.desc`

      const favoritesResponse = await Taro.request({
        url: favoritesUrl,
        method: 'GET',
        header: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        dataType: 'json',
      })

      if (favoritesResponse.statusCode !== 200) {
        throw new Error(`查询收藏失败: HTTP ${favoritesResponse.statusCode}`)
      }

      const favorites = favoritesResponse.data as Array<{ event_id: number; created_at: string }>

      // 如果没有收藏，直接返回空数组
      if (!favorites || favorites.length === 0) {
        return []
      }

      // 3. 批量查询事件详情
      const eventIds = favorites.map(f => f.event_id)
      const events = await this.getEventsByIds(eventIds)

      // 4. 过滤掉已删除的事件，并按收藏时间排序
      const favoriteMap = new Map(favorites.map(f => [f.event_id, f.created_at]))
      const validEvents = events
        .filter(event => event !== null)
        .sort((a, b) => {
          const timeA = favoriteMap.get(a.id) || ''
          const timeB = favoriteMap.get(b.id) || ''
          return timeB.localeCompare(timeA) // 倒序
        })

      return validEvents
    } catch (error: any) {
      console.error('[FavoritesService] 获取收藏列表失败:', error)
      
      if (error instanceof AuthError) {
        throw error
      }
      
      throw new NetworkError(
        `获取收藏列表失败: ${error.message || error.errMsg || '未知错误'}`
      )
    }
  }

  /**
   * 批量查询事件的收藏状态
   * 
   * @param eventIds - 事件 ID 数组
   * @returns Promise<Set<number>> - 已收藏的事件 ID 集合
   */
  async getFavoriteStatus(eventIds: number[]): Promise<Set<number>> {
    if (!eventIds || eventIds.length === 0) {
      return new Set()
    }

    try {
      // 1. 获取用户 ID（不触发登录，如果未登录返回空集合）
      const userId = authService.getCurrentOpenID()
      if (!userId) {
        return new Set()
      }

      // 2. 批量查询收藏状态
      const eventIdsStr = eventIds.join(',')
      const url = `${SUPABASE_URL}/rest/v1/favorites?user_id=eq.${userId}&event_id=in.(${eventIdsStr})&select=event_id`

      const response = await Taro.request({
        url,
        method: 'GET',
        header: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        dataType: 'json',
      })

      if (response.statusCode !== 200) {
        console.error('[FavoritesService] 查询收藏状态失败:', response.statusCode)
        return new Set()
      }

      const favorites = response.data as Array<{ event_id: number }>
      return new Set(favorites.map(f => f.event_id))
    } catch (error: any) {
      console.error('[FavoritesService] 批量查询收藏状态失败:', error)
      return new Set()
    }
  }

  /**
   * 检查单个事件是否已收藏
   * 
   * @param eventId - 事件 ID
   * @returns Promise<boolean> - 是否已收藏
   */
  async isFavorited(eventId: number): Promise<boolean> {
    try {
      const userId = authService.getCurrentOpenID()
      if (!userId) {
        return false
      }

      const url = `${SUPABASE_URL}/rest/v1/favorites?user_id=eq.${userId}&event_id=eq.${eventId}&select=id&limit=1`

      const response = await Taro.request({
        url,
        method: 'GET',
        header: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        dataType: 'json',
      })

      return response.statusCode === 200 && Array.isArray(response.data) && response.data.length > 0
    } catch (error: any) {
      console.error('[FavoritesService] 检查收藏状态失败:', error)
      return false
    }
  }

  /**
   * 根据 ID 数组批量获取事件
   * 
   * @param eventIds - 事件 ID 数组
   * @returns Promise<Event[]> - 事件列表
   * @private
   */
  private async getEventsByIds(eventIds: number[]): Promise<Event[]> {
    if (!eventIds || eventIds.length === 0) {
      return []
    }

    const eventIdsStr = eventIds.join(',')
    const url = `${SUPABASE_URL}/rest/v1/events?id=in.(${eventIdsStr})`

    try {
      const response = await Taro.request({
        url,
        method: 'GET',
        header: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        dataType: 'json',
      })

      if (response.statusCode === 200 && Array.isArray(response.data)) {
        return response.data as Event[]
      }

      return []
    } catch (error: any) {
      console.error('[FavoritesService] 批量获取事件失败:', error)
      return []
    }
  }

  /**
   * 重试逻辑：网络超时时重试一次
   * 
   * @param operation - 要执行的操作
   * @returns Promise<T> - 操作结果
   * @private
   */
  private async retryOnce<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation()
    } catch (error: any) {
      // 只在网络超时时重试
      if (error instanceof NetworkError && error.isTimeout) {
        console.log('[FavoritesService] 网络超时，重试一次')
        return await operation()
      }
      throw error
    }
  }
}

// 导出单例实例
export const favoritesService = new FavoritesService()

// 导出类型和错误类
export default favoritesService
