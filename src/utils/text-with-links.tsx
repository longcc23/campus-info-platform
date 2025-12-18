/**
 * 文本链接识别组件
 * 自动识别文本中的URL并添加复制按钮
 */

import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'

interface TextWithLinksProps {
  text: string
  className?: string
}

/**
 * 复制链接到剪贴板
 */
export function copyToClipboard(content: string, showToast = false): void {
  Taro.setClipboardData({
    data: content,
    success: () => {
      if (showToast) {
        Taro.showToast({
          title: '已复制',
          icon: 'success',
          duration: 1500,
        })
      }
    },
    fail: () => {
      Taro.showToast({
        title: '复制失败',
        icon: 'none',
      })
    }
  })
}

/**
 * 复制链接并显示提示弹窗
 */
export function copyLinkWithModal(link: string, linkType: 'registration' | 'apply' = 'apply'): void {
  Taro.setClipboardData({
    data: link,
    success: () => {
      const title = linkType === 'registration' ? '报名链接已复制' : '链接已复制'
      Taro.showModal({
        title: title,
        content: '链接已复制到剪贴板，请在浏览器中粘贴打开',
        showCancel: false,
        confirmText: '知道了',
        confirmColor: '#8B5CF6'
      })
    },
    fail: () => {
      Taro.showToast({
        title: '复制失败',
        icon: 'none',
      })
    }
  })
}

/**
 * 渲染带有链接识别和Copy按钮的文本内容
 */
export function TextWithLinks({ text, className }: TextWithLinksProps) {
  if (!text) return null
  
  // 匹配URL的正则表达式
  const urlRegex = /(https?:\/\/[^\s\n]+)/g
  const parts = text.split(urlRegex)
  
  return (
    <View className={`text-with-links ${className || ''}`}>
      {parts.map((part, index) => {
        // 重新测试是否是URL（因为split后需要重新判断）
        if (/^https?:\/\/[^\s\n]+$/.test(part)) {
          // 这是一个链接
          return (
            <View key={index} className="link-container">
              <Text className="link-text" style={{ wordBreak: 'break-all', flex: 1 }}>
                {part}
              </Text>
              <View 
                className="copy-link-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  copyToClipboard(part)
                }}
              >
                <Text>Copy</Text>
              </View>
            </View>
          )
        } else {
          // 这是普通文本
          return (
            <Text key={index} style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {part}
            </Text>
          )
        }
      })}
    </View>
  )
}

export default TextWithLinks

