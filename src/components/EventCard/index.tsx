/**
 * EventCard - 统一的事件卡片组件
 * 用于首页、收藏页、历史页的列表展示
 */

import { View, Text } from '@tarojs/components'
import { FavoriteButton } from '../index'
import { formatDate } from '../../utils/date-formatter'
import { isExpired } from '../../services/expiration'
import type { CardData, KeyInfo } from '../../types/event'
import './index.scss'

export interface EventCardProps {
  /** 卡片数据 */
  data: CardData
  /** 是否为列表第一项 */
  isFirst?: boolean
  /** 点击卡片回调 */
  onClick?: () => void
  /** 收藏状态变化回调 */
  onFavoriteToggle?: (isFavorited: boolean) => void
  /** 是否显示摘要 */
  showSummary?: boolean
}

/**
 * 检查是否过期（兼容 CardData）
 */
function checkExpired(data: CardData): boolean {
  // 构造一个兼容 isExpired 函数的对象
  const item = {
    type: data.type,
    keyInfo: data.keyInfo,
    key_info: data.keyInfo
  }
  return isExpired(item as any)
}

/**
 * 获取类型标签文本
 */
function getTypeLabel(type: string): string {
  switch (type) {
    case 'recruit': return '招聘'
    case 'lecture': return '讲座'
    case 'activity': return '活动'
    default: return '活动'
  }
}

/**
 * 获取日期显示文本
 */
function getDateText(keyInfo: KeyInfo, type: string): string {
  if (keyInfo.deadline) {
    return formatDate(keyInfo.deadline)
  }
  if (keyInfo.date) {
    return formatDate(keyInfo.date)
  }
  return keyInfo.time || '-'
}

export default function EventCard({
  data,
  isFirst = false,
  onClick,
  onFavoriteToggle,
  showSummary = false
}: EventCardProps) {
  const expired = checkExpired(data)
  const typeClass = data.type === 'recruit' ? 'recruit' : data.type === 'lecture' ? 'lecture' : 'activity'

  return (
    <View
      className={`event-card ${isFirst ? 'first-card' : ''} ${expired ? 'expired' : ''}`}
      onClick={onClick}
    >
      {/* 左上角置顶三角标签 */}
      {data.isTop && (
        <View className="top-corner-badge">
          <Text className="top-corner-text">置顶</Text>
        </View>
      )}

      {/* 顶部色条 */}
      <View
        className="card-top-bar"
        style={{
          background: expired
            ? '#9CA3AF'
            : `linear-gradient(to right, ${data.posterColor})`
        }}
      />

      {/* 卡片内容 */}
      <View className="card-content">
        {/* 头部：类型标签和收藏按钮 */}
        <View className="card-header">
          <View className="card-tags">
            <Text className={`type-tag ${typeClass}`}>
              {getTypeLabel(data.type)}
            </Text>
            {expired && <Text className="expired-tag">已过期</Text>}
          </View>
          <FavoriteButton
            eventId={data.id}
            initialFavorited={data.isFavorited}
            onToggle={onFavoriteToggle}
          />
        </View>

        {/* 标题 */}
        <Text className={`card-title ${expired ? 'expired-text' : ''}`}>
          {data.title}
        </Text>

        {/* 关键信息 */}
        <View className="card-info">
          <View className="info-item">
            <Text className="info-icon">{data.type === 'recruit' ? '⏰' : '📅'}</Text>
            <Text className={`info-text ${expired ? 'expired-text' : ''}`}>
              {getDateText(data.keyInfo, data.type)}
            </Text>
          </View>
          {data.keyInfo.location && (
            <View className="info-item">
              <Text className="info-icon">📍</Text>
              <Text className={`info-text ${expired ? 'expired-text' : ''}`}>
                {data.keyInfo.location}
              </Text>
            </View>
          )}
        </View>

        {/* 摘要（可选） */}
        {showSummary && data.summary && (
          <Text className="card-summary">{data.summary}</Text>
        )}
      </View>
    </View>
  )
}
