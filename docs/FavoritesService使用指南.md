# FavoritesService 使用指南

## 📋 概述

FavoritesService 是 CDC 智汇中心的收藏服务，负责处理用户收藏功能的所有操作。

## 🎯 核心功能

- ✅ 添加/取消收藏（自动处理认证）
- ✅ 获取用户收藏列表
- ✅ 批量查询收藏状态
- ✅ 检查单个事件收藏状态
- ✅ 自动重试（网络超时）
- ✅ 幂等性保证（重复操作不报错）
- ✅ 自动过滤已删除的事件

## 📦 导入

```typescript
import favoritesService from '@/services/favorites'
// 或
import { favoritesService, NotFoundError } from '@/services/favorites'
```

## 🚀 基础使用

### 1. 切换收藏状态

```typescript
// 收藏
const success = await favoritesService.toggleFavorite(eventId, true)

// 取消收藏
const success = await favoritesService.toggleFavorite(eventId, false)
```

### 2. 获取收藏列表

```typescript
try {
  const favorites = await favoritesService.getFavorites()
  console.log('收藏列表:', favorites)
} catch (error) {
  console.error('获取收藏失败:', error)
}
```

### 3. 批量查询收藏状态

```typescript
const eventIds = [1, 2, 3, 4, 5]
const favoritedIds = await favoritesService.getFavoriteStatus(eventIds)

// 检查某个事件是否已收藏
if (favoritedIds.has(1)) {
  console.log('事件 1 已收藏')
}
```

### 4. 检查单个事件收藏状态

```typescript
const isFavorited = await favoritesService.isFavorited(eventId)
if (isFavorited) {
  console.log('已收藏')
}
```

## 💡 实际应用场景

### 场景 1: 收藏按钮组件

```typescript
// src/components/FavoriteButton/index.tsx
import { useState, useEffect } from 'react'
import { View } from '@tarojs/components'
import favoritesService from '@/services/favorites'

interface FavoriteButtonProps {
  eventId: number
  initialFavorited?: boolean
  onToggle?: (isFavorited: boolean) => void
}

export default function FavoriteButton({ 
  eventId, 
  initialFavorited = false,
  onToggle 
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)

  // 加载收藏状态
  useEffect(() => {
    async function loadStatus() {
      const favorited = await favoritesService.isFavorited(eventId)
      setIsFavorited(favorited)
    }
    loadStatus()
  }, [eventId])

  const handleToggle = async () => {
    if (loading) return

    setLoading(true)
    
    // 乐观更新 UI
    const newState = !isFavorited
    setIsFavorited(newState)

    // 执行操作
    const success = await favoritesService.toggleFavorite(eventId, newState)

    if (!success) {
      // 操作失败，回滚 UI
      setIsFavorited(!newState)
    } else {
      // 通知父组件
      onToggle?.(newState)
    }

    setLoading(false)
  }

  return (
    <View 
      className={`heart-icon ${isFavorited ? 'filled' : 'outline'} ${loading ? 'disabled' : ''}`}
      onClick={handleToggle}
    >
      {isFavorited ? '❤️' : '🤍'}
    </View>
  )
}
```

### 场景 2: 首页加载收藏状态

```typescript
// src/pages/index/index.tsx
import { useState, useEffect } from 'react'
import { View } from '@tarojs/components'
import { getEvents } from '@/utils/supabase-rest'
import favoritesService from '@/services/favorites'

export default function Index() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // 1. 获取事件列表
        const { data } = await getEvents()
        if (!data) return

        // 2. 批量查询收藏状态
        const eventIds = data.map(e => e.id)
        const favoritedIds = await favoritesService.getFavoriteStatus(eventIds)

        // 3. 合并收藏状态
        const eventsWithFavorite = data.map(event => ({
          ...event,
          isFavorited: favoritedIds.has(event.id)
        }))

        setEvents(eventsWithFavorite)
      } catch (error) {
        console.error('加载数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <View>
      {events.map(event => (
        <EventCard 
          key={event.id} 
          event={event}
          isFavorited={event.isFavorited}
        />
      ))}
    </View>
  )
}
```

### 场景 3: 收藏列表页面

```typescript
// src/pages/favorites/index.tsx
import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import favoritesService from '@/services/favorites'

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    setLoading(true)
    try {
      const data = await favoritesService.getFavorites()
      setFavorites(data)
    } catch (error) {
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEventClick = (eventId: number) => {
    Taro.navigateTo({
      url: `/pages/detail/index?id=${eventId}`
    })
  }

  const handleUnfavorite = async (eventId: number) => {
    const success = await favoritesService.toggleFavorite(eventId, false)
    if (success) {
      // 从列表中移除
      setFavorites(prev => prev.filter(e => e.id !== eventId))
    }
  }

  if (loading) {
    return <View>加载中...</View>
  }

  if (favorites.length === 0) {
    return (
      <View className="empty-state">
        <Text>还没有收藏，去首页看看感兴趣的机会吧</Text>
        <Button onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>
          去首页
        </Button>
      </View>
    )
  }

  return (
    <View>
      {favorites.map(event => (
        <View key={event.id} onClick={() => handleEventClick(event.id)}>
          <Text>{event.title}</Text>
          <Button onClick={(e) => {
            e.stopPropagation()
            handleUnfavorite(event.id)
          }}>
            取消收藏
          </Button>
        </View>
      ))}
    </View>
  )
}
```

### 场景 4: 带错误处理的收藏操作

```typescript
import favoritesService from '@/services/favorites'
import { AuthError, NetworkError, NotFoundError } from '@/services/favorites'

async function handleFavoriteWithErrorHandling(eventId: number, isFavorite: boolean) {
  try {
    const success = await favoritesService.toggleFavorite(eventId, isFavorite)
    return success
  } catch (error) {
    // toggleFavorite 内部已经处理了错误并显示 Toast
    // 这里可以做额外的错误处理，比如上报日志
    console.error('收藏操作异常:', error)
    
    if (error instanceof AuthError) {
      // 跳转到登录页
      Taro.navigateTo({ url: '/pages/login/index' })
    } else if (error instanceof NotFoundError) {
      // 刷新页面数据
      refreshPageData()
    }
    
    return false
  }
}
```

## 🔧 API 参考

### favoritesService.toggleFavorite(eventId, isFavorite)

切换事件的收藏状态。

**参数**:
- `eventId: number` - 事件 ID
- `isFavorite: boolean` - true 表示收藏，false 表示取消收藏

**返回**: `Promise<boolean>` - 操作是否成功

**特性**:
- ✅ 自动处理认证
- ✅ 自动显示 Toast 反馈
- ✅ 网络超时自动重试一次
- ✅ 幂等性保证（重复收藏不报错）

**示例**:
```typescript
const success = await favoritesService.toggleFavorite(123, true)
if (success) {
  console.log('收藏成功')
}
```

### favoritesService.getFavorites()

获取当前用户的所有收藏。

**返回**: `Promise<Event[]>` - 收藏的事件列表，按收藏时间倒序

**抛出**:
- `AuthError` - 未登录
- `NetworkError` - 网络请求失败

**特性**:
- ✅ 自动过滤已删除的事件
- ✅ 按收藏时间倒序排列

**示例**:
```typescript
const favorites = await favoritesService.getFavorites()
console.log(`共有 ${favorites.length} 个收藏`)
```

### favoritesService.getFavoriteStatus(eventIds)

批量查询事件的收藏状态。

**参数**:
- `eventIds: number[]` - 事件 ID 数组

**返回**: `Promise<Set<number>>` - 已收藏的事件 ID 集合

**特性**:
- ✅ 批量查询，性能优化
- ✅ 未登录返回空集合（不报错）
- ✅ 查询失败返回空集合（不影响页面）

**示例**:
```typescript
const eventIds = [1, 2, 3, 4, 5]
const favoritedIds = await favoritesService.getFavoriteStatus(eventIds)

eventIds.forEach(id => {
  console.log(`事件 ${id}: ${favoritedIds.has(id) ? '已收藏' : '未收藏'}`)
})
```

### favoritesService.isFavorited(eventId)

检查单个事件是否已收藏。

**参数**:
- `eventId: number` - 事件 ID

**返回**: `Promise<boolean>` - 是否已收藏

**特性**:
- ✅ 未登录返回 false（不报错）
- ✅ 查询失败返回 false（不影响页面）

**示例**:
```typescript
const isFavorited = await favoritesService.isFavorited(123)
if (isFavorited) {
  console.log('已收藏')
}
```

## ⚠️ 注意事项

### 1. 自动错误处理

`toggleFavorite()` 方法会自动显示 Toast 提示，无需手动处理：

```typescript
// ✅ 推荐：直接调用，错误会自动显示 Toast
const success = await favoritesService.toggleFavorite(eventId, true)

// ❌ 不推荐：重复显示 Toast
const success = await favoritesService.toggleFavorite(eventId, true)
if (!success) {
  Taro.showToast({ title: '收藏失败' }) // 重复了
}
```

### 2. 幂等性保证

重复收藏或取消收藏不会报错：

```typescript
// 重复收藏同一个事件
await favoritesService.toggleFavorite(123, true)
await favoritesService.toggleFavorite(123, true) // ✅ 不会报错

// 取消未收藏的事件
await favoritesService.toggleFavorite(456, false) // ✅ 不会报错
```

### 3. 乐观更新

建议使用乐观更新提升用户体验：

```typescript
// 1. 立即更新 UI
setIsFavorited(true)

// 2. 后台执行操作
const success = await favoritesService.toggleFavorite(eventId, true)

// 3. 失败时回滚
if (!success) {
  setIsFavorited(false)
}
```

### 4. 批量查询优化

首页加载时使用批量查询，避免多次请求：

```typescript
// ✅ 推荐：批量查询
const eventIds = events.map(e => e.id)
const favoritedIds = await favoritesService.getFavoriteStatus(eventIds)

// ❌ 不推荐：逐个查询
for (const event of events) {
  event.isFavorited = await favoritesService.isFavorited(event.id)
}
```

### 5. 错误处理策略

查询类方法（`getFavoriteStatus`, `isFavorited`）失败时返回默认值，不抛出错误：

```typescript
// 查询失败不影响页面显示
const favoritedIds = await favoritesService.getFavoriteStatus([1, 2, 3])
// 失败时返回空 Set，页面正常显示（所有事件显示为未收藏）
```

操作类方法（`toggleFavorite`）失败时显示 Toast 并返回 false：

```typescript
const success = await favoritesService.toggleFavorite(123, true)
if (!success) {
  // 操作失败，已显示 Toast，可以做额外处理
  console.log('收藏失败')
}
```

## 🐛 故障排查

### 问题 1: 收藏后刷新页面状态丢失

**原因**: 未重新查询收藏状态

**解决**:
```typescript
// 收藏成功后，更新本地状态
const success = await favoritesService.toggleFavorite(eventId, true)
if (success) {
  setIsFavorited(true) // 更新本地状态
}
```

### 问题 2: 批量查询返回空集合

**原因**: 用户未登录或网络错误

**解决**:
```typescript
// 检查用户是否登录
import authService from '@/services/auth'

if (!authService.isAuthenticated()) {
  console.log('用户未登录，无法查询收藏状态')
}
```

### 问题 3: 收藏列表显示已删除的事件

**原因**: 不应该出现，`getFavorites()` 会自动过滤

**解决**: 如果出现，检查数据库外键约束是否正确配置

### 问题 4: 重复收藏报错

**原因**: 数据库唯一约束冲突

**解决**: 已在代码中处理，409 状态码会被忽略（幂等性）

## 📚 相关文档

- [AuthService 使用指南](./AuthService使用指南.md)
- [收藏功能设计文档](../.kiro/specs/favorites-feature/design.md)
- [Supabase REST API 文档](https://supabase.com/docs/guides/api)
