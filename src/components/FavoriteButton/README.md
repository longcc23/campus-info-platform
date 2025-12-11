# FavoriteButton 组件

## 📋 概述

FavoriteButton 是一个收藏按钮组件，显示心形图标，点击可切换收藏状态。

## 🎯 特性

- ✅ 两种状态：已收藏（❤️）和未收藏（🤍）
- ✅ 乐观更新：点击立即更新 UI，操作失败自动回滚
- ✅ 加载状态：操作进行中禁用按钮，防止重复点击
- ✅ 心跳动画：收藏时播放心跳动画
- ✅ 事件冒泡控制：不影响父元素的点击事件
- ✅ 自动错误处理：操作失败自动显示 Toast

## 📦 导入

```typescript
import FavoriteButton from '@/components/FavoriteButton'
```

## 🚀 基础使用

### 1. 最简单的用法

```tsx
<FavoriteButton eventId={123} />
```

### 2. 带初始状态

```tsx
<FavoriteButton 
  eventId={123} 
  initialFavorited={true} 
/>
```

### 3. 监听状态变化

```tsx
<FavoriteButton 
  eventId={123}
  onToggle={(isFavorited) => {
    console.log('收藏状态:', isFavorited)
  }}
/>
```

### 4. 大尺寸按钮

```tsx
<FavoriteButton 
  eventId={123}
  large={true}
/>
```

### 5. 自定义样式

```tsx
<FavoriteButton 
  eventId={123}
  className="my-custom-style"
/>
```

## 💡 实际应用场景

### 场景 1: 事件卡片中使用

```tsx
// EventCard.tsx
import { View, Text } from '@tarojs/components'
import FavoriteButton from '@/components/FavoriteButton'

interface EventCardProps {
  event: {
    id: number
    title: string
    isFavorited?: boolean
  }
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <View className="event-card">
      <View className="card-header">
        <Text className="title">{event.title}</Text>
        <FavoriteButton 
          eventId={event.id}
          initialFavorited={event.isFavorited}
        />
      </View>
      {/* 其他内容 */}
    </View>
  )
}
```

### 场景 2: 详情页中使用

```tsx
// DetailPage.tsx
import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import FavoriteButton from '@/components/FavoriteButton'
import favoritesService from '@/services/favorites'

export default function DetailPage({ eventId }) {
  const [isFavorited, setIsFavorited] = useState(false)

  useEffect(() => {
    async function loadFavoriteStatus() {
      const favorited = await favoritesService.isFavorited(eventId)
      setIsFavorited(favorited)
    }
    loadFavoriteStatus()
  }, [eventId])

  return (
    <View className="detail-page">
      <View className="header">
        <Text className="title">活动详情</Text>
        <FavoriteButton 
          eventId={eventId}
          initialFavorited={isFavorited}
          large={true}
          onToggle={(favorited) => {
            setIsFavorited(favorited)
          }}
        />
      </View>
      {/* 其他内容 */}
    </View>
  )
}
```

### 场景 3: 列表中批量使用

```tsx
// EventList.tsx
import { View } from '@tarojs/components'
import { useState, useEffect } from 'react'
import FavoriteButton from '@/components/FavoriteButton'
import { getEvents } from '@/utils/supabase-rest'
import favoritesService from '@/services/favorites'

export default function EventList() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    async function loadData() {
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
    }

    loadData()
  }, [])

  const handleFavoriteToggle = (eventId: number, isFavorited: boolean) => {
    // 更新本地状态
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, isFavorited } 
        : event
    ))
  }

  return (
    <View className="event-list">
      {events.map(event => (
        <View key={event.id} className="event-item">
          <Text>{event.title}</Text>
          <FavoriteButton 
            eventId={event.id}
            initialFavorited={event.isFavorited}
            onToggle={(favorited) => handleFavoriteToggle(event.id, favorited)}
          />
        </View>
      ))}
    </View>
  )
}
```

## 🔧 Props API

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| eventId | number | - | ✅ | 事件 ID |
| initialFavorited | boolean | false | ❌ | 初始收藏状态 |
| onToggle | (isFavorited: boolean) => void | - | ❌ | 收藏状态变化回调 |
| className | string | '' | ❌ | 自定义样式类名 |
| large | boolean | false | ❌ | 是否显示为大尺寸 |

## 🎨 样式定制

### 1. 修改图标大小

```scss
.my-custom-button {
  .heart-icon {
    font-size: 28px; // 默认 24px
  }
}
```

### 2. 修改动画效果

```scss
.my-custom-button {
  .heart-icon.filled {
    animation: myCustomAnimation 0.5s ease;
  }
}

@keyframes myCustomAnimation {
  0% { transform: scale(1); }
  50% { transform: scale(1.5) rotate(15deg); }
  100% { transform: scale(1); }
}
```

### 3. 修改颜色

```scss
.my-custom-button {
  .heart-icon.filled {
    filter: hue-rotate(30deg); // 改变颜色
  }
}
```

## ⚠️ 注意事项

### 1. 事件冒泡

组件内部已处理事件冒泡，点击按钮不会触发父元素的点击事件：

```tsx
<View onClick={() => console.log('卡片被点击')}>
  <FavoriteButton eventId={123} />
  {/* 点击按钮不会触发 View 的 onClick */}
</View>
```

### 2. 乐观更新

组件使用乐观更新策略，点击后立即更新 UI，操作失败会自动回滚：

```tsx
// 用户点击 → UI 立即更新 → 后台请求 → 失败则回滚
<FavoriteButton eventId={123} />
```

### 3. 加载状态

操作进行中按钮会自动禁用，防止重复点击：

```tsx
// 用户快速点击多次，只会执行一次操作
<FavoriteButton eventId={123} />
```

### 4. 初始状态同步

当 `initialFavorited` prop 变化时，组件会自动更新状态：

```tsx
// 父组件更新 initialFavorited，子组件会同步
<FavoriteButton 
  eventId={123}
  initialFavorited={isFavorited} // 变化时自动同步
/>
```

### 5. 错误处理

组件内部已集成 FavoritesService 的错误处理，操作失败会自动显示 Toast，无需额外处理。

## 🐛 故障排查

### 问题 1: 点击没有反应

**原因**: 可能是事件 ID 无效或网络问题

**解决**:
1. 检查 eventId 是否正确
2. 打开控制台查看错误日志
3. 检查网络连接

### 问题 2: 状态不同步

**原因**: initialFavorited 没有正确传递

**解决**:
```tsx
// ✅ 正确：传递正确的初始状态
<FavoriteButton 
  eventId={event.id}
  initialFavorited={event.isFavorited}
/>

// ❌ 错误：没有传递初始状态
<FavoriteButton eventId={event.id} />
```

### 问题 3: 动画不流畅

**原因**: 可能是样式冲突或性能问题

**解决**:
1. 检查是否有其他样式覆盖了动画
2. 确保没有在动画期间进行大量计算
3. 使用 CSS transform 而不是 width/height 动画

## 📚 相关文档

- [FavoritesService 使用指南](../../../docs/FavoritesService使用指南.md)
- [收藏功能设计文档](../../../.kiro/specs/favorites-feature/design.md)
