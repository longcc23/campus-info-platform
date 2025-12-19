/**
 * 首页 - 信息流列表
 * 使用函数组件 + Hooks 重构
 */

import { useState, useEffect, useCallback } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { getEvents, upsertUser, recordViewHistory } from '../../utils/supabase-rest'
import { EventCard, SkeletonList, ExpiredFilter, DetailModal } from '../../components'
import { isExpired } from '../../services/expiration'
import { getSafeAreaBottom } from '../../utils/system-info'
import favoritesService from '../../services/favorites'
import authService from '../../services/auth'
import type { Event, FeedItem, CardData } from '../../types/event'
import { eventToFeedItem, feedItemToCardData } from '../../types/event'
import './index.scss'

type FilterType = 'all' | 'recruit' | 'activity'

export default function Index() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [hideExpired, setHideExpired] = useState(false)

  // 初始化
  useEffect(() => {
    initUser()
    loadEvents()
    updateTabBar()
  }, [])

  // 页面显示时刷新收藏状态
  useDidShow(() => {
    loadFavoriteStatus()
    updateTabBar()
  })

  // 下拉刷新
  usePullDownRefresh(async () => {
    try {
      await loadEvents()
      await loadFavoriteStatus()
      Taro.showToast({ title: '刷新成功', icon: 'success', duration: 1500 })
    } catch (error) {
      console.error('刷新失败:', error)
      Taro.showToast({ title: '刷新失败', icon: 'none' })
    } finally {
      Taro.stopPullDownRefresh()
    }
  })

  const updateTabBar = () => {
    try {
      const page = Taro.getCurrentInstance()?.page
      if (page && typeof (page as any).getTabBar === 'function') {
        const tabBar = (page as any).getTabBar()
        if (tabBar && typeof tabBar.setSelected === 'function') {
          tabBar.setSelected(0)
        }
      }
    } catch (error) {
      console.error('更新 TabBar 状态失败:', error)
    }
  }

  const initUser = async () => {
    try {
      const openid = await authService.getOpenID()
      if (openid) {
        await upsertUser(openid)
        console.log('✅ 用户初始化成功:', openid)
        loadFavoriteStatus()
      }
    } catch (error) {
      console.error('❌ 用户初始化失败:', error)
    }
  }

  const loadEvents = async () => {
    try {
      if (isFirstLoad) {
        setLoading(true)
      }

      console.log('📡 开始加载 Supabase 数据...')
      const { data, error } = await getEvents()

      if (error) {
        console.error('❌ 加载失败：', error)
        return
      }

      if (data && data.length > 0) {
        console.log(`✅ 成功加载 ${data.length} 条数据`)
        const feedItems = data.map((event: Event) => eventToFeedItem(event))
        setFeed(feedItems)
        setIsFirstLoad(false)
      }
    } catch (error) {
      console.error('❌ 加载数据异常：', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFavoriteStatus = useCallback(async () => {
    if (feed.length === 0) return

    try {
      const eventIds = feed.map(item => item.id)
      const favoritedIds = await favoritesService.getFavoriteStatus(eventIds)

      setFeed(prev => prev.map(item => ({
        ...item,
        isSaved: favoritedIds.has(item.id)
      })))
    } catch (error) {
      console.error('加载收藏状态失败:', error)
    }
  }, [feed.length])

  // feed 加载完成后加载收藏状态
  useEffect(() => {
    if (feed.length > 0 && !isFirstLoad) {
      loadFavoriteStatus()
    }
  }, [feed.length, isFirstLoad])

  const handleItemClick = async (item: FeedItem) => {
    setSelectedItem(item)

    try {
      const openid = await authService.getOpenID()
      if (openid) {
        await recordViewHistory(openid, item.id)
      }
    } catch (error) {
      console.error('记录浏览历史失败:', error)
    }
  }

  const handleFavoriteToggle = (itemId: number, isFavorited: boolean) => {
    setFeed(prev => prev.map(item =>
      item.id === itemId ? { ...item, isSaved: isFavorited } : item
    ))
  }

  const getFilteredFeed = useCallback(() => {
    let filteredItems = feed.filter(item => {
      // 分类过滤
      if (activeFilter === 'activity') {
        if (!['activity', 'lecture'].includes(item.type)) return false
      } else if (activeFilter === 'recruit') {
        if (item.type !== 'recruit') return false
      }

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

    // 排序：置顶的在前
    filteredItems.sort((a, b) => {
      if (a.isTop && !b.isTop) return -1
      if (!a.isTop && b.isTop) return 1
      return 0
    })

    return filteredItems
  }, [feed, activeFilter, searchKeyword, hideExpired])

  const filteredFeed = getFilteredFeed()
  const safeAreaBottom = getSafeAreaBottom()

  return (
    <View className="index-page">
      {/* 搜索栏和筛选栏 */}
      <View className="header-section">
        <View className="search-section">
          <View className="search-input-wrapper">
            <Text className="search-icon">🔍</Text>
            <Input
              className="search-input"
              type="text"
              placeholder="搜索职位、公司或活动..."
              value={searchKeyword}
              onInput={(e) => setSearchKeyword(e.detail.value || '')}
            />
            {searchKeyword && (
              <View className="search-clear" onClick={() => setSearchKeyword('')}>
                <Text>✕</Text>
              </View>
            )}
          </View>
        </View>

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
                onClick={() => setActiveFilter(tab.id as FilterType)}
              >
                <Text>{tab.label}</Text>
                {activeFilter === tab.id && <View className="filter-tab-indicator" />}
              </View>
            ))}
          </View>

          <ExpiredFilter
            value={hideExpired}
            onChange={setHideExpired}
            className="filter-expired-toggle"
          />
        </View>
      </View>

      {/* 主内容区 */}
      <ScrollView
        scrollY
        className="page-scroll"
        enhanced
        showScrollbar={false}
      >
        <View className="page-content" style={{ paddingBottom: `${safeAreaBottom + 200}rpx` }}>
          {loading && isFirstLoad ? (
            <SkeletonList count={5} />
          ) : (
            <View className="feed-container">
              {filteredFeed.length === 0 ? (
                <View className="empty-state">
                  <Text className="empty-icon">📭</Text>
                  <Text className="empty-title">暂无数据</Text>
                  <Text className="empty-desc">试试其他筛选条件</Text>
                </View>
              ) : (
                filteredFeed.map((item, index) => (
                  <EventCard
                    key={item.id}
                    data={feedItemToCardData(item)}
                    isFirst={index === 0}
                    onClick={() => handleItemClick(item)}
                    onFavoriteToggle={(isFavorited) => handleFavoriteToggle(item.id, isFavorited)}
                  />
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 详情弹窗 */}
      {selectedItem && (
        <DetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          initialFavorited={selectedItem.isSaved}
          onFavoriteToggle={(isFavorited: boolean) => {
            setSelectedItem(prev => prev ? { ...prev, isSaved: isFavorited } : null)
            handleFavoriteToggle(selectedItem.id, isFavorited)
          }}
        />
      )}
    </View>
  )
}
