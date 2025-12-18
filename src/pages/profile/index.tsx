import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import authService from '../../services/auth'
import favoritesService from '../../services/favorites'
import { withAuthGuard } from '../../utils/auth-guard'
import './index.scss'

export default function Profile() {
  const [userId, setUserId] = useState<string>('')
  const [nickname, setNickname] = useState<string>('UniFlow 用户')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserInfo()
  }, [])

  useDidShow(() => {
    if (userId) {
      loadFavoritesCount()
      refreshUserProfile()
    }
  })

  const loadUserInfo = async () => {
    try {
      const openid = await authService.getOpenID()
      setUserId(openid)
      
      // 加载个人资料
      const profile = await authService.getUserProfile()
      if (profile) {
        setNickname(profile.nickname || 'UniFlow 用户')
        setAvatarUrl(profile.avatar_url || '')
      }
      
      setLoading(false)
      loadFavoritesCount()
    } catch (error) {
      console.error('加载用户信息失败:', error)
      setLoading(false)
    }
  }

  const refreshUserProfile = async () => {
    const profile = await authService.getUserProfile()
    if (profile) {
      setNickname(profile.nickname || 'UniFlow 用户')
      setAvatarUrl(profile.avatar_url || '')
    }
  }

  const loadFavoritesCount = async () => {
    try {
      const favorites = await favoritesService.getFavorites()
      setFavoritesCount(favorites.length)
    } catch (error) {
      console.error('加载收藏数量失败:', error)
    }
  }

  const navigateTo = (url: string) => {
    // 🚀 对于收藏和历史记录，增加登录守卫
    if (url.includes('favorites') || url.includes('history')) {
      const actionName = url.includes('favorites') ? '我的收藏' : '浏览历史'
      withAuthGuard(actionName, () => {
        Taro.navigateTo({ url })
      })
    } else {
      Taro.navigateTo({ url })
    }
  }

  if (loading) {
    return (
      <View className="profile-container loading">
        <View className="loading-spinner"></View>
        <Text className="loading-text">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="profile-container">
      {/* 1. 沉浸式紫色渐变头部 */}
      <View className="header-bg">
        <View className="blur-circle circle-1"></View>
        <View className="blur-circle circle-2"></View>
        
        <View className="user-info" onClick={() => navigateTo('/pages/profile-edit/index')}>
          <View className="avatar-box">
            <Image 
              src={avatarUrl || require('../../assets/images/IMG_9253.jpg')} 
              className="user-avatar" 
              mode="aspectFill" 
            />
          </View>
          <Text className="user-name">{nickname}</Text>
          <View className="user-id-tag">
            <Text>ID: {userId ? `${userId.substring(0, 12)}...` : '未登录'}</Text>
          </View>
        </View>
      </View>

      {/* 2. 悬浮内容区 */}
      <View className="content-wrapper">
        {/* A. 核心功能卡片 (网格布局) */}
        <View className="grid-box">
          <View className="big-card" onClick={() => navigateTo('/pages/favorites/index')}>
            <View className="icon-circle bg-pink">
              <View className="icon-heart"></View>
            </View>
            <View className="text-group">
              <Text className="card-title">我的收藏</Text>
              <Text className="card-subtitle">FAVORITES</Text>
            </View>
            <View className="status-tag">
              {favoritesCount > 0 ? `${favoritesCount} 个收藏` : '点击查看'}
            </View>
          </View>

          <View className="big-card" onClick={() => navigateTo('/pages/history/index')}>
            <View className="icon-circle bg-indigo">
              <View className="icon-clock"></View>
            </View>
            <View className="text-group">
              <Text className="card-title">最近浏览</Text>
              <Text className="card-subtitle">HISTORY</Text>
            </View>
            <View className="status-tag">近期足迹</View>
          </View>
        </View>

        {/* B. 列表功能区 */}
        <View className="list-card">
          <View className="list-item" onClick={() => navigateTo('/pages/feedback/index')}>
            <View className="item-left">
              <View className="icon-square bg-emerald">
                <View className="icon-message"></View>
              </View>
              <View className="text-col">
                <View className="title-row">
                  <Text className="item-title">意见反馈</Text>
                  <Text className="item-en-title">FEEDBACK</Text>
                </View>
              </View>
            </View>
            <View className="arrow-right"></View>
          </View>

          <View className="divider"></View>

          <View className="list-item" onClick={() => navigateTo('/pages/about/index')}>
            <View className="item-left">
              <View className="icon-square bg-blue">
                <View className="icon-info"></View>
              </View>
              <View className="text-col">
                <View className="title-row">
                  <Text className="item-title">关于我们</Text>
                  <Text className="item-en-title">ABOUT US</Text>
                </View>
              </View>
            </View>
            <View className="arrow-right"></View>
          </View>
        </View>
      </View>

      {/* 3. 页脚 */}
      <View className="footer">
        <Text className="footer-text">UniFlow Design</Text>
        <Text className="footer-sub">V 1.1.1 PREMIUM</Text>
      </View>
    </View>
  )
}
