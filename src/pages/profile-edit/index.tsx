import { View, Text, Button, Image, Input } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import authService from '../../services/auth'
import './index.scss'

export default function ProfileEdit() {
  const [nickname, setNickname] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useLoad(async () => {
    Taro.showLoading({ title: '加载中...' })
    const profile = await authService.getUserProfile()
    if (profile) {
      setNickname(profile.nickname || '')
      setAvatarUrl(profile.avatar_url || '')
    }
    Taro.hideLoading()
  })

  const onChooseAvatar = (e) => {
    const { avatarUrl: newAvatarUrl } = e.detail
    setAvatarUrl(newAvatarUrl)
  }

  const handleNicknameChange = (e) => {
    setNickname(e.detail.value)
  }

  const handleSave = async () => {
    if (!nickname.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    setSubmitting(true)
    Taro.showLoading({ title: '保存中...' })

    try {
      // 注意：微信返回的 avatarUrl 是临时路径
      // 在实际生产中，应该先通过 Taro.uploadFile 上传到 Supabase Storage
      // 这里为了演示流程，先直接保存（临时路径在真机上有效期较短）
      const success = await authService.updateUserProfile({
        nickname: nickname.trim(),
        avatar_url: avatarUrl
      })

      if (success) {
        Taro.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        throw new Error('Update failed')
      }
    } catch (error) {
      console.error('保存失败:', error)
      Taro.showToast({ title: '保存失败，请重试', icon: 'none' })
    } finally {
      setSubmitting(false)
      Taro.hideLoading()
    }
  }

  return (
    <View className="profile-edit-container">
      <View className="header">
        <View className="back-btn" onClick={() => Taro.navigateBack()}>
          <Text className="icon">←</Text>
        </View>
        <Text className="title">个人资料</Text>
      </View>

      <View className="edit-form">
        <View className="section avatar-section">
          <Button 
            className="avatar-wrapper" 
            openType="chooseAvatar" 
            onChooseAvatar={onChooseAvatar}
          >
            {avatarUrl ? (
              <Image className="avatar" src={avatarUrl} mode="aspectFill" />
            ) : (
              <View className="avatar-placeholder">
                <View className="plus-icon">+</View>
              </View>
            )}
            <View className="edit-badge">
              <View className="icon-camera" />
            </View>
          </Button>
          <Text className="hint">点击更换头像</Text>
        </View>

        <View className="section info-section">
          <View className="form-item">
            <Text className="label">昵称</Text>
            <Input
              type="nickname"
              className="input"
              value={nickname}
              placeholder="请输入昵称"
              onInput={handleNicknameChange}
              onBlur={handleNicknameChange}
            />
          </View>
        </View>

        <Button 
          className={`save-btn ${submitting ? 'disabled' : ''}`}
          onClick={handleSave}
          disabled={submitting}
        >
          保存设置
        </Button>
      </View>
    </View>
  )
}

