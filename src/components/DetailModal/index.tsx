/**
 * 详情弹窗组件
 * 统一的事件详情展示组件，支持招聘、活动、讲座三种类型
 */

import { View, Text, Button, ScrollView, Image } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import FavoriteButton from '../FavoriteButton'
import ShareButton from '../ShareButton'
import { TextWithLinks, copyToClipboard } from '../../utils/text-with-links'
import { withAuthGuard } from '../../utils/auth-guard'
import { formatDate, extractTimeFromDeadline } from '../../utils/date-formatter'
import { createCalendarEventFromItem, addToPhoneCalendar } from '../../utils/ics-generator'
import { getSafeAreaBottom } from '../../utils/system-info'
import './index.scss'

// 事件类型定义
export interface EventKeyInfo {
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

export interface EventItem {
  id: number
  type: 'activity' | 'lecture' | 'recruit'
  title: string
  summary?: string
  raw_content?: string
  rawContent?: string // 兼容首页 FeedItem 格式
  image_url?: string
  imageUrl?: string // 兼容两种命名
  key_info?: EventKeyInfo
  keyInfo?: EventKeyInfo // 兼容两种命名
  is_top?: boolean
  isTop?: boolean // 兼容两种命名
  isSaved?: boolean
  poster_color?: string
  posterColor?: string // 兼容两种命名
}

interface DetailModalProps {
  item: EventItem
  onClose: () => void
  onFavoriteToggle?: (isFavorited: boolean) => void
  initialFavorited?: boolean
}

export default function DetailModal({ 
  item, 
  onClose, 
  onFavoriteToggle,
  initialFavorited = false 
}: DetailModalProps) {
  const [showPoster, setShowPoster] = useState(false)
  
  // 兼容两种数据格式（snake_case 和 camelCase）
  const keyInfo = item.key_info || item.keyInfo || {}
  const imageUrl = item.image_url || item.imageUrl
  const rawContent = item.raw_content || item.rawContent
  
  const handleClose = () => {
    setShowPoster(false)
    onClose()
  }

  const handleCopyLink = (link: string) => {
    withAuthGuard('复制', () => {
      copyToClipboard(link)
    })
  }

  const handleAddToCalendar = async () => {
    await withAuthGuard('添加到日历', async () => {
      try {
        let dateStr = ''
        let timeStr = ''
        
        if (item.type === 'recruit' && keyInfo.deadline) {
          dateStr = keyInfo.deadline
          timeStr = extractTimeFromDeadline(keyInfo.deadline)
        } else {
          dateStr = keyInfo.date || ''
          timeStr = keyInfo.time || ''
        }
        
        const calendarEvent = createCalendarEventFromItem(
          item.title,
          dateStr,
          timeStr,
          keyInfo.location || '',
          item.summary || rawContent || ''
        )
        
        if (!calendarEvent) {
          Taro.showToast({
            title: '无法解析活动时间',
            icon: 'none'
          })
          return
        }
        
        await addToPhoneCalendar(calendarEvent)
      } catch (error) {
        console.error('添加到日历失败:', error)
        Taro.showToast({
          title: '添加到日历失败',
          icon: 'none'
        })
      }
    })
  }

  // 判断是否显示底部操作栏
  const showActions = (
    ((item.type === 'activity' || item.type === 'lecture') && keyInfo.date) ||
    (item.type === 'recruit' && keyInfo.deadline)
  )

  return (
    <View className="detail-modal">
      {/* 头部 */}
      <View className="detail-header">
        <Button className="detail-back-btn" onClick={handleClose}>
          <Text>←</Text>
        </Button>
        <Text className="detail-title">{item.title}</Text>
        <View className="detail-header-right">
          <ShareButton 
            eventData={item}
            size="medium"
            type="icon"
            className="detail-share-btn"
          />
          <FavoriteButton 
            eventId={item.id}
            initialFavorited={initialFavorited}
            large={true}
            onToggle={(isFavorited) => {
              onFavoriteToggle?.(isFavorited)
            }}
          />
        </View>
      </View>

      {/* 滚动内容区 */}
      <View className="detail-scroll-wrapper">
        <ScrollView 
          scrollY 
          className="detail-scroll"
          enhanced
          showScrollbar={false}
        >
          {/* 顶部渐变区域 */}
          <View className="detail-hero">
            <View className="detail-hero-gradient" />
          </View>

          {/* 标题 */}
          <Text className="detail-main-title">{item.title}</Text>

          <View className="detail-content">
            {/* 关键信息卡片 */}
            <View className="detail-info-card">
              <Text className="detail-section-title">关键信息</Text>
              
              {/* 招聘信息 */}
              {item.type === 'recruit' && (
                <>
                  {keyInfo.company && (
                    <InfoItem icon="🏢" label="公司 | Company:" value={keyInfo.company} />
                  )}
                  {keyInfo.position && (
                    <InfoItem icon="💼" label="岗位 | Position:" value={keyInfo.position} />
                  )}
                  {keyInfo.contact && (
                    <InfoItem 
                      icon="💬" 
                      label="联系方式 | Contact:" 
                      value={keyInfo.contact}
                      showCopy
                      onCopy={() => handleCopyLink(keyInfo.contact || '')}
                    />
                  )}
                  {keyInfo.education && (
                    <InfoItem icon="🎓" label="申请群体 | Applicants:" value={keyInfo.education} />
                  )}
                  {keyInfo.deadline && (
                    <InfoItem icon="⏰" label="截止时间 | Deadline:" value={formatDate(keyInfo.deadline)} />
                  )}
                  {keyInfo.link && (
                    <InfoItem 
                      icon="📧" 
                      label="投递方式 | Apply:" 
                      value={keyInfo.link.replace(/^mailto:/i, '')}
                      showCopy={!keyInfo.link.includes('二维码报名') && !keyInfo.link.includes('QR Code')}
                      onCopy={() => handleCopyLink((keyInfo.link || '').replace(/^mailto:/i, ''))}
                    />
                  )}
                </>
              )}
              
              {/* 活动/讲座信息 */}
              {(item.type === 'activity' || item.type === 'lecture') && (
                <>
                  {keyInfo.date && (
                    <InfoItem icon="📅" label="日期 | Date:" value={formatDate(keyInfo.date)} />
                  )}
                  {keyInfo.time && (
                    <InfoItem icon="🕐" label="时间 | Time:" value={keyInfo.time} />
                  )}
                  {keyInfo.location && (
                    <InfoItem icon="📍" label="地点 | Location:" value={keyInfo.location} />
                  )}
                  {keyInfo.deadline && (
                    <InfoItem icon="⏰" label="截止时间 | Deadline:" value={formatDate(keyInfo.deadline)} />
                  )}
                  {keyInfo.registration_link && (
                    <InfoItem 
                      icon="🔗" 
                      label="报名链接 | Register:" 
                      value={keyInfo.registration_link}
                      showCopy={!keyInfo.registration_link.includes('二维码报名') && !keyInfo.registration_link.includes('QR Code')}
                      onCopy={() => handleCopyLink(keyInfo.registration_link || '')}
                    />
                  )}
                </>
              )}
            </View>

            {/* 活动详情 */}
            <View className="detail-body">
              <Text className="detail-body-title">活动详情 | Details</Text>
              
              {item.summary && rawContent && 
               rawContent.trim() && 
               !rawContent.startsWith('📷') &&
               item.summary.trim() !== rawContent.trim().substring(0, Math.min(item.summary.length, rawContent.length)).trim() ? (
                <>
                  <Text className="detail-summary">{item.summary}</Text>
                  {rawContent && rawContent.trim() && !rawContent.startsWith('📷') && (
                    <View className="detail-raw-content">
                      <TextWithLinks text={rawContent} />
                    </View>
                  )}
                </>
              ) : (
                <View className="detail-summary">
                  <TextWithLinks 
                    text={
                      rawContent?.trim() && !rawContent.startsWith('📷') 
                        ? rawContent 
                        : item.summary || '暂无详情'
                    } 
                  />
                </View>
              )}

              {/* 海报图片 */}
              {imageUrl && (
                <View className="detail-poster">
                  {showPoster ? (
                    <Image 
                      src={imageUrl} 
                      mode="widthFix" 
                      className="detail-poster-image"
                      showMenuByLongpress
                      lazyLoad
                    />
                  ) : (
                    <Button 
                      className="load-poster-btn"
                      onClick={() => setShowPoster(true)}
                    >
                      <Text>点击查看海报 | view poster</Text>
                    </Button>
                  )}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* 底部操作栏 */}
      {showActions && (
        <View className="detail-actions" style={{ paddingBottom: `${getSafeAreaBottom() + 32}rpx` }}>
          <Button 
            className="detail-action-btn"
            onClick={handleAddToCalendar}
          >
            <Text>📅 添加到日历 | Add to Calendar</Text>
          </Button>
        </View>
      )}
    </View>
  )
}

// 信息项子组件
interface InfoItemProps {
  icon: string
  label: string
  value: string
  showCopy?: boolean
  onCopy?: () => void
}

function InfoItem({ icon, label, value, showCopy, onCopy }: InfoItemProps) {
  return (
    <View className="detail-info-item">
      <View className="detail-info-icon">
        <Text>{icon}</Text>
      </View>
      <View className="detail-info-content" style={showCopy ? { flex: 1 } : {}}>
        <Text className="detail-info-label">{label}</Text>
        {showCopy ? (
          <View className="detail-info-value-row">
            <Text className="detail-info-value" style={{ wordBreak: 'break-all', flex: 1 }}>
              {value}
            </Text>
            <View 
              className="copy-link-btn"
              onClick={(e) => {
                e.stopPropagation()
                onCopy?.()
              }}
            >
              <Text>Copy</Text>
            </View>
          </View>
        ) : (
          <Text className="detail-info-value">{value}</Text>
        )}
      </View>
    </View>
  )
}

