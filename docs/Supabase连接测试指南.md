# 🧪 Supabase 连接测试指南

## 📋 测试前准备

### 1. 确保域名已配置

在微信公众平台已添加：
```
https://civlywqsdzzrvsutlrxx.supabase.co
```

### 2. 开发者工具设置

1. 打开微信开发者工具
2. 点击右上角 **"详情"**
3. 在 **"本地设置"** 中：
   - ✅ 勾选 **"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"**
   - 这样可以在开发环境跳过域名校验进行测试

---

## 🚀 测试步骤

### 方法一：使用测试按钮（推荐）

1. **运行项目**
   ```bash
   npm run dev:weapp
   ```

2. **在开发者工具中打开项目**
   - 项目路径：`dist` 目录

3. **点击测试按钮**
   - 在首页顶部，点击 **"测试连接"** 按钮（➕图标旁边）
   - 或者点击页面上的 **"测试 Supabase"** 按钮

4. **查看结果**
   - 成功：控制台显示 `✅ Supabase 连接成功！` 和数据
   - 失败：控制台显示错误信息

### 方法二：在控制台手动测试

1. **打开控制台**
   - 在开发者工具中，点击 **"调试器"** 标签
   - 切换到 **"Console"** 面板

2. **输入测试代码**
   ```javascript
   // 在控制台输入以下代码
   import { getEvents } from '@/utils/supabase'
   
   // 测试获取数据
   getEvents().then(events => {
     console.log('✅ 连接成功！', events)
   }).catch(error => {
     console.error('❌ 连接失败：', error)
   })
   ```

---

## 🔍 查看测试结果

### 1. 控制台输出

**成功示例：**
```
✅ Supabase 连接成功！
[
  {
    id: 1,
    title: "Google Office Tour & 2026 暑期实习预热",
    type: "activity",
    ...
  },
  ...
]
```

**失败示例：**
```
❌ Supabase 连接失败：Error: request:fail url not in domain list
```

### 2. Network 面板

1. 点击 **"调试器"** → **"Network"** 标签
2. 刷新页面或触发测试
3. 查找对 `civlywqsdzzrvsutlrxx.supabase.co` 的请求
4. 查看请求状态：
   - ✅ **200 OK** - 请求成功
   - ❌ **其他状态码** - 查看错误详情

### 3. 页面显示

如果测试成功，页面会显示：
- 数据加载成功提示
- 从数据库获取的活动列表

---

## 🐛 常见错误及解决方案

### 错误 1：`url not in domain list`

**原因：** 域名未配置或配置错误

**解决方案：**
1. 检查微信公众平台是否已添加域名
2. 确认域名格式正确（无末尾分号）
3. 等待几分钟让配置生效
4. 在开发者工具中勾选"不校验合法域名"（仅开发环境）

### 错误 2：`Network Error` 或 `request:fail`

**原因：** 网络连接问题或 Supabase 服务不可用

**解决方案：**
1. 检查网络连接
2. 确认 Supabase 项目状态正常
3. 检查 Supabase URL 和 Key 是否正确

### 错误 3：`401 Unauthorized` 或 `403 Forbidden`

**原因：** API Key 错误或 RLS 策略限制

**解决方案：**
1. 检查 `src/utils/supabase.ts` 中的 API Key 是否正确
2. 确认数据库 RLS 策略允许 public 角色 SELECT

### 错误 4：`404 Not Found`

**原因：** 表名错误或表不存在

**解决方案：**
1. 确认数据库表名是 `events`（小写）
2. 在 Supabase Dashboard 中检查表是否存在
3. 确认已执行 `supabase_schema.sql` 创建表

---

## ✅ 测试检查清单

- [ ] 域名已在微信公众平台配置
- [ ] 开发者工具中勾选了"不校验合法域名"
- [ ] Supabase URL 和 Key 配置正确
- [ ] 数据库表已创建（执行了 SQL）
- [ ] 表中有测试数据
- [ ] 控制台无错误信息
- [ ] Network 面板显示请求成功（200）
- [ ] 页面能正常显示数据

---

## 📊 测试数据验证

测试成功后，应该能看到：

1. **控制台输出**
   - 3 条测试数据（Google Tour、BootCamp、实践活动）

2. **数据结构**
   ```json
   {
     "id": 1,
     "title": "Google Office Tour & 2026 暑期实习预热",
     "type": "activity",
     "source_group": "CDC 官方通知群 1群",
     "key_info": {
       "date": "12月4日 (周三)",
       "time": "14:00 - 16:00",
       "location": "Google Beijing Office",
       "deadline": "名额有限，先到先得"
     },
     ...
   }
   ```

3. **页面显示**
   - 活动列表正常显示
   - 可以点击查看详情
   - 筛选功能正常

---

## 🎯 下一步

测试成功后：

1. ✅ 移除测试按钮（如果添加了）
2. ✅ 将 Mock 数据替换为真实数据
3. ✅ 实现数据加载状态和错误处理
4. ✅ 优化用户体验

---

按照以上步骤操作，应该可以成功测试 Supabase 连接！🎉

