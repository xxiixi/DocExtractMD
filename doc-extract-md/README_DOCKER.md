# DocExtractMD Docker 部署指南

## 🚀 快速开始

### 方法一：使用启动脚本（推荐）

**Windows:**
```cmd
# 双击运行
start-docker.bat
```

**Linux/Mac:**
```bash
# 添加执行权限
chmod +x start-docker.sh

# 运行脚本
./start-docker.sh
```

### 方法二：手动命令

```bash
# 1. 构建镜像
docker build -t doc-extract-md:latest .

# 2. 启动容器
docker run -d \
  --name doc-extract-md-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_MINERU_API_URL=http://10.81.117.115:8501/mineru \
  doc-extract-md:latest
```

### 方法三：使用 Docker Compose

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 🌐 访问应用

启动成功后，在浏览器中访问：
```
http://localhost:3000
```

## 📋 常用命令

```bash
# 查看运行状态
docker ps

# 查看日志
docker logs -f doc-extract-md-frontend

# 停止服务
docker stop doc-extract-md-frontend

# 重启服务
docker restart doc-extract-md-frontend

# 删除容器
docker rm doc-extract-md-frontend
```

## 🔧 配置说明

### 环境变量
- `NEXT_PUBLIC_MINERU_API_URL`: MinerU API地址
- `NODE_ENV`: 运行环境（production/development）

### 端口映射
- 主机端口: 3000
- 容器端口: 3000

### 数据卷
- `./uploads`: 文件上传目录
- `./logs`: 日志文件目录

## 🆘 故障排除

### 1. 端口被占用
```bash
# 修改端口映射
docker run -p 3001:3000 doc-extract-md:latest
```

### 2. 权限问题
```bash
# Windows: 以管理员身份运行
# Linux: 使用 sudo
sudo ./start-docker.sh
```

### 3. 网络问题
确保容器能够访问公司内网：
```bash
# 测试网络连通性
docker exec doc-extract-md-frontend ping 10.81.117.115
```

## 📚 详细文档

更多详细信息请查看：[DOCKER_GUIDE.md](./DOCKER_GUIDE.md)
