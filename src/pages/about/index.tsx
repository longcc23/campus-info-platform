/**
 * 关于页面
 */

import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

export default function About() {
  const handleBack = () => {
    Taro.navigateBack()
  }

  const handleCopyContact = (contact: string) => {
    Taro.setClipboardData({
      data: contact,
      success: () => {
        // 系统会自动显示"内容已复制"
      }
    })
  }

  return (
    <View className="about-page">
      {/* 头部 */}
      <View className="about-header">
        <Button className="back-btn" onClick={handleBack}>
          <Text>←</Text>
        </Button>
        <Text className="page-title">关于</Text>
      </View>

      {/* 应用信息 */}
      <View className="app-info">
        <View className="app-logo">
          <Text className="logo-text">U</Text>
        </View>
        <Text className="app-name">UniFlow 智汇流</Text>
        <Text className="app-version">版本 1.0.0</Text>
        <Text className="app-slogan">让校园信息不再流失，让每一个机会触手可及</Text>
      </View>

      {/* 项目介绍 */}
      <View className="content-section">
        <Text className="section-title">📖 项目简介</Text>
        <View className="section-content">
          <Text className="description">
            UniFlow (智汇流) 是一个基于 AI 的校园信息智能聚合平台，通过多模态解析技术，自动采集、结构化并展示校园招聘、讲座、活动等信息。
          </Text>
          <Text className="description">
            我们的理念是"做工具而非平台"——随手存、随手查、不打扰。让每一个有价值的机会都能被需要的人看到。
          </Text>
        </View>
      </View>

      {/* 功能特色 */}
      <View className="content-section">
        <Text className="section-title">✨ 功能特色</Text>
        <View className="feature-list">
          <View className="feature-item">
            <Text className="feature-icon">🔍</Text>
            <Text className="feature-text">智能搜索和筛选</Text>
          </View>
          <View className="feature-item">
            <Text className="feature-icon">❤️</Text>
            <Text className="feature-text">收藏感兴趣的机会</Text>
          </View>
          <View className="feature-item">
            <Text className="feature-icon">📅</Text>
            <Text className="feature-text">一键添加到日历</Text>
          </View>
          <View className="feature-item">
            <Text className="feature-icon">🔗</Text>
            <Text className="feature-text">便捷分享给好友</Text>
          </View>
          <View className="feature-item">
            <Text className="feature-icon">🕐</Text>
            <Text className="feature-text">浏览历史记录</Text>
          </View>
          <View className="feature-item">
            <Text className="feature-icon">⚡</Text>
            <Text className="feature-text">过期信息自动筛选</Text>
          </View>
        </View>
      </View>

      {/* 联系我们 */}
      <View className="content-section">
        <Text className="section-title">📞 联系我们</Text>
        <View className="contact-list">
          <View className="contact-item">
            <Text className="contact-label">开发团队</Text>
            <View className="contact-value-row">
              <Text className="contact-value">UniFlow 产品团队</Text>
            </View>
          </View>
          <View className="contact-item">
            <Text className="contact-label">开源地址</Text>
            <View className="contact-value-row">
              <Text className="contact-value">github.com/longcc23/campus-info-platform</Text>
              <Button 
                className="copy-btn"
                onClick={() => handleCopyContact('https://github.com/longcc23/campus-info-platform')}
              >
                <Text>复制</Text>
              </Button>
            </View>
          </View>
        </View>
      </View>

      {/* 版权信息 */}
      <View className="footer">
        <Text className="copyright">© 2025 UniFlow 智汇流</Text>
        <Text className="copyright">让信息流动，让机会触手可及</Text>
      </View>
    </View>
  )
}