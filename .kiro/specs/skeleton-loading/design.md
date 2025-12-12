# Design Document - Skeleton 加载状态 (Skeleton Loading)

## Overview

Skeleton 加载状态是一种现代化的加载体验优化方案，通过显示内容的"骨架"轮廓来替代传统的 Loading 转圈。本设计采用轻量级、可复用的组件架构，使用 CSS 动画实现流畅的 shimmer 效果，确保在各种网络条件下都能提供良好的用户体验。

### Key Design Goals

- **视觉连续性**: Skeleton 布局与真实内容布局一致，减少视觉跳跃
- **性能优化**: 使用 CSS 动画和 GPU 加速，避免 JavaScript 性能开销
- **可复用性**: 创建通用组件，可在多个页面中复用
- **响应式**: 支持不同屏幕尺寸和内容数量
- **优雅降级**: 在加载失败或超时时提供清晰的错误提示

## Architecture

### Component Structure

```
┌─────────────────────────────────────────────────────────┐
│                     Page Component                       │
│  (HomePage / FavoritesPage / HistoryPage)              │
│                                                         │
│  ┌───────────────────────────────────────────────┐    │
│  │  Loading State Check                          │    │
│  │  if (loading) {                               │    │
│  │    return <SkeletonList count={5} />          │    │
│  │  }                                            │    │
│  └───────────────────────────────────────────────┘    │
│                                                         │
│  ┌───────────────────────────────────────────────┐    │
│  │  SkeletonList Component                       │    │
│  │  ┌─────────────────────────────────────┐     │    │
│  │  │  SkeletonCard (card 1)              │     │    │
│  │  │  - shimmer animation                │     │    │
│  │  │  - delay: 0ms                       │     │    │
│  │  └─────────────────────────────────────┘     │    │
│  │  ┌─────────────────────────────────────┐     │    │
│  │  │  SkeletonCard (card 2)              │     │    │
│  │  │  - shimmer animation                │     │    │
│  │  │  - delay: 100ms                     │     │    │
│  │  └─────────────────────────────────────┘     │    │
│  │  ┌─────────────────────────────────────┐     │    │
│  │  │  SkeletonCard (card 3)              │     │    │
│  │  │  - shimmer animation                │     │    │
│  │  │  - delay: 200ms                     │     │    │
│  │  └─────────────────────────────────────┘     │    │
│  └───────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
Page Load
    ↓
Set loading = true
    ↓
Render SkeletonList
    ↓
Start shimmer animation
    ↓
Fetch data from API
    ↓
Data received
    ↓
Set loading = false
    ↓
Fade out Skeleton
    ↓
Fade in real content
```

## Components and Interfaces

### 1. SkeletonCard Component

单个 Skeleton 卡片组件，模拟真实的 Event 卡片布局。

```typescript
interface SkeletonCardProps {
  /**
   * 动画延迟时间（毫秒）
   * 用于错开多个卡片的动画开始时间
   */
  delay?: number;
  
  /**
   * 自定义样式类名
   */
  className?: string;
}

/**
 * Skeleton 卡片组件
 * 模拟 Event 卡片的布局结构
 */
const SkeletonCard: React.FC<SkeletonCardProps>;
```

**布局结构**：
```
┌─────────────────────────────────────────┐
│  ┌─────┐  ┌──────────────────────┐     │  <- 标题行
│  │ 图标 │  │ ████████████         │     │
│  └─────┘  └──────────────────────┘     │
│                                         │
│  ┌──────────────────────────────────┐  │  <- 标签行
│  │ ████  ████  ████                 │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │  <- 摘要行
│  │ ████████████████████████         │  │
│  │ ████████████████                 │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌────────┐  ┌────────┐  ┌────────┐   │  <- 底部信息
│  │ ██████ │  │ ██████ │  │ ██████ │   │
│  └────────┘  └────────┘  └────────┘   │
└─────────────────────────────────────────┘
```

### 2. SkeletonList Component

Skeleton 卡片列表组件，管理多个 SkeletonCard。

```typescript
interface SkeletonListProps {
  /**
   * 显示的 Skeleton 卡片数量
   * @default 5
   */
  count?: number;
  
  /**
   * 每个卡片之间的动画延迟（毫秒）
   * @default 100
   */
  staggerDelay?: number;
  
  /**
   * 自定义样式类名
   */
  className?: string;
}

/**
 * Skeleton 列表组件
 * 渲染多个 SkeletonCard 并管理动画错开
 */
const SkeletonList: React.FC<SkeletonListProps>;
```

### 3. SkeletonBox Component

通用的 Skeleton 占位符组件，可用于任意形状的占位。

```typescript
interface SkeletonBoxProps {
  /**
   * 宽度（支持 rpx 或百分比）
   */
  width?: string | number;
  
  /**
   * 高度（支持 rpx）
   */
  height?: string | number;
  
  /**
   * 圆角大小（rpx）
   */
  borderRadius?: string | number;
  
  /**
   * 动画延迟时间（毫秒）
   */
  delay?: number;
  
  /**
   * 自定义样式类名
   */
  className?: string;
}

/**
 * 通用 Skeleton 占位符组件
 * 可用于任意形状的占位
 */
const SkeletonBox: React.FC<SkeletonBoxProps>;
```

## Data Models

### Skeleton State

```typescript
interface SkeletonState {
  /**
   * 是否正在加载
   */
  loading: boolean;
  
  /**
   * 加载开始时间（用于超时检测）
   */
  loadingStartTime?: number;
  
  /**
   * 是否加载超时
   */
  timeout: boolean;
  
  /**
   * 错误信息
   */
  error?: string;
}
```

### Page Loading State

```typescript
interface PageLoadingState {
  /**
   * 数据是否正在加载
   */
  isLoading: boolean;
  
  /**
   * 是否首次加载
   */
  isFirstLoad: boolean;
  
  /**
   * 是否正在刷新
   */
  isRefreshing: boolean;
  
  /**
   * 数据
   */
  data: Event[];
  
  /**
   * 错误信息
   */
  error?: string;
}
```

## Styling and Animation

### Shimmer Animation

使用 CSS 渐变和 transform 实现流畅的 shimmer 效果：

```scss
// Shimmer 动画定义
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

// Skeleton 基础样式
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 0%,
    #f0f0f0 40%,
    #e0e0e0 50%,
    #f0f0f0 60%,
    #f0f0f0 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 8rpx;
  overflow: hidden;
  position: relative;
}

// Shimmer 光效
.skeleton::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.6) 50%,
    transparent 100%
  );
  animation: shimmer 1.5s ease-in-out infinite;
}
```

### Fade Transition

内容加载完成后的淡入动画：

```scss
// 淡入动画
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

// 应用淡入动画
.content-loaded {
  animation: fadeIn 300ms ease-out;
}
```

## Error Handling

### Loading Timeout

```typescript
const LOADING_TIMEOUT = 10000; // 10 seconds

useEffect(() => {
  if (loading) {
    const timer = setTimeout(() => {
      setError('加载超时，请检查网络连接');
      setLoading(false);
    }, LOADING_TIMEOUT);
    
    return () => clearTimeout(timer);
  }
}, [loading]);
```

### Network Error

```typescript
try {
  const data = await fetchEvents();
  setData(data);
} catch (error) {
  if (error.message === 'Network Error') {
    setError('网络连接失败，请检查网络设置');
  } else {
    setError('加载失败，请稍后重试');
  }
} finally {
  setLoading(false);
}
```

### Empty State

```typescript
if (!loading && data.length === 0) {
  return <EmptyState message="还没有收藏，去首页看看感兴趣的机会吧" />;
}
```

## Performance Optimization

### 1. CSS Animation (GPU Accelerated)

使用 CSS transform 和 opacity 属性，利用 GPU 加速：

```scss
.skeleton {
  // 使用 transform 而不是 left/right
  animation: shimmer 1.5s ease-in-out infinite;
  
  // 启用硬件加速
  will-change: transform;
  transform: translateZ(0);
}
```

### 2. Animation Reuse

所有 Skeleton 卡片共享同一个动画定义：

```scss
// 定义一次动画
@keyframes shimmer { ... }

// 所有 Skeleton 元素复用
.skeleton-card,
.skeleton-box,
.skeleton-text {
  animation: shimmer 1.5s ease-in-out infinite;
}
```

### 3. Lazy Rendering

只渲染可见区域的 Skeleton 卡片：

```typescript
const SkeletonList: React.FC<SkeletonListProps> = ({ count = 5 }) => {
  // 只渲染前 5 个，避免过多 DOM 节点
  const visibleCount = Math.min(count, 5);
  
  return (
    <View>
      {Array.from({ length: visibleCount }).map((_, index) => (
        <SkeletonCard key={index} delay={index * 100} />
      ))}
    </View>
  );
};
```

### 4. Memory Cleanup

组件卸载时清理动画资源：

```typescript
useEffect(() => {
  return () => {
    // 清理定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };
}, []);
```

## Implementation Strategy

### Phase 1: Core Components (Week 1)

1. 创建 SkeletonBox 基础组件
2. 创建 SkeletonCard 组件
3. 创建 SkeletonList 组件
4. 实现 shimmer 动画

### Phase 2: Page Integration (Week 1)

5. 集成到首页（HomePage）
6. 集成到收藏页（FavoritesPage）
7. 集成到历史页（HistoryPage）

### Phase 3: Polish & Optimization (Week 1)

8. 添加淡入淡出过渡动画
9. 优化性能（GPU 加速）
10. 添加错误处理和超时逻辑
11. 真机测试和调优

## Testing Strategy

### Unit Testing

- SkeletonBox 组件渲染测试
- SkeletonCard 组件渲染测试
- SkeletonList 组件渲染测试
- 动画延迟计算测试

### Integration Testing

- 首页加载流程测试
- 收藏页加载流程测试
- 历史页加载流程测试
- 下拉刷新流程测试

### Visual Testing

- Skeleton 布局与真实内容对比
- 动画流畅度测试
- 不同屏幕尺寸适配测试
- 暗黑模式适配测试（可选）

### Performance Testing

- 动画帧率测试（目标：60fps）
- 内存占用测试
- 加载时间测试
- 慢速网络测试

## Accessibility

### Screen Reader Support

```typescript
<View 
  className="skeleton-card"
  aria-label="正在加载内容"
  aria-busy="true"
>
  {/* Skeleton content */}
</View>
```

### Reduced Motion

支持用户的"减少动画"偏好设置：

```scss
@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    background: #f0f0f0;
  }
}
```

## Migration Plan

### Backward Compatibility

- 保留现有的 loading 状态逻辑
- Skeleton 作为增强功能，不影响现有功能
- 可通过配置开关控制是否启用 Skeleton

### Rollout Strategy

1. **Phase 1**: 在首页启用 Skeleton（A/B 测试）
2. **Phase 2**: 根据用户反馈调整动画效果
3. **Phase 3**: 推广到所有页面
4. **Phase 4**: 移除旧的 loading 转圈逻辑

## Monitoring

### Key Metrics

- Skeleton 显示时长（平均值、P95）
- 用户感知加载速度（问卷调查）
- 页面跳出率（对比 Skeleton 前后）
- 动画性能（FPS、内存占用）

### Error Tracking

- 加载超时次数
- 网络错误次数
- 组件渲染错误次数

---

**设计版本**：V1.0  
**最后更新**：2025年12月  
**设计者**：开发团队
