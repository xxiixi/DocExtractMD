# Docker 部署指南

## 📖 Docker 原理详解

### 什么是 Docker？

Docker 是一个**容器化平台**，它可以将应用程序及其所有依赖项打包到一个称为"容器"的标准化单元中。

### 🏗️ 容器 vs 虚拟机

```
传统虚拟机：
┌─────────────────────────────────────┐
│           应用程序 A                 │
├─────────────────────────────────────┤
│           操作系统 A                 │
├─────────────────────────────────────┤
│           虚拟机监控器               │
├─────────────────────────────────────┤
│           主机操作系统               │
└─────────────────────────────────────┘

Docker 容器：
┌─────────────────────────────────────┐
│           应用程序 A                 │
├─────────────────────────────────────┤
│           应用程序 B                 │
├─────────────────────────────────────┤
│           应用程序 C                 │
├─────────────────────────────────────┤
│           Docker 引擎               │
├─────────────────────────────────────┤
│           主机操作系统               │
└─────────────────────────────────────┘
```

**优势：**
- 🚀 **更轻量**：容器共享主机内核，占用资源更少
- ⚡ **更快速**：启动时间以秒为单位
- 🔄 **更一致**：在任何环境都能保证相同的运行环境
- 📦 **更便携**：一次构建，到处运行

### 🏛️ Docker 架构

```
┌─────────────────────────────────────┐
│           Docker Client             │ ← 用户命令
├─────────────────────────────────────┤
│           Docker Daemon             │ ← 后台服务
├─────────────────────────────────────┤
│           Docker Registry           │ ← 镜像仓库
└─────────────────────────────────────┘
```

### 📦 核心概念

1. **镜像 (Image)**：应用程序的模板，包含运行环境
2. **容器 (Container)**：镜像的运行实例
3. **仓库 (Registry)**：存储镜像的地方
4. **Dockerfile**：构建镜像的指令文件

## 🛠️ 安装 Docker

### Windows 10/11
1. 下载 [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. 安装并重启电脑
3. 启动 Docker Desktop

### Windows 7
由于 Docker Desktop 不支持 Win7，建议：
1. 使用虚拟机安装 Linux
2. 在 Linux 中安装 Docker
3. 或者使用 Docker Toolbox（已停止维护）

## 🚀 快速开始

### 1. 构建镜像

```bash
# 进入项目目录
cd DocExtractMD/doc-extract-md

# 构建生产镜像
docker build -t doc-extract-md:latest .

# 构建开发镜像
docker build -f Dockerfile.dev -t doc-extract-md:dev .
```

### 2. 运行容器

```bash
# 运行生产容器
docker run -d \
  --name doc-extract-md \
  -p 3000:3000 \
  -e NEXT_PUBLIC_MINERU_API_URL=http://10.81.117.115:8501/mineru \
  doc-extract-md:latest

# 运行开发容器
docker run -d \
  --name doc-extract-md-dev \
  -p 3001:3000 \
  -v $(pwd):/app \
  -e NEXT_PUBLIC_MINERU_API_URL=http://10.81.117.115:8501/mineru \
  doc-extract-md:dev
```

### 3. 使用 Docker Compose（推荐）

```bash
# 启动生产环境
docker-compose up -d

# 启动开发环境
docker-compose --profile dev up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 📋 常用命令

### 镜像管理
```bash
# 列出所有镜像
docker images

# 删除镜像
docker rmi doc-extract-md:latest

# 强制删除镜像
docker rmi -f doc-extract-md:latest
```

### 容器管理
```bash
# 列出运行中的容器
docker ps

# 列出所有容器
docker ps -a

# 启动容器
docker start doc-extract-md

# 停止容器
docker stop doc-extract-md

# 重启容器
docker restart doc-extract-md

# 删除容器
docker rm doc-extract-md

# 进入容器内部
docker exec -it doc-extract-md sh
```

### 日志和监控
```bash
# 查看容器日志
docker logs doc-extract-md

# 实时查看日志
docker logs -f doc-extract-md

# 查看容器资源使用
docker stats
```

## 🔧 配置文件详解

### Dockerfile 结构

```dockerfile
# 基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]
```

### docker-compose.yml 结构

```yaml
version: '3.8'
services:
  app:
    build: .                    # 构建上下文
    ports:
      - "3000:3000"            # 端口映射
    environment:                # 环境变量
      - NODE_ENV=production
    volumes:                    # 数据卷
      - ./uploads:/app/uploads
    restart: unless-stopped     # 重启策略
```

## 🌐 网络配置

### 容器网络模式

1. **bridge**（默认）：容器间通过Docker网桥通信
2. **host**：容器直接使用主机网络
3. **none**：容器无网络访问

### 端口映射

```bash
# 格式：主机端口:容器端口
-p 3000:3000    # 主机3000端口映射到容器3000端口
-p 8080:3000    # 主机8080端口映射到容器3000端口
```

## 💾 数据持久化

### 数据卷 (Volumes)

```bash
# 创建数据卷
docker volume create my-data

# 使用数据卷
docker run -v my-data:/app/data doc-extract-md

# 绑定挂载
docker run -v /host/path:/container/path doc-extract-md
```

### 文件上传目录

```yaml
volumes:
  - ./uploads:/app/uploads  # 上传文件持久化
  - ./logs:/app/logs        # 日志文件持久化
```

## 🔍 故障排除

### 常见问题

1. **端口被占用**
```bash
# 查看端口占用
netstat -ano | findstr :3000

# 修改端口映射
-p 3001:3000
```

2. **权限问题**
```bash
# 修改文件权限
chmod -R 755 ./uploads

# 使用非root用户运行
USER nextjs
```

3. **内存不足**
```bash
# 限制内存使用
docker run -m 512m doc-extract-md

# 清理未使用的资源
docker system prune
```

### 调试技巧

```bash
# 进入容器调试
docker exec -it doc-extract-md sh

# 查看容器详细信息
docker inspect doc-extract-md

# 查看容器日志
docker logs doc-extract-md

# 复制文件到容器
docker cp local-file.txt doc-extract-md:/app/
```

## 📊 性能优化

### 镜像优化

1. **多阶段构建**：减少最终镜像大小
2. **使用 .dockerignore**：排除不必要文件
3. **合并RUN命令**：减少镜像层数
4. **使用Alpine基础镜像**：减小基础镜像大小

### 容器优化

1. **资源限制**：设置CPU和内存限制
2. **健康检查**：监控容器状态
3. **重启策略**：自动恢复服务
4. **日志轮转**：避免日志文件过大

## 🔐 安全考虑

1. **使用非root用户**：避免权限提升
2. **最小化镜像**：减少攻击面
3. **定期更新**：修复安全漏洞
4. **网络隔离**：限制容器网络访问

## 📚 进阶学习

### 推荐资源
- [Docker 官方文档](https://docs.docker.com/)
- [Docker Hub](https://hub.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)

### 下一步
- 学习 Docker Swarm 或 Kubernetes
- 了解 CI/CD 流水线集成
- 探索微服务架构
- 学习容器编排技术

---

## 🎯 项目特定配置

### 环境变量
```bash
# .env 文件
NEXT_PUBLIC_MINERU_API_URL=http://10.81.117.115:8501/mineru
NODE_ENV=production
```

### 网络配置
确保容器能够访问公司内网的MinerU服务：
```yaml
networks:
  - doc-extract-network
```

### 健康检查
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

现在您可以开始使用Docker部署您的应用了！🎉
