/**
 * 详情弹窗组件
 * 严格参照图 2 还原：去掉所有按钮背景，修复滚动问题
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

export interface Attachment {
  url: string
  type: 'pdf' | 'image' | 'doc'
  name?: string
}

export interface EventItem {
  id: number
  type: 'activity' | 'lecture' | 'recruit'
  title: string
  summary?: string
  raw_content?: string
  rawContent?: string
  image_url?: string
  imageUrl?: string
  attachments?: Attachment[]  // 新增：支持多个附件
  key_info?: any
  keyInfo?: any
  is_top?: boolean
  isTop?: boolean
  isSaved?: boolean
  poster_color?: string
  posterColor?: string
}

export default function DetailModal({ 
  item, 
  onClose, 
  onFavoriteToggle,
  initialFavorited = false 
}: { item: EventItem, onClose: () => void, onFavoriteToggle?: any, initialFavorited?: boolean }) {
  const [expandedAttachments, setExpandedAttachments] = useState<Set<number>>(new Set())
  
  const keyInfo = item.key_info || item.keyInfo || {}
  const imageUrl = item.image_url || item.imageUrl
  const rawContent = item.raw_content || item.rawContent
  const attachments = item.attachments || []
  
  // 调试日志
  console.log('[DetailModal] 附件数据:', {
    hasAttachments: attachments.length > 0,
    attachmentsCount: attachments.length,
    attachments: attachments,
    imageUrl: imageUrl
  })
  
  // 如果有 image_url 但没有 attachments，自动转换为 attachments 格式
  const allAttachments: Attachment[] = attachments.length > 0 
    ? attachments 
    : imageUrl 
      ? [{ url: imageUrl, type: imageUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image' }]
      : []
  
  console.log('[DetailModal] 最终附件列表:', allAttachments)
  
  const toggleAttachment = (index: number) => {
    setExpandedAttachments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }
  
  const handleOpenAttachment = (attachment: Attachment) => {
    console.log('[DetailModal] 打开附件:', attachment)
    
    if (attachment.type === 'pdf' || attachment.type === 'doc') {
      // 显示加载提示
      Taro.showLoading({
        title: '正在下载...',
        mask: true
      })
      
      Taro.downloadFile({
        url: attachment.url,
        success: (res) => {
          console.log('[DetailModal] 下载成功:', res)
          Taro.hideLoading()
          
          if (res.statusCode === 200) {
            Taro.openDocument({
              filePath: res.tempFilePath,
              showMenu: true,
              success: () => {
                console.log('[DetailModal] 文件打开成功')
              },
              fail: (err) => {
                console.error('[DetailModal] 打开文档失败:', err)
                Taro.showModal({
                  title: '无法打开文件',
                  content: `错误信息: ${err.errMsg || '未知错误'}`,
                  showCancel: false
                })
              }
            })
          } else {
            Taro.showToast({
              title: `下载失败 (${res.statusCode})`,
              icon: 'none',
              duration: 2000
            })
          }
        },
        fail: (err) => {
          console.error('[DetailModal] 下载文件失败:', err)
          Taro.hideLoading()
          
          // 显示详细错误信息
          Taro.showModal({
            title: '下载失败',
            content: `${err.errMsg || '网络错误'}\n\n提示：请检查网络连接或文件链接是否有效`,
            showCancel: false
          })
        }
      })
    }
  }
  
  const handleCopyLink = (link: string) => {
    withAuthGuard('复制', () => {
      copyToClipboard(link)
    })
  }
  
  const handleAddToCalendar = async () => {
    await withAuthGuard('添加到日历', async () => {
      let dateStr = keyInfo.deadline || keyInfo.date
      if (!dateStr) return
      const calendarEvent = createCalendarEventFromItem(
        keyInfo.deadline ? `⏰ ${item.title}` : item.title,
        dateStr,
        keyInfo.time || '',
        keyInfo.location || '',
        item.summary || rawContent || ''
      )
      if (calendarEvent) await addToPhoneCalendar(calendarEvent)
    })
  }

  const showActions = !!(keyInfo.date || keyInfo.deadline || keyInfo.time)

  return (
    <View className="detail-modal">
      {/* 1. 顶部操作栏（无背景，绝对定位） */}
      <View className="detail-header-overlay">
        <View className="back-icon" onClick={onClose}>
          <Text>←</Text>
        </View>
        <View className="right-icons">
          <ShareButton eventData={item} size="medium" type="icon" />
          <FavoriteButton 
            eventId={item.id} 
            initialFavorited={initialFavorited} 
            large={true} 
            onToggle={onFavoriteToggle} 
          />
        </View>
      </View>

      {/* 2. 滚动内容区 */}
      <ScrollView 
        scrollY 
        className="detail-scroll-view"
        scrollWithAnimation
        enablePassive
      >
        <View className="detail-inner-content">
          <Text className="detail-title-main">{item.title}</Text>

          <View className="detail-cards-stack">
            {/* 关键信息 */}
            <View className="info-glass-card">
              <Text className="card-label-purple">关键信息</Text>
              {item.type === 'recruit' ? (
                <View className="info-list">
                  {keyInfo.company && <InfoRow icon="🏢" label="公司 | Company:" value={keyInfo.company} />}
                  {keyInfo.position && <InfoRow icon="💼" label="岗位 | Position:" value={keyInfo.position} />}
                  {keyInfo.contact && (
                    <InfoRow 
                      icon="💬" 
                      label="联系方式 | Contact:" 
                      value={keyInfo.contact}
                      showCopy
                      onCopy={() => handleCopyLink(keyInfo.contact || '')}
                    />
                  )}
                  {keyInfo.education && <InfoRow icon="🎓" label="申请群体 | Applicants:" value={keyInfo.education} />}
                  {keyInfo.deadline && <InfoRow icon="⏰" label="截止时间 | Deadline:" value={formatDate(keyInfo.deadline)} />}
                  {keyInfo.link && (
                    <InfoRow 
                      icon="📧" 
                      label="投递方式 | Apply:" 
                      value={keyInfo.link.replace(/^mailto:/i, '')}
                      showCopy={!keyInfo.link.includes('二维码报名') && !keyInfo.link.includes('QR Code')}
                      onCopy={() => handleCopyLink((keyInfo.link || '').replace(/^mailto:/i, ''))}
                    />
                  )}
                </View>
              ) : (
                <View className="info-list">
                  {keyInfo.date && <InfoRow icon="📅" label="日期 | Date:" value={formatDate(keyInfo.date)} />}
                  {keyInfo.time && <InfoRow icon="🕐" label="时间 | Time:" value={keyInfo.time} />}
                  {keyInfo.location && <InfoRow icon="📍" label="地点 | Location:" value={keyInfo.location} />}
                  {keyInfo.deadline && <InfoRow icon="⏰" label="截止时间 | Deadline:" value={formatDate(keyInfo.deadline)} />}
                  {keyInfo.registration_link && <InfoRow icon="🔗" label="报名链接 | Register:" value={keyInfo.registration_link} showCopy onCopy={() => handleCopyLink(keyInfo.registration_link)} />}
                </View>
              )}
            </View>

            {/* 活动详情 */}
            <View className="info-glass-card">
              <Text className="card-label-purple">活动详情 | Details</Text>
              <View className="details-text">
                {item.summary && rawContent && 
                 rawContent.trim() && 
                 !rawContent.startsWith('📷') &&
                 !rawContent.startsWith('📄') &&
                 !rawContent.startsWith('📦') &&
                 item.summary.trim() !== rawContent.trim().substring(0, Math.min(item.summary.length, rawContent.length)).trim() ? (
                  <>
                    <Text className="detail-summary-text">{item.summary}</Text>
                    <View className="detail-divider" />
                    <TextWithLinks text={rawContent} />
                  </>
                ) : (
                  <TextWithLinks 
                    text={
                      rawContent?.trim() && !rawContent.startsWith('📷') && !rawContent.startsWith('📄') && !rawContent.startsWith('📦')
                        ? rawContent 
                        : item.summary || '暂无详情'
                    } 
                  />
                )}
              </View>

              {/* 附件区域 */}
              {allAttachments.length > 0 && (
                <View className="attachments-area">
                  <Text className="attachments-title">
                    📎 附件 | Attachments ({allAttachments.length})
                  </Text>
                  {allAttachments.map((attachment, index) => (
                    <View key={index} className="attachment-item">
                      {attachment.type === 'pdf' || attachment.type === 'doc' ? (
                        <Button 
                          className="attachment-btn" 
                          onClick={() => handleOpenAttachment(attachment)}
                        >
                          <Text className="attachment-icon">
                            {attachment.type === 'pdf' ? '📄' : '📝'}
                          </Text>
                          <Text className="attachment-name">
                            {attachment.name || `文件 ${index + 1}`}
                          </Text>
                          <Text className="attachment-action">查看</Text>
                        </Button>
                      ) : (
                        <View className="attachment-image-wrapper">
                          {expandedAttachments.has(index) ? (
                            <Image 
                              src={attachment.url} 
                              mode="widthFix" 
                              className="attachment-img" 
                              showMenuByLongpress 
                            />
                          ) : (
                            <Button 
                              className="attachment-btn" 
                              onClick={() => toggleAttachment(index)}
                            >
                              <Text className="attachment-icon">🖼️</Text>
                              <Text className="attachment-name">
                                {attachment.name || `图片 ${index + 1}`}
                              </Text>
                              <Text className="attachment-action">查看</Text>
                            </Button>
                          )}
                          {expandedAttachments.has(index) && (
                            <Button 
                              className="collapse-btn" 
                              onClick={() => toggleAttachment(index)}
                            >
                              收起
                            </Button>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
          
          {/* 底部占位留白 */}
          <View style={{ height: '300rpx' }} />
        </View>
      </ScrollView>

      {/* 3. 底部操作按钮 */}
      {showActions && (
        <View className="fixed-bottom-bar" style={{ paddingBottom: `${getSafeAreaBottom() + 10}px` }}>
          <Button className="calendar-btn" onClick={handleAddToCalendar}>
            <Text>📅 添加到日历 | Add to Calendar</Text>
          </Button>
        </View>
      )}
    </View>
  )
}

function InfoRow({ icon, label, value, showCopy, onCopy }: any) {
  return (
    <View className="info-row">
      <View className="info-row-icon">{icon}</View>
      <View className="info-row-main">
        <Text className="info-row-label">{label}</Text>
        <View className="info-row-value-wrap">
          <Text className="info-row-value">{value}</Text>
          {showCopy && <View className="mini-copy-btn" onClick={onCopy}>Copy</View>}
        </View>
      </View>
    </View>
  )
}
