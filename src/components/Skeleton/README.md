# Skeleton 组件库

Skeleton 组件库提供了一套完整的加载占位符组件，用于优化数据加载时的用户体验。

## 组件列表

- **SkeletonBox**: 基础占位符组件，可自定义尺寸和形状
- **SkeletonCard**: 卡片占位符组件，模拟 Event 卡片布局
- **SkeletonList**: 列表占位符组件，渲染多个 SkeletonCard

## 快速开始

### 基础用法

```tsx
import { SkeletonList } from '@/components/Skeleton'

function MyPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])

  useEffect(() => {
    fetchData().then(result => {
      setData(result)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <SkeletonList count={5} />
  }

  return (
    <View>
      {data.map(item => <EventCard key={item.id} data={item} />)}
    </View>
  )
}
```

## API 文档

### SkeletonBox

基础占位符组件，可用于任意形状的占位。

**Props:**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| width | string \| number | '100%' | 宽度（支持 rpx 或百分比） |
| height | string \| number | '40rpx' | 高度（支持 rpx） |
| borderRadius | string \| number | 8 | 圆角大小（rpx） |
| delay | number | 0 | 动画延迟时间（毫秒） |
| className | string | '' | 自定义样式类名 |

**示例:**

```tsx
import { SkeletonBox } from '@/components/Skeleton'

// 矩形占位符
<SkeletonBox width="100%" height="40rpx" />

// 圆形占位符
<SkeletonBox width="100rpx" height="100rpx" borderRadius="50%" />

// 带延迟动画
<SkeletonBox width="200rpx" height="40rpx" delay={100} />
```

### SkeletonCard

卡片占位符组件，模拟 Event 卡片的布局结构。

**Props:**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| delay | number | 0 | 动画延迟时间（毫秒） |
| className | string | '' | 自定义样式类名 |

**示例:**

```tsx
import { SkeletonCard } from '@/components/Skeleton'

// 单个卡片
<SkeletonCard />

// 带延迟动画（用于列表中）
<SkeletonCard delay={100} />
```

### SkeletonList

列表占位符组件，渲染多个 SkeletonCard 并管理动画错开效果。

**Props:**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| count | number | 5 | 显示的卡片数量 |
| staggerDelay | number | 100 | 每个卡片之间的动画延迟（毫秒） |
| className | string | '' | 自定义样式类名 |

**示例:**

```tsx
import { SkeletonList } from '@/components/Skeleton'

// 基础用法（显示 5 个卡片）
<SkeletonList />

// 自定义数量
<SkeletonList count={3} />

// 自定义动画延迟
<SkeletonList count={5} staggerDelay={150} />
```

## 使用场景

### 1. 首页加载

```tsx
import { SkeletonList } from '@/components/Skeleton'

function HomePage() {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])

  useEffect(() => {
    loadEvents().then(data => {
      setEvents(data)
      setLoading(false)
    })
  }, [])

  return (
    <View>
      {loading ? (
        <SkeletonList count={5} />
      ) : (
        events.map(event => <EventCard key={event.id} data={event} />)
      )}
    </View>
  )
}
```

### 2. 下拉刷新

```tsx
import { SkeletonList } from '@/components/Skeleton'

function HomePage() {
  const [refreshing, setRefreshing] = useState(false)
  const [events, setEvents] = useState([])

  const onRefresh = async () => {
    setRefreshing(true)
    const data = await loadEvents()
    setEvents(data)
    setRefreshing(false)
  }

  return (
    <ScrollView onRefresh={onRefresh}>
      {refreshing ? (
        <SkeletonList count={3} />
      ) : (
        events.map(event => <EventCard key={event.id} data={event} />)
      )}
    </ScrollView>
  )
}
```

### 3. 收藏列表

```tsx
import { SkeletonList } from '@/components/Skeleton'

function FavoritesPage() {
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState([])

  useEffect(() => {
    loadFavorites().then(data => {
      setFavorites(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return <SkeletonList count={5} />
  }

  if (favorites.length === 0) {
    return <EmptyState message="还没有收藏" />
  }

  return (
    <View>
      {favorites.map(item => <EventCard key={item.id} data={item} />)}
    </View>
  )
}
```

## 性能优化

### 1. GPU 加速

Skeleton 组件使用 CSS 动画和 GPU 加速属性，确保流畅的动画效果：

```scss
.skeleton-box {
  // 使用 transform 而不是 left/right
  animation: shimmer 1.5s ease-in-out infinite;
  
  // 启用硬件加速
  will-change: transform;
  transform: translateZ(0);
}
```

### 2. 动画复用

所有 Skeleton 元素共享同一个动画定义，减少内存占用：

```scss
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 3. 限制数量

SkeletonList 组件限制最大显示数量为 10 个，避免过多 DOM 节点：

```tsx
const visibleCount = Math.min(count, 10)
```

## 无障碍支持

Skeleton 组件支持屏幕阅读器：

```tsx
<View 
  className="skeleton-box"
  aria-label="正在加载"
  aria-busy="true"
/>
```

## 减少动画偏好

支持用户的"减少动画"偏好设置：

```scss
@media (prefers-reduced-motion: reduce) {
  .skeleton-box {
    animation: none;
    background: #f5f5f5;
  }
}
```

## 最佳实践

### 1. 使用合适的数量

根据页面内容显示合适数量的 Skeleton 卡片：

```tsx
// ✅ 好的做法：显示 3-5 个卡片
<SkeletonList count={5} />

// ❌ 不好的做法：显示过多卡片
<SkeletonList count={20} />
```

### 2. 添加过渡动画

在 Skeleton 和真实内容之间添加淡入淡出动画：

```tsx
<View className={loading ? 'fade-out' : 'fade-in'}>
  {loading ? <SkeletonList /> : <EventList data={events} />}
</View>
```

### 3. 处理空状态

加载完成后，如果数据为空，显示空状态而不是 Skeleton：

```tsx
if (loading) {
  return <SkeletonList />
}

if (data.length === 0) {
  return <EmptyState />
}

return <EventList data={data} />
```

### 4. 避免闪烁

如果数据加载很快（< 300ms），可以延迟显示 Skeleton：

```tsx
const [showSkeleton, setShowSkeleton] = useState(false)

useEffect(() => {
  const timer = setTimeout(() => setShowSkeleton(true), 300)
  return () => clearTimeout(timer)
}, [])

if (loading && showSkeleton) {
  return <SkeletonList />
}
```

## 故障排查

### 动画不流畅

1. 检查是否使用了 CSS 动画（而不是 JavaScript）
2. 确保启用了硬件加速（`will-change: transform`）
3. 检查是否有过多的 DOM 节点

### 样式不正确

1. 确保导入了 SCSS 文件
2. 检查 Tailwind CSS 配置
3. 检查是否有样式冲突

### 内存泄漏

1. 确保组件卸载时清理了定时器
2. 检查是否有未清理的事件监听器

## 更新日志

### v1.0.0 (2025-12-12)

- ✨ 初始版本
- ✨ 添加 SkeletonBox 组件
- ✨ 添加 SkeletonCard 组件
- ✨ 添加 SkeletonList 组件
- ✨ 支持 shimmer 动画效果
- ✨ 支持动画延迟和错开
- ✨ 支持无障碍访问
- ✨ 支持减少动画偏好

---

**文档版本**：v1.0.0  
**最后更新**：2025年12月12日
