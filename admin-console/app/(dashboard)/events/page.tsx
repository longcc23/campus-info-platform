'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  Calendar,
  Tag
} from 'lucide-react'
import Link from 'next/link'
import type { Event } from '@/types/event'

type EventStatusFilter = 'all' | 'published' | 'draft' | 'archived'
type EventTypeFilter = 'all' | 'recruit' | 'activity' | 'lecture'

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<EventStatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<EventTypeFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  useEffect(() => {
    fetchEvents()
  }, [statusFilter, typeFilter])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (typeFilter !== 'all') {
        params.append('type', typeFilter)
      }

      const response = await fetch(`/api/events?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        // 映射数据库状态到前端状态，并确保排序（置顶优先）
        const mappedEvents = result.data.map((event: any) => ({
          ...event,
          id: Number(event.id), // 确保 ID 是数字类型
          status: event.status === 'active' ? 'published' : event.status === 'inactive' ? 'draft' : event.status
        }))
        // 客户端二次排序确保置顶在前（虽然服务端已排序，但这里作为保险）
        mappedEvents.sort((a: Event, b: Event) => {
          if (a.is_top !== b.is_top) {
            return b.is_top ? 1 : -1
          }
          const aTime = new Date(a.created_at || 0).getTime()
          const bTime = new Date(b.created_at || 0).getTime()
          return bTime - aTime
        })
        setEvents(mappedEvents)
      } else {
        alert(`获取活动列表失败: ${result.error}`)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      alert('获取活动列表失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`确定要删除活动"${title}"吗？此操作不可恢复。`)) {
      return
    }

    try {
      console.log('Delete event:', id, title)
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const text = await response.text()
        console.error('API error response:', text)
        alert(`删除失败: HTTP ${response.status}\n${text.substring(0, 200)}`)
        return
      }

      const result = await response.json()

      if (result.success) {
        alert('删除成功')
        fetchEvents()
      } else {
        console.error('API error:', result)
        alert(`删除失败: ${result.error || '未知错误'}`)
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      alert(`删除失败: ${errorMessage}\n\n请检查：\n1. 是否配置了 Service Role Key\n2. 浏览器控制台查看详细错误`)
    }
  }

  const handleToggleTop = async (id: number, currentIsTop: boolean) => {
    try {
      console.log('Toggle top for event:', id, 'current:', currentIsTop)
      const response = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_top: !currentIsTop,
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        console.error('API error response:', text)
        alert(`操作失败: HTTP ${response.status}\n${text.substring(0, 200)}`)
        return
      }

      const result = await response.json()

      if (result.success) {
        fetchEvents()
      } else {
        console.error('API error:', result)
        alert(`操作失败: ${result.error || '未知错误'}`)
      }
    } catch (error) {
      console.error('Error toggling top:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      alert(`操作失败: ${errorMessage}\n\n请检查：\n1. 是否配置了 Service Role Key\n2. 浏览器控制台查看详细错误`)
    }
  }

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'archived' : 'published'
    
    try {
      console.log('Toggle status for event:', id, 'current:', currentStatus, 'new:', newStatus)
      const response = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus === 'published' ? 'active' : 'archived',
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        console.error('API error response:', text)
        alert(`操作失败: HTTP ${response.status}\n${text.substring(0, 200)}`)
        return
      }

      const result = await response.json()

      if (result.success) {
        fetchEvents()
      } else {
        console.error('API error:', result)
        alert(`操作失败: ${result.error || '未知错误'}`)
      }
    } catch (error) {
      console.error('Error toggling status:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      alert(`操作失败: ${errorMessage}\n\n请检查：\n1. 是否配置了 Service Role Key\n2. 浏览器控制台查看详细错误`)
    }
  }

  // 过滤搜索结果
  const filteredEvents = events.filter(event => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        event.title.toLowerCase().includes(query) ||
        event.summary?.toLowerCase().includes(query) ||
        event.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }
    return true
  })

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      published: { label: '已发布', className: 'bg-green-100 text-green-800' },
      draft: { label: '草稿', className: 'bg-gray-100 text-gray-800' },
      archived: { label: '已下架', className: 'bg-orange-100 text-orange-800' },
      expired: { label: '已过期', className: 'bg-red-100 text-red-800' },
    }
    
    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }

  const getTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; className: string }> = {
      recruit: { label: '招聘', className: 'bg-blue-100 text-blue-800' },
      activity: { label: '活动', className: 'bg-purple-100 text-purple-800' },
      lecture: { label: '讲座', className: 'bg-pink-100 text-pink-800' },
    }
    
    const typeInfo = typeMap[type] || { label: type, className: 'bg-gray-100 text-gray-800' }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeInfo.className}`}>
        {typeInfo.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">活动管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理所有活动、招聘和讲座信息</p>
        </div>
        <Link
          href="/ingest"
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" />
          新建活动（AI 识别）
        </Link>
      </div>

      {/* 筛选和搜索栏 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 状态筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="inline h-4 w-4 mr-1" />
              状态
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as EventStatusFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">全部</option>
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
              <option value="archived">已下架</option>
            </select>
          </div>

          {/* 类型筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="inline h-4 w-4 mr-1" />
              类型
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as EventTypeFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">全部</option>
              <option value="recruit">招聘</option>
              <option value="activity">活动</option>
              <option value="lecture">讲座</option>
            </select>
          </div>

          {/* 搜索 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="inline h-4 w-4 mr-1" />
              搜索
            </label>
            <input
              type="text"
              placeholder="搜索标题、摘要、标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* 活动列表表格 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchQuery ? '没有找到匹配的活动' : '暂无活动数据'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    标题
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    发布时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {event.is_top && (
                          <ArrowUp className="h-4 w-4 text-purple-600 mr-2" title="置顶" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{event.title}</div>
                          {event.summary && (
                            <div className="text-sm text-gray-500 truncate max-w-md">
                              {event.summary}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(event.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(event.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.published_at 
                        ? new Date(event.published_at).toLocaleString('zh-CN')
                        : event.created_at 
                        ? new Date(event.created_at).toLocaleString('zh-CN')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/events/${event.id}/edit`}
                          className="text-purple-600 hover:text-purple-900"
                          title="编辑"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleToggleTop(event.id, event.is_top)}
                          className={`${event.is_top ? 'text-purple-600' : 'text-gray-400'} hover:text-purple-900`}
                          title={event.is_top ? '取消置顶' : '置顶'}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(event.id, event.status)}
                          className="text-gray-600 hover:text-gray-900"
                          title={event.status === 'published' ? '下架' : '发布'}
                        >
                          {event.status === 'published' ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(event.id, event.title)}
                          className="text-red-600 hover:text-red-900"
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 统计信息 */}
      {!loading && (
        <div className="text-sm text-gray-500 text-center">
          共 {filteredEvents.length} 条活动
        </div>
      )}
    </div>
  )
}
