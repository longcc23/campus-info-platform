/**
 * 统一的事件类型定义
 * 所有页面和服务共用这些类型
 */

/**
 * 关键信息类型
 */
export interface KeyInfo {
  date?: string
  time?: string
  location?: string
  deadline?: string
  company?: string
  position?: string
  education?: string
  link?: string
  contact?: string
  registration_link?: string
  referral?: boolean
}

/**
 * 事件类型（数据库格式，snake_case）
 */
export interface Event {
  id: number
  title: string
  type: EventType
  source_group: string
  publish_time: string
  tags: string[]
  key_info: KeyInfo
  summary?: string
  raw_content?: string
  image_url?: string
  is_top: boolean
  status: EventStatus
  poster_color: string
  created_at?: string
  updated_at?: string
  // 前端扩展字段
  isFavorited?: boolean
}

/**
 * Feed 项类型（前端格式，camelCase）
 * 用于首页列表展示
 */
export interface FeedItem {
  id: number
  type: EventType
  status: 'open' | 'urgent' | 'new'
  title: string
  organizer: string
  sourceGroup: string
  publishTime: string
  tags: string[]
  keyInfo: KeyInfo
  summary: string
  rawContent: string
  imageUrl?: string
  isTop: boolean
  isSaved: boolean
  posterColor: string
}

/**
 * 事件类型枚举
 */
export type EventType = 'recruit' | 'activity' | 'lecture'

/**
 * 事件状态枚举
 */
export type EventStatus = 'active' | 'inactive' | 'archived' | 'new' | 'urgent'

/**
 * 将数据库 Event 转换为前端 FeedItem
 */
export function eventToFeedItem(event: Event): FeedItem {
  return {
    id: event.id,
    type: event.type,
    status: event.status === 'active' ? 'open' : event.status === 'inactive' ? 'urgent' : 'new',
    title: event.title,
    organizer: event.source_group.split(' ')[0] || event.source_group,
    sourceGroup: event.source_group,
    publishTime: event.publish_time,
    tags: event.tags,
    keyInfo: event.key_info,
    summary: event.summary || '',
    rawContent: event.raw_content || '',
    imageUrl: event.image_url || '',
    isTop: event.is_top,
    isSaved: event.isFavorited || false,
    posterColor: event.poster_color
  }
}

/**
 * 统一的卡片数据接口
 * EventCard 组件使用此接口，兼容 Event 和 FeedItem
 */
export interface CardData {
  id: number
  type: EventType
  title: string
  isTop: boolean
  isFavorited: boolean
  posterColor: string
  keyInfo: KeyInfo
  summary?: string
}

/**
 * 从 Event 创建 CardData
 */
export function eventToCardData(event: Event, isFavorited: boolean = false): CardData {
  return {
    id: event.id,
    type: event.type,
    title: event.title,
    isTop: event.is_top,
    isFavorited,
    posterColor: event.poster_color,
    keyInfo: event.key_info,
    summary: event.summary
  }
}

/**
 * 从 FeedItem 创建 CardData
 */
export function feedItemToCardData(item: FeedItem): CardData {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    isTop: item.isTop,
    isFavorited: item.isSaved,
    posterColor: item.posterColor,
    keyInfo: item.keyInfo,
    summary: item.summary
  }
}
