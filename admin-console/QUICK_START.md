# 🚀 快速开始：部署管理后台到 Vercel

## 第一步：推送代码到 GitHub

### 方式 A：使用自动化脚本（推荐）

```bash
cd admin-console
./setup-git-repo.sh
```

脚本会自动：
- ✅ 初始化 Git 仓库
- ✅ 添加所有文件
- ✅ 配置远程仓库
- ✅ 推送到 GitHub

### 方式 B：手动执行

```bash
cd admin-console

# 初始化仓库（如果还没有）
git init

# 添加文件
git add .

# 提交
git commit -m "Initial commit: Admin console"

# 添加远程仓库
git remote add origin https://github.com/longcc23/campus-info-platform.git

# 推送
git branch -M main
git push -u origin main
```

## 第二步：在 Vercel 部署

### 1. 登录 Vercel
访问 [https://vercel.com](https://vercel.com) 并登录

### 2. 导入项目
**使用团队页面导入**：
```
https://vercel.com/new?teamSlug=mrijs-projects
```

在 **"Import Git Repository"** 中搜索并导入仓库：`campus-info-platform` 或 `longcc23/campus-info-platform`

### 3. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥 | `eyJhbGc...` |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | `sk-xxxxx` |
| `NEXT_PUBLIC_API_URL` | Python 后端地址 | **必须**：`http://42.193.241.119:5001` |

### 4. 部署设置

- **Framework Preset**: Next.js（自动检测）
- **Root Directory**: 留空（如果 admin-console 是仓库根目录）
- **Build Command**: `npm run build`（默认）
- **Output Directory**: `.next`（默认）

### 5. 点击 Deploy

等待 2-5 分钟，部署完成后会获得一个测试域名。

## 📚 详细文档

- **完整部署指南**: 查看 [DEPLOY.md](./DEPLOY.md)
- **推送说明**: 查看 [PUSH_TO_GITHUB.md](./PUSH_TO_GITHUB.md)

## ⚠️ 重要提示

1. **环境变量**：⚠️ **必须将所有 env 部分替换成真实数据**，所有敏感信息（API Keys）需要在 Vercel 中配置，不要提交到 Git
2. **Python 后端**：
   - 服务器地址：`42.193.241.119:5001`
   - 服务器路径：`/www/wwwroot/XY/campus-info-platform-main/scripts`
   - 确保服务正在运行：`nohup python api_server.py`
3. **Git 仓库**：`admin-console` 文件夹的代码需要**单独上传**到一个 Git 库
4. **HTTPS**：生产环境建议配置 HTTPS 或使用 Vercel 的代理功能

