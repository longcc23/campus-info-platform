/**
 * 个人中心页面
 */

import { View, Text, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import authService from '../../services/auth'
import favoritesService from '../../services/favorites'
import './index.scss'

export default function Profile() {
  const [userId, setUserId] = useState<string | null>(null)
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserInfo()
    updateTabBar()
  }, [])

  const updateTabBar = () => {
    // 更新自定义 TabBar 的选中状态
    try {
      const page = Taro.getCurrentInstance()?.page
      if (page && typeof (page as any).getTabBar === 'function') {
        const tabBar = (page as any).getTabBar()
        if (tabBar && typeof tabBar.setSelected === 'function') {
          tabBar.setSelected(1) // 我的页面的索引是 1
        }
      }
    } catch (error) {
      console.error('更新 TabBar 状态失败:', error)
    }
  }

  const loadUserInfo = async () => {
    try {
      // 获取用户 ID
      const openid = await authService.getOpenID()
      setUserId(openid)

      // 先显示页面，后台加载收藏数量
      setLoading(false)

      // 获取收藏数量（后台加载）
      const favorites = await favoritesService.getFavorites()
      setFavoritesCount(favorites.length)
    } catch (error) {
      console.error('加载用户信息失败:', error)
      setLoading(false)
    }
  }

  const handleNavigateToFavorites = () => {
    Taro.navigateTo({
      url: '/pages/favorites/index'
    })
  }

  const handleNavigateToHistory = () => {
    Taro.navigateTo({
      url: '/pages/history/index'
    })
  }

  const handleNavigateToHome = () => {
    Taro.switchTab({
      url: '/pages/index/index'
    })
  }

  if (loading) {
    return (
      <View className="profile-page loading">
        <Text>加载中...</Text>
      </View>
    )
  }

  return (
    <View className="profile-page">
      {/* 个人信息卡片 */}
      <View className="profile-header">
        <View className="avatar">
          <Text className="avatar-text">U</Text>
        </View>
        <View className="user-info">
          <Text className="username">微信用户</Text>
          <Text className="user-id">ID: {userId?.substring(0, 16)}...</Text>
        </View>
      </View>

      {/* 功能列表 */}
      <View className="menu-section">
        <Text className="section-title">我的内容</Text>
        
        <View className="menu-list">
          <Button className="menu-item" onClick={handleNavigateToFavorites}>
            <View className="menu-icon">❤️</View>
            <View className="menu-content">
              <Text className="menu-title">我的收藏</Text>
              <Text className="menu-desc">查看收藏的活动和招聘</Text>
            </View>
            <View className="menu-arrow">
              <Text>›</Text>
            </View>
          </Button>

          <Button className="menu-item" onClick={handleNavigateToHistory}>
            <View className="menu-icon">🕐</View>
            <View className="menu-content">
              <Text className="menu-title">浏览历史</Text>
              <Text className="menu-desc">最近浏览的内容</Text>
            </View>
            <View className="menu-arrow">
              <Text>›</Text>
            </View>
          </Button>
        </View>
      </View>

      {/* 其他功能 */}
      <View className="menu-section">
        <Text className="section-title">其他</Text>
        
        <View className="menu-list">
          <Button className="menu-item disabled">
            <View className="menu-icon">⚙️</View>
            <View className="menu-content">
              <Text className="menu-title">设置</Text>
              <Text className="menu-desc">偏好设置和隐私</Text>
            </View>
            <View className="menu-arrow">
              <Text>›</Text>
            </View>
          </Button>

          <Button className="menu-item disabled">
            <View className="menu-icon">ℹ️</View>
            <View className="menu-content">
              <Text className="menu-title">关于</Text>
              <Text className="menu-desc">版本信息和帮助</Text>
            </View>
            <View className="menu-arrow">
              <Text>›</Text>
            </View>
          </Button>
        </View>
      </View>
    </View>
  )
}
