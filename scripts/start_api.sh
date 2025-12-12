#!/bin/bash

# AI 采集 API 服务启动脚本

echo "🚀 启动 AI 采集 API 服务..."

# 检查 Python 环境
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到 python3，请先安装 Python"
    exit 1
fi

# 检查依赖
echo "📦 检查依赖..."
cd "$(dirname "$0")"
if [ ! -f "requirements.txt" ]; then
    echo "❌ 未找到 requirements.txt"
    exit 1
fi

# 安装依赖（如果需要）
if [ ! -d "../venv" ]; then
    echo "📦 创建虚拟环境..."
    python3 -m venv ../venv
fi

source ../venv/bin/activate

echo "📦 安装/更新依赖..."
pip install -q -r requirements.txt

# 检查 .env 文件
if [ ! -f "../.env" ]; then
    echo "⚠️  未找到 .env 文件，请先配置环境变量"
    echo "   需要配置：deepseek_API_KEY, SUPABASE_URL, SUPABASE_KEY"
fi

# 启动服务
echo "🚀 启动 API 服务..."
echo "📍 服务地址: http://localhost:5000"
echo "📝 健康检查: http://localhost:5000/health"
echo "📥 采集接口: http://localhost:5000/api/ingest"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

python3 api_server.py






