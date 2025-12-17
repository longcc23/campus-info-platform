# Skeleton 组件集成指南

本文档说明如何在现有页面中集成 Skeleton 加载状态。

## 快速开始

### 1. 导入组件

```tsx
import { SkeletonList } from '../../components/Skeleton'
```

### 2. 添加 loading 状态

在组件的 state 中添加 `loading` 状态：

```tsx
interface IndexState {
  // ... 其他状态
  loading: boolean  // 新增
  isFirstLoad: boolean  // 新增（可选，用于区分首次加载和刷新）
}

constructor(props: {}) {
  super(props)
  this.state = {
    // ... 其他状态
    loading: true,  // 初始为 true
    isFirstLoad: true
  }
}
```

### 3. 在数据加载时更新状态

```tsx
loadEvents = async () => {
  try {
    // 设置 loading 状态
    this.setState({ loading: true })
    
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
        isFirstLoad: false  // 标记首次加载完成
      })
    }
  } catch (error: any) {
    console.error('❌ 加载数据异常：', error)
  } finally {
    // 无论成功失败，都要关闭 loading
    this.setState({ loading: false })
  }
}
```

### 4. 在渲染中使用 Skeleton

```tsx
render() {
  const { loading, feed, searchKeyword } = this.state
  const filteredFeed = this.getFilteredFeed()

  return (
    <View className="index-page">
      {/* 搜索栏和筛选栏 */}
      <View className="header-section">
        {/* ... */}
      </View>

      {/* Main Content */}
      <ScrollView scrollY className="page-scroll">
        <View className="page-content">
          {/* 显示 Skeleton 或真实内容 */}
          {loading ? (
            <SkeletonList count={5} />
          ) : (
            <View className="feed-container">
              {filteredFeed.length === 0 ? (
                <View className="empty-state">
                  <Text className="empty-icon">📭</Text>
                  <Text className="empty-title">暂无数据</Text>
                </View>
              ) : (
                filteredFeed.map((item) => (
                  <View key={item.id} className="feed-card">
                    {/* 卡片内容 */}
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
```

## 完整示例：首页集成

以下是首页完整的集成示例：

```tsx
import React, { Component } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { SkeletonList } from '../../components/Skeleton'
import { getEvents } from '../../utils/supabase-rest'

interface IndexState {
  loading: boolean
  isFirstLoad: boolean
  feed: FeedItem[]
  // ... 其他状态
}

export default class Index extends Component<{}, IndexState> {
  constructor(props: {}) {
    super(props)
    this.state = {
      loading: true,
      isFirstLoad: true,
      feed: [],
      // ... 其他状态
    }
  }

  componentDidMount() {
    this.loadEvents()
  }

  loadEvents = async () => {
    try {
      this.setState({ loading: true })
      
      const { data, error } = await getEvents()
      
      if (error) {
        console.error('加载失败：', error)
        return
      }
      
      if (data && data.length > 0) {
        const feedItems = data.map(this.convertEventToFeedItem)
        this.setState({ 
          feed: feedItems,
          isFirstLoad: false
        })
      }
    } catch (error) {
      console.error('加载数据异常：', error)
    } finally {
      this.setState({ loading: false })
    }
  }

  // 下拉刷新
  onPullDownRefresh = async () => {
    try {
      await this.loadEvents()
      Taro.showToast({ title: '刷新成功', icon: 'success' })
    } catch (error) {
      console.error('刷新失败:', error)
      Taro.showToast({ title: '刷新失败', icon: 'error' })
    } finally {
      Taro.stopPullDownRefresh()
    }
  }

  render() {
    const { loading, feed } = this.state

    return (
      <View className="index-page">
        <ScrollView scrollY className="page-scroll">
          <View className="page-content">
            {loading ? (
              <SkeletonList count={5} />
            ) : (
              <View className="feed-container">
                {feed.length === 0 ? (
                  <View className="empty-state">
                    <Text>暂无数据</Text>
                  </View>
                ) : (
                  feed.map((item) => (
                    <View key={item.id} className="feed-card">
                      {/* 卡片内容 */}
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    )
  }
}
```

## 高级用法

### 1. 避免闪烁（快速加载时）

如果数据加载很快（< 300ms），可以延迟显示 Skeleton：

```tsx
interface IndexState {
  loading: boolean
  showSkeleton: boolean  // 新增
}

componentDidMount() {
  // 延迟 300ms 显示 Skeleton
  this.skeletonTimer = setTimeout(() => {
    if (this.state.loading) {
      this.setState({ showSkeleton: true })
    }
  }, 300)
  
  this.loadEvents()
}

componentWillUnmount() {
  // 清理定时器
  if (this.skeletonTimer) {
    clearTimeout(this.skeletonTimer)
  }
}

loadEvents = async () => {
  try {
    this.setState({ loading: true, showSkeleton: false })
    
    // 加载数据...
    
  } finally {
    this.setState({ loading: false, showSkeleton: false })
  }
}

render() {
  const { loading, showSkeleton, feed } = this.state

  return (
    <View>
      {loading && showSkeleton ? (
        <SkeletonList count={5} />
      ) : loading ? (
        // 显示简单的 loading 或什么都不显示
        null
      ) : (
        // 真实内容
        <View className="feed-container">
          {/* ... */}
        </View>
      )}
    </View>
  )
}
```

### 2. 添加淡入淡出动画

在 SCSS 中添加过渡动画：

```scss
.feed-container {
  animation: fadeIn 300ms ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 3. 下拉刷新时的处理

下拉刷新时，可以选择不显示 Skeleton（因为已经有内容了）：

```tsx
interface IndexState {
  loading: boolean
  isRefreshing: boolean  // 新增
  isFirstLoad: boolean
}

onPullDownRefresh = async () => {
  try {
    this.setState({ isRefreshing: true })
    await this.loadEvents()
  } finally {
    this.setState({ isRefreshing: false })
    Taro.stopPullDownRefresh()
  }
}

loadEvents = async () => {
  try {
    // 只有首次加载时才显示 Skeleton
    if (this.state.isFirstLoad) {
      this.setState({ loading: true })
    }
    
    // 加载数据...
    
  } finally {
    this.setState({ loading: false, isFirstLoad: false })
  }
}

render() {
  const { loading, isFirstLoad, feed } = this.state

  return (
    <View>
      {loading && isFirstLoad ? (
        <SkeletonList count={5} />
      ) : (
        <View className="feed-container">
          {/* 真实内容 */}
        </View>
      )}
    </View>
  )
}
```

## 其他页面集成

### 收藏页

```tsx
// src/pages/favorites/index.tsx
import { SkeletonList } from '../../components/Skeleton'

export default class Favorites extends Component {
  state = {
    loading: true,
    favorites: []
  }

  componentDidMount() {
    this.loadFavorites()
  }

  loadFavorites = async () => {
    try {
      this.setState({ loading: true })
      const data = await favoritesService.getFavorites()
      this.setState({ favorites: data })
    } finally {
      this.setState({ loading: false })
    }
  }

  render() {
    const { loading, favorites } = this.state

    if (loading) {
      return <SkeletonList count={5} />
    }

    if (favorites.length === 0) {
      return (
        <View className="empty-state">
          <Text>还没有收藏</Text>
        </View>
      )
    }

    return (
      <View>
        {favorites.map(item => (
          <View key={item.id} className="favorite-card">
            {/* 卡片内容 */}
          </View>
        ))}
      </View>
    )
  }
}
```

### 浏览历史页

```tsx
// src/pages/history/index.tsx
import { SkeletonList } from '../../components/Skeleton'

export default class History extends Component {
  state = {
    loading: true,
    history: []
  }

  componentDidMount() {
    this.loadHistory()
  }

  loadHistory = async () => {
    try {
      this.setState({ loading: true })
      const data = await getViewHistory(userId)
      this.setState({ history: data })
    } finally {
      this.setState({ loading: false })
    }
  }

  render() {
    const { loading, history } = this.state

    if (loading) {
      return <SkeletonList count={5} />
    }

    if (history.length === 0) {
      return (
        <View className="empty-state">
          <Text>还没有浏览记录</Text>
        </View>
      )
    }

    return (
      <View>
        {history.map(item => (
          <View key={item.id} className="history-card">
            {/* 卡片内容 */}
          </View>
        ))}
      </View>
    )
  }
}
```

## 故障排查

### 问题 1：Skeleton 不显示

**原因**：可能是 loading 状态没有正确设置。

**解决**：
1. 检查 `loading` 初始值是否为 `true`
2. 检查 `loadEvents()` 中是否正确设置了 `loading: true`
3. 检查 `finally` 块中是否正确设置了 `loading: false`

### 问题 2：动画不流畅

**原因**：可能是 CSS 动画没有正确加载。

**解决**：
1. 确保导入了 `SkeletonBox.scss`
2. 检查 Tailwind CSS 配置
3. 检查是否有样式冲突

### 问题 3：Skeleton 和真实内容之间有跳跃

**原因**：Skeleton 布局与真实内容布局不一致。

**解决**：
1. 调整 SkeletonCard 的布局，使其与真实卡片一致
2. 添加淡入淡出过渡动画
3. 确保 padding 和 margin 一致

## 最佳实践

1. **首次加载显示 Skeleton**：用户首次进入页面时显示 Skeleton
2. **下拉刷新不显示 Skeleton**：已有内容时，下拉刷新不需要显示 Skeleton
3. **快速加载避免闪烁**：数据加载很快时，延迟显示 Skeleton
4. **空状态优先**：加载完成后，如果数据为空，显示空状态而不是 Skeleton
5. **添加过渡动画**：在 Skeleton 和真实内容之间添加淡入淡出动画

---

**文档版本**：v1.0.0  
**最后更新**：2025年12月18日
