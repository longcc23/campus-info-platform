import { Component } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { 
  getEvents, 
  type Event,
  upsertUser,
  recordViewHistory
} from '../../utils/supabase-rest'
import { FavoriteButton, SkeletonList, ExpiredFilter, DetailModal } from '../../components'
import { formatDate } from '../../utils/date-formatter'
import favoritesService from '../../services/favorites'
import authService from '../../services/auth'
import { isExpired } from '../../services/expiration'
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
  imageUrl?: string  // 图片海报 URL
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
      // 🚀 修复：下拉刷新后重新加载收藏状态，防止红心消失
      await this.loadFavoriteStatus()
      
      Taro.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1500
      })
    } catch (error) {
      console.error('刷新失败:', error)
      Taro.showToast({
        title: '刷新失败',
        icon: 'none'
      })
    } finally {
      Taro.stopPullDownRefresh()
    }
  }

  initUser = async () => {
    try {
      const openid = await authService.getOpenID()
      if (openid) {
        this.setState({ userId: openid })
        // ensureUser 已经在 authService.getOpenID 中处理过了，但这里保留以防万一
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
      imageUrl: (event as any).image_url || '',  // 图片海报 URL
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
    
    // 🚀 修复：使用 authService 确保一定能拿到 ID，解决浏览历史漏损问题
    try {
      const openid = await authService.getOpenID()
      if (openid) {
        await recordViewHistory(openid, item.id)
      }
    } catch (error) {
      console.error('记录浏览历史失败:', error)
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
    
    // 排序：置顶的在前，然后按创建时间倒序
    filteredItems.sort((a, b) => {
      if (a.isTop && !b.isTop) return -1
      if (!a.isTop && b.isTop) return 1
      return 0 // 如果都置顶或都不置顶，保持原有顺序（后端已排序）
    })
    
    return filteredItems
  }

  render() {
    const { activeFilter, selectedItem, feed, searchKeyword, loading, isFirstLoad } = this.state
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
                        {item.isTop && (
                          <View className="top-corner-badge">
                            <Text className="top-corner-text">置顶</Text>
                          </View>
                        )}
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
                                {item.keyInfo.deadline 
                                  ? formatDate(item.keyInfo.deadline)
                                  : item.keyInfo.date 
                                    ? formatDate(item.keyInfo.date) 
                                    : item.keyInfo.time || '-'}
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

        {/* Detail Modal - 使用公共组件 */}
        {selectedItem && (
          <DetailModal
            item={selectedItem}
            onClose={() => this.setState({ selectedItem: null })}
            initialFavorited={selectedItem.isSaved}
            onFavoriteToggle={(isFavorited) => {
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
        )}
      </View>
    )
  }
}

