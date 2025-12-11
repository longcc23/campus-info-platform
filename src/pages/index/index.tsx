import React, { Component } from 'react'
import { View, Text, Input, Button, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { 
  getEvents, 
  type Event,
  getWechatOpenID,
  upsertUser,
  recordViewHistory,
  getFavorites,
  getViewHistory
} from '../../utils/supabase-rest'
import { 
  createCalendarEventFromItem, 
  addToPhoneCalendar 
} from '../../utils/ics-generator'
import FavoriteButton from '../../components/FavoriteButton'
import favoritesService from '../../services/favorites'
import { getSafeAreaBottom } from '../../utils/system-info'
import './index.scss'

// --- Type Definitions ---
interface KeyInfo {
  date?: string
  time?: string
  location?: string
  deadline?: string
  company?: string
  position?: string
  education?: string
  link?: string
  referral?: boolean
}

interface FeedItem {
  id: number
  type: 'activity' | 'lecture' | 'recruit'
  status: 'open' | 'urgent' | 'new'
  title: string
  organizer: string
  sourceGroup: string
  publishTime: string
  tags: string[]
  keyInfo: KeyInfo
  summary: string
  rawContent: string
  isTop: boolean
  isSaved: boolean
  posterColor: string
}

// --- Mock Data ---
const INITIAL_DATA: FeedItem[] = [
  {
    id: 1,
    type: 'activity',
    status: 'open',
    title: 'Google Office Tour & 2026 暑期实习预热',
    organizer: 'Google x 学院CDC',
    sourceGroup: 'CDC 官方通知群 1群',
    publishTime: '10分钟前',
    tags: ['企业参访', '外企', '含Office Tour'],
    keyInfo: {
      date: '12月4日 (周三)',
      time: '14:00 - 16:00',
      location: 'Google Beijing Office',
      deadline: '名额有限，先到先得'
    },
    summary: '面向中国籍学生的2026 Summer Intern预热。含Opening, Business Intro, 校友分享及Office Tour。',
    rawContent: `Agenda:
• 14:00–14:05 Opening & Kahoot
• 14:05–14:15 Business Introduction
• 14:15–14:30 Alumni Sharing
• 15:00-16:00 Interview Process Introduction
• Office Tour

注：活动语言为中文。`,
    isTop: true,
    isSaved: false,
    posterColor: 'from-blue-600 to-red-500'
  },
  {
    id: 2,
    type: 'lecture',
    status: 'urgent',
    title: 'Career BootCamp: Networking & Insights',
    organizer: 'Tsinghua SEM CDC',
    sourceGroup: 'SEM 职业发展中心',
    publishTime: '2小时前',
    tags: ['技能工作坊', '嘉宾分享', '职业辅导'],
    keyInfo: {
      date: '2025.12.02',
      time: '14:00 - 16:00 (GMT+8)',
      location: '伟伦楼 (详见报名群)',
      deadline: '活动开始前'
    },
    summary: 'Guest Speaker: Rosemary Zhou. 曾负责文华东方酒店集团全球人力运营。Topic: Build Your Network, Personal Brand.',
    rawContent: '通过本次 BootCamp，你将学习到如何构建职场人脉，打造个人品牌，以及对中国职业市场的深入洞察。',
    isTop: false,
    isSaved: true,
    posterColor: 'from-green-500 to-teal-400'
  },
  {
    id: 3,
    type: 'recruit',
    status: 'open',
    title: '2025年秋季学期中期实践活动招募',
    organizer: '清华大学学生就业服务协会',
    sourceGroup: '校友内推群 (经管)',
    publishTime: '昨天',
    tags: ['校级组织', '社工锻炼'],
    keyInfo: {
      date: '近期面试',
      time: '课余时间灵活安排',
      location: '校内/线上',
      deadline: '2025.11.30'
    },
    summary: '立大志，入主流，上大舞台，干大事业！学生职业发展指导中心招募新一届骨干。',
    rawContent: '主要负责秋季学期的就业引导、大型招聘会筹备以及企业联络工作。',
    isTop: false,
    isSaved: false,
    posterColor: 'from-purple-600 to-indigo-600'
  }
]

interface IndexState {
  activeFilter: 'all' | 'recruit' | 'activity'
  feed: FeedItem[]
  selectedItem: FeedItem | null
  toast: string | null
  userId: string | null
  favorites: FeedItem[]
  searchKeyword: string
}

export default class Index extends Component<{}, IndexState> {
  constructor(props: {}) {
    super(props)
    this.state = {
      activeFilter: 'all',
      feed: INITIAL_DATA,
      selectedItem: null,
      toast: null,
      userId: null,
      favorites: [],
      searchKeyword: ''
    }
  }

  componentDidMount() {
    this.initUser()
    this.loadEvents()
    this.updateTabBar()
  }

  componentDidShow() {
    // 每次页面显示时重新加载收藏状态
    this.loadFavoriteStatus()
    this.updateTabBar()
  }

  updateTabBar = () => {
    // 更新自定义 TabBar 的选中状态
    try {
      const page = Taro.getCurrentInstance()?.page
      if (page && typeof (page as any).getTabBar === 'function') {
        const tabBar = (page as any).getTabBar()
        if (tabBar && typeof tabBar.setSelected === 'function') {
          tabBar.setSelected(0) // 首页的索引是 0
        }
      }
    } catch (error) {
      console.error('更新 TabBar 状态失败:', error)
    }
  }

  // 下拉刷新处理
  onPullDownRefresh = async () => {
    try {
      await this.loadEvents()
      this.showToast('刷新成功')
    } catch (error) {
      console.error('刷新失败:', error)
      this.showToast('刷新失败')
    } finally {
      Taro.stopPullDownRefresh()
    }
  }

  showToast = (message: string) => {
    this.setState({ toast: message })
    setTimeout(() => this.setState({ toast: null }), 2000)
  }

  initUser = async () => {
    try {
      const openid = await getWechatOpenID()
      if (openid) {
        this.setState({ userId: openid })
        await upsertUser(openid)
        console.log('✅ 用户初始化成功:', openid)
        this.loadFavoriteStatus()
      }
    } catch (error) {
      console.error('❌ 用户初始化失败:', error)
    }
  }

  loadEvents = async () => {
    try {
      console.log('📡 开始加载 Supabase 数据...')
      const { data, error } = await getEvents()
      
      if (error) {
        console.error('❌ 加载失败：', error)
        return
      }
      
      if (data && data.length > 0) {
        console.log(`✅ 成功加载 ${data.length} 条数据`)
        const feedItems = data.map(this.convertEventToFeedItem)
        this.setState({ feed: feedItems })
      }
    } catch (error: any) {
      console.error('❌ 加载数据异常：', error)
    }
  }

  convertEventToFeedItem = (event: Event): FeedItem => {
    return {
      id: event.id,
      type: event.type,
      status: event.status === 'active' ? 'open' : event.status === 'inactive' ? 'urgent' : 'new',
      title: event.title,
      organizer: event.source_group.split(' ')[0] || event.source_group,
      sourceGroup: event.source_group,
      publishTime: event.publish_time,
      tags: event.tags,
      keyInfo: event.key_info,
      summary: event.summary || '',
      rawContent: event.raw_content || '',
      isTop: event.is_top,
      isSaved: false,
      posterColor: event.poster_color
    }
  }

  loadFavoriteStatus = async () => {
    const { feed } = this.state
    if (feed.length === 0) return
    
    try {
      const eventIds = feed.map(item => item.id)
      const favoritedIds = await favoritesService.getFavoriteStatus(eventIds)
      
      this.setState({
        feed: feed.map(item => ({
          ...item,
          isSaved: favoritedIds.has(item.id)
        }))
      })
    } catch (error) {
      console.error('加载收藏状态失败:', error)
    }
  }

  handleItemClick = async (item: FeedItem) => {
    this.setState({ selectedItem: item })
    
    const { userId } = this.state
    if (userId) {
      await recordViewHistory(userId, item.id)
    }
  }

  handleAddToCalendar = async (item: FeedItem) => {
    try {
      let dateStr = ''
      let timeStr = ''
      
      // 如果是招聘类型，使用 deadline
      if (item.type === 'recruit' && item.keyInfo.deadline) {
        dateStr = item.keyInfo.deadline
        // 尝试从 deadline 中提取时间（如"12月16日中午12:00"）
        const timeMatch = item.keyInfo.deadline.match(/(中午|上午|下午|晚上)?\s*(\d{1,2}):(\d{2})/)
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
        dateStr = item.keyInfo.date || ''
        timeStr = item.keyInfo.time || ''
      }
      
      const calendarEvent = createCalendarEventFromItem(
        item.title,
        dateStr,
        timeStr,
        item.keyInfo.location || '',
        item.summary || item.rawContent
      )
      
      if (!calendarEvent) {
        this.showToast('无法解析活动时间')
        return
      }
      
      await addToPhoneCalendar(calendarEvent)
    } catch (error) {
      console.error('添加到日历失败:', error)
      this.showToast('添加到日历失败')
    }
  }

  getFilteredFeed = () => {
    const { feed, activeFilter, searchKeyword } = this.state
    
    return feed.filter(item => {
      // 分类过滤
      let matchesFilter = true
      if (activeFilter === 'activity') {
        matchesFilter = ['activity', 'lecture'].includes(item.type)
      } else if (activeFilter === 'recruit') {
        matchesFilter = item.type === 'recruit'
      }
      
      if (!matchesFilter) return false
      
      // 搜索过滤
      if (!searchKeyword.trim()) return true
      
      const keyword = searchKeyword.trim().toLowerCase()
      return (
        item.title.toLowerCase().includes(keyword) ||
        item.organizer.toLowerCase().includes(keyword) ||
        item.sourceGroup.toLowerCase().includes(keyword) ||
        item.tags.some(tag => tag.toLowerCase().includes(keyword)) ||
        (item.summary && item.summary.toLowerCase().includes(keyword)) ||
        (item.keyInfo.location && item.keyInfo.location.toLowerCase().includes(keyword))
      )
    })
  }

  render() {
    const { activeFilter, selectedItem, toast, feed, searchKeyword } = this.state
    const filteredFeed = this.getFilteredFeed()
    const safeAreaBottom = getSafeAreaBottom()

    return (
      <View className="index-page">
        {/* 搜索栏和筛选栏（移到 ScrollView 外面，确保无缝连接） */}
        <View className="header-section">
          <View className="search-section">
            <View className="search-input-wrapper">
              <Text className="search-icon">🔍</Text>
              <Input 
                className="search-input"
                type="text" 
                placeholder="搜索职位、公司或活动..." 
                value={searchKeyword}
                onInput={(e) => this.setState({ searchKeyword: e.detail.value || '' })}
              />
              {searchKeyword && (
                <View 
                  className="search-clear"
                  onClick={() => this.setState({ searchKeyword: '' })}
                >
                  <Text>✕</Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Filter Bar */}
          <View className="filter-bar">
            {[
              { id: 'all', label: '全部' }, 
              { id: 'recruit', label: '实习招聘' }, 
              { id: 'activity', label: '讲座活动' }
            ].map((tab) => (
              <View 
                key={tab.id}
                className={`filter-tab ${activeFilter === tab.id ? 'active' : ''}`}
                onClick={() => this.setState({ activeFilter: tab.id as any })}
              >
                <Text>{tab.label}</Text>
                {activeFilter === tab.id && <View className="filter-tab-indicator" />}
              </View>
            ))}
          </View>
        </View>

        {/* Main Content */}
        <ScrollView 
          scrollY 
          className="page-scroll"
          enhanced
          showScrollbar={false}
        >
          <View className="page-content" style={{ paddingBottom: `${safeAreaBottom + 200}rpx` }}>

            <View className="feed-container">
              {/* Feed List */}
              {filteredFeed.length === 0 ? (
                <View className="empty-state">
                  <Text className="empty-icon">📭</Text>
                  <Text className="empty-title">暂无数据</Text>
                  <Text className="empty-desc">试试其他筛选条件</Text>
                </View>
              ) : (
                filteredFeed.map((item, index) => (
                  <View 
                    key={item.id} 
                    className={`feed-card ${index === 0 ? 'first-card' : ''}`}
                    onClick={() => this.handleItemClick(item)}
                  >
                    <View className="card-top-bar" style={{ background: `linear-gradient(to right, ${item.posterColor})` }} />
                    <View className="card-content">
                      <View className="card-header">
                        <View className="card-header-left">
                          <Text className={`type-tag ${item.type === 'recruit' ? 'recruit' : item.type === 'lecture' ? 'lecture' : 'activity'}`}>
                            {item.type === 'recruit' ? '招聘' : item.type === 'lecture' ? '讲座' : '活动'}
                          </Text>
                        </View>
                        <FavoriteButton 
                          eventId={item.id}
                          initialFavorited={item.isSaved}
                          className="card-favorite-btn"
                          onToggle={(isFavorited) => {
                            this.setState({
                              feed: feed.map(feedItem => 
                                feedItem.id === item.id 
                                  ? { ...feedItem, isSaved: isFavorited } 
                                  : feedItem
                              )
                            })
                          }}
                        />
                      </View>
                      <Text className="card-title">{item.title}</Text>
                      <View className="card-info">
                        <View className="info-item">
                          <Text className="info-icon">{item.type === 'recruit' ? '⏰' : '📅'}</Text>
                          <Text className="info-text">
                            {item.type === 'recruit' && item.keyInfo.deadline 
                              ? item.keyInfo.deadline 
                              : item.keyInfo.date || '-'}
                          </Text>
                        </View>
                        {item.keyInfo.location && (
                          <View className="info-item location">
                            <Text className="info-icon">📍</Text>
                            <Text className="info-text">{item.keyInfo.location}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>

        {/* Detail Modal */}
        {selectedItem && (
          <View className="detail-modal">
            <View className="detail-header">
              <Button 
                className="detail-back-btn"
                onClick={() => this.setState({ selectedItem: null })} 
              >
                <Text>←</Text>
              </Button>
              <Text className="detail-title">{selectedItem.title}</Text>
              <View className="detail-header-right">
                <FavoriteButton 
                  eventId={selectedItem.id}
                  initialFavorited={selectedItem.isSaved}
                  large={true}
                  onToggle={(isFavorited) => {
                    this.setState({
                      selectedItem: { ...selectedItem, isSaved: isFavorited },
                      feed: feed.map(item => 
                        item.id === selectedItem.id 
                          ? { ...item, isSaved: isFavorited } 
                          : item
                      )
                    })
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
                <View className="detail-hero" style={{ background: `linear-gradient(to bottom right, ${selectedItem.posterColor})` }}>
                  <Text style={{ fontSize: '40rpx', fontWeight: 'bold' }}>{selectedItem.title}</Text>
                </View>

                <View className="detail-content">
                <View className="detail-info-card">
                  <Text className="detail-section-title">关键信息</Text>
                  
                  {/* 招聘信息：公司、岗位、截止时间、投递方式 */}
                  {selectedItem.type === 'recruit' && (
                    <>
                      {selectedItem.keyInfo.company && (
                        <View className="detail-info-item">
                          <View className="detail-info-icon">
                            <Text>🏢</Text>
                          </View>
                          <View className="detail-info-content">
                            <Text className="detail-info-label">公司</Text>
                            <Text className="detail-info-value">{selectedItem.keyInfo.company}</Text>
                          </View>
                        </View>
                      )}
                      
                      {selectedItem.keyInfo.position && (
                        <View className="detail-info-item">
                          <View className="detail-info-icon">
                            <Text>💼</Text>
                          </View>
                          <View className="detail-info-content">
                            <Text className="detail-info-label">岗位</Text>
                            <Text className="detail-info-value">{selectedItem.keyInfo.position}</Text>
                          </View>
                        </View>
                      )}
                      
                      {selectedItem.keyInfo.deadline && (
                        <View className="detail-info-item">
                          <View className="detail-info-icon">
                            <Text>⏰</Text>
                          </View>
                          <View className="detail-info-content">
                            <Text className="detail-info-label">截止时间</Text>
                            <Text className="detail-info-value">{selectedItem.keyInfo.deadline}</Text>
                          </View>
                        </View>
                      )}
                      
                      {selectedItem.keyInfo.link && (
                        <View className="detail-info-item">
                          <View className="detail-info-icon">
                            <Text>📧</Text>
                          </View>
                          <View className="detail-info-content" style={{ flex: 1 }}>
                            <Text className="detail-info-label">投递方式</Text>
                            <Text className="detail-info-value" style={{ wordBreak: 'break-all' }}>
                              {selectedItem.keyInfo.link}
                            </Text>
                          </View>
                        </View>
                      )}
                      
                      {selectedItem.keyInfo.education && (
                        <View className="detail-info-item">
                          <View className="detail-info-icon">
                            <Text>🎓</Text>
                          </View>
                          <View className="detail-info-content">
                            <Text className="detail-info-label">申请群体</Text>
                            <Text className="detail-info-value">{selectedItem.keyInfo.education}</Text>
                          </View>
                        </View>
                      )}
                    </>
                  )}
                  
                  {/* 活动/讲座信息：日期、时间、地点 */}
                  {(selectedItem.type === 'activity' || selectedItem.type === 'lecture') && (
                    <>
                      {selectedItem.keyInfo.date && (
                        <View className="detail-info-item">
                          <View className="detail-info-icon">
                            <Text>📅</Text>
                          </View>
                          <View className="detail-info-content">
                            <Text className="detail-info-label">日期</Text>
                            <Text className="detail-info-value">{selectedItem.keyInfo.date}</Text>
                          </View>
                        </View>
                      )}
                      
                      {selectedItem.keyInfo.time && (
                        <View className="detail-info-item">
                          <View className="detail-info-icon">
                            <Text>🕐</Text>
                          </View>
                          <View className="detail-info-content">
                            <Text className="detail-info-label">时间</Text>
                            <Text className="detail-info-value">{selectedItem.keyInfo.time}</Text>
                          </View>
                        </View>
                      )}
                      
                      {selectedItem.keyInfo.location && (
                        <View className="detail-info-item">
                          <View className="detail-info-icon">
                            <Text>📍</Text>
                          </View>
                          <View className="detail-info-content">
                            <Text className="detail-info-label">地点</Text>
                            <Text className="detail-info-value">{selectedItem.keyInfo.location}</Text>
                          </View>
                        </View>
                      )}
                      
                      {selectedItem.keyInfo.deadline && (
                        <View className="detail-info-item">
                          <View className="detail-info-icon">
                            <Text>⏰</Text>
                          </View>
                          <View className="detail-info-content">
                            <Text className="detail-info-label">截止时间</Text>
                            <Text className="detail-info-value">{selectedItem.keyInfo.deadline}</Text>
                          </View>
                        </View>
                      )}
                    </>
                  )}
                </View>

                <View className="detail-body">
                  {/* 显示活动详情：优先显示 summary（如果有且与 rawContent 不同），否则显示 rawContent */}
                  {selectedItem.summary && selectedItem.rawContent && 
                   selectedItem.rawContent.trim() && 
                   selectedItem.summary.trim() !== selectedItem.rawContent.trim().substring(0, Math.min(selectedItem.summary.length, selectedItem.rawContent.length)).trim() ? (
                    <>
                      <Text className="detail-body-title">📄 活动详情</Text>
                      <Text className="detail-summary">{selectedItem.summary}</Text>
                      {selectedItem.rawContent && selectedItem.rawContent.trim() && (
                        <View className="detail-raw-content" style={{ marginTop: '32rpx', paddingTop: '32rpx', borderTop: '1px solid #e5e7eb' }}>
                          <Text className="detail-body-title" style={{ marginBottom: '16rpx', fontSize: '32rpx' }}>📋 详细内容</Text>
                          <Text style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{selectedItem.rawContent}</Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <>
                      <Text className="detail-body-title">📄 活动详情</Text>
                      <Text className="detail-summary" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                        {selectedItem.rawContent?.trim() || selectedItem.summary || ''}
                      </Text>
                    </>
                  )}
                </View>
              </View>
              </ScrollView>
            </View>

            <View className="detail-actions">
              {/* 活动/讲座：有日期时显示添加到日历 */}
              {(selectedItem.type === 'activity' || selectedItem.type === 'lecture') && 
               selectedItem.keyInfo && 
               selectedItem.keyInfo.date && (
                <Button 
                  className="detail-action-btn"
                  onClick={() => this.handleAddToCalendar(selectedItem)}
                >
                  <Text>📅 添加到日历</Text>
                </Button>
              )}
              {/* 招聘：有截止时间时显示添加到日历 */}
              {selectedItem.type === 'recruit' && 
               selectedItem.keyInfo && 
               selectedItem.keyInfo.deadline && (
                <Button 
                  className="detail-action-btn"
                  onClick={() => this.handleAddToCalendar(selectedItem)}
                >
                  <Text>📅 添加截止日期到日历</Text>
                </Button>
              )}
            </View>
          </View>
        )}

        {/* Toast */}
        {toast && (
          <View className="toast">
            <Text>✅ {toast}</Text>
          </View>
        )}
      </View>
    )
  }
}
