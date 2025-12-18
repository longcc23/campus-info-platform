/**
 * 浏览历史页面
 */

import { View, Text, ScrollView, Button, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { getViewHistory, type Event, recordViewHistory, clearViewHistory } from '../../utils/supabase-rest'
import FavoriteButton from '../../components/FavoriteButton'
import { SkeletonList } from '../../components/Skeleton'
import ExpiredFilter from '../../components/ExpiredFilter'
import ShareButton from '../../components/ShareButton'
import { createCalendarEventFromItem, addToPhoneCalendar } from '../../utils/ics-generator'
import { isExpired } from '../../services/expiration'
import { getSafeAreaBottom } from '../../utils/system-info'
import authService from '../../services/auth'
import favoritesService from '../../services/favorites'
import './index.scss'

// 过期判断逻辑已移至 src/services/expiration.ts

export default function History() {
  const [history, setHistory] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Event | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set())
  const [hideExpired, setHideExpired] = useState(false)
  const [showPoster, setShowPoster] = useState(false) // 控制海报显示状态

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const userId = await authService.getOpenID()
      if (!userId) {
        Taro.showToast({
          title: '请先登录',
          icon: 'none'
        })
        setLoading(false)
        return
      }

      const { data, error } = await getViewHistory(userId)
      if (error) {
        throw new Error(error.message || '加载失败')
      }
      
      const historyData = data || []
      setHistory(historyData)

      // 加载收藏状态
      if (historyData.length > 0) {
        const eventIds = historyData.map(item => item.id)
        const favoriteStatus = await favoritesService.getFavoriteStatus(eventIds)
        setFavoriteIds(favoriteStatus)
      }
    } catch (error: any) {
      console.error('加载浏览历史失败:', error)
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
    loadHistory()
  }

  const handleEventClick = async (item: Event) => {
    setSelectedItem(item)
    setShowPoster(false) // 重置海报显示状态
    
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

  // 格式化日期为 2025.12.30 格式
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return ''
    
    // 格式1: 2025年12月30日 -> 2025.12.30
    const match1 = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
    if (match1) {
      const year = match1[1]
      const month = match1[2].padStart(2, '0')
      const day = match1[3].padStart(2, '0')
      return `${year}.${month}.${day}`
    }
    
    // 格式2: 12月30日 -> 当前年份.12.30
    const match2 = dateStr.match(/(\d{1,2})月(\d{1,2})日/)
    if (match2) {
      const currentYear = new Date().getFullYear()
      const month = match2[1].padStart(2, '0')
      const day = match2[2].padStart(2, '0')
      return `${currentYear}.${month}.${day}`
    }
    
    // 格式3: December 30, 2025 或 Dec 30, 2025
    const match3 = dateStr.match(/(\d{1,2})[,\s]+(\d{4})/i)
    if (match3) {
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
      const monthMatch = dateStr.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i)
      if (monthMatch) {
        const month = (monthNames.indexOf(monthMatch[1].toLowerCase()) + 1).toString().padStart(2, '0')
        const day = match3[1].padStart(2, '0')
        const year = match3[2]
        return `${year}.${month}.${day}`
      }
    }
    
    // 格式4: 已经是 2025.12.30 格式
    if (/^\d{4}\.\d{1,2}\.\d{1,2}$/.test(dateStr)) {
      const parts = dateStr.split('.')
      return `${parts[0]}.${parts[1].padStart(2, '0')}.${parts[2].padStart(2, '0')}`
    }
    
    // 如果无法解析，返回原字符串
    return dateStr
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

  // 渲染带有链接识别和Copy按钮的文本内容
  const renderTextWithLinks = (text: string) => {
    if (!text) return null
    
    // 匹配URL的正则表达式
    const urlRegex = /(https?:\/\/[^\s\n]+)/g
    const parts = text.split(urlRegex)
    
    return (
      <View className="text-with-links">
        {parts.map((part, index) => {
          if (urlRegex.test(part)) {
            // 这是一个链接
            return (
              <View key={index} className="link-container">
                <Text className="link-text" style={{ wordBreak: 'break-all', flex: 1 }}>
                  {part}
                </Text>
                <View 
                  className="copy-link-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCopyLink(part)
                  }}
                >
                  <Text>Copy</Text>
                </View>
              </View>
            )
          } else {
            // 这是普通文本
            return (
              <Text key={index} style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {part}
              </Text>
            )
          }
        })}
      </View>
    )
  }

  const handleClearHistory = async () => {
    const result = await Taro.showModal({
      title: '确认清空',
      content: '确定要清空所有浏览历史吗？此操作不可恢复。',
      confirmText: '清空',
      confirmColor: '#EF4444',
      cancelText: '取消'
    })
    
    if (result.confirm) {
      try {
        const userId = await authService.getOpenID()
        if (!userId) return
        
        const { error } = await clearViewHistory(userId)
        if (error) {
          throw new Error(error.message)
        }
        
        setHistory([])
        Taro.showToast({
          title: '已清空',
          icon: 'success'
        })
      } catch (error) {
        console.error('清空浏览历史失败:', error)
        Taro.showToast({
          title: '清空失败',
          icon: 'none'
        })
      }
    }
  }

  // 获取筛选后的历史列表
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
            <Text className="empty-icon">🕐</Text>
            <Text className="empty-title">还没有浏览历史</Text>
            <Text className="empty-desc">去首页看看感兴趣的机会吧</Text>
            <View className="empty-action" onClick={handleNavigateToHome}>
              <Text>去首页</Text>
            </View>
          </View>
        ) : (
          <>
            <View className="history-header">
              <View className="history-header-left">
                <Text className="history-count">共 {getFilteredHistory().length} 条浏览记录</Text>
                <ExpiredFilter
                  value={hideExpired}
                  onChange={setHideExpired}
                  className="history-expired-filter"
                />
              </View>
              <View className="clear-history-btn" onClick={handleClearHistory}>
                <Text>🗑️ 清空</Text>
              </View>
            </View>

            <View className="history-list">
              {getFilteredHistory().map(item => {
                const expired = isExpired(item)
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
                    <Text className={`type-tag ${item.type === 'recruit' ? 'recruit' : item.type === 'lecture' ? 'lecture' : 'activity'}`}>
                      {item.type === 'recruit' ? '招聘' : item.type === 'lecture' ? '讲座' : '活动'}
                    </Text>
                    {expired && <Text className="expired-tag">已过期</Text>}
                  </View>
                  <FavoriteButton
                    eventId={item.id}
                    initialFavorited={favoriteIds.has(item.id)}
                    onToggle={(isFavorited) => {
                      // 更新本地收藏状态
                      const newFavoriteIds = new Set(favoriteIds)
                      if (isFavorited) {
                        newFavoriteIds.add(item.id)
                      } else {
                        newFavoriteIds.delete(item.id)
                      }
                      setFavoriteIds(newFavoriteIds)
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
                        <Text className={`info-text ${expired ? 'expired-text' : ''}`}>{formatDate(item.key_info.deadline)}</Text>
                      </View>
                    )
                  ) : (
                    // 活动信息显示日期和时间
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

      {/* 详情 Modal */}
      {selectedItem && (
        <View className="detail-modal">
          <View className="detail-header">
            <Button 
              className="detail-back-btn"
              onClick={() => {
                setSelectedItem(null)
                setShowPoster(false)
              }}
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
                initialFavorited={favoriteIds.has(selectedItem.id)}
                large={true}
                onToggle={(isFavorited) => {
                  // 更新本地收藏状态
                  const newFavoriteIds = new Set(favoriteIds)
                  if (isFavorited) {
                    newFavoriteIds.add(selectedItem.id)
                  } else {
                    newFavoriteIds.delete(selectedItem.id)
                  }
                  setFavoriteIds(newFavoriteIds)
                }}
              />
            </View>
          </View>

          <View className="detail-scroll-wrapper">
            <ScrollView 
              scrollY 
              className="detail-scroll"
              enhanced
              showScrollbar={false}
            >
              {/* 图片区域 */}
              <View className="detail-hero">
                <View className="detail-hero-gradient" />
              </View>

              {/* 标题 */}
              <Text className="detail-main-title">{selectedItem.title}</Text>

              <View className="detail-content">
                <View className="detail-info-card">
                  <Text className="detail-section-title">关键信息</Text>
                  
                  {/* 招聘信息 */}
                  {selectedItem.type === 'recruit' && (
                    <>
                      {selectedItem.key_info.company && (
                        <View className="detail-info-item">
                          <View className="detail-info-icon">
                            <Text>🏢</Text>
                          </View>
                          <View className="detail-info-content">
                            <Text className="detail-info-label">公司 | Company:</Text>
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
                            <Text className="detail-info-label">岗位 | Position:</Text>
                            <Text className="detail-info-value">{selectedItem.key_info.position}</Text>
                          </View>
                        </View>
                      )}
                      
                      {/* 联系方式 */}
                      {selectedItem.key_info.contact && (
                        <View className="detail-info-item">
                          <View className="detail-info-icon">
                            <Text>💬</Text>
                          </View>
                          <View className="detail-info-content" style={{ flex: 1 }}>
                            <Text className="detail-info-label">联系方式 | Contact:</Text>
                            <View className="detail-info-value-row">
                              <Text className="detail-info-value" style={{ wordBreak: 'break-all', flex: 1 }}>
                                {selectedItem.key_info.contact}
                              </Text>
                              <View 
                                className="copy-link-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCopyLink(selectedItem.key_info.contact || '')
                                }}
                              >
                                <Text>Copy</Text>
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
                            <Text className="detail-info-label">申请群体 | Applicants:</Text>
                            <Text className="detail-info-value">{selectedItem.key_info.education}</Text>
                          </View>
                        </View>
                      )}
                      
                      {selectedItem.key_info.deadline && (
                        <View className="detail-info-item">
                          <View className="detail-info-icon">
                            <Text>⏰</Text>
                          </View>
                          <View className="detail-info-content">
                            <Text className="detail-info-label">截止时间 | Deadline:</Text>
                            <Text className="detail-info-value">{formatDate(selectedItem.key_info.deadline)}</Text>
                          </View>
                        </View>
                      )}
                      
                      {selectedItem.key_info.link && (
                        <View className="detail-info-item">
                          <View className="detail-info-icon">
                            <Text>📧</Text>
                          </View>
                          <View className="detail-info-content" style={{ flex: 1 }}>
                            <Text className="detail-info-label">投递方式 | Apply:</Text>
                            <View className="detail-info-value-row">
                              <Text className="detail-info-value" style={{ wordBreak: 'break-all', flex: 1 }}>
                                {selectedItem.key_info.link.replace(/^mailto:/i, '')}
                              </Text>
                              {/* 只有当不是二维码报名时才显示Copy按钮 */}
                              {!selectedItem.key_info.link.includes('二维码报名') && !selectedItem.key_info.link.includes('QR Code') && (
                                <View 
                                  className="copy-link-btn"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleCopyLink((selectedItem.key_info.link || '').replace(/^mailto:/i, ''))
                                  }}
                                >
                                  <Text>Copy</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                      )}
                    </>
                  )}
                  
                  {/* 活动/讲座信息 */}
                  {(selectedItem.type === 'activity' || selectedItem.type === 'lecture') && (
                    <>
                      {selectedItem.key_info.date && (
                        <View className="detail-info-item">
                          <View className="detail-info-icon">
                            <Text>📅</Text>
                          </View>
                          <View className="detail-info-content">
                            <Text className="detail-info-label">日期 | Date:</Text>
                            <Text className="detail-info-value">{formatDate(selectedItem.key_info.date)}</Text>
                          </View>
                        </View>
                      )}
                      
                      {selectedItem.key_info.time && (
                        <View className="detail-info-item">
                          <View className="detail-info-icon">
                            <Text>🕐</Text>
                          </View>
                          <View className="detail-info-content">
                            <Text className="detail-info-label">时间 | Time:</Text>
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
                            <Text className="detail-info-label">地点 | Location:</Text>
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
                            <Text className="detail-info-label">截止时间 | Deadline:</Text>
                            <Text className="detail-info-value">{formatDate(selectedItem.key_info.deadline)}</Text>
                          </View>
                        </View>
                      )}
                      
                      {selectedItem.key_info.registration_link && (
                        <View className="detail-info-item">
                          <View className="detail-info-icon">
                            <Text>🔗</Text>
                          </View>
                          <View className="detail-info-content" style={{ flex: 1 }}>
                            <Text className="detail-info-label">报名链接 | Register:</Text>
                            <View className="detail-info-value-row">
                              <Text className="detail-info-value" style={{ wordBreak: 'break-all', flex: 1 }}>
                                {selectedItem.key_info.registration_link}
                              </Text>
                              {/* 只有当不是二维码报名时才显示Copy按钮 */}
                              {!selectedItem.key_info.registration_link.includes('二维码报名') && !selectedItem.key_info.registration_link.includes('QR Code') && (
                                <View 
                                  className="copy-link-btn"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleCopyLink(selectedItem.key_info.registration_link || '')
                                  }}
                                >
                                  <Text>Copy</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                      )}
                    </>
                  )}
                </View>

                {/* 活动详情 */}
                <View className="detail-body">
                  {selectedItem.summary && selectedItem.raw_content && 
                   selectedItem.raw_content.trim() && 
                   selectedItem.summary.trim() !== selectedItem.raw_content.trim().substring(0, Math.min(selectedItem.summary.length, selectedItem.raw_content.length)).trim() ? (
                    <>
                      <Text className="detail-body-title">活动详情 | Details</Text>
                      <Text className="detail-summary">{selectedItem.summary}</Text>
                      {selectedItem.raw_content && selectedItem.raw_content.trim() && !selectedItem.raw_content.startsWith('📷') && (
                        <View className="detail-raw-content">
                          {renderTextWithLinks(selectedItem.raw_content)}
                        </View>
                      )}
                    </>
                  ) : (
                    <>
                      <Text className="detail-body-title">活动详情 | Details</Text>
                      <View className="detail-summary">
                        {renderTextWithLinks(
                          selectedItem.raw_content?.trim() && !selectedItem.raw_content.startsWith('📷')
                            ? selectedItem.raw_content 
                            : selectedItem.summary || '暂无详情'
                        )}
                      </View>
                    </>
                  )}

                  {/* 如果有图片海报，显示查看按钮或图片 */}
                  {selectedItem.image_url && (
                    <View className="detail-poster">
                      {showPoster ? (
                        <Image 
                          src={selectedItem.image_url} 
                          mode="widthFix" 
                          className="detail-poster-image"
                          showMenuByLongpress
                          lazyLoad
                        />
                      ) : (
                        <Button 
                          className="load-poster-btn"
                          onClick={() => setShowPoster(true)}
                        >
                          <Text>点击查看海报 | view poster</Text>
                        </Button>
                      )}
                    </View>
                  )}
                </View>
              </View>
              </ScrollView>
            </View>

          {/* 只有需要显示按钮时才渲染底部操作栏 */}
          {((selectedItem.type !== 'recruit' && selectedItem.key_info?.date) ||
            (selectedItem.type === 'recruit' && selectedItem.key_info?.deadline)) && (
            <View className="detail-actions" style={{ paddingBottom: `${getSafeAreaBottom() + 32}rpx` }}>
              {/* 活动/讲座：有日期时显示添加到日历 */}
              {selectedItem.type !== 'recruit' && (
                <Button 
                  className="detail-action-btn"
                  onClick={() => handleAddToCalendar(selectedItem)}
                >
                  <Text>📅 添加到日历 | Add to Calendar</Text>
                </Button>
              )}
              {/* 招聘：有截止时间时显示添加到日历 */}
              {selectedItem.type === 'recruit' && (
                <Button 
                  className="detail-action-btn"
                  onClick={() => handleAddToCalendar(selectedItem)}
                >
                  <Text>📅 添加到日历 | Add to Calendar</Text>
                </Button>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  )
}

