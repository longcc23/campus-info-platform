# AuthService 使用指南

## 📋 概述

AuthService 是 CDC 智汇中心的用户认证服务，负责处理微信用户身份识别和用户记录管理。

## 🎯 核心功能

- ✅ 自动获取微信 OpenID（无感登录）
- ✅ 本地缓存 OpenID，避免重复登录
- ✅ 自动创建/更新用户记录
- ✅ 统一的错误处理

## 📦 导入

```typescript
import authService from '@/services/auth'
// 或
import { authService, AuthError, NetworkError } from '@/services/auth'
```

## 🚀 基础使用

### 1. 获取用户 OpenID

```typescript
try {
  const openid = await authService.getOpenID()
  console.log('用户 OpenID:', openid)
} catch (error) {
  if (error instanceof AuthError) {
    // 认证失败
    Taro.showToast({
      title: '登录失败，请重试',
      icon: 'none'
    })
  }
}
```

### 2. 检查认证状态

```typescript
if (authService.isAuthenticated()) {
  console.log('用户已登录')
  const openid = authService.getCurrentOpenID()
} else {
  console.log('用户未登录')
}
```

### 3. 清除认证信息（登出）

```typescript
authService.clearAuth()
Taro.showToast({
  title: '已退出登录',
  icon: 'success'
})
```

## 💡 实际应用场景

### 场景 1: 页面加载时自动登录

```typescript
// src/pages/index/index.tsx
import { useEffect, useState } from 'react'
import authService from '@/services/auth'

export default function Index() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function initAuth() {
      try {
        const openid = await authService.getOpenID()
        setUserId(openid)
      } catch (error) {
        console.error('认证失败:', error)
      } finally {
        setLoading(false)
      }
    }
    
    initAuth()
  }, [])

  if (loading) {
    return <View>加载中...</View>
  }

  return (
    <View>
      <Text>用户 ID: {userId}</Text>
    </View>
  )
}
```

### 场景 2: 收藏功能中使用

```typescript
// src/components/FavoriteButton/index.tsx
import { useState } from 'react'
import authService from '@/services/auth'
import { addFavorite } from '@/utils/supabase-rest'

export default function FavoriteButton({ eventId }) {
  const [loading, setLoading] = useState(false)

  const handleFavorite = async () => {
    setLoading(true)
    try {
      // 获取用户 ID
      const userId = await authService.getOpenID()
      
      // 添加收藏
      const { error } = await addFavorite(userId, eventId)
      
      if (error) {
        throw new Error(error.message)
      }
      
      Taro.showToast({
        title: '已收藏',
        icon: 'success'
      })
    } catch (error) {
      Taro.showToast({
        title: '收藏失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleFavorite} disabled={loading}>
      {loading ? '处理中...' : '收藏'}
    </Button>
  )
}
```

### 场景 3: 带重试的错误处理

```typescript
import authService, { AuthError, NetworkError } from '@/services/auth'

async function getUserIdWithRetry(maxRetries = 1): Promise<string> {
  let lastError: Error | null = null
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await authService.getOpenID()
    } catch (error) {
      lastError = error as Error
      
      if (error instanceof NetworkError && error.isTimeout && i < maxRetries) {
        // 网络超时，重试
        console.log(`网络超时，重试 ${i + 1}/${maxRetries}`)
        continue
      }
      
      // 其他错误或重试次数用尽，抛出
      break
    }
  }
  
  throw lastError
}

// 使用
try {
  const userId = await getUserIdWithRetry()
  console.log('用户 ID:', userId)
} catch (error) {
  if (error instanceof AuthError) {
    Taro.showToast({ title: '请先登录', icon: 'none' })
  } else if (error instanceof NetworkError) {
    Taro.showToast({ title: '网络连接失败', icon: 'none' })
  }
}
```

## 🔧 API 参考

### authService.getOpenID()

获取当前用户的 OpenID，如果未登录则自动调用微信登录。

**返回**: `Promise<string>` - 用户的 OpenID

**抛出**:
- `AuthError` - 认证失败
- `NetworkError` - 网络请求失败

**示例**:
```typescript
const openid = await authService.getOpenID()
```

### authService.isAuthenticated()

检查用户是否已认证（是否有缓存的 OpenID）。

**返回**: `boolean` - 是否已认证

**示例**:
```typescript
if (authService.isAuthenticated()) {
  // 用户已登录
}
```

### authService.getCurrentOpenID()

获取当前缓存的 OpenID，不触发登录流程。

**返回**: `string | null` - 当前的 OpenID，未登录返回 null

**示例**:
```typescript
const openid = authService.getCurrentOpenID()
if (openid) {
  console.log('当前用户:', openid)
}
```

### authService.clearAuth()

清除认证信息（登出）。

**返回**: `void`

**示例**:
```typescript
authService.clearAuth()
```

### authService.ensureUser(openid)

确保用户记录存在于数据库中，如果不存在则创建，如果存在则更新 last_seen。

**参数**:
- `openid: string` - 用户的 OpenID

**返回**: `Promise<void>`

**抛出**:
- `NetworkError` - 网络请求失败

**注意**: 通常不需要手动调用，`getOpenID()` 会自动调用此方法。

## ⚠️ 注意事项

### 1. 临时 OpenID 方案

当前实现使用临时方案生成 OpenID（基于微信 login code 的 hash）。

**生产环境必须**:
1. 搭建后端服务
2. 将 code 发送到后端
3. 后端调用微信 API 换取真实 OpenID
4. 返回 OpenID 给前端

**后端接口示例**:
```typescript
// 前端
const loginRes = await Taro.login()
const response = await Taro.request({
  url: 'https://your-backend.com/api/wechat/login',
  method: 'POST',
  data: { code: loginRes.code }
})
const { openid } = response.data
```

### 2. 错误处理

始终使用 try-catch 包裹 `getOpenID()` 调用：

```typescript
try {
  const openid = await authService.getOpenID()
  // 使用 openid
} catch (error) {
  // 处理错误
}
```

### 3. 性能优化

- OpenID 会自动缓存到本地存储
- 多次调用 `getOpenID()` 不会重复请求
- 首次调用后，后续调用直接返回缓存值

### 4. 隐私保护

- OpenID 仅存储在本地，不会上传到第三方
- 用户可以通过 `clearAuth()` 清除本地数据
- 符合微信小程序隐私规范

## 🐛 故障排查

### 问题 1: 获取 OpenID 失败

**错误**: `AuthError: 微信登录失败：未获取到 code`

**原因**: 微信登录接口调用失败

**解决**:
1. 检查小程序 AppID 配置
2. 检查网络连接
3. 在微信开发者工具中测试

### 问题 2: 用户记录创建失败

**错误**: `NetworkError: 用户记录操作失败`

**原因**: Supabase 数据库连接失败或 RLS 策略问题

**解决**:
1. 检查 Supabase URL 和 API Key 配置
2. 确认 users 表已创建
3. 确认 RLS 策略已正确配置
4. 检查网络连接

### 问题 3: 本地存储失败

**错误**: 无法保存 OpenID 到本地

**原因**: 小程序存储空间不足或权限问题

**解决**:
1. 清理小程序缓存
2. 检查存储权限
3. 使用 `Taro.getStorageInfo()` 查看存储使用情况

## 📚 相关文档

- [微信小程序登录文档](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.login.html)
- [Supabase RLS 文档](https://supabase.com/docs/guides/auth/row-level-security)
- [收藏功能设计文档](../.kiro/specs/favorites-feature/design.md)
