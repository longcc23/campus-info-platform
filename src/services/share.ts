/**
 * 分享服务
 * 封装微信分享功能和分享卡片生成
 */

import Taro from '@tarojs/taro'

// 分享数据接口
export interface ShareData {
  title: string        // 分享标题
  desc: string         // 分享描述
  link: string         // 分享链接
  imgUrl?: string      // 分享图片URL
  type: 'activity' | 'recruit' | 'lecture'
  source: string       // 来源信息
}

// 分享结果接口
export interface ShareResult {
  success: boolean
  error?: string
  platform?: 'friend' | 'timeline' | 'group' | 'clipboard'
}

// 支持的事件类型接口
interface EventData {
  id: number
  type: 'activity' | 'lecture' | 'recruit'
  title: string
  summary?: string
  rawContent?: string
  raw_content?: string
  sourceGroup?: string
  source_group?: string
  keyInfo?: {
    company?: string
    position?: string
    location?: string
    date?: string
    deadline?: string
  }
  key_info?: {
    company?: string
    position?: string
    location?: string
    date?: string
    deadline?: string
  }
}

/**
 * 生成分享卡片数据
 * @param event 活动数据
 * @returns 分享数据对象
 */
export const generateShareCard = (event: EventData): ShareData => {
  // 兼容不同的数据结构
  const keyInfo = event.keyInfo || event.key_info || {}
  const sourceGroup = event.sourceGroup || event.source_group || '信息平台'
  const content = event.summary || event.rawContent || event.raw_content || ''
  
  // 生成分享标题
  let title = event.title
  if (title.length > 30) {
    title = title.substring(0, 27) + '...'
  }
  
  // 生成分享描述
  let desc = ''
  if (event.type === 'recruit') {
    // 招聘信息：公司 + 岗位 + 截止时间
    const parts = []
    if (keyInfo.company) parts.push(`🏢 ${keyInfo.company}`)
    if (keyInfo.position) parts.push(`💼 ${keyInfo.position}`)
    if (keyInfo.deadline) parts.push(`⏰ ${keyInfo.deadline}`)
    desc = parts.join(' | ')
  } else {
    // 活动/讲座：时间 + 地点
    const parts = []
    if (keyInfo.date) parts.push(`📅 ${keyInfo.date}`)
    if (keyInfo.location) parts.push(`📍 ${keyInfo.location}`)
    desc = parts.join(' | ')
  }
  
  // 如果没有关键信息，使用摘要
  if (!desc && content) {
    desc = content.length > 50 ? content.substring(0, 47) + '...' : content
  }
  
  // 添加来源信息
  if (desc) {
    desc += ` | 来源：${sourceGroup}`
  } else {
    desc = `来源：${sourceGroup}`
  }
  
  // 生成分享链接（这里可以根据实际需求调整）
  const link = `https://your-domain.com/event/${event.id}`
  
  return {
    title,
    desc,
    link,
    type: event.type,
    source: sourceGroup
  }
}

/**
 * 配置页面分享信息
 * 这个函数应该在页面的 onShareAppMessage 中调用
 * @param shareData 分享数据
 * @returns 微信分享配置对象
 */
export const getShareConfig = (shareData: ShareData) => {
  return {
    title: shareData.title,
    path: `/pages/index/index?eventId=${extractEventIdFromLink(shareData.link)}`,
    imageUrl: shareData.imgUrl
  }
}

/**
 * 触发分享操作 - 直接复制分享内容
 * @param shareData 分享数据
 * @returns 分享结果
 */
export const triggerShare = async (shareData: ShareData): Promise<ShareResult> => {
  try {
    // 直接复制分享内容，这是最实用的分享方式
    const shareText = `📢 ${shareData.title}\n\n${shareData.desc}\n\n🔗 查看详情：${shareData.link}\n\n📱 来自 UniFlow 智汇校园`
    
    await Taro.setClipboardData({
      data: shareText
    })
    
    return {
      success: true,
      platform: 'clipboard'
    }
  } catch (error: any) {
    console.error('分享操作失败:', error)
    return {
      success: false,
      error: error.message || '复制失败'
    }
  }
}

/**
 * 显示分享选项（备用方案）
 * @param shareData 分享数据
 * @returns 分享结果
 */
export const showShareOptions = async (shareData: ShareData): Promise<ShareResult> => {
  try {
    const result = await Taro.showActionSheet({
      itemList: ['复制分享内容', '复制链接地址']
    })
    
    if (result.tapIndex === 0) {
      // 复制完整分享内容
      const shareText = `📢 ${shareData.title}\n\n${shareData.desc}\n\n🔗 查看详情：${shareData.link}\n\n📱 来自 UniFlow 智汇校园`
      await Taro.setClipboardData({
        data: shareText
      })
      
      return {
        success: true,
        platform: 'clipboard'
      }
    } else if (result.tapIndex === 1) {
      // 只复制链接
      await Taro.setClipboardData({
        data: shareData.link
      })
      
      return {
        success: true,
        platform: 'clipboard'
      }
    }
    
    return {
      success: false,
      error: '用户取消分享'
    }
  } catch (error: any) {
    if (error.errMsg && error.errMsg.includes('cancel')) {
      return {
        success: false,
        error: '用户取消分享'
      }
    }
    
    console.error('分享选项失败:', error)
    return {
      success: false,
      error: error.message || '分享失败'
    }
  }
}

/**
 * 从分享链接中提取事件ID
 * @param link 分享链接
 * @returns 事件ID
 */
const extractEventIdFromLink = (link: string): string => {
  const match = link.match(/\/event\/(\d+)/)
  return match ? match[1] : ''
}

// showShareOptions 函数已被 triggerShare 替代

/**
 * 处理分享结果
 * @param result 分享结果
 */
export const handleShareResult = (result: ShareResult): void => {
  if (result.success) {
    Taro.showModal({
      title: '分享内容已复制 📋',
      content: '内容已复制到剪贴板，你可以：\n\n• 粘贴到微信群聊或好友对话\n• 分享到朋友圈或其他社交平台\n• 发送给需要这个信息的同学',
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#8B5CF6'
    })
  } else {
    // 只有非用户取消的错误才显示错误提示
    if (result.error && !result.error.includes('取消')) {
      Taro.showToast({
        title: result.error,
        icon: 'none',
        duration: 2000
      })
    }
  }
}

export default {
  generateShareCard,
  getShareConfig,
  triggerShare,
  showShareOptions,
  handleShareResult
}