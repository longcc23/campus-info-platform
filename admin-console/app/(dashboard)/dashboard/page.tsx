'use client'

import { useState, useEffect } from 'react'
import { 
  Eye, 
  Heart, 
  Calendar, 
  Users,
  TrendingUp,
  BarChart3,
  Award
} from 'lucide-react'

interface StatsData {
  todayViews: number
  totalFavorites: number
  todayEvents: number
  totalUsers?: number
  activeUsers: number
  uniqueFavoriteUsers?: number
  typeDistribution: {
    recruit: number
    activity: number
    lecture: number
  }
  topEvents: Array<{
    id: number
    title: string
    type: string
    favorite_count: number
    favorite_users_count?: number
  }>
  viewTrend: Array<{
    date: string
    count: number
  }>
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
    // 每 30 秒刷新一次数据
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/stats')
      const result = await response.json()

      if (result.success) {
        setStats(result.data)
      } else {
        setError(result.error || '获取统计数据失败')
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      setError('获取统计数据失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      recruit: '招聘',
      activity: '活动',
      lecture: '讲座',
    }
    return typeMap[type] || type
  }

  const getTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      recruit: 'bg-blue-100 text-blue-800',
      activity: 'bg-purple-100 text-purple-800',
      lecture: 'bg-pink-100 text-pink-800',
    }
    return colorMap[type] || 'bg-gray-100 text-gray-800'
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载数据中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">数据看板</h1>
        <p className="text-sm text-gray-500 mt-1">实时数据统计和分析</p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 今日新增浏览量 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">今日新增浏览量</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats?.todayViews.toLocaleString() || 0}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Eye className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* 累计收藏数 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">累计收藏数</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats?.totalFavorites.toLocaleString() || 0}
              </p>
            </div>
            <div className="h-12 w-12 bg-pink-100 rounded-full flex items-center justify-center">
              <Heart className="h-6 w-6 text-pink-600" />
            </div>
          </div>
        </div>

        {/* 今日新增活动 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">今日新增活动</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats?.todayEvents.toLocaleString() || 0}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* 活跃用户数 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">活跃用户数</p>
              <p className="text-xs text-gray-400 mt-1">(最近 7 天)</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {stats?.activeUsers.toLocaleString() || 0}
              </p>
              {stats?.totalUsers !== undefined && stats.totalUsers > stats.activeUsers && (
                <p className="text-xs text-gray-500 mt-1">
                  总用户: {stats.totalUsers}
                </p>
              )}
              {stats?.uniqueFavoriteUsers !== undefined && (
                <p className="text-xs text-gray-500 mt-1">
                  收藏用户: {stats.uniqueFavoriteUsers}
                </p>
              )}
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 活动类型分布和热门活动 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 活动类型分布 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">活动类型分布</h2>
          </div>
          
          {stats?.typeDistribution ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">招聘</span>
                  <span className="font-medium text-gray-900">
                    {stats.typeDistribution.recruit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${
                        stats.typeDistribution.recruit +
                        stats.typeDistribution.activity +
                        stats.typeDistribution.lecture > 0
                          ? (stats.typeDistribution.recruit /
                              (stats.typeDistribution.recruit +
                                stats.typeDistribution.activity +
                                stats.typeDistribution.lecture)) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">活动</span>
                  <span className="font-medium text-gray-900">
                    {stats.typeDistribution.activity}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${
                        stats.typeDistribution.recruit +
                        stats.typeDistribution.activity +
                        stats.typeDistribution.lecture > 0
                          ? (stats.typeDistribution.activity /
                              (stats.typeDistribution.recruit +
                                stats.typeDistribution.activity +
                                stats.typeDistribution.lecture)) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">讲座</span>
                  <span className="font-medium text-gray-900">
                    {stats.typeDistribution.lecture}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-pink-600 h-2 rounded-full"
                    style={{
                      width: `${
                        stats.typeDistribution.recruit +
                        stats.typeDistribution.activity +
                        stats.typeDistribution.lecture > 0
                          ? (stats.typeDistribution.lecture /
                              (stats.typeDistribution.recruit +
                                stats.typeDistribution.activity +
                                stats.typeDistribution.lecture)) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">暂无数据</p>
          )}
        </div>

        {/* 热门活动排行 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Award className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">热门活动 Top 5</h2>
            <span className="text-xs text-gray-500">(按收藏数)</span>
          </div>

          {stats?.topEvents && stats.topEvents.length > 0 ? (
            <div className="space-y-3">
              {stats.topEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {event.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(
                            event.type
                          )}`}
                        >
                          {getTypeLabel(event.type)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end space-y-1 ml-4">
                    <div className="flex items-center space-x-1 text-gray-600">
                    <Heart className="h-4 w-4 text-pink-500" />
                    <span className="text-sm font-medium">{event.favorite_count}</span>
                    </div>
                    {event.favorite_users_count !== undefined && event.favorite_users_count !== event.favorite_count && (
                      <span className="text-xs text-gray-400">
                        {event.favorite_users_count} 用户
                      </span>
                    )}
                    {/* 只在数据异常时显示警告：收藏数 > 收藏用户数（说明有重复收藏） */}
                    {event.favorite_users_count !== undefined && event.favorite_count > event.favorite_users_count && (
                      <span 
                        className="text-xs text-yellow-600" 
                        title={`数据异常：收藏数(${event.favorite_count}) > 收藏用户数(${event.favorite_users_count})，可能存在重复收藏`}
                      >
                        ⚠️
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">暂无热门活动数据</p>
          )}
        </div>
      </div>

      {/* 浏览量趋势（如果数据可用） */}
      {stats?.viewTrend && stats.viewTrend.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">7 天浏览量趋势</h2>
          </div>
          
          <div className="h-64 flex items-end space-x-2">
            {stats.viewTrend.map((day, index) => {
              const maxCount = Math.max(...stats.viewTrend.map((d) => d.count), 1)
              const height = (day.count / maxCount) * 100
              
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center space-y-2">
                  <div className="relative w-full flex items-end justify-center" style={{ height: '200px' }}>
                    <div
                      className="w-full bg-purple-600 rounded-t hover:bg-purple-700 transition-colors"
                      style={{ height: `${height}%`, minHeight: '4px' }}
                      title={`${day.date}: ${day.count} 次浏览`}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    {new Date(day.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-sm font-medium text-gray-900">{day.count}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 刷新提示 */}
      <div className="text-xs text-gray-500 text-center">
        数据每 30 秒自动刷新
      </div>
    </div>
  )
}
