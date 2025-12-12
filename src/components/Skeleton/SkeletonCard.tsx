import { View } from '@tarojs/components'
import React from 'react'
import SkeletonBox from './SkeletonBox'
import './SkeletonCard.scss'

interface SkeletonCardProps {
  /**
   * 动画延迟时间（毫秒）
   * 用于错开多个卡片的动画开始时间
   * @default 0
   */
  delay?: number
  
  /**
   * 自定义样式类名
   */
  className?: string
}

/**
 * Skeleton 卡片组件
 * 
 * 模拟 Event 卡片的布局结构，用于首页、收藏页、历史页的加载占位
 * 
 * @example
 * ```tsx
 * // 基础用法
 * <SkeletonCard />
 * 
 * // 带延迟动画（用于列表中）
 * <SkeletonCard delay={100} />
 * ```
 */
const SkeletonCard: React.FC<SkeletonCardProps> = ({
  delay = 0,
  className = ''
}) => {
  return (
    <View className={`skeleton-card ${className}`}>
      {/* 顶部标题行 */}
      <View className="skeleton-card__header">
        <View className="skeleton-card__icon">
          <SkeletonBox width="48rpx" height="48rpx" borderRadius="8rpx" delay={delay} />
        </View>
        <View className="skeleton-card__title-wrapper">
          <SkeletonBox width="80%" height="36rpx" borderRadius="6rpx" delay={delay} />
        </View>
      </View>

      {/* 标签行 */}
      <View className="skeleton-card__tags">
        <SkeletonBox width="100rpx" height="44rpx" borderRadius="22rpx" delay={delay} />
        <SkeletonBox width="120rpx" height="44rpx" borderRadius="22rpx" delay={delay + 50} />
        <SkeletonBox width="80rpx" height="44rpx" borderRadius="22rpx" delay={delay + 100} />
      </View>

      {/* 摘要行 */}
      <View className="skeleton-card__summary">
        <SkeletonBox width="100%" height="32rpx" borderRadius="6rpx" delay={delay} />
        <SkeletonBox width="85%" height="32rpx" borderRadius="6rpx" delay={delay + 50} />
      </View>

      {/* 底部信息行 */}
      <View className="skeleton-card__footer">
        <SkeletonBox width="120rpx" height="28rpx" borderRadius="6rpx" delay={delay} />
        <SkeletonBox width="100rpx" height="28rpx" borderRadius="6rpx" delay={delay + 50} />
        <SkeletonBox width="80rpx" height="28rpx" borderRadius="6rpx" delay={delay + 100} />
      </View>
    </View>
  )
}

export default SkeletonCard
