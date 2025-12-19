/**
 * 组件统一导出
 * 
 * 使用方式：
 * import { FavoriteButton, ShareButton, ExpiredFilter, SkeletonList } from '@/components'
 */

// 收藏按钮组件
export { default as FavoriteButton } from './FavoriteButton'
export type { FavoriteButtonProps } from './FavoriteButton/types'

// 分享按钮组件
export { default as ShareButton } from './ShareButton'

// 过期筛选组件
export { default as ExpiredFilter } from './ExpiredFilter'

// 骨架屏组件
export { SkeletonBox, SkeletonCard, SkeletonList } from './Skeleton'

// 详情弹窗组件
export { default as DetailModal } from './DetailModal'
export type { EventItem, EventKeyInfo } from './DetailModal'

// 事件卡片组件
export { default as EventCard } from './EventCard'
export type { EventCardProps } from './EventCard'
