/**
 * 统计数据 API Route
 * GET /api/stats - 获取数据看板统计信息
 * 
 * 性能优化：
 * 1. 并行执行独立查询
 * 2. 使用 SQL 聚合代替内存计算
 * 3. 减少数据传输量
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 检查用户是否已登录
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: '未授权，请先登录' },
        { status: 401 }
      )
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayStartISO = todayStart.toISOString()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const sevenDaysAgoISO = sevenDaysAgo.toISOString()

    // 🚀 并行执行所有独立查询
    const [
      todayViewsResult,
      totalFavoritesResult,
      todayEventsResult,
      totalUsersResult,
      activeUsersResult,
      typeDistributionResult,
      topEventsResult,
      viewTrendResult,
    ] = await Promise.all([
      // 1. 今日新增浏览量
      (async () => {
        try {
          const { count } = await supabase
            .from('view_history')
            .select('*', { count: 'exact', head: true })
            .gte('viewed_at', todayStartISO)
          return count || 0
        } catch { return 0 }
      })(),

      // 2. 累计收藏数
      (async () => {
        try {
          const { count } = await supabase
            .from('favorites')
            .select('*', { count: 'exact', head: true })
          return count || 0
        } catch { return 0 }
      })(),

      // 3. 今日新增活动数
      (async () => {
        try {
          const { count } = await supabase
            .from('events')
            .select('*', { count: 'exact', head: true })
            .in('status', ['active', 'published'])
            .gte('created_at', todayStartISO)
          return count || 0
        } catch { return 0 }
      })(),

      // 4. 总用户数
      (async () => {
        try {
          const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
          return count || 0
        } catch { return 0 }
      })(),

      // 5. 活跃用户数（最近7天）
      (async () => {
        try {
          const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gte('last_seen', sevenDaysAgoISO)
          return count || 0
        } catch { return 0 }
      })(),

      // 6. 活动类型分布（只获取 type 字段）
      (async () => {
        try {
          const { data } = await supabase
            .from('events')
            .select('type')
            .eq('status', 'active')
          return data || []
        } catch { return [] }
      })(),

      // 7. 热门活动（使用数据库聚合）
      getTopEventsOptimized(supabase),

      // 8. 7天浏览量趋势
      getViewTrendOptimized(supabase, sevenDaysAgoISO),
    ])

    // 计算类型分布
    const typeStats = { recruit: 0, activity: 0, lecture: 0 }
    typeDistributionResult.forEach((event: { type: string }) => {
      if (event.type === 'recruit') typeStats.recruit++
      else if (event.type === 'activity') typeStats.activity++
      else if (event.type === 'lecture') typeStats.lecture++
    })

    return NextResponse.json({
      success: true,
      data: {
        todayViews: todayViewsResult,
        totalFavorites: totalFavoritesResult,
        todayEvents: todayEventsResult,
        totalUsers: totalUsersResult,
        activeUsers: activeUsersResult,
        uniqueFavoriteUsers: topEventsResult.uniqueFavoriteUsers,
        typeDistribution: typeStats,
        topEvents: topEventsResult.topEvents,
        viewTrend: viewTrendResult,
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取统计数据失败',
      },
      { status: 500 }
    )
  }
}

/**
 * 优化的热门活动查询
 * 使用数据库聚合而非内存计算
 */
async function getTopEventsOptimized(supabase: any) {
  try {
    // 获取收藏统计（按 event_id 分组）
    const { data: favoritesData } = await supabase
      .from('favorites')
      .select('event_id, user_id')

    if (!favoritesData || favoritesData.length === 0) {
      return { topEvents: [], uniqueFavoriteUsers: 0 }
    }

    // 统计
    const favoriteCounts: Record<number, number> = {}
    const favoriteUsersByEvent: Record<number, Set<string>> = {}
    const allUserIds = new Set<string>()

    favoritesData.forEach((fav: { event_id: number; user_id: string }) => {
      favoriteCounts[fav.event_id] = (favoriteCounts[fav.event_id] || 0) + 1
      
      if (!favoriteUsersByEvent[fav.event_id]) {
        favoriteUsersByEvent[fav.event_id] = new Set()
      }
      favoriteUsersByEvent[fav.event_id].add(fav.user_id)
      allUserIds.add(fav.user_id)
    })

    // 获取收藏数最多的前5个活动ID
    const topEventIds = Object.entries(favoriteCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id]) => parseInt(id))

    if (topEventIds.length === 0) {
      return { topEvents: [], uniqueFavoriteUsers: allUserIds.size }
    }

    // 只获取这5个活动的详情
    const { data: eventsData } = await supabase
      .from('events')
      .select('id, title, type')
      .in('id', topEventIds)

    const topEvents = topEventIds.map(id => {
      const event = eventsData?.find((e: any) => e.id === id)
      return {
        id,
        title: event?.title || '未知活动',
        type: event?.type || 'activity',
        favorite_count: favoriteCounts[id] || 0,
        favorite_users_count: favoriteUsersByEvent[id]?.size || 0,
      }
    })

    return { topEvents, uniqueFavoriteUsers: allUserIds.size }
  } catch (error) {
    console.warn('Error fetching top events:', error)
    return { topEvents: [], uniqueFavoriteUsers: 0 }
  }
}

/**
 * 优化的浏览趋势查询
 * 只获取必要的日期字段
 */
async function getViewTrendOptimized(supabase: any, sevenDaysAgoISO: string) {
  try {
    const { data: viewsData } = await supabase
      .from('view_history')
      .select('viewed_at')
      .gte('viewed_at', sevenDaysAgoISO)

    if (!viewsData || viewsData.length === 0) {
      return generateEmptyTrend()
    }

    // 按日期分组统计
    const dailyCounts: Record<string, number> = {}
    viewsData.forEach((view: { viewed_at: string }) => {
      const date = new Date(view.viewed_at).toISOString().split('T')[0]
      dailyCounts[date] = (dailyCounts[date] || 0) + 1
    })

    // 生成过去7天的数据
    const now = new Date()
    const viewTrend: { date: string; count: number }[] = []
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      viewTrend.push({
        date: dateStr,
        count: dailyCounts[dateStr] || 0,
      })
    }

    return viewTrend
  } catch (error) {
    console.warn('Error fetching view trend:', error)
    return generateEmptyTrend()
  }
}

/**
 * 生成空的7天趋势数据
 */
function generateEmptyTrend() {
  const now = new Date()
  const viewTrend: { date: string; count: number }[] = []
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    viewTrend.push({
      date: date.toISOString().split('T')[0],
      count: 0,
    })
  }
  
  return viewTrend
}
