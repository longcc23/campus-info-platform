/**
 * 个人中心页面 - 现代简约设计
 */

import { View, Text, Button } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import authService from '../../services/auth'
import favoritesService from '../../services/favorites'
import './index.scss'

export default function Profile() {
  const [userId, setUserId] = useState<string | null>(null)
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [historyCount, setHistoryCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserInfo()
    updateTabBar()
  }, [])

  // 每次页面显示时刷新数据
  useDidShow(() => {
    loadFavoritesCount()
    updateTabBar()
  })

  const updateTabBar = () => {
    try {
      const page = Taro.getCurrentInstance()?.page
      if (page && typeof (page as any).getTabBar === 'function') {
        const tabBar = (page as any).getTabBar()
        if (tabBar && typeof tabBar.setSelected === 'function') {
          tabBar.setSelected(1)
        }
      }
    } catch (error) {
      console.error('更新 TabBar 状态失败:', error)
    }
  }

  const loadUserInfo = async () => {
    try {
      const openid = await authService.getOpenID()
      setUserId(openid)
      setLoading(false)
      await loadFavoritesCount()
    } catch (error) {
      console.error('加载用户信息失败:', error)
      setLoading(false)
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

  const handleNavigateToFavorites = () => {
    Taro.navigateTo({ url: '/pages/favorites/index' })
  }

  const handleNavigateToHistory = () => {
    Taro.navigateTo({ url: '/pages/history/index' })
  }

  const handleNavigateToAbout = () => {
    Taro.navigateTo({ url: '/pages/about/index' })
  }

  const handleNavigateToFeedback = () => {
    Taro.navigateTo({ url: '/pages/feedback/index' })
  }

  if (loading) {
    return (
      <View className="profile-page loading">
        <View className="loading-spinner"></View>
        <Text className="loading-text">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="profile-page">
      {/* 顶部渐变背景 */}
      <View className="profile-bg"></View>
      
      {/* 用户卡片 */}
      <View className="user-card">
        <View className="avatar-wrapper">
          <View className="avatar">
            <Text className="avatar-emoji">👤</Text>
          </View>
          <View className="avatar-ring"></View>
        </View>
        <View className="user-info">
          <Text className="greeting">Hi, 欢迎回来 👋</Text>
          <Text className="username">UniFlow 用户</Text>
          <View className="user-id-tag">
            <Text className="user-id">ID: {userId?.substring(0, 12)}...</Text>
          </View>
        </View>
      </View>

      {/* 功能入口 */}
      <View className="section">
        <View className="menu-grid">
          <Button className="menu-card" onClick={handleNavigateToFavorites}>
            <View className="menu-card-icon favorites">
              <View className="custom-icon favorites"></View>
            </View>
            <View className="menu-card-info">
              <Text className="menu-card-title">我的收藏</Text>
              <Text className="menu-card-subtitle">My Favorites</Text>
            </View>
            {favoritesCount > 0 && (
              <View className="menu-card-badge">
                <Text className="badge-text">{favoritesCount}</Text>
              </View>
            )}
          </Button>

          <Button className="menu-card" onClick={handleNavigateToHistory}>
            <View className="menu-card-icon history">
              <View className="custom-icon history"></View>
            </View>
            <View className="menu-card-info">
              <Text className="menu-card-title">浏览历史</Text>
              <Text className="menu-card-subtitle">History</Text>
            </View>
          </Button>

          <Button className="menu-card" onClick={handleNavigateToFeedback}>
            <View className="menu-card-icon feedback">
              <View className="custom-icon feedback"></View>
            </View>
            <View className="menu-card-info">
              <Text className="menu-card-title">意见反馈</Text>
              <Text className="menu-card-subtitle">Feedback</Text>
            </View>
          </Button>

          <Button className="menu-card" onClick={handleNavigateToAbout}>
            <View className="menu-card-icon about">
              <View className="custom-icon about"></View>
            </View>
            <View className="menu-card-info">
              <Text className="menu-card-title">关于我们</Text>
              <Text className="menu-card-subtitle">About Us</Text>
            </View>
          </Button>
        </View>
      </View>

      {/* 底部信息 */}
      <View className="footer">
        <Text className="footer-text">UniFlow - 智汇流</Text>
        <Text className="footer-slogan">让信息触手可及</Text>
      </View>
    </View>
  )
}
