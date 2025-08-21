#!/bin/bash

# DocExtractMD Docker 快速启动脚本
# 适用于公司内网环境

echo "🚀 启动 DocExtractMD Docker 服务..."

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 Docker 是否运行
if ! docker info &> /dev/null; then
    echo "❌ Docker 未运行，请启动 Docker Desktop"
    exit 1
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p uploads logs

# 设置环境变量
export NEXT_PUBLIC_MINERU_API_URL=http://10.81.117.115:8501/mineru

# 构建镜像
echo "🔨 构建 Docker 镜像..."
docker build -t doc-extract-md:latest .

if [ $? -ne 0 ]; then
    echo "❌ 镜像构建失败"
    exit 1
fi

# 停止并删除旧容器
echo "🧹 清理旧容器..."
docker stop doc-extract-md-frontend 2>/dev/null || true
docker rm doc-extract-md-frontend 2>/dev/null || true

# 启动新容器
echo "🚀 启动容器..."
docker run -d \
  --name doc-extract-md-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_MINERU_API_URL=http://10.81.117.115:8501/mineru \
  -e NODE_ENV=production \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/logs:/app/logs \
  --restart unless-stopped \
  doc-extract-md:latest

if [ $? -eq 0 ]; then
    echo "✅ 服务启动成功！"
    echo "🌐 访问地址: http://localhost:3000"
    echo "📊 查看日志: docker logs -f doc-extract-md-frontend"
    echo "🛑 停止服务: docker stop doc-extract-md-frontend"
else
    echo "❌ 服务启动失败"
    exit 1
fi
