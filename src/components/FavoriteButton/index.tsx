/**
 * FavoriteButton - 收藏按钮组件
 * 
 * 显示心形图标，点击切换收藏状态
 * 支持两种状态：已收藏（实心）和未收藏（空心）
 */

import { View } from '@tarojs/components'
import { useState, useEffect } from 'react'
import favoritesService from '../../services/favorites'
import './index.scss'

export interface FavoriteButtonProps {
  /** 事件 ID */
  eventId: number
  /** 初始收藏状态 */
  initialFavorited?: boolean
  /** 收藏状态变化回调 */
  onToggle?: (isFavorited: boolean) => void
  /** 自定义样式类名 */
  className?: string
  /** 是否显示为大尺寸 */
  large?: boolean
}

export default function FavoriteButton({
  eventId,
  initialFavorited = false,
  onToggle,
  className = '',
  large = false,
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)

  // 当 initialFavorited 变化时更新状态
  useEffect(() => {
    setIsFavorited(initialFavorited)
  }, [initialFavorited])

  /**
   * 处理点击事件
   */
  const handleClick = async (e: any) => {
    // 阻止事件冒泡，避免触发父元素的点击事件
    e.stopPropagation()

    // 如果正在加载，忽略点击
    if (loading) {
      return
    }

    setLoading(true)

    // 乐观更新：立即更新 UI
    const newState = !isFavorited
    setIsFavorited(newState)

    try {
      // 执行收藏操作
      const success = await favoritesService.toggleFavorite(eventId, newState)

      if (success) {
        // 操作成功，通知父组件
        onToggle?.(newState)
      } else {
        // 操作失败，回滚 UI 状态
        setIsFavorited(!newState)
      }
    } catch (error) {
      // 发生异常，回滚 UI 状态
      console.error('[FavoriteButton] 收藏操作异常:', error)
      setIsFavorited(!newState)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View
      className={`favorite-button ${className} ${large ? 'large' : ''} ${loading ? 'loading' : ''}`}
      onClick={handleClick}
      style={{ 
        background: 'transparent',
        border: 'none',
        padding: 0,
        margin: 0,
        outline: 'none'
      }}
    >
      <View 
        className={`heart-icon ${isFavorited ? 'filled' : 'outline'}`}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          margin: 0,
          boxShadow: 'none',
          outline: 'none'
        }}
      >
        {isFavorited ? '❤️' : '🤍'}
      </View>
    </View>
  )
}
