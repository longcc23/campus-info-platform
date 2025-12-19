# 管理后台部署指南

## 📋 前置准备

1. **GitHub 仓库**：确保代码已推送到 `https://github.com/longcc23/campus-info-platform.git`
2. **环境变量**：准备好以下配置信息
   - Supabase 项目 URL 和密钥
   - DeepSeek API Key
   - Python 后端 API 地址

## 🚀 Vercel 部署步骤

### 1. 登录 Vercel

访问 [https://vercel.com](https://vercel.com) 并登录（如果没有账号，先注册）

### 2. 导入项目

访问导入页面：
```
https://vercel.com/new?teamSlug=mrijs-projects
```

或者：
1. 点击右上角 **"Add New..."** → **"Project"**
2. 在 **"Import Git Repository"** 中搜索 `campus-info-platform`
3. 找到仓库后点击 **"Import"**

### 3. 配置项目

#### Framework Preset
- 选择 **"Next.js"**（Vercel 会自动检测）

#### Environment Variables（环境变量）

点击 **"Environment Variables"** 添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 你的 Supabase 项目 URL | 例如：`https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 你的 Supabase Anon Key | 从 Supabase Dashboard 获取 |
| `SUPABASE_SERVICE_ROLE_KEY` | 你的 Supabase Service Role Key | 从 Supabase Dashboard 获取 |
| `DEEPSEEK_API_KEY` | 你的 DeepSeek API Key | 从 DeepSeek 平台获取 |
| `NEXT_PUBLIC_API_URL` | Python 后端地址 | 例如：`http://42.193.241.119:5001` |

⚠️ **重要**：
- `NEXT_PUBLIC_*` 开头的变量会暴露到客户端，确保这些值可以公开
- `SUPABASE_SERVICE_ROLE_KEY` 和 `DEEPSEEK_API_KEY` 是敏感信息，不要泄露

#### Root Directory
- 如果仓库根目录就是 `admin-console`，留空
- 如果 `admin-console` 是子目录，填写：`admin-console`

#### Build Command
- 默认：`npm run build`（通常不需要修改）

#### Output Directory
- 默认：`.next`（通常不需要修改）

#### Install Command
- 默认：`npm install`（通常不需要修改）

### 4. 部署

点击 **"Deploy"** 按钮，等待部署完成（通常需要 2-5 分钟）

### 5. 访问部署地址

部署成功后，Vercel 会自动分配一个测试域名，例如：
```
https://campus-info-platform-xxxxx.vercel.app
```

### 6. 配置自定义域名（可选）

1. 在项目页面点击 **"Settings"** → **"Domains"**
2. 输入你的自定义域名（例如：`admin.yourdomain.com`）
3. 按照提示配置 DNS 记录

## 🔧 环境变量获取方式

### Supabase 配置
1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Settings** → **API**
4. 复制以下信息：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`（⚠️ 保密）

### DeepSeek API Key
1. 访问 [DeepSeek 平台](https://platform.deepseek.com)
2. 登录后进入 API Keys 页面
3. 创建或复制 API Key → `DEEPSEEK_API_KEY`

### Python 后端地址
- 根据运维文档，服务器地址为：`http://42.193.241.119:5001`
- 如果使用域名，替换为实际域名

## 🔄 更新部署

每次推送到 GitHub 的 `main` 分支，Vercel 会自动触发重新部署。

也可以手动触发：
1. 在 Vercel 项目页面
2. 点击 **"Deployments"** 标签
3. 找到对应的部署记录
4. 点击 **"Redeploy"**

## 🐛 常见问题

### 部署失败
1. 检查环境变量是否全部配置
2. 查看部署日志中的错误信息
3. 确认 `package.json` 中的构建脚本正确

### API 调用失败
1. 检查 `NEXT_PUBLIC_API_URL` 是否正确
2. 确认 Python 后端服务正在运行
3. 检查服务器防火墙是否开放 5001 端口

### 登录问题
1. 确认 Supabase 环境变量配置正确
2. 检查 Supabase 项目的认证设置
3. 查看浏览器控制台的错误信息

## 📝 注意事项

1. **不要将 `.env.local` 文件提交到 Git**（已在 `.gitignore` 中排除）
2. **生产环境使用 HTTPS**：确保 Python 后端也配置 HTTPS，或使用 Vercel 的代理功能
3. **API 跨域问题**：如果遇到 CORS 错误，需要在 Python 后端配置允许的域名

