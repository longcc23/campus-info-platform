/**
 * 关于页面
 */

import { View, Text, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import logoImg from '../../assets/images/logo.jpg'
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
      </View>

      {/* 应用信息 */}
      <View className="app-info">
        <View className="app-logo-container">
          <Image 
            src={logoImg} 
            mode="aspectFit" 
            className="app-logo-img"
          />
        </View>
        <Text className="app-version">版本 1.1.2</Text>
        <Text className="app-slogan">让校园信息不再流失，让每一个机会触手可及</Text>
      </View>

      {/* 项目介绍 */}
      <View className="content-section">
        <Text className="section-title">项目简介</Text>
        <View className="section-content">
          <Text className="description">
            UniFlow 是一台对抗校园信息熵增的 AI 引擎。
          </Text>
          <Text className="description">
            我们利用多模态技术，将散落在群聊、海报中的碎片，重塑为结构化、多语言的数据资产。我们坚持 "做工具而非平台" —— 随手存、随手查、不打扰。在这里，我们帮你过滤噪音，打破语言壁垒，只为将每一次偶然的"看见"，转化为你日历中确定的"未来"。
          </Text>
        </View>
      </View>

      {/* 功能特色 */}
      <View className="content-section">
        <Text className="section-title">功能特色</Text>
        <View className="feature-list">
          <View className="feature-item">
            <Text className="feature-text">AI 多模态精炼：支持多种输入，精准提取要素</Text>
          </View>
          <View className="feature-item">
            <Text className="feature-text">原生双语视野：中英实时对照，信息无界共享</Text>
          </View>
          <View className="feature-item">
            <Text className="feature-text">一键行动闭环：接入系统日历，锁定未来行程</Text>
          </View>
          <View className="feature-item">
            <Text className="feature-text">动态时效清洗：自动隐藏过期，只看有效机会</Text>
          </View>
        </View>
      </View>

      {/* 联系我们 */}
      <View className="content-section">
        <Text className="section-title">联系我们</Text>
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