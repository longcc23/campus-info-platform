# 🚀 部署指南

## Vercel 部署管理后台

### 1. 准备工作

确保你已经：
- 拥有 [Vercel](https://vercel.com) 账号
- 项目已推送到 GitHub
- 配置好 Supabase 数据库

### 2. 部署步骤

#### 方法一：通过 Vercel Dashboard（推荐）

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 选择 GitHub 仓库：`longcc23/campus-info-platform`
4. 配置项目设置：
   - **Framework Preset**: Next.js
   - **Root Directory**: `admin-console`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

5. 配置环境变量（Environment Variables）：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://civlywqsdzzrvsutlrxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   DEEPSEEK_API_KEY=sk-2ccdda335fc4425b8723968b4a536959
   SUPABASE_SERVICE_ROLE_KEY=sb_publishable_yUXh7g3fTN72yrRi0gnM0w_U7Oe9v-L
   NEXT_PUBLIC_API_URL=https://your-api-server.com
   ```

6. 点击 "Deploy" 开始部署

#### 方法二：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 在项目根目录运行
vercel

# 按提示配置：
# - Set up and deploy? Y
# - Which scope? 选择你的账号
# - Link to existing project? N
# - Project name: uniflow-admin-console
# - In which directory is your code located? admin-console
```

### 3. 环境变量配置

在 Vercel Dashboard 的项目设置中添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|----|----|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://civlywqsdzzrvsutlrxx.supabase.co` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase 匿名密钥 |
| `DEEPSEEK_API_KEY` | `sk-2ccdda335fc4425b8723968b4a536959` | DeepSeek API 密钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_publishable_yUXh7g3fTN72yrRi0gnM0w_U7Oe9v-L` | Supabase 服务角色密钥 |
| `NEXT_PUBLIC_API_URL` | `https://your-api-server.com` | API 服务器地址（可选） |

### 4. 自定义域名（可选）

1. 在 Vercel Dashboard 中进入项目设置
2. 点击 "Domains" 标签
3. 添加你的自定义域名
4. 按照提示配置 DNS 记录

### 5. 部署后验证

部署完成后，访问分配的 URL（如 `https://uniflow-admin-console.vercel.app`）：

1. 检查登录页面是否正常显示
2. 尝试登录（使用 Supabase Auth）
3. 检查数据加载是否正常
4. 测试 AI 解析功能

### 6. 常见问题

#### 构建失败
- 检查 `admin-console/package.json` 中的依赖是否完整
- 确保环境变量配置正确

#### API 调用失败
- 检查 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 确认 Supabase 项目的 RLS 策略配置

#### AI 功能不工作
- 检查 `DEEPSEEK_API_KEY` 是否正确
- 确认 API 配额是否充足

### 7. 持续部署

Vercel 会自动监听 GitHub 仓库的变化：
- 推送到 `main` 分支会触发生产环境部署
- 推送到其他分支会创建预览部署

---

## 本地开发

```bash
# 进入管理后台目录
cd admin-console

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env.local

# 编辑环境变量
nano .env.local

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 查看管理后台。

---

**维护者**：UniFlow 产品团队  
**更新时间**：2025年12月19日