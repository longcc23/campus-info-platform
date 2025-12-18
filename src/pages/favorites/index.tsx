/**
 * 收藏列表页面
 * 使用公共 DetailModal 组件展示详情
 */

import { View, Text, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import favoritesService, { type Event } from '../../services/favorites'
import { FavoriteButton, SkeletonList, ExpiredFilter, DetailModal } from '../../components'
import { recordViewHistory } from '../../utils/supabase-rest'
import { isExpired } from '../../services/expiration'
import { formatDate } from '../../utils/date-formatter'
import authService from '../../services/auth'
import './index.scss'

export default function Favorites() {
  const [favorites, setFavorites] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Event | null>(null)
  const [hideExpired, setHideExpired] = useState(false)

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
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
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
    
    // 记录浏览历史
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
    Taro.switchTab({
      url: '/pages/index/index'
    })
  }

  const getFilteredFavorites = () => {
    if (!hideExpired) {
      return favorites
    }
    return favorites.filter(item => !isExpired(item))
  }

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
              <Text className="favorites-count">共 {getFilteredFavorites().length} 个收藏</Text>
              <ExpiredFilter
                value={hideExpired}
                onChange={setHideExpired}
                className="favorites-expired-filter"
              />
            </View>

            <View className="favorites-list">
              {getFilteredFavorites().map(item => {
                const expired = isExpired(item)
                return (
                  <View
                    key={item.id}
                    className={`favorite-card ${expired ? 'expired' : ''}`}
                    onClick={() => handleEventClick(item)}
                  >
                    {/* 左上角置顶三角标签 */}
                    {item.is_top && (
                      <View className="top-corner-badge">
                        <Text className="top-corner-text">置顶</Text>
                      </View>
                    )}
                    
                    {/* 顶部色条 */}
                    <View 
                      className="card-top-bar" 
                      style={{ background: expired ? '#9CA3AF' : `linear-gradient(to right, ${item.poster_color})` }} 
                    />

                    {/* 卡片内容 */}
                    <View className="card-content">
                      {/* 头部：类型标签和收藏按钮 */}
                      <View className="card-header">
                        <View className="card-tags">
                          <Text className={`type-tag ${item.type === 'recruit' ? 'recruit' : 'activity'}`}>
                            {item.type === 'recruit' ? '招聘' : item.type === 'lecture' ? '讲座' : '活动'}
                          </Text>
                          {expired && <Text className="expired-tag">已过期</Text>}
                        </View>
                        <FavoriteButton
                          eventId={item.id}
                          initialFavorited={true}
                          onToggle={(isFavorited) => {
                            if (!isFavorited) {
                              handleUnfavorite(item.id)
                            }
                          }}
                        />
                      </View>

                      {/* 标题 */}
                      <Text className={`card-title ${expired ? 'expired-text' : ''}`}>{item.title}</Text>

                      {/* 关键信息 */}
                      <View className="card-info">
                        <View className="info-item">
                          <Text className="info-icon">{item.type === 'recruit' ? '⏰' : '📅'}</Text>
                          <Text className={`info-text ${expired ? 'expired-text' : ''}`}>
                            {item.key_info.deadline 
                              ? formatDate(item.key_info.deadline)
                              : item.key_info.date 
                                ? formatDate(item.key_info.date) 
                                : item.key_info.time || '-'}
                          </Text>
                        </View>
                        {item.key_info.location && (
                          <View className="info-item">
                            <Text className="info-icon">📍</Text>
                            <Text className={`info-text ${expired ? 'expired-text' : ''}`}>{item.key_info.location}</Text>
                          </View>
                        )}
                      </View>

                      {/* 摘要 */}
                      {item.summary && (
                        <Text className="card-summary">{item.summary}</Text>
                      )}
                    </View>
                  </View>
                )
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* 详情 Modal - 使用公共组件 */}
      {selectedItem && (
        <DetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          initialFavorited={true}
          onFavoriteToggle={(isFavorited) => {
            if (!isFavorited) {
              handleUnfavorite(selectedItem.id)
              setSelectedItem(null)
            }
          }}
        />
      )}
    </View>
  )
}
