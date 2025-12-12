/**
 * 意见反馈页面
 */

import { View, Text, Button, Textarea, Input } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

export default function Feedback() {
  const [feedbackType, setFeedbackType] = useState<'bug' | 'suggestion' | 'other'>('suggestion')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [contact, setContact] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleBack = () => {
    Taro.navigateBack()
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      Taro.showToast({
        title: '请填写反馈标题',
        icon: 'none'
      })
      return
    }

    if (!content.trim()) {
      Taro.showToast({
        title: '请填写反馈内容',
        icon: 'none'
      })
      return
    }

    setSubmitting(true)

    try {
      // 这里可以集成实际的反馈提交接口
      // 目前先模拟提交过程
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 生成反馈邮件内容
      const emailContent = `反馈类型：${getFeedbackTypeText(feedbackType)}\n标题：${title}\n内容：${content}\n联系方式：${contact || '未提供'}`
      
      // 复制到剪贴板
      await Taro.setClipboardData({
        data: emailContent
      })

      Taro.showModal({
        title: '反馈已记录 📝',
        content: '感谢您的宝贵意见！反馈内容已复制到剪贴板，您也可以直接发送邮件到 feedback@cdc.edu.cn\n\n我们会认真对待每一条反馈，持续改进产品体验。',
        showCancel: false,
        confirmText: '知道了',
        confirmColor: '#8B5CF6',
        success: () => {
          // 清空表单
          setTitle('')
          setContent('')
          setContact('')
          setFeedbackType('suggestion')
        }
      })
    } catch (error) {
      console.error('提交反馈失败:', error)
      Taro.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getFeedbackTypeText = (type: string) => {
    switch (type) {
      case 'bug': return '问题反馈'
      case 'suggestion': return '功能建议'
      case 'other': return '其他'
      default: return '其他'
    }
  }

  return (
    <View className="feedback-page">
      {/* 头部 */}
      <View className="feedback-header">
        <Button className="back-btn" onClick={handleBack}>
          <Text>←</Text>
        </Button>
        <Text className="page-title">意见反馈</Text>
      </View>

      {/* 反馈说明 */}
      <View className="feedback-intro">
        <Text className="intro-title">💬 畅所欲言</Text>
        <Text className="intro-desc">
          您的每一条反馈都是我们前进的动力。无论是发现的问题、功能建议，还是使用感受，我们都会认真对待并持续改进。
        </Text>
      </View>

      {/* 反馈表单 */}
      <View className="feedback-form">
        {/* 反馈类型 */}
        <View className="form-section">
          <Text className="form-label">反馈类型</Text>
          <View className="type-selector">
            {[
              { key: 'suggestion', label: '功能建议', icon: '💡' },
              { key: 'bug', label: '问题反馈', icon: '🐛' },
              { key: 'other', label: '其他', icon: '💭' }
            ].map(type => (
              <Button
                key={type.key}
                className={`type-btn ${feedbackType === type.key ? 'active' : ''}`}
                onClick={() => setFeedbackType(type.key as any)}
              >
                <Text className="type-icon">{type.icon}</Text>
                <Text className="type-label">{type.label}</Text>
              </Button>
            ))}
          </View>
        </View>

        {/* 反馈标题 */}
        <View className="form-section">
          <Text className="form-label">反馈标题</Text>
          <Input
            className="form-input"
            placeholder="简要描述您的反馈..."
            value={title}
            onInput={(e) => setTitle(e.detail.value)}
            maxlength={50}
          />
          <Text className="char-count">{title.length}/50</Text>
        </View>

        {/* 反馈内容 */}
        <View className="form-section">
          <Text className="form-label">详细描述</Text>
          <Textarea
            className="form-textarea"
            placeholder="请详细描述您的问题或建议，包括具体的使用场景、期望的功能等..."
            value={content}
            onInput={(e) => setContent(e.detail.value)}
            maxlength={500}
            autoHeight
          />
          <Text className="char-count">{content.length}/500</Text>
        </View>

        {/* 联系方式 */}
        <View className="form-section">
          <Text className="form-label">联系方式 (可选)</Text>
          <Input
            className="form-input"
            placeholder="微信号、邮箱等，方便我们与您沟通"
            value={contact}
            onInput={(e) => setContact(e.detail.value)}
            maxlength={50}
          />
          <Text className="form-note">我们承诺不会泄露您的联系方式</Text>
        </View>

        {/* 提交按钮 */}
        <Button
          className={`submit-btn ${submitting ? 'submitting' : ''}`}
          onClick={handleSubmit}
          disabled={submitting}
        >
          <Text>{submitting ? '提交中...' : '提交反馈'}</Text>
        </Button>
      </View>

      {/* 其他反馈方式 */}
      <View className="other-contact">
        <Text className="contact-title">其他联系方式</Text>
        <View className="contact-methods">
          <View className="contact-method">
            <Text className="method-icon">📧</Text>
            <Text className="method-text">邮箱：feedback@cdc.edu.cn</Text>
          </View>
          <View className="contact-method">
            <Text className="method-icon">💬</Text>
            <Text className="method-text">微信群：扫码加入用户交流群</Text>
          </View>
        </View>
      </View>
    </View>
  )
}