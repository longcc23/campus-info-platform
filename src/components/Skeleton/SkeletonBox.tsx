import { View } from '@tarojs/components'
import React from 'react'
import './SkeletonBox.scss'

interface SkeletonBoxProps {
  /**
   * 宽度（支持 rpx 或百分比）
   * @example '100%' | '200rpx' | 200
   */
  width?: string | number
  
  /**
   * 高度（支持 rpx）
   * @example '40rpx' | 40
   */
  height?: string | number
  
  /**
   * 圆角大小（rpx）
   * @default 8
   */
  borderRadius?: string | number
  
  /**
   * 动画延迟时间（毫秒）
   * @default 0
   */
  delay?: number
  
  /**
   * 自定义样式类名
   */
  className?: string
}

/**
 * Skeleton 基础占位符组件
 * 
 * 用于显示加载中的占位符，支持自定义尺寸和动画延迟
 * 
 * @example
 * ```tsx
 * // 基础用法
 * <SkeletonBox width="100%" height="40rpx" />
 * 
 * // 带延迟动画
 * <SkeletonBox width="200rpx" height="40rpx" delay={100} />
 * 
 * // 自定义圆角
 * <SkeletonBox width="100rpx" height="100rpx" borderRadius="50%" />
 * ```
 */
const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width = '100%',
  height = '40rpx',
  borderRadius = 8,
  delay = 0,
  className = ''
}) => {
  // 格式化尺寸值
  const formatSize = (size: string | number): string => {
    if (typeof size === 'number') {
      return `${size}rpx`
    }
    return size
  }

  // 格式化圆角值
  const formatBorderRadius = (radius: string | number): string => {
    if (typeof radius === 'number') {
      return `${radius}rpx`
    }
    return radius
  }

  const style = {
    width: formatSize(width),
    height: formatSize(height),
    borderRadius: formatBorderRadius(borderRadius),
    animationDelay: `${delay}ms`
  }

  return (
    <View 
      className={`skeleton-box ${className}`}
      style={style}
      aria-label="正在加载"
      aria-busy="true"
    />
  )
}

export default SkeletonBox
