/**
 * 收藏列表页面
 * 使用公共 EventCard 和 DetailModal 组件
 */

import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect, useRef } from 'react'
import Taro, { useShareAppMessage } from '@tarojs/taro'
import favoritesService from '../../services/favorites'
import { EventCard, SkeletonList, ExpiredFilter, DetailModal } from '../../components'
import { recordViewHistory } from '../../utils/supabase-rest'
import { isExpired } from '../../services/expiration'
import authService from '../../services/auth'
import type { Event, CardData } from '../../types/event'
import { eventToCardData } from '../../types/event'
import './index.scss'

export default function Favorites() {
  const [favorites, setFavorites] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Event | null>(null)
  const [hideExpired, setHideExpired] = useState(false)
  const selectedItemRef = useRef<Event | null>(null)
  
  // 配置微信分享
  useShareAppMessage(() => {
    const item = selectedItemRef.current
    if (item) {
      return {
        title: item.title,
        path: `/pages/index/index?eventId=${item.id}`,
        imageUrl: item.image_url || undefined
      }
    }
    return {
      title: 'UniFlow 智汇流 - 我的收藏',
      path: '/pages/index/index'
    }
  })

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    try {
      setLoading(true)
      const data = await favoritesService.getFavorites()
      setFavorites(data)
    } catch (error) {
      console.error('加载收藏列表失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadFavorites()
  }

  const handleEventClick = async (item: Event) => {
    setSelectedItem(item)
    selectedItemRef.current = item

    try {
      const userId = await authService.getOpenID()
      if (userId) {
        await recordViewHistory(userId, item.id)
      }
    } catch (error) {
      console.error('记录浏览历史失败:', error)
    }
  }

  const handleUnfavorite = (eventId: number) => {
    setFavorites(prev => prev.filter(item => item.id !== eventId))
  }

  const handleNavigateToHome = () => {
    Taro.switchTab({ url: '/pages/index/index' })
  }

  const getFilteredFavorites = () => {
    if (!hideExpired) return favorites
    return favorites.filter(item => !isExpired(item))
  }

  const filteredFavorites = getFilteredFavorites()

  return (
    <View className="favorites-page">
      <ScrollView
        scrollY
        className="favorites-scroll"
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}
      >
        {loading ? (
          <SkeletonList count={5} />
        ) : favorites.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">💝</Text>
            <Text className="empty-title">还没有收藏</Text>
            <Text className="empty-desc">去首页看看感兴趣的机会吧</Text>
            <View className="empty-action" onClick={handleNavigateToHome}>
              <Text>去首页</Text>
            </View>
          </View>
        ) : (
          <>
            <View className="favorites-header">
              <Text className="favorites-count">共 {filteredFavorites.length} 个收藏</Text>
              <ExpiredFilter
                value={hideExpired}
                onChange={setHideExpired}
                className="favorites-expired-filter"
              />
            </View>

            <View className="favorites-list">
              {filteredFavorites.map((item, index) => (
                <EventCard
                  key={item.id}
                  data={eventToCardData(item, true)}
                  isFirst={index === 0}
                  onClick={() => handleEventClick(item)}
                  onFavoriteToggle={(isFavorited) => {
                    if (!isFavorited) handleUnfavorite(item.id)
                  }}
                  showSummary
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* 详情弹窗 */}
      {selectedItem && (
        <DetailModal
          item={selectedItem}
          onClose={() => {
            setSelectedItem(null)
            selectedItemRef.current = null
          }}
          initialFavorited={true}
          onFavoriteToggle={(isFavorited: boolean) => {
            if (!isFavorited) {
              handleUnfavorite(selectedItem.id)
              setSelectedItem(null)
              selectedItemRef.current = null
            }
          }}
        />
      )}
    </View>
  )
}
