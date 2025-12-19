# 将 admin-console 推送到 GitHub 仓库

## 📋 前提条件

1. 确保 GitHub 仓库已创建：`https://github.com/longcc23/campus-info-platform.git`
2. 确保你有该仓库的推送权限

## 🚀 推送步骤

### 方式一：将 admin-console 作为仓库根目录（推荐）

如果你想将 `admin-console` 的内容作为新仓库的根目录：

```bash
# 1. 进入 admin-console 目录
cd admin-console

# 2. 初始化新的 git 仓库（如果还没有）
git init

# 3. 添加所有文件
git add .

# 4. 提交
git commit -m "Initial commit: Admin console for campus info platform"

# 5. 添加远程仓库
git remote add origin https://github.com/longcc23/campus-info-platform.git

# 6. 推送到 main 分支
git branch -M main
git push -u origin main
```

### 方式二：保留当前仓库结构（如果需要）

如果你想保留当前仓库的完整结构，直接推送整个项目：

```bash
# 1. 在项目根目录
cd "/Users/cissyl/Desktop/2025GMBA/1st.Sem/management thinking/infor_platform"

# 2. 添加新文件
git add admin-console/DEPLOY.md admin-console/vercel.json admin-console/.env.example

# 3. 提交
git commit -m "Add deployment configuration for admin console"

# 4. 推送到远程
git push origin main
```

然后在 Vercel 部署时，设置 **Root Directory** 为 `admin-console`

## ⚠️ 注意事项

1. **环境变量文件**：
   - `.env.example` 已创建，包含所有需要的环境变量模板
   - **不要**提交 `.env.local` 文件（已在 `.gitignore` 中排除）
   - 在 Vercel 中手动配置环境变量

2. **Node Modules**：
   - `node_modules` 已在 `.gitignore` 中排除
   - Vercel 会自动运行 `npm install` 安装依赖

3. **Python 后端地址**：
   - 开发环境：`http://localhost:5001`
   - 生产环境：`http://42.193.241.119:5001`（根据实际服务器地址修改）

## 🔍 验证推送

推送成功后，访问 GitHub 仓库确认：
- ✅ 所有文件都已上传
- ✅ `.env.example` 存在
- ✅ `DEPLOY.md` 存在
- ✅ `vercel.json` 存在
- ✅ `node_modules` 和 `.env.local` 不在仓库中

