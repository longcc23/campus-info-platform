# 🚀 Supabase 集成指南 - Taro 小程序

## ✅ 已完成的工作

### 1. 安装依赖

```bash
npm install @supabase/supabase-js
```

✅ 已安装完成

### 2. 创建 Supabase 工具文件

📁 文件位置：`src/utils/supabase.ts`

**主要功能：**
- ✅ 自动应用 fetch polyfill（使用 Taro.request）
- ✅ 自动应用 URL 和 Headers polyfill
- ✅ 配置 Supabase 客户端
- ✅ 提供类型定义和便捷方法

**包含的方法：**
- `getEvents()` - 获取所有活动（支持筛选）
- `getEventById()` - 根据 ID 获取单个活动
- `createEvent()` - 创建新活动（需要认证）
- `updateEvent()` - 更新活动（需要认证）

### 3. 域名配置说明

📁 详细说明：`微信小程序域名配置说明.md`

**需要配置的域名：**
```
https://civlywqsdzzrvsutlrxx.supabase.co
```

---

## 📝 使用步骤

### 第一步：配置微信小程序域名

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入 **开发** → **开发管理** → **开发设置**
3. 在 **request 合法域名** 中添加：
   ```
   https://civlywqsdzzrvsutlrxx.supabase.co
   ```
4. 点击 **保存**

**开发环境快速测试：**
- 在微信开发者工具中，勾选 **"不校验合法域名"**（仅开发环境）

### 第二步：在代码中使用

```typescript
import { getEvents, getEventById, type Event } from '@/utils/supabase'

// 获取所有活动
const events = await getEvents()

// 按类型筛选
const recruitEvents = await getEvents({ type: 'recruit' })

// 获取单个活动
const event = await getEventById(1)
```

### 第三步：在组件中集成

参考示例文件：`src/utils/supabase使用示例.tsx`

```tsx
import { useEffect, useState } from 'react'
import { getEvents, type Event } from '@/utils/supabase'

export default function MyComponent() {
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    const data = await getEvents()
    setEvents(data)
  }

  return (
    // 你的 UI 代码
  )
}
```

---

## 🔧 技术实现说明

### Polyfill 机制

小程序环境不支持标准的 `fetch` API，因此我们实现了以下 polyfill：

1. **fetch polyfill**
   - 使用 `Taro.request` 实现
   - 自动转换请求和响应格式
   - 兼容 Supabase SDK 的调用方式

2. **URL polyfill**
   - 实现基本的 URL 解析功能
   - 支持 Supabase SDK 的 URL 处理

3. **Headers polyfill**
   - 实现 Headers 类的基本功能
   - 支持 header 的增删改查

### 配置说明

Supabase 客户端配置：
- `persistSession: false` - 小程序不持久化 session
- `autoRefreshToken: false` - 不自动刷新 token
- `detectSessionInUrl: false` - 不检测 URL 中的 session

---

## 🧪 测试连接

在 `src/pages/index/index.tsx` 中添加测试代码：

```typescript
import { getEvents } from '@/utils/supabase'

// 在组件中测试
useEffect(() => {
  const testConnection = async () => {
    try {
      const events = await getEvents()
      console.log('✅ Supabase 连接成功！', events)
    } catch (error) {
      console.error('❌ Supabase 连接失败：', error)
    }
  }
  testConnection()
}, [])
```

---

## ⚠️ 注意事项

### 1. 域名配置

- ✅ **必须配置**：在微信公众平台添加 Supabase 域名
- ✅ **开发环境**：可以勾选"不校验合法域名"进行测试
- ❌ **生产环境**：必须配置合法域名，否则无法请求

### 2. RLS 策略

当前数据库配置：
- ✅ 允许所有用户（public）进行 SELECT 操作
- ❌ INSERT/UPDATE/DELETE 需要认证（如需使用，需要配置认证策略）

### 3. 错误处理

建议在所有 API 调用中添加错误处理：

```typescript
try {
  const events = await getEvents()
  // 处理数据
} catch (error) {
  // 显示错误提示
  Taro.showToast({
    title: '加载失败',
    icon: 'none'
  })
}
```

---

## 📚 相关文件

- `src/utils/supabase.ts` - Supabase 客户端和工具方法
- `src/utils/supabase使用示例.tsx` - 使用示例代码
- `微信小程序域名配置说明.md` - 详细的域名配置步骤
- `supabase_schema.sql` - 数据库表结构

---

## 🎯 下一步

1. ✅ 配置微信小程序域名
2. ✅ 在代码中导入并使用 `getEvents()`
3. ✅ 替换现有的 Mock 数据为真实数据
4. ✅ 测试数据加载和显示

---

配置完成后，你的小程序就可以从 Supabase 数据库获取真实数据了！🎉

