/**
 * FavoriteButton 组件类型定义
 */

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
