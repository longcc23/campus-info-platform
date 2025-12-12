/**
 * Supabase REST API 客户端
 * 直接使用 Taro.request 调用 Supabase REST API，避免 SDK 的 polyfill 问题
 */

import Taro from '@tarojs/taro'

// Supabase 配置
const SUPABASE_URL = 'https://civlywqsdzzrvsutlrxx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpdmx5d3FzZHp6cnZzdXRscnh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NTkzODUsImV4cCI6MjA4MDMzNTM4NX0.vHueW-6OoZg1srGLzMvRGS1Cwy1bpyX-isVtJ_z6SbQ'

/**
 * Events 表类型定义
 */
export interface Event {
  id: number
  title: string
  type: 'recruit' | 'activity' | 'lecture'
  source_group: string
  publish_time: string
  tags: string[]
  key_info: {
    date: string
    time: string
    location: string
    deadline: string
    company?: string // 公司名称（招聘信息）
    position?: string // 岗位名称（可以是多个岗位）
    education?: string // 学历要求
    link?: string // 投递链接/问卷链接
    registration_link?: string // 活动/讲座报名链接
    referral?: boolean // 是否内推
  }
  summary?: string
  raw_content?: string
  is_top: boolean
  status: 'active' | 'inactive' | 'archived' | 'new' | 'urgent'
  poster_color: string
  created_at?: string
  updated_at?: string
}

/**
 * 基础请求方法
 */
async function request<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: any
    params?: Record<string, any>
  } = {}
): Promise<{ data: T | null; error: any }> {
  const { method = 'GET', body, params } = options

  // 构建 URL
  let url = `${SUPABASE_URL}/rest/v1/${endpoint}`
  
  // 添加查询参数
  if (params && Object.keys(params).length > 0) {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&')
    url += `?${queryString}`
  }

  try {
    const response = await Taro.request({
      url,
      method: method as any,
      header: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      data: body,
      dataType: 'json',
    })

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return {
        data: response.data as T,
        error: null,
      }
    } else {
      return {
        data: null,
        error: {
          message: `HTTP ${response.statusCode}`,
          details: response.data,
        },
      }
    }
  } catch (error: any) {
    console.error('Supabase REST API 请求失败:', error)
    return {
      data: null,
      error: {
        message: error.errMsg || 'Network error',
        details: error,
      },
    }
  }
}

/**
 * 获取所有活动
 */
export async function getEvents(filters?: {
  type?: 'recruit' | 'activity' | 'lecture'
  status?: string
  limit?: number
}): Promise<{ data: Event[] | null; error: any }> {
  const params: Record<string, any> = {
    order: 'is_top.desc,publish_time.desc',
  }

  if (filters?.type) {
    params.type = `eq.${filters.type}`
  }

  if (filters?.status) {
    params.status = `eq.${filters.status}`
  }

  if (filters?.limit) {
    params.limit = filters.limit
  }

  // 构建查询字符串（Supabase PostgREST 格式）
  const queryParams: Record<string, string> = {
    order: 'is_top.desc,publish_time.desc',
  }

  if (filters?.type) {
    queryParams.type = `eq.${filters.type}`
  }

  if (filters?.status) {
    queryParams.status = `eq.${filters.status}`
  }

  if (filters?.limit) {
    queryParams.limit = String(filters.limit)
  }

  // 按置顶优先，然后按创建时间倒序（最新的在前）
  // 默认只获取已发布（active）的活动，排除草稿（inactive）和已下架（archived）
  let url = `${SUPABASE_URL}/rest/v1/events?order=is_top.desc,created_at.desc`
  
  // 如果没有指定状态，默认只获取 active 状态（已发布）
  if (filters?.status) {
    url += `&status=eq.${filters.status}`
  } else {
    // 默认只显示已发布的活动，排除已下架的
    url += `&status=eq.active`
  }
  
  if (filters?.type) {
    url += `&type=eq.${filters.type}`
  }
  
  if (filters?.limit) {
    url += `&limit=${filters.limit}`
  }

  try {
    const response = await Taro.request({
      url,
      method: 'GET',
      header: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      dataType: 'json',
    })

    if (response.statusCode >= 200 && response.statusCode < 300) {
      // 过滤掉已下架（archived）的活动（作为额外的保险措施）
      const events = (response.data as Event[]).filter(
        event => event.status !== 'archived'
      )
      
      return {
        data: events,
        error: null,
      }
    } else {
      return {
        data: null,
        error: {
          message: `HTTP ${response.statusCode}`,
          details: response.data,
        },
      }
    }
  } catch (error: any) {
    console.error('获取活动失败:', error)
    return {
      data: null,
      error: {
        message: error.errMsg || 'Network error',
        details: error,
      },
    }
  }
}

/**
 * 根据 ID 获取单个活动
 */
export async function getEventById(id: number): Promise<{ data: Event | null; error: any }> {
  const url = `${SUPABASE_URL}/rest/v1/events?id=eq.${id}&limit=1`

  try {
    const response = await Taro.request({
      url,
      method: 'GET',
      header: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      dataType: 'json',
    })

    if (response.statusCode >= 200 && response.statusCode < 300) {
      const events = response.data as Event[]
      return {
        data: events && events.length > 0 ? events[0] : null,
        error: null,
      }
    } else {
      return {
        data: null,
        error: {
          message: `HTTP ${response.statusCode}`,
          details: response.data,
        },
      }
    }
  } catch (error: any) {
    console.error('获取活动失败:', error)
    return {
      data: null,
      error: {
        message: error.errMsg || 'Network error',
        details: error,
      },
    }
  }
}

/**
 * 创建新活动（需要认证）
 */
export async function createEvent(
  event: Omit<Event, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: Event | null; error: any }> {
  const url = `${SUPABASE_URL}/rest/v1/events`

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
      data: event,
      dataType: 'json',
    })

    if (response.statusCode >= 200 && response.statusCode < 300) {
      const events = Array.isArray(response.data) ? response.data : [response.data]
      return {
        data: events[0] as Event,
        error: null,
      }
    } else {
      return {
        data: null,
        error: {
          message: `HTTP ${response.statusCode}`,
          details: response.data,
        },
      }
    }
  } catch (error: any) {
    console.error('创建活动失败:', error)
    return {
      data: null,
      error: {
        message: error.errMsg || 'Network error',
        details: error,
      },
    }
  }
}

/**
 * 更新活动（需要认证）
 */
export async function updateEvent(
  id: number,
  updates: Partial<Event>
): Promise<{ data: Event | null; error: any }> {
  const url = `${SUPABASE_URL}/rest/v1/events?id=eq.${id}`

  try {
    const response = await Taro.request({
      url,
      method: 'PATCH',
      header: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      data: updates,
      dataType: 'json',
    })

    if (response.statusCode >= 200 && response.statusCode < 300) {
      const events = Array.isArray(response.data) ? response.data : [response.data]
      return {
        data: events[0] as Event,
        error: null,
      }
    } else {
      return {
        data: null,
        error: {
          message: `HTTP ${response.statusCode}`,
          details: response.data,
        },
      }
    }
  } catch (error: any) {
    console.error('更新活动失败:', error)
    return {
      data: null,
      error: {
        message: error.errMsg || 'Network error',
        details: error,
      },
    }
  }
}

/**
 * ============================================
 * 用户和收藏相关 API
 * ============================================
 */

/**
 * 获取微信用户 OpenID
 * 注意：实际项目中应该将 code 发送到后端换取 openid
 * 这里使用临时方案，生产环境需要后端接口
 */
export async function getWechatOpenID(): Promise<string | null> {
  try {
    // 先尝试从本地存储获取已保存的用户 ID
    const storedUserId = Taro.getStorageSync('user_openid')
    if (storedUserId) {
      console.log('从本地存储获取用户 ID:', storedUserId)
      return storedUserId
    }
    
    // 如果没有，则获取新的
    const loginRes = await Taro.login()
    if (loginRes.code) {
      // TODO: 调用后端接口获取 openid
      // 临时方案：使用 code 的 hash 作为用户标识
      // 生产环境必须使用真实的 openid
      const tempId = `temp_${loginRes.code.substring(0, 16)}`
      
      // 保存到本地存储，确保刷新后也能使用同一个 ID
      Taro.setStorageSync('user_openid', tempId)
      console.log('生成并保存新的用户 ID:', tempId)
      return tempId
    }
    return null
  } catch (error) {
    console.error('获取微信 OpenID 失败:', error)
    // 如果获取失败，尝试从本地存储获取
    try {
      const storedUserId = Taro.getStorageSync('user_openid')
      if (storedUserId) {
        console.log('获取失败，使用本地存储的用户 ID:', storedUserId)
        return storedUserId
      }
    } catch (e) {
      console.error('从本地存储获取用户 ID 失败:', e)
    }
    return null
  }
}

/**
 * 创建或更新用户记录
 */
export async function upsertUser(openid: string): Promise<{ data: any; error: any }> {
  const url = `${SUPABASE_URL}/rest/v1/users`
  
  try {
    const response = await Taro.request({
      url,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'resolution=merge-duplicates', // 如果存在则更新
      },
      data: {
        openid,
        last_seen: new Date().toISOString(),
      },
      dataType: 'json',
    })

    return { data: response.data, error: null }
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.errMsg || 'Network error',
        details: error,
      },
    }
  }
}

/**
 * 添加收藏
 */
export async function addFavorite(userId: string, eventId: number): Promise<{ data: any; error: any }> {
  const url = `${SUPABASE_URL}/rest/v1/favorites`
  
  try {
    const response = await Taro.request({
      url,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      data: {
        user_id: userId,
        event_id: eventId,
      },
      dataType: 'json',
    })

    return { data: response.data, error: null }
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.errMsg || 'Network error',
        details: error,
      },
    }
  }
}

/**
 * 取消收藏
 */
export async function removeFavorite(userId: string, eventId: number): Promise<{ data: any; error: any }> {
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

    return { data: response.data, error: null }
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.errMsg || 'Network error',
        details: error,
      },
    }
  }
}

/**
 * 获取用户收藏列表
 */
export async function getFavorites(userId: string): Promise<{ data: Event[] | null; error: any }> {
  // 先获取收藏的 event_id 列表
  const favoritesUrl = `${SUPABASE_URL}/rest/v1/favorites?user_id=eq.${userId}&select=event_id&order=created_at.desc`
  
  try {
    const favoritesResponse = await Taro.request({
      url: favoritesUrl,
      method: 'GET',
      header: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      dataType: 'json',
    })

    if (favoritesResponse.statusCode !== 200 || !Array.isArray(favoritesResponse.data) || favoritesResponse.data.length === 0) {
      return { data: [], error: null }
    }

    // 提取 event_id 列表
    const eventIds = favoritesResponse.data.map((item: any) => item.event_id)
    
    // 批量获取 events（使用 in 查询）
    const eventIdsStr = eventIds.join(',')
    const eventsUrl = `${SUPABASE_URL}/rest/v1/events?id=in.(${eventIdsStr})&order=created_at.desc`
    
    const eventsResponse = await Taro.request({
      url: eventsUrl,
      method: 'GET',
      header: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      dataType: 'json',
    })

    if (eventsResponse.statusCode === 200 && Array.isArray(eventsResponse.data)) {
      return { data: eventsResponse.data as Event[], error: null }
    }

    return { data: [], error: null }
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.errMsg || 'Network error',
        details: error,
      },
    }
  }
}

/**
 * 检查用户是否收藏了某个活动
 */
export async function checkFavorite(userId: string, eventId: number): Promise<boolean> {
  const url = `${SUPABASE_URL}/rest/v1/favorites?user_id=eq.${userId}&event_id=eq.${eventId}&select=id&limit=1`
  
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

    return response.statusCode === 200 && Array.isArray(response.data) && response.data.length > 0
  } catch (error) {
    console.error('检查收藏状态失败:', error)
    return false
  }
}

/**
 * 记录浏览历史
 */
export async function recordViewHistory(userId: string, eventId: number): Promise<void> {
  const url = `${SUPABASE_URL}/rest/v1/view_history`
  
  try {
    await Taro.request({
      url,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      data: {
        user_id: userId,
        event_id: eventId,
      },
      dataType: 'json',
    })
  } catch (error) {
    // 静默失败，不影响用户体验
    console.error('记录浏览历史失败:', error)
  }
}

/**
 * 清除用户浏览历史
 */
export async function clearViewHistory(userId: string): Promise<{ data: any; error: any }> {
  const url = `${SUPABASE_URL}/rest/v1/view_history?user_id=eq.${userId}`
  
  try {
    const response = await Taro.request({
      url,
      method: 'DELETE',
      header: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })

    return { data: response.data, error: null }
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.errMsg || 'Network error',
        details: error,
      },
    }
  }
}

/**
 * 获取用户浏览历史
 */
export async function getViewHistory(userId: string): Promise<{ data: Event[] | null; error: any }> {
  // 先获取浏览历史的 event_id 列表
  const historyUrl = `${SUPABASE_URL}/rest/v1/view_history?user_id=eq.${userId}&select=event_id&order=viewed_at.desc&limit=20`
  
  try {
    const historyResponse = await Taro.request({
      url: historyUrl,
      method: 'GET',
      header: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      dataType: 'json',
    })

    if (historyResponse.statusCode !== 200 || !Array.isArray(historyResponse.data) || historyResponse.data.length === 0) {
      return { data: [], error: null }
    }

    // 提取 event_id 列表（保持浏览时间顺序）
    const historyItems = historyResponse.data as Array<{ event_id: number }>
    const eventIds = historyItems.map((item: any) => item.event_id)
    const eventIdOrder = new Map<number, number>()
    eventIds.forEach((id, index) => eventIdOrder.set(id, index))
    
    // 批量获取 events（使用 in 查询）
    const eventIdsStr = eventIds.join(',')
    const eventsUrl = `${SUPABASE_URL}/rest/v1/events?id=in.(${eventIdsStr})`
    
    const eventsResponse = await Taro.request({
      url: eventsUrl,
      method: 'GET',
      header: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      dataType: 'json',
    })

    if (eventsResponse.statusCode === 200 && Array.isArray(eventsResponse.data)) {
      const events = eventsResponse.data as Event[]
      // 按照浏览时间顺序排序
      const sortedEvents = events.sort((a, b) => {
        const orderA = eventIdOrder.get(a.id) ?? Infinity
        const orderB = eventIdOrder.get(b.id) ?? Infinity
        return orderA - orderB
      })
      return { data: sortedEvents, error: null }
    }

    return { data: [], error: null }
  } catch (error: any) {
    return {
      data: null,
      error: {
        message: error.errMsg || 'Network error',
        details: error,
      },
    }
  }
}

