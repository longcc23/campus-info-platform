/**
 * Supabase 使用示例
 * 展示如何在小程序中使用 Supabase 获取数据
 */

import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
// 注意：微信小程序环境请使用 supabase-rest.ts 而不是 supabase.ts
import { getEvents, getEventById, type Event } from './supabase-rest'

export default function SupabaseExample() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadEvents()
  }, [])

  // 加载所有活动
  const loadEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 获取所有活动
      const data = await getEvents()
      setEvents(data)
    } catch (err: any) {
      setError(err.message || '加载失败')
      console.error('加载活动失败：', err)
    } finally {
      setLoading(false)
    }
  }

  // 按类型筛选
  const loadRecruitEvents = async () => {
    try {
      const data = await getEvents({ type: 'recruit' })
      setEvents(data)
    } catch (err: any) {
      setError(err.message || '加载失败')
    }
  }

  // 获取单个活动
  const loadSingleEvent = async (id: number) => {
    try {
      const event = await getEventById(id)
      if (event) {
        console.log('活动详情：', event)
      }
    } catch (err: any) {
      console.error('获取活动失败：', err)
    }
  }

  if (loading) {
    return (
      <View className="p-4">
        <Text>加载中...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View className="p-4">
        <Text className="text-red-500">错误：{error}</Text>
      </View>
    )
  }

  return (
    <View className="p-4">
      <Text className="text-xl font-bold mb-4">活动列表</Text>
      {events.map(event => (
        <View key={event.id} className="mb-4 p-4 bg-white rounded-lg shadow">
          <Text className="text-lg font-bold">{event.title}</Text>
          <Text className="text-sm text-gray-500">{event.type}</Text>
          <Text className="text-sm">{event.summary}</Text>
        </View>
      ))}
    </View>
  )
}

