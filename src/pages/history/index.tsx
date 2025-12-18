/**
 * 浏览历史页面
 * 使用公共 DetailModal 组件展示详情
 */

import { View, Text, ScrollView, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { getViewHistory, type Event, clearViewHistory } from '../../utils/supabase-rest'
import { FavoriteButton, SkeletonList, ExpiredFilter, DetailModal } from '../../components'
import { isExpired } from '../../services/expiration'
import { formatDate } from '../../utils/date-formatter'
import authService from '../../services/auth'
import favoritesService from '../../services/favorites'
import './index.scss'

export default function History() {
  const [history, setHistory] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Event | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set())
  const [hideExpired, setHideExpired] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const userId = await authService.getOpenID()
      if (!userId) {
        setHistory([])
        return
      }
      
      const { data, error } = await getViewHistory(userId)
      if (error) {
        console.error('加载浏览历史失败:', error)
        Taro.showToast({
          title: '加载失败',
          icon: 'none'
        })
        return
      }
      
      setHistory(data || [])
      
      // 加载收藏状态
      if (data && data.length > 0) {
        const eventIds = data.map(item => item.id)
        const favoritedIds = await favoritesService.getFavoriteStatus(eventIds)
        setFavoriteIds(favoritedIds)
      }
    } catch (error) {
      console.error('加载浏览历史失败:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadHistory()
  }

  const handleEventClick = (item: Event) => {
    setSelectedItem(item)
  }

  const handleClearHistory = async () => {
    try {
      const result = await Taro.showModal({
        title: '清空浏览历史',
        content: '确定要清空所有浏览历史吗？',
        confirmText: '确定',
        cancelText: '取消',
        confirmColor: '#EF4444'
      })
      
      if (result.confirm) {
        const userId = await authService.getOpenID()
        if (userId) {
          await clearViewHistory(userId)
          setHistory([])
          Taro.showToast({
            title: '已清空',
            icon: 'success'
          })
        }
      }
    } catch (error) {
      console.error('清空浏览历史失败:', error)
      Taro.showToast({
        title: '清空失败',
        icon: 'none'
      })
    }
  }

  const handleNavigateToHome = () => {
    Taro.switchTab({
      url: '/pages/index/index'
    })
  }

  const getFilteredHistory = () => {
    if (!hideExpired) {
      return history
    }
    return history.filter(item => !isExpired(item))
  }

  return (
    <View className="history-page">
      <ScrollView
        scrollY
        className="history-scroll"
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}
      >
        {loading ? (
          <SkeletonList count={5} />
        ) : history.length === 0 ? (
          <View className="empty-state">
            <Text className="empty-icon">📚</Text>
            <Text className="empty-title">暂无浏览记录</Text>
            <Text className="empty-desc">去首页看看有什么新鲜事</Text>
            <View className="empty-action" onClick={handleNavigateToHome}>
              <Text>去首页</Text>
            </View>
          </View>
        ) : (
          <>
            <View className="history-header">
              <View className="history-header-left">
                <Text className="history-count">共 {getFilteredHistory().length} 条记录</Text>
                <ExpiredFilter
                  value={hideExpired}
                  onChange={setHideExpired}
                  className="history-expired-filter"
                />
              </View>
              <Button className="clear-btn" onClick={handleClearHistory}>
                <Text>清空</Text>
              </Button>
            </View>

            <View className="history-list">
              {getFilteredHistory().map(item => {
                const expired = isExpired(item)
                const isFavorited = favoriteIds.has(item.id)
                return (
                  <View
                    key={item.id}
                    className={`history-card ${expired ? 'expired' : ''}`}
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
                          initialFavorited={isFavorited}
                          onToggle={(newFavorited) => {
                            setFavoriteIds(prev => {
                              const newSet = new Set(prev)
                              if (newFavorited) {
                                newSet.add(item.id)
                              } else {
                                newSet.delete(item.id)
                              }
                              return newSet
                            })
                          }}
                        />
                      </View>

                      {/* 标题 */}
                      <Text className={`card-title ${expired ? 'expired-text' : ''}`}>{item.title}</Text>

                      {/* 关键信息 */}
                      <View className="card-info">
                        {item.type === 'recruit' ? (
                          item.key_info.deadline && (
                            <View className="info-item">
                              <Text className="info-icon">⏰</Text>
                              <Text className={`info-text ${expired ? 'expired-text' : ''}`}>{formatDate(item.key_info.deadline)}</Text>
                            </View>
                          )
                        ) : (
                          <>
                            {item.key_info.date && (
                              <View className="info-item">
                                <Text className="info-icon">📅</Text>
                                <Text className={`info-text ${expired ? 'expired-text' : ''}`}>{formatDate(item.key_info.date)}</Text>
                              </View>
                            )}
                            {item.key_info.time && (
                              <View className="info-item">
                                <Text className="info-icon">🕐</Text>
                                <Text className={`info-text ${expired ? 'expired-text' : ''}`}>{item.key_info.time}</Text>
                              </View>
                            )}
                          </>
                        )}
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
          initialFavorited={favoriteIds.has(selectedItem.id)}
          onFavoriteToggle={(isFavorited) => {
            setFavoriteIds(prev => {
              const newSet = new Set(prev)
              if (isFavorited) {
                newSet.add(selectedItem.id)
              } else {
                newSet.delete(selectedItem.id)
              }
              return newSet
            })
          }}
        />
      )}
    </View>
  )
}
