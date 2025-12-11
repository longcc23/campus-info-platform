# 🔧 API 错误排查指南

## 常见错误：`Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

这个错误表示 API 返回了 HTML 页面而不是 JSON 响应。

### 可能的原因

1. **API Key 未配置或无效**
   - `.env.local` 文件中 `DEEPSEEK_API_KEY` 未设置
   - API Key 值还是占位符 `your_deepseek_api_key_here`
   - API Key 已过期或无效

2. **服务器未重启**
   - 修改 `.env.local` 后没有重启开发服务器
   - 环境变量未加载

3. **API 路由问题**
   - Next.js 路由配置问题
   - 中间件拦截了 API 请求

---

## 🔍 排查步骤

### 步骤 1: 检查 API Key 配置

```bash
cd admin-console
cat .env.local | grep DEEPSEEK_API_KEY
```

**预期输出**：
```
DEEPSEEK_API_KEY=sk-xxxxx...（真实的 API Key，不是 your_deepseek_api_key_here）
```

**如果还是占位符**：
1. 访问 https://platform.deepseek.com/
2. 创建或获取 API Key
3. 更新 `.env.local` 文件
4. **重要**：重启开发服务器

---

### 步骤 2: 重启开发服务器

修改 `.env.local` 后，**必须重启服务器**才能加载新的环境变量。

```bash
# 停止当前服务器（按 Ctrl+C）
# 然后重新启动
npm run dev
```

---

### 步骤 3: 检查 API 路由是否正常工作

在浏览器中打开开发者工具（F12），查看 Network 标签：

1. 点击 "AI 识别" 按钮
2. 查看 Network 中的 `/api/ai/parse` 请求
3. 检查：
   - **Status**: 应该是 200 或 500（不应该是 404）
   - **Response**: 应该是 JSON 格式，不应该是 HTML

如果 Status 是 404，说明 API 路由不存在。

如果 Response 是 HTML，说明：
- API Key 验证失败，返回了错误页面
- 或者服务器内部错误

---

### 步骤 4: 查看服务器日志

查看运行 `npm run dev` 的终端输出，检查是否有错误信息。

**常见错误信息**：
- `DeepSeek API Key 未配置` → 检查 `.env.local`
- `401 Authentication Fails` → API Key 无效
- `ENOTFOUND` → 网络连接问题

---

## ✅ 正确的配置示例

`.env.local` 文件应该包含：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://civlywqsdzzrvsutlrxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# DeepSeek API (必须配置真实值)
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase Service Role Key (可选，后续使用)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

---

## 🐛 如果问题仍然存在

1. **清除 `.next` 缓存**：
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **检查 API Key 是否有效**：
   - 访问 DeepSeek 平台确认 API Key 状态
   - 确认 API Key 有足够的额度

3. **检查网络连接**：
   - 确保可以访问 `https://api.deepseek.com`
   - 检查防火墙设置

4. **查看完整错误信息**：
   - 浏览器控制台（Console 标签）
   - 服务器终端输出

---

**最后更新**：2025年12月

