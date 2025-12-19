#!/bin/bash

# 将 admin-console 设置为独立的 Git 仓库并推送到 GitHub

set -e

echo "🚀 开始设置 admin-console 为独立 Git 仓库..."

# 检查是否在 admin-console 目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在 admin-console 目录下运行此脚本"
    exit 1
fi

# 仓库地址
REPO_URL="https://github.com/longcc23/campus-info-platform.git"

echo ""
echo "📦 步骤 1: 初始化 Git 仓库（如果还没有）..."
if [ ! -d ".git" ]; then
    git init
    echo "✅ Git 仓库已初始化"
else
    echo "ℹ️  Git 仓库已存在"
fi

echo ""
echo "📝 步骤 2: 添加所有文件..."
git add .

echo ""
echo "💾 步骤 3: 提交更改..."
if git diff --staged --quiet; then
    echo "ℹ️  没有需要提交的更改"
else
    git commit -m "Initial commit: Admin console for campus info platform"
    echo "✅ 文件已提交"
fi

echo ""
echo "🔗 步骤 4: 配置远程仓库..."
# 检查远程仓库是否已存在
if git remote get-url origin > /dev/null 2>&1; then
    CURRENT_URL=$(git remote get-url origin)
    if [ "$CURRENT_URL" != "$REPO_URL" ]; then
        echo "⚠️  远程仓库已存在，但地址不同"
        echo "   当前: $CURRENT_URL"
        echo "   目标: $REPO_URL"
        read -p "是否更新远程仓库地址? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git remote set-url origin "$REPO_URL"
            echo "✅ 远程仓库地址已更新"
        fi
    else
        echo "✅ 远程仓库已配置正确"
    fi
else
    git remote add origin "$REPO_URL"
    echo "✅ 远程仓库已添加"
fi

echo ""
echo "🌿 步骤 5: 设置分支为 main..."
git branch -M main

echo ""
echo "📤 步骤 6: 推送到 GitHub..."
echo "⚠️  注意：如果远程仓库已有内容，可能需要使用 --force 参数"
read -p "是否强制推送? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push -u origin main --force
else
    git push -u origin main
fi

echo ""
echo "✅ 完成！admin-console 已推送到 GitHub"
echo "📍 仓库地址: $REPO_URL"
echo ""
echo "📋 下一步："
echo "   1. 访问 https://vercel.com 登录"
echo "   2. 导入 GitHub 仓库: $REPO_URL"
echo "   3. 配置环境变量（参考 DEPLOY.md）"
echo "   4. 部署项目"

