/**
 * 意见反馈页面
 */

import { View, Text, Button, Textarea, Input } from '@tarojs/components'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { authService } from '../../services/auth'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config/supabase'
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
      Taro.showToast({ title: '请填写反馈标题', icon: 'none' })
      return
    }

    if (!content.trim()) {
      Taro.showToast({ title: '请填写反馈内容', icon: 'none' })
      return
    }

    setSubmitting(true)

    try {
      const openid = await authService.getOpenID()
      
      // 🚀 直接提交到 Supabase feedbacks 表
      const response = await Taro.request({
        url: `${SUPABASE_URL}/rest/v1/feedbacks`,
        method: 'POST',
        header: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        data: {
          openid,
          type: feedbackType,
          title: title.trim(),
          content: content.trim(),
          contact: contact.trim() || null,
          created_at: new Date().toISOString()
        }
      })

      if (response.statusCode >= 200 && response.statusCode < 300) {
        Taro.showModal({
          title: '反馈提交成功 🚀',
          content: '感谢您的宝贵意见！我们会认真对待每一条反馈，持续改进产品体验。',
          showCancel: false,
          confirmText: '回首页',
          confirmColor: '#8B5CF6',
          success: () => {
            Taro.reLaunch({ url: '/pages/index/index' })
          }
        })
      } else {
        throw new Error('Server responded with status: ' + response.statusCode)
      }
    } catch (error) {
      console.error('提交反馈失败:', error)
      Taro.showToast({
        title: '网络开小差了，请重试',
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
            <Text className="method-icon">🔗</Text>
            <Text className="method-text">GitHub: longcc23/campus-info-platform</Text>
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