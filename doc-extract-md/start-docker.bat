@echo off
chcp 65001 >nul

REM DocExtractMD Docker 快速启动脚本 (Windows)
REM 适用于公司内网环境

echo 🚀 启动 DocExtractMD Docker 服务...

REM 检查 Docker 是否安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker 未安装，请先安装 Docker Desktop
    pause
    exit /b 1
)

REM 检查 Docker 是否运行
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker 未运行，请启动 Docker Desktop
    pause
    exit /b 1
)

REM 创建必要的目录
echo 📁 创建必要的目录...
if not exist uploads mkdir uploads
if not exist logs mkdir logs

REM 设置环境变量
set NEXT_PUBLIC_MINERU_API_URL=http://10.81.117.115:8501/mineru

REM 构建镜像
echo 🔨 构建 Docker 镜像...
docker build -t doc-extract-md:latest .

if errorlevel 1 (
    echo ❌ 镜像构建失败
    pause
    exit /b 1
)

REM 停止并删除旧容器
echo 🧹 清理旧容器...
docker stop doc-extract-md-frontend >nul 2>&1
docker rm doc-extract-md-frontend >nul 2>&1

REM 启动新容器
echo 🚀 启动容器...
docker run -d ^
  --name doc-extract-md-frontend ^
  -p 3000:3000 ^
  -e NEXT_PUBLIC_MINERU_API_URL=http://10.81.117.115:8501/mineru ^
  -e NODE_ENV=production ^
  -v %cd%/uploads:/app/uploads ^
  -v %cd%/logs:/app/logs ^
  --restart unless-stopped ^
  doc-extract-md:latest

if errorlevel 1 (
    echo ❌ 服务启动失败
    pause
    exit /b 1
) else (
    echo ✅ 服务启动成功！
    echo 🌐 访问地址: http://localhost:3000
    echo 📊 查看日志: docker logs -f doc-extract-md-frontend
    echo 🛑 停止服务: docker stop doc-extract-md-frontend
)

pause
