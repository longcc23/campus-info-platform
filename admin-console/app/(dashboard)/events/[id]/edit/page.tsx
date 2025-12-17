'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import ReviewArea from '@/components/ingest/ReviewArea'
import type { ParsedEvent } from '@/types/ai'
import type { Event } from '@/types/event'

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [eventData, setEventData] = useState<Event | null>(null)
  const [formData, setFormData] = useState<ParsedEvent | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (eventId) {
      fetchEvent()
    }
  }, [eventId])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/events/${eventId}`)
      const result = await response.json()

      if (result.success && result.data) {
        const event = result.data
        setEventData(event)

        // 转换为 ParsedEvent 格式（用于 ReviewArea 组件）
        const parsedEvent: ParsedEvent = {
          title: event.title,
          type: event.type,
          key_info: event.key_info || {},
          summary: event.summary || '',
          tags: event.tags || [],
          raw_content: event.raw_content || '',
        }

        setFormData(parsedEvent)
      } else {
        setError(result.error || '获取活动失败')
      }
    } catch (error) {
      console.error('Error fetching event:', error)
      setError('获取活动失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleFormUpdate = (data: ParsedEvent) => {
    setFormData(data)
  }

  const handleSave = async (action: 'draft' | 'publish') => {
    if (!formData) {
      alert('请先加载活动数据')
      return
    }

    if (!formData.title.trim()) {
      alert('请填写标题')
      return
    }

    if (action === 'publish') {
      const confirmed = confirm(`确认发布活动"${formData.title}"？\n\n发布后，小程序用户将可以看到此内容。`)
      if (!confirmed) {
        return
      }
    }

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          type: formData.type,
          tags: formData.tags || [],
          key_info: formData.key_info || {},
          summary: formData.summary || '',
          raw_content: formData.raw_content || eventData?.raw_content || '',
          status: action === 'publish' ? 'published' : 'draft',
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        console.error('API error response:', text)
        setError(`操作失败: HTTP ${response.status}\n${text.substring(0, 200)}`)
        alert(`操作失败: HTTP ${response.status}`)
        return
      }

      const result = await response.json()

      if (result.success) {
        alert(action === 'publish' ? '发布成功' : '草稿已保存')
        router.push('/events')
      } else {
        setError(result.error || '保存失败')
        alert(result.error || '保存失败，请重试')
      }
    } catch (error) {
      console.error('Error saving event:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      setError(`保存失败: ${errorMessage}`)
      alert(`保存失败: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error && !eventData) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
        <Link
          href="/events"
          className="inline-flex items-center text-purple-600 hover:text-purple-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回活动列表
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和返回 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/events"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">编辑活动</h1>
            <p className="text-sm text-gray-500 mt-1">
              {eventData?.title || '加载中...'}
            </p>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* 编辑表单 */}
      {formData && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <ReviewArea
              data={formData}
              originalContent={eventData?.raw_content || ''}
              onUpdate={handleFormUpdate}
            />
          </div>

          {/* 操作按钮 */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '保存中...' : '保存草稿'}
              </button>
              <button
                onClick={() => handleSave('publish')}
                disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '发布中...' : '确认发布'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 活动信息 */}
      {eventData && (
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">创建时间：</span>
              {eventData.created_at
                ? new Date(eventData.created_at).toLocaleString('zh-CN')
                : '-'}
            </div>
            <div>
              <span className="font-medium">更新时间：</span>
              {eventData.updated_at
                ? new Date(eventData.updated_at).toLocaleString('zh-CN')
                : '-'}
            </div>
            {eventData.published_at && (
              <div>
                <span className="font-medium">发布时间：</span>
                {new Date(eventData.published_at).toLocaleString('zh-CN')}
              </div>
            )}
            <div>
              <span className="font-medium">状态：</span>
              <span
                className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                  eventData.status === 'active' || eventData.status === 'published'
                    ? 'bg-green-100 text-green-800'
                    : eventData.status === 'inactive' || eventData.status === 'draft'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                {eventData.status === 'active' || eventData.status === 'published'
                  ? '已发布'
                  : eventData.status === 'inactive' || eventData.status === 'draft'
                  ? '草稿'
                  : '已下架'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
