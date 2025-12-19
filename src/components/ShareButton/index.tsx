/**
 * 分享按钮组件
 * 使用微信原生分享功能，点击后弹出分享菜单
 */

import { Button, Text, View } from '@tarojs/components'
import './index.scss'

interface ShareButtonProps {
  eventData: any // 活动数据（用于页面 onShareAppMessage 获取）
  className?: string
  size?: 'small' | 'medium' | 'large'
  type?: 'icon' | 'text' | 'both'
  disabled?: boolean
}

// 简约分享图标 SVG
const ShareIcon = ({ size = 20, color = '#666' }: { size?: number; color?: string }) => (
  <View 
    className="share-svg-icon"
    style={{ 
      width: `${size}px`, 
      height: `${size}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    <View
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(color)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8'/%3E%3Cpolyline points='16 6 12 2 8 6'/%3E%3Cline x1='12' y1='2' x2='12' y2='15'/%3E%3C/svg%3E") no-repeat center`,
        backgroundSize: 'contain'
      }}
    />
  </View>
)

export default function ShareButton({ 
  className = '', 
  size = 'medium',
  type = 'both',
  disabled = false
}: ShareButtonProps) {

  const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20
  const iconColor = '#8B5CF6'  // 紫色主题色

  const renderContent = () => {
    switch (type) {
      case 'icon':
        return <ShareIcon size={iconSize} color={iconColor} />
      case 'text':
        return <Text className="share-text">分享</Text>
      case 'both':
      default:
        return (
          <>
            <ShareIcon size={iconSize} color={iconColor} />
            <Text className="share-text">分享</Text>
          </>
        )
    }
  }

  return (
    <Button 
      className={`share-button ${size} ${type} ${disabled ? 'disabled' : ''} ${className}`}
      openType="share"
      plain
    >
      {renderContent()}
    </Button>
  )
}