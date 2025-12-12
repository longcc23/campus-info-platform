import { View } from '@tarojs/components'
import React from 'react'
import SkeletonCard from './SkeletonCard'
import './SkeletonList.scss'

interface SkeletonListProps {
  /**
   * 显示的 Skeleton 卡片数量
   * @default 5
   */
  count?: number
  
  /**
   * 每个卡片之间的动画延迟（毫秒）
   * @default 100
   */
  staggerDelay?: number
  
  /**
   * 自定义样式类名
   */
  className?: string
}

/**
 * Skeleton 列表组件
 * 
 * 渲染多个 SkeletonCard 并管理动画错开效果
 * 
 * @example
 * ```tsx
 * // 基础用法（显示 5 个卡片）
 * <SkeletonList />
 * 
 * // 自定义数量
 * <SkeletonList count={3} />
 * 
 * // 自定义动画延迟
 * <SkeletonList count={5} staggerDelay={150} />
 * ```
 */
const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 5,
  staggerDelay = 100,
  className = ''
}) => {
  // 限制最大数量，避免过多 DOM 节点
  const visibleCount = Math.min(count, 10)

  return (
    <View className={`skeleton-list ${className}`}>
      {Array.from({ length: visibleCount }).map((_, index) => (
        <SkeletonCard 
          key={`skeleton-${index}`}
          delay={index * staggerDelay}
        />
      ))}
    </View>
  )
}

export default SkeletonList
