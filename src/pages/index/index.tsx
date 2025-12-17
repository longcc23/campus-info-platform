import { Component } from 'react'
import { View, Text, Input, Button, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { 
  getEvents, 
  type Event,
  getWechatOpenID,
  upsertUser,
  recordViewHistory
} from '../../utils/supabase-rest'
import { 
  createCalendarEventFromItem, 
  addToPhoneCalendar 
} from '../../utils/ics-generator'
import FavoriteButton from '../../components/FavoriteButton'
import { SkeletonList } from '../../components/Skeleton'
import ExpiredFilter from '../../components/ExpiredFilter'
import ShareButton from '../../components/ShareButton'
import favoritesService from '../../services/favorites'
import { isExpired, filterExpiredEvents } from '../../services/expiration'
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
  contact?: string  // 联系方式（微信号、电话等）
  registration_link?: string  // 活动/讲座报名链接
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

// 过期判断逻辑已移至 src/services/expiration.ts

interface IndexState {
  activeFilter: 'all' | 'recruit' | 'activity'
  feed: FeedItem[]
  selectedItem: FeedItem | null
  toast: string | null
  userId: string | null
  favorites: FeedItem[]
  searchKeyword: string
  loading: boolean
  isFirstLoad: boolean
  hideExpired: boolean
}

export default class Index extends Component<{}, IndexState> {
  constructor(props: {}) {
    super(props)
    this.state = {
      activeFilter: 'all',
      feed: [],
      selectedItem: null,
      toast: null,
      userId: null,
      favorites: [],
      searchKeyword: '',
      loading: true,
      isFirstLoad: true,
      hideExpired: false
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
      // 只在首次加载时显示 Skeleton
      if (this.state.isFirstLoad) {
        this.setState({ loading: true })
      }
      
      console.log('📡 开始加载 Supabase 数据...')
      const { data, error } = await getEvents()
      
      if (error) {
        console.error('❌ 加载失败：', error)
        return
      }
      
      if (data && data.length > 0) {
        console.log(`✅ 成功加载 ${data.length} 条数据`)
        const feedItems = data.map(this.convertEventToFeedItem)
        this.setState({ 
          feed: feedItems,
          isFirstLoad: false
        })
      }
    } catch (error: any) {
      console.error('❌ 加载数据异常：', error)
    } finally {
      this.setState({ loading: false })
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

  handleCopyLink = (link: string) => {
    Taro.setClipboardData({
      data: link,
      success: () => {
        // 不显示提示，系统会自动显示"内容已复制"
      },
      fail: () => {
        this.showToast('复制失败')
      }
    })
  }

  // 处理链接点击：复制并提示用户在浏览器打开
  handleLinkClick = (link: string, linkType: 'registration' | 'apply' = 'apply') => {
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
        this.showToast('复制失败')
      }
    })
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
    const { feed, activeFilter, searchKeyword, hideExpired } = this.state
    
    let filteredItems = feed.filter(item => {
      // 分类过滤
      let matchesFilter = true
      if (activeFilter === 'activity') {
        matchesFilter = ['activity', 'lecture'].includes(item.type)
      } else if (activeFilter === 'recruit') {
        matchesFilter = item.type === 'recruit'
      }
      
      if (!matchesFilter) return false
      
      // 过期筛选
      if (hideExpired && isExpired(item)) {
        return false
      }
      
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
    
    return filteredItems
  }

  render() {
    const { activeFilter, selectedItem, toast, feed, searchKeyword, loading, isFirstLoad } = this.state
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
            <View className="filter-tabs">
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
            
            <ExpiredFilter
              value={this.state.hideExpired}
              onChange={(hideExpired) => this.setState({ hideExpired })}
              className="filter-expired-toggle"
            />
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

            {/* 显示 Skeleton 或真实内容 */}
            {loading && isFirstLoad ? (
              <SkeletonList count={5} />
            ) : (
              <View className="feed-container">
                {/* Feed List */}
                {filteredFeed.length === 0 ? (
                  <View className="empty-state">
                    <Text className="empty-icon">📭</Text>
                    <Text className="empty-title">暂无数据</Text>
                    <Text className="empty-desc">试试其他筛选条件</Text>
                  </View>
                ) : (
                  filteredFeed.map((item, index) => {
                    const expired = isExpired(item)
                    return (
                      <View 
                        key={item.id} 
                        className={`feed-card ${index === 0 ? 'first-card' : ''} ${expired ? 'expired' : ''}`}
                        onClick={() => this.handleItemClick(item)}
                      >
                        <View className="card-top-bar" style={{ background: expired ? '#9CA3AF' : `linear-gradient(to right, ${item.posterColor})` }} />
                        <View className="card-content">
                          <View className="card-header">
                            <View className="card-header-left">
                              <Text className={`type-tag ${item.type === 'recruit' ? 'recruit' : item.type === 'lecture' ? 'lecture' : 'activity'}`}>
                                {item.type === 'recruit' ? '招聘' : item.type === 'lecture' ? '讲座' : '活动'}
                              </Text>
                              {expired && (
                                <Text className="expired-tag">已过期</Text>
                              )}
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
                          <Text className={`card-title ${expired ? 'expired-text' : ''}`}>{item.title}</Text>
                          <View className="card-info">
                            <View className="info-item">
                              <Text className="info-icon">{item.type === 'recruit' ? '⏰' : '📅'}</Text>
                              <Text className={`info-text ${expired ? 'expired-text' : ''}`}>
                                {item.type === 'recruit' && item.keyInfo.deadline 
                                  ? item.keyInfo.deadline 
                                  : item.keyInfo.date || '-'}
                              </Text>
                            </View>
                            {item.keyInfo.location && (
                              <View className="info-item location">
                                <Text className="info-icon">📍</Text>
                                <Text className={`info-text ${expired ? 'expired-text' : ''}`}>{item.keyInfo.location}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    )
                  })
                )}
              </View>
            )}
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
                <ShareButton 
                  eventData={selectedItem}
                  size="medium"
                  type="icon"
                  className="detail-share-btn"
                />
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
                {/* 图片区域 */}
                <View className="detail-hero">
                  <View className="detail-hero-gradient" />
                </View>

                {/* 标题 */}
                <Text className="detail-main-title">{selectedItem.title}</Text>

                <View className="detail-content">
                <View className="detail-info-card">
                  <Text className="detail-section-title">关键信息</Text>
                  
                  {/* 招聘信息：公司、岗位、联系方式、申请群体 */}
                  {selectedItem.type === 'recruit' && (
                    <>
                      {selectedItem.keyInfo.company && (
                        <View className="detail-info-item">
                          <View className="detail-info-icon">
                            <Text>🏢</Text>
                          </View>
                          <View className="detail-info-content">
                            <Text className="detail-info-label">公司 | Company:</Text>
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
                            <Text className="detail-info-label">岗位 | Position:</Text>
                            <Text className="detail-info-value">{selectedItem.keyInfo.position}</Text>
                          </View>
                        </View>
                      )}
                      
                      {/* 联系方式（微信号、电话等） */}
                      {selectedItem.keyInfo.contact && (
                        <View className="detail-info-item">
                          <View className="detail-info-icon">
                            <Text>💬</Text>
                          </View>
                          <View className="detail-info-content" style={{ flex: 1 }}>
                            <Text className="detail-info-label">联系方式 | Contact:</Text>
                            <View className="detail-info-value-row">
                              <Text className="detail-info-value" style={{ wordBreak: 'break-all', flex: 1 }}>
                                {selectedItem.keyInfo.contact}
                              </Text>
                              <View 
                                className="copy-link-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  this.handleCopyLink(selectedItem.keyInfo.contact || '')
                                }}
                              >
                                <Text>复制 | Copy</Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      )}
                      
                      {selectedItem.keyInfo.education && (
                        <View className="detail-info-item">
                          <View className="detail-info-icon">
                            <Text>🎓</Text>
                          </View>
                          <View className="detail-info-content">
                            <Text className="detail-info-label">申请群体 | Applicants:</Text>
                            <Text className="detail-info-value">{selectedItem.keyInfo.education}</Text>
                          </View>
                        </View>
                      )}
                      
                      {selectedItem.keyInfo.deadline && (
                        <View className="detail-info-item">
                          <View className="detail-info-icon">
                            <Text>⏰</Text>
                          </View>
                          <View className="detail-info-content">
                            <Text className="detail-info-label">截止时间 | Deadline:</Text>
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
                            <Text className="detail-info-label">投递方式 | Apply:</Text>
                            <View className="detail-info-value-row">
                              <Text className="detail-info-value" style={{ wordBreak: 'break-all', flex: 1 }}>
                                {selectedItem.keyInfo.link.replace(/^mailto:/i, '')}
                              </Text>
                              <View 
                                className="copy-link-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  this.handleCopyLink((selectedItem.keyInfo.link || '').replace(/^mailto:/i, ''))
                                }}
                              >
                                <Text>复制 | Copy</Text>
                              </View>
                            </View>
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
                            <Text className="detail-info-label">日期 | Date:</Text>
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
                            <Text className="detail-info-label">时间 | Time:</Text>
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
                            <Text className="detail-info-label">地点 | Location:</Text>
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
                            <Text className="detail-info-label">截止时间 | Deadline:</Text>
                            <Text className="detail-info-value">{selectedItem.keyInfo.deadline}</Text>
                          </View>
                        </View>
                      )}
                      
                      {selectedItem.keyInfo.registration_link && (
                        <View className="detail-info-item">
                          <View className="detail-info-icon">
                            <Text>🔗</Text>
                          </View>
                          <View className="detail-info-content" style={{ flex: 1 }}>
                            <Text className="detail-info-label">报名链接 | Register:</Text>
                            <View className="detail-info-value-row">
                              <Text className="detail-info-value" style={{ wordBreak: 'break-all', flex: 1 }}>
                                {selectedItem.keyInfo.registration_link}
                              </Text>
                              <View 
                                className="copy-link-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  this.handleCopyLink(selectedItem.keyInfo.registration_link || '')
                                }}
                              >
                                <Text>复制 | Copy</Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      )}
                    </>
                  )}
                </View>

                {/* 活动详情 */}
                <View className="detail-body">
                  {selectedItem.summary && selectedItem.rawContent && 
                   selectedItem.rawContent.trim() && 
                   selectedItem.summary.trim() !== selectedItem.rawContent.trim().substring(0, Math.min(selectedItem.summary.length, selectedItem.rawContent.length)).trim() ? (
                    <>
                      <Text className="detail-body-title">活动详情 | Details</Text>
                      <Text className="detail-summary">{selectedItem.summary}</Text>
                      {selectedItem.rawContent && selectedItem.rawContent.trim() && (
                        <View className="detail-raw-content">
                          <Text style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{selectedItem.rawContent}</Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <>
                      <Text className="detail-body-title">活动详情 | Details</Text>
                      <Text className="detail-summary" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                        {selectedItem.rawContent?.trim() || selectedItem.summary || ''}
                      </Text>
                    </>
                  )}
                </View>
              </View>
              </ScrollView>
            </View>

            {/* 只有需要显示按钮时才渲染底部操作栏 */}
            {(((selectedItem.type === 'activity' || selectedItem.type === 'lecture') && 
               selectedItem.keyInfo?.date) ||
              (selectedItem.type === 'recruit' && selectedItem.keyInfo?.deadline)) && (
              <View className="detail-actions">
                {/* 活动/讲座：有日期时显示添加到日历 */}
                {(selectedItem.type === 'activity' || selectedItem.type === 'lecture') && (
                  <Button 
                    className="detail-action-btn"
                    onClick={() => this.handleAddToCalendar(selectedItem)}
                  >
                    <Text>📅 添加到日历 | Add to Calendar</Text>
                  </Button>
                )}
                {/* 招聘：有截止时间时显示添加到日历 */}
                {selectedItem.type === 'recruit' && (
                  <Button 
                    className="detail-action-btn"
                    onClick={() => this.handleAddToCalendar(selectedItem)}
                  >
                    <Text>📅 添加到日历 | Add to Calendar</Text>
                  </Button>
                )}
              </View>
            )}
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

