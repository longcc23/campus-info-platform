/**
 * 统计数据 API Route
 * GET /api/stats - 获取数据看板统计信息
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

    // 1. 今日新增浏览量 (view_history 表)
    // 注意：如果 view_history 表不存在，返回 0
    let todayViews = 0
    try {
      const { count } = await supabase
        .from('view_history')
        .select('*', { count: 'exact', head: true })
        .gte('viewed_at', todayStartISO)
      
      todayViews = count || 0
    } catch (error) {
      // 表不存在或查询失败，使用默认值 0
      console.warn('view_history table may not exist:', error)
    }

    // 2. 累计收藏数 (favorites 表)
    let totalFavorites = 0
    try {
      const { count } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
      
      totalFavorites = count || 0
    } catch (error) {
      console.warn('favorites table may not exist:', error)
    }

    // 3. 今日新增活动数 (events 表，status = 'active' 或 'published')
    const { count: todayEventsCount } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .in('status', ['active', 'published'])
      .gte('created_at', todayStartISO)

    // 4. 活跃用户数 (users 表，最近 7 天有访问)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    let activeUsers = 0
    try {
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', sevenDaysAgo.toISOString())
      
      activeUsers = count || 0
    } catch (error) {
      console.warn('users table may not exist:', error)
    }

    // 5. 活动类型分布
    const { data: typeDistribution } = await supabase
      .from('events')
      .select('type')
      .eq('status', 'active')

    const typeStats = {
      recruit: 0,
      activity: 0,
      lecture: 0,
    }

    if (typeDistribution) {
      typeDistribution.forEach((event) => {
        if (event.type === 'recruit') typeStats.recruit++
        else if (event.type === 'activity') typeStats.activity++
        else if (event.type === 'lecture') typeStats.lecture++
      })
    }

    // 6. 热门活动排行（按收藏数，Top 5）
    let topEvents: any[] = []
    try {
      const { data: favoritesData } = await supabase
        .from('favorites')
        .select('event_id')
        .eq('status', 'active')

      // 统计每个活动的收藏数
      const favoriteCounts: Record<number, number> = {}
      if (favoritesData) {
        favoritesData.forEach((fav) => {
          favoriteCounts[fav.event_id] = (favoriteCounts[fav.event_id] || 0) + 1
        })
      }

      // 获取所有已发布的活动
      const { data: allEvents } = await supabase
        .from('events')
        .select('id, title, type, status')
        .eq('status', 'active')
        .limit(100)

      if (allEvents) {
        // 计算每个活动的收藏数并排序
        topEvents = allEvents
          .map((event) => ({
            id: event.id,
            title: event.title,
            type: event.type,
            favorite_count: favoriteCounts[event.id] || 0,
          }))
          .sort((a, b) => b.favorite_count - a.favorite_count)
          .slice(0, 5)
      }
    } catch (error) {
      console.warn('Error fetching top events:', error)
    }

    // 7. 7 天浏览量趋势（如果 view_history 表存在）
    let viewTrend: { date: string; count: number }[] = []
    try {
      const sevenDaysAgoDate = new Date(sevenDaysAgo)
      const { data: viewsData } = await supabase
        .from('view_history')
        .select('viewed_at')
        .gte('viewed_at', sevenDaysAgoDate.toISOString())

      if (viewsData) {
        // 按日期分组统计
        const dailyCounts: Record<string, number> = {}
        viewsData.forEach((view) => {
          const date = new Date(view.viewed_at).toISOString().split('T')[0]
          dailyCounts[date] = (dailyCounts[date] || 0) + 1
        })

        // 生成过去 7 天的数据
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          const dateStr = date.toISOString().split('T')[0]
          viewTrend.push({
            date: dateStr,
            count: dailyCounts[dateStr] || 0,
          })
        }
      }
    } catch (error) {
      console.warn('Error fetching view trend:', error)
    }

    return NextResponse.json({
      success: true,
      data: {
        todayViews,
        totalFavorites,
        todayEvents: todayEventsCount || 0,
        activeUsers,
        typeDistribution: typeStats,
        topEvents,
        viewTrend,
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
