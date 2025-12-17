# 🔧 微信小程序域名配置说明

## 📋 配置步骤

### 1. 登录微信公众平台

访问 [微信公众平台](https://mp.weixin.qq.com/)，使用你的小程序账号登录。

### 2. 进入开发设置

在左侧菜单中，点击 **"开发"** → **"开发管理"** → **"开发设置"**

### 3. 配置服务器域名

在 **"服务器域名"** 部分，点击 **"修改"** 按钮。

### 4. 添加 Supabase 域名

在 **"request 合法域名"** 中添加以下域名：

```
https://civlywqsdzzrvsutlrxx.supabase.co
```

**⚠️ 重要提示：**
- ✅ 只添加域名部分，不要包含路径（如 `/rest/v1/`）
- ✅ 必须使用 `https://` 协议
- ✅ 不要添加端口号
- ✅ 不要添加路径或参数
- ❌ **不要添加末尾的分号（;）** - 如果只填写一个域名，不需要分号
- ✅ 如果填写多个域名，用分号分隔，但最后一个域名后不要加分号

**常见错误：**
- ❌ `https://civlywqsdzzrvsutlrxx.supabase.co;` （末尾有分号）
- ✅ `https://civlywqsdzzrvsutlrxx.supabase.co` （正确格式）

### 5. 保存设置

点击 **"保存"** 按钮，配置会在几分钟内生效。

---

## ⚠️ 注意事项

### 域名格式要求

✅ **正确格式：**
```
https://civlywqsdzzrvsutlrxx.supabase.co
```

❌ **错误格式：**
```
https://civlywqsdzzrvsutlrxx.supabase.co/rest/v1/  (包含路径)
civlywqsdzzrvsutlrxx.supabase.co  (缺少协议)
http://civlywqsdzzrvsutlrxx.supabase.co  (使用 http 而非 https)
```

### 校验文件（如果需要）

如果微信要求上传校验文件：

1. 下载微信提供的校验文件
2. 在 Supabase Dashboard 中：
   - 进入 **Storage** → **Public Buckets**
   - 创建或选择一个 bucket
   - 上传校验文件
   - 设置文件为公开访问
3. 在微信公众平台点击 **"校验文件"** 按钮

### 开发环境配置

在 **微信开发者工具** 中：

1. 打开项目
2. 点击右上角 **"详情"**
3. 在 **"本地设置"** 中：
   - ✅ 勾选 **"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"**
   - 这样在开发时可以跳过域名校验

**⚠️ 注意：** 此设置仅用于开发环境，正式发布前必须配置合法域名！

---

## 🔍 验证配置

配置完成后，可以在小程序中测试：

```typescript
import { getEvents } from '@/utils/supabase'

// 测试获取数据
const testConnection = async () => {
  try {
    const events = await getEvents()
    console.log('✅ 连接成功！', events)
  } catch (error) {
    console.error('❌ 连接失败：', error)
  }
}
```

---

## 📝 其他可能需要配置的域名

如果你的小程序还使用了其他服务，也需要在相应的域名列表中添加：

- **uploadFile 合法域名**：如果使用 Supabase Storage 上传文件
- **downloadFile 合法域名**：如果从 Supabase Storage 下载文件
- **socket 合法域名**：如果使用 Supabase Realtime（WebSocket）

---

## 🚀 快速配置清单

- [ ] 登录微信公众平台
- [ ] 进入开发设置
- [ ] 在 request 合法域名中添加：`https://civlywqsdzzrvsutlrxx.supabase.co`
- [ ] 保存配置
- [ ] 在开发者工具中测试连接
- [ ] 确认数据可以正常获取

---

## 💡 常见问题

### Q: 为什么请求失败，提示 "不在以下 request 合法域名列表中"？

A: 检查以下几点：
1. 域名是否已添加到 request 合法域名列表
2. 域名格式是否正确（必须包含 https://）
3. 是否在开发者工具中勾选了"不校验合法域名"（仅开发环境）
4. 配置是否已生效（可能需要等待几分钟）

### Q: 开发环境可以正常请求，但真机调试失败？

A: 真机调试必须配置合法域名，不能使用"不校验合法域名"选项。

### Q: 如何查看当前配置的域名？

A: 在微信公众平台的"开发设置" → "服务器域名"中可以看到所有已配置的域名。

---

配置完成后，你的小程序就可以正常连接 Supabase 数据库了！🎉

