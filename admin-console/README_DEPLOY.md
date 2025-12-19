# 📦 管理后台部署完整指南

根据运维文档，本指南将帮助你完成管理后台的 Vercel 部署。

## 🎯 部署流程概览

```
1. 准备环境变量（真实数据）
   ↓
2. 将 admin-console 单独推送到 GitHub
   ↓
3. 在 Vercel 导入并配置
   ↓
4. 部署完成
```

## 📋 第一步：准备环境变量

⚠️ **重要**：根据运维文档要求，**必须将所有 env 部分替换成真实数据**

### 需要准备的环境变量

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥 | Supabase Dashboard → Settings → API |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | DeepSeek 平台 → API Keys |
| `NEXT_PUBLIC_API_URL` | Python 后端地址 | **固定值**：`http://42.193.241.119:5001` |

### Python 后端信息

- **服务器地址**：`42.193.241.119`
- **服务器路径**：`/www/wwwroot/XY/campus-info-platform-main/scripts`
- **启动命令**：`nohup python api_server.py`
- **端口**：`5001`

⚠️ 确保服务器上的 Python 后端服务正在运行。

## 🚀 第二步：推送代码到 GitHub

根据运维文档，`admin-console` 文件夹的代码需要**单独上传**到一个 Git 库。

### 目标仓库
```
https://github.com/longcc23/campus-info-platform.git
```

### 推送方式

#### 方式 A：使用自动化脚本（推荐）

```bash
cd admin-console
./setup-git-repo.sh
```

#### 方式 B：手动执行

```bash
cd admin-console

# 初始化仓库（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Admin console for campus info platform"

# 添加远程仓库
git remote add origin https://github.com/longcc23/campus-info-platform.git

# 推送
git branch -M main
git push -u origin main
```

## 🌐 第三步：在 Vercel 部署

### 1. 登录 Vercel

访问 [https://vercel.com](https://vercel.com) 并登录/注册

### 2. 导入项目

**使用指定的团队页面**：
```
https://vercel.com/new?teamSlug=mrijs-projects
```

在 **"Import Git Repository"** 中：
1. 搜索 `campus-info-platform` 或 `longcc23/campus-info-platform`
2. 找到仓库后点击 **"Import"**

### 3. 配置项目

#### Framework Preset
- 选择 **"Next.js"**（Vercel 会自动检测）

#### Environment Variables

点击 **"Environment Variables"** 添加所有环境变量：

⚠️ **必须使用真实数据替换所有占位符**

```
NEXT_PUBLIC_SUPABASE_URL=你的真实Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的真实Anon Key
SUPABASE_SERVICE_ROLE_KEY=你的真实Service Role Key
DEEPSEEK_API_KEY=你的真实DeepSeek API Key
NEXT_PUBLIC_API_URL=http://42.193.241.119:5001
```

#### Root Directory
- 如果 `admin-console` 是仓库根目录：**留空**
- 如果 `admin-console` 是子目录：填写 `admin-console`

#### Build Settings
- **Build Command**: `npm run build`（默认）
- **Output Directory**: `.next`（默认）
- **Install Command**: `npm install`（默认）

### 4. 部署

点击 **"Deploy"** 按钮，等待部署完成（通常 2-5 分钟）

### 5. 访问部署地址

部署成功后，Vercel 会自动分配测试域名，例如：
```
https://campus-info-platform-xxxxx.vercel.app
```

### 6. 配置自定义域名（可选）

1. 在项目页面点击 **"Settings"** → **"Domains"**
2. 输入自定义域名
3. 按照提示配置 DNS 记录

## ✅ 验证部署

部署成功后，访问登录页面验证：
- ✅ 页面正常加载
- ✅ 可以正常登录
- ✅ AI 解析功能正常（需要 Python 后端运行）
- ✅ 文件上传功能正常

## 🔄 更新部署

每次推送到 GitHub 的 `main` 分支，Vercel 会自动触发重新部署。

也可以手动触发：
1. Vercel 项目页面 → **"Deployments"**
2. 找到对应部署记录
3. 点击 **"Redeploy"**

## 🐛 常见问题

### 部署失败
- 检查所有环境变量是否已配置
- 查看部署日志中的错误信息
- 确认 `package.json` 中的构建脚本正确

### API 调用失败
- 检查 `NEXT_PUBLIC_API_URL` 是否为 `http://42.193.241.119:5001`
- 确认服务器上的 Python 后端服务正在运行
- 检查服务器防火墙是否开放 5001 端口

### 登录问题
- 确认 Supabase 环境变量配置正确
- 检查 Supabase 项目的认证设置
- 查看浏览器控制台的错误信息

## 📝 注意事项

1. ⚠️ **环境变量**：所有敏感信息必须在 Vercel 中配置，不要提交到 Git
2. ⚠️ **Python 后端**：确保服务器 `42.193.241.119:5001` 上的服务正在运行
3. ⚠️ **Git 仓库**：`admin-console` 必须单独上传到一个 Git 库
4. ⚠️ **真实数据**：必须将所有 env 部分替换成真实数据

## 📚 相关文档

- **快速开始**: [QUICK_START.md](./QUICK_START.md)
- **详细部署指南**: [DEPLOY.md](./DEPLOY.md)
- **GitHub 推送说明**: [PUSH_TO_GITHUB.md](./PUSH_TO_GITHUB.md)

