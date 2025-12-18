import { View, Text, Button, Image } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import logoImg from '../../assets/images/logo.png'
import './index.scss'

export default function Welcome() {
  useLoad(() => {
    const hasSeenWelcome = Taro.getStorageSync('has_seen_welcome')
    if (hasSeenWelcome) {
      Taro.reLaunch({
        url: '/pages/index/index'
      })
    }
  })

  const handleStart = () => {
    Taro.setStorageSync('has_seen_welcome', true)
    Taro.reLaunch({
      url: '/pages/index/index'
    })
  }

  return (
    <View className="welcome-page">
      {/* 动态背景层 */}
      <View className="mesh-gradient">
        <View className="blob blob-1" />
        <View className="blob blob-2" />
        <View className="blob blob-3" />
      </View>

      <View className="content-container">
        {/* 顶部品牌 */}
        <View className="brand-header">
          <View className="logo-image-wrapper">
            <Image 
              src={logoImg} 
              mode="aspectFit" 
              className="brand-logo"
            />
          </View>
        </View>

        {/* 核心价值叙事 */}
        <View className="narrative-section">
          <View className="narrative-body">
            <Text className="text-p text-line-1">别再让重要的机会</Text>
            <Text className="text-p text-line-2">淹没在成百上千的群聊和海报里</Text>
            <View className="text-divider" />
            <Text className="text-p secondary text-line-3">AI 驱动的信息聚合</Text>
            <Text className="text-p secondary text-line-4">让每一个机会都触手可及</Text>
          </View>
        </View>

        {/* 底部行动按钮 */}
        <View className="action-footer">
          <Button className="enter-button" onClick={handleStart}>
            <Text>开启高效校园生活</Text>
            <View className="button-glow" />
          </Button>
          <View className="slogan-wrapper">
            <Text className="slogan-line">随手记 · 随手查 · 不打扰</Text>
            <Text className="slogan-sub">SAVE · SEARCH · SILENT</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
