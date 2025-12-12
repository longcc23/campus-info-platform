/**
 * 收藏列表页面
 */

import { View, Text, ScrollView, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import favoritesService, { type Event } from '../../services/favorites'
import FavoriteButton from '../../components/FavoriteButton'
import { SkeletonList } from '../../components/Skeleton'
import ExpiredFilter from '../../components/ExpiredFilter'
import ShareButton from '../../components/ShareButton'
import { recordViewHistory } from '../../utils/supabase-rest'
import { isExpired } from '../../services/expiration'
import { createCalendarEventFromItem, addToPhoneCalendar } from '../../utils/ics-generator'
import { getSafeAreaBottom } from '../../utils/system-info'
import authService from '../../services/auth'
import './index.scss'

// 过期判断逻辑已移至 src/services/expiration.ts

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

  const handleAddToCalendar = async (item: Event) => {
    try {
      let dateStr = ''
      let timeStr = ''
      
      // 如果是招聘类型，使用 deadline
      if (item.type === 'recruit' && item.key_info.deadline) {
        dateStr = item.key_info.deadline
        // 尝试从 deadline 中提取时间（如"12月16日中午12:00"）
        const timeMatch = item.key_info.deadline.match(/(中午|上午|下午|晚上)?\s*(\d{1,2}):(\d{2})/)
        if (timeMatch) {
          const hour = parseInt(timeMatch[2])
          const minute = parseInt(timeMatch[3])
          const period = timeMatch[1] // "中午"、"上午"、"下午"、"晚上"
          
          // 转换12小时制到24小时制
          let hour24 = hour
          if (period === '下午' || period === '晚上') {
            if (hour !== 12) hour24 = hour + 12
          } else if (period === '中午') {
            if (hour !== 12) hour24 = hour + 12
          }
          // 如果是"中午12:00"，保持为12:00
          if (period === '中午' && hour === 12) {
            hour24 = 12
          }
          
          timeStr = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        }
      } else {
        // 活动/讲座类型，使用 date 和 time
        dateStr = item.key_info.date || ''
        timeStr = item.key_info.time || ''
      }
      
      const calendarEvent = createCalendarEventFromItem(
        item.title,
        dateStr,
        timeStr,
        item.key_info.location || '',
        item.summary || item.raw_content || ''
      )
      
      if (!calendarEvent) {
        Taro.showToast({
          title: '无法解析活动时间',
          icon: 'none'
        })
        return
      }
      
      await addToPhoneCalendar(calendarEvent)
    } catch (error) {
      console.error('添加到日历失败:', error)
      Taro.showToast({
        title: '添加到日历失败',
        icon: 'none'
      })
    }
  }

  const handleUnfavorite = (eventId: number) => {
    // 从列表中移除
    setFavorites(prev => prev.filter(item => item.id !== eventId))
  }

  const handleNavigateToHome = () => {
    Taro.switchTab({
      url: '/pages/index/index'
    })
  }

  const handleCopyLink = (link: string) => {
    Taro.setClipboardData({
      data: link,
      success: () => {
        // 不显示提示，系统会自动显示"内容已复制"
      },
      fail: () => {
        Taro.showToast({
          title: '复制失败',
          icon: 'none'
        })
      }
    })
  }

  // 处理链接点击：复制并提示用户在浏览器打开
  const handleLinkClick = (link: string, linkType: 'registration' | 'apply' = 'apply') => {
    Taro.setClipboardData({
      data: link,
      success: () => {
        const title = linkType === 'registration' ? '报名链接已复制' : '链接已复制'
        Taro.showModal({
          title: title,
          content: '链接已复制到剪贴板，请在浏览器中粘贴打开',
          showCancel: false,
          confirmText: '知道了',
          confirmColor: '#8B5CF6'
        })
      },
      fail: () => {
        Taro.showToast({
          title: '复制失败',
          icon: 'none'
        })
      }
    })
  }

  // 获取筛选后的收藏列表
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
                    <Text className="source-tag">{item.source_group}</Text>
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
                  {item.type === 'recruit' ? (
                    // 招聘信息显示截止时间
                    item.key_info.deadline && (
                      <View className="info-item">
                        <Text className="info-icon">⏰</Text>
                        <Text className={`info-text ${expired ? 'expired-text' : ''}`}>{item.key_info.deadline}</Text>
                      </View>
                    )
                  ) : (
                    // 活动信息显示日期和时间
                    <>
                      {item.key_info.date && (
                        <View className="info-item">
                          <Text className="info-icon">📅</Text>
                          <Text className={`info-text ${expired ? 'expired-text' : ''}`}>{item.key_info.date}</Text>
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

      {/* 详情 Modal */}
      {selectedItem && (
        <View className="detail-modal">
          <View className="detail-header">
            <Button 
              className="detail-back-btn"
              onClick={() => setSelectedItem(null)}
            >
              <Text>←</Text>
            </Button>
            <Text className="detail-title">{selectedItem.title}</Text>
            <View className="detail-header-right">
              <ShareButton 
                eventData={selectedItem}
                size="medium"
                type="icon"
                className="detail-share-btn"
              />
              <FavoriteButton 
                eventId={selectedItem.id}
                initialFavorited={true}
                large={true}
                onToggle={(isFavorited) => {
                  if (!isFavorited) {
                    handleUnfavorite(selectedItem.id)
                    setSelectedItem(null)
                  }
                }}
              />
            </View>
          </View>

          <ScrollView 
            scrollY 
            className="detail-scroll"
            enhanced
            showScrollbar={false}
          >
            <View className="detail-hero" style={{ background: `linear-gradient(to bottom right, ${selectedItem.poster_color})` }}>
              <Text style={{ fontSize: '40rpx', fontWeight: 'bold' }}>{selectedItem.title}</Text>
            </View>

            <View className="detail-content">
              <View className="detail-info-card">
                <Text className="detail-section-title">关键信息</Text>
                
                {/* 招聘信息：公司、岗位、截止时间、投递方式 */}
                {selectedItem.type === 'recruit' && (
                  <>
                    {selectedItem.key_info.company && (
                      <View className="detail-info-item">
                        <View className="detail-info-icon">
                          <Text>🏢</Text>
                        </View>
                        <View className="detail-info-content">
                          <Text className="detail-info-label">公司</Text>
                          <Text className="detail-info-value">{selectedItem.key_info.company}</Text>
                        </View>
                      </View>
                    )}
                    
                    {selectedItem.key_info.position && (
                      <View className="detail-info-item">
                        <View className="detail-info-icon">
                          <Text>💼</Text>
                        </View>
                        <View className="detail-info-content">
                          <Text className="detail-info-label">岗位</Text>
                          <Text className="detail-info-value">{selectedItem.key_info.position}</Text>
                        </View>
                      </View>
                    )}
                    
                    {selectedItem.key_info.deadline && (
                      <View className="detail-info-item">
                        <View className="detail-info-icon">
                          <Text>⏰</Text>
                        </View>
                        <View className="detail-info-content">
                          <Text className="detail-info-label">截止时间</Text>
                          <Text className="detail-info-value">{selectedItem.key_info.deadline}</Text>
                        </View>
                      </View>
                    )}
                    
                    {selectedItem.key_info.link && (
                      <View className="detail-info-item">
                        <View className="detail-info-icon">
                          <Text>📧</Text>
                        </View>
                        <View className="detail-info-content" style={{ flex: 1 }}>
                          <Text className="detail-info-label">投递方式</Text>
                          <View className="detail-info-value-row">
                            <Text className="detail-info-value" style={{ wordBreak: 'break-all', flex: 1 }}>
                              {selectedItem.key_info.link}
                            </Text>
                            <View 
                              className="copy-link-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCopyLink(selectedItem.key_info.link || '')
                              }}
                            >
                              <Text>📋 复制</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    )}
                    
                    {selectedItem.key_info.education && (
                      <View className="detail-info-item">
                        <View className="detail-info-icon">
                          <Text>🎓</Text>
                        </View>
                        <View className="detail-info-content">
                          <Text className="detail-info-label">申请群体</Text>
                          <Text className="detail-info-value">{selectedItem.key_info.education}</Text>
                        </View>
                      </View>
                    )}
                  </>
                )}
                
                {/* 活动/讲座信息：日期、时间、地点 */}
                {(selectedItem.type === 'activity' || selectedItem.type === 'lecture') && (
                  <>
                    {selectedItem.key_info.date && (
                      <View className="detail-info-item">
                        <View className="detail-info-icon">
                          <Text>📅</Text>
                        </View>
                        <View className="detail-info-content">
                          <Text className="detail-info-label">日期</Text>
                          <Text className="detail-info-value">{selectedItem.key_info.date}</Text>
                        </View>
                      </View>
                    )}
                    
                    {selectedItem.key_info.time && (
                      <View className="detail-info-item">
                        <View className="detail-info-icon">
                          <Text>🕐</Text>
                        </View>
                        <View className="detail-info-content">
                          <Text className="detail-info-label">时间</Text>
                          <Text className="detail-info-value">{selectedItem.key_info.time}</Text>
                        </View>
                      </View>
                    )}
                    
                    {selectedItem.key_info.location && (
                      <View className="detail-info-item">
                        <View className="detail-info-icon">
                          <Text>📍</Text>
                        </View>
                        <View className="detail-info-content">
                          <Text className="detail-info-label">地点</Text>
                          <Text className="detail-info-value">{selectedItem.key_info.location}</Text>
                        </View>
                      </View>
                    )}
                    
                    {selectedItem.key_info.deadline && (
                      <View className="detail-info-item">
                        <View className="detail-info-icon">
                          <Text>⏰</Text>
                        </View>
                        <View className="detail-info-content">
                          <Text className="detail-info-label">截止时间</Text>
                          <Text className="detail-info-value">{selectedItem.key_info.deadline}</Text>
                        </View>
                      </View>
                    )}
                    
                    {selectedItem.key_info.registration_link && (
                      <View 
                        className="detail-info-item clickable-link"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleLinkClick(selectedItem.key_info.registration_link || '', 'registration')
                        }}
                      >
                        <View className="detail-info-icon">
                          <Text>🔗</Text>
                        </View>
                        <View className="detail-info-content" style={{ flex: 1 }}>
                          <Text className="detail-info-label">报名链接</Text>
                          <View className="detail-info-value-row">
                            <Text className="detail-info-value link-text" style={{ wordBreak: 'break-all', flex: 1, color: '#8B5CF6' }}>
                              {selectedItem.key_info.registration_link}
                            </Text>
                            <Text style={{ color: '#8B5CF6', fontSize: '24rpx' }}>点击复制 →</Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </>
                )}
              </View>

              <View className="detail-body">
                {/* 显示活动详情：优先显示 summary（如果有且与 raw_content 不同），否则显示 raw_content */}
                {selectedItem.summary && selectedItem.raw_content && 
                 selectedItem.raw_content.trim() && 
                 selectedItem.summary.trim() !== selectedItem.raw_content.trim().substring(0, Math.min(selectedItem.summary.length, selectedItem.raw_content.length)).trim() ? (
                  <>
                    <Text className="detail-body-title">📄 活动详情</Text>
                    <Text className="detail-summary">{selectedItem.summary}</Text>
                    {selectedItem.raw_content && selectedItem.raw_content.trim() && (
                      <View className="detail-raw-content" style={{ marginTop: '32rpx', paddingTop: '32rpx', borderTop: '1px solid #e5e7eb' }}>
                        <Text className="detail-body-title" style={{ marginBottom: '16rpx', fontSize: '32rpx' }}>📋 详细内容</Text>
                        <Text style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{selectedItem.raw_content}</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    <Text className="detail-body-title">📄 活动详情</Text>
                    <Text className="detail-summary" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                      {selectedItem.raw_content?.trim() || selectedItem.summary || ''}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </ScrollView>

          <View className="detail-actions" style={{ paddingBottom: `${getSafeAreaBottom() + 32}rpx` }}>
            {/* 活动/讲座：有日期时显示添加到日历 */}
            {selectedItem.type !== 'recruit' && selectedItem.key_info.date && (
              <Button 
                className="detail-action-btn"
                onClick={() => handleAddToCalendar(selectedItem)}
              >
                <Text>📅 添加到日历</Text>
              </Button>
            )}
            {/* 招聘：有截止时间时显示添加到日历 */}
            {selectedItem.type === 'recruit' && selectedItem.key_info.deadline && (
              <Button 
                className="detail-action-btn"
                onClick={() => handleAddToCalendar(selectedItem)}
              >
                <Text>📅 添加截止日期到日历</Text>
              </Button>
            )}
          </View>
        </View>
      )}
    </View>
  )
}
