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
          <Text className="logo-text">CDC</Text>
        </View>
        <Text className="app-name">CDC智汇中心</Text>
        <Text className="app-version">版本 1.0.0</Text>
        <Text className="app-slogan">连接机会，成就未来</Text>
      </View>

      {/* 项目介绍 */}
      <View className="content-section">
        <Text className="section-title">📖 项目简介</Text>
        <View className="section-content">
          <Text className="description">
            CDC智汇中心是一个专为学生打造的信息聚合平台，致力于整合各类实习招聘、讲座活动等有价值的机会信息。
          </Text>
          <Text className="description">
            我们的目标是让每一个有价值的机会都能被需要的人看到，帮助同学们不错过任何成长和发展的机会。
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
              <Text className="contact-value">CDC开发小组</Text>
            </View>
          </View>
          <View className="contact-item">
            <Text className="contact-label">技术支持</Text>
            <View className="contact-value-row">
              <Text className="contact-value">support@cdc.edu.cn</Text>
              <Button 
                className="copy-btn"
                onClick={() => handleCopyContact('support@cdc.edu.cn')}
              >
                <Text>复制</Text>
              </Button>
            </View>
          </View>
          <View className="contact-item">
            <Text className="contact-label">意见反馈</Text>
            <View className="contact-value-row">
              <Text className="contact-value">feedback@cdc.edu.cn</Text>
              <Button 
                className="copy-btn"
                onClick={() => handleCopyContact('feedback@cdc.edu.cn')}
              >
                <Text>复制</Text>
              </Button>
            </View>
          </View>
        </View>
      </View>

      {/* 版权信息 */}
      <View className="footer">
        <Text className="copyright">© 2024 CDC智汇中心</Text>
        <Text className="copyright">用心连接每一个机会</Text>
      </View>
    </View>
  )
}