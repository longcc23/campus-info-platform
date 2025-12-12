/**
 * 分享按钮组件
 * 可复用的分享按钮，支持不同尺寸和样式
 */

import { View, Text } from '@tarojs/components'
import { generateShareCard, triggerShare, showShareOptions, handleShareResult } from '../../services/share'
import './index.scss'

interface ShareButtonProps {
  eventData: any // 活动数据
  className?: string
  size?: 'small' | 'medium' | 'large'
  type?: 'icon' | 'text' | 'both'
  disabled?: boolean
  showOptions?: boolean // 是否显示更多选项
}

export default function ShareButton({ 
  eventData, 
  className = '', 
  size = 'medium',
  type = 'both',
  disabled = false,
  showOptions = false
}: ShareButtonProps) {

  const handleShare = async (e: any) => {
    e.stopPropagation()
    
    if (disabled) return
    
    try {
      // 生成分享数据
      const shareData = generateShareCard(eventData)
      
      // 根据配置选择分享方式
      const result = showOptions 
        ? await showShareOptions(shareData)  // 显示选项菜单
        : await triggerShare(shareData)      // 直接复制
      
      // 处理分享结果
      handleShareResult(result)
    } catch (error) {
      console.error('分享失败:', error)
      handleShareResult({
        success: false,
        error: '分享失败'
      })
    }
  }

  const renderContent = () => {
    switch (type) {
      case 'icon':
        return <Text className="share-icon">🔗</Text>
      case 'text':
        return <Text className="share-text">分享</Text>
      case 'both':
      default:
        return (
          <>
            <Text className="share-icon">🔗</Text>
            <Text className="share-text">分享</Text>
          </>
        )
    }
  }

  return (
    <View 
      className={`share-button ${size} ${type} ${disabled ? 'disabled' : ''} ${className}`}
      onClick={handleShare}
    >
      {renderContent()}
    </View>
  )
}