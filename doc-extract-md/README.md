# Document Processor Frontend

一个现代化的文档处理前端应用，支持多种文件格式的处理和转换。

## 架构特点

### 前后端分离
- **前端**: Next.js + TypeScript + Tailwind CSS
- **后端**: 独立的API服务（Python FastAPI）
- **通信**: RESTful API接口

### 模块化设计
- **API层**: 统一的接口管理和错误处理
- **服务层**: 文件处理逻辑封装
- **组件层**: 可复用的UI组件
- **配置层**: 灵活的应用配置管理

## 功能特性

### 支持的文件格式
- **PDF文档**: 解析和提取文本
- **图片文件**: PNG, JPG, JPEG, GIF, BMP, TIFF
- **文档文件**: DOC, DOCX, TXT
- **文本文件**: 纯文本处理

### 处理功能
- **解析 (Parse)**: 将文档转换为Markdown格式
- **提取 (Extract)**: 提取文档中的文本、表格、图片
- **转换 (Convert)**: 将文档转换为不同格式

### 用户界面
- **拖拽上传**: 支持多文件拖拽上传
- **实时进度**: 显示文件处理进度
- **状态管理**: 清晰的文件状态显示
- **错误处理**: 友好的错误提示和重试机制
- **处理历史**: 显示文件处理步骤历史

## 技术栈

### 前端技术
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI组件**: shadcn/ui
- **图标**: Lucide React
- **状态管理**: React Hooks

### 核心库
- **文件处理**: 自定义FileProcessor服务
- **API管理**: 自定义ApiClient类
- **配置管理**: ConfigManager单例模式
- **类型安全**: 完整的TypeScript类型定义

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 主页面
│   └── layout.tsx         # 布局组件
├── components/            # UI组件
│   ├── UploadSection.tsx  # 文件上传区域
│   ├── FileListSection.tsx # 文件列表
│   ├── PreviewSection.tsx # 预览区域
│   └── ui/               # 基础UI组件
├── lib/                  # 核心库
│   ├── api.ts           # API接口管理
│   ├── fileProcessor.ts # 文件处理服务
│   ├── config.ts        # 配置管理
│   └── utils.ts         # 工具函数
└── types/               # 类型定义
    └── index.ts         # 全局类型
```

## API接口设计

### 基础配置
```typescript
interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  endpoints: {
    upload: string;
    parse: string;
    extract?: string;
    convert?: string;
  };
}
```

### 支持的操作
- `POST /api/upload` - 文件上传
- `POST /api/parse` - 文档解析
- `POST /api/extract` - 内容提取
- `POST /api/convert` - 格式转换

### 响应格式
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## 配置管理

### 环境变量
```bash
# API配置
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# 功能开关
NEXT_PUBLIC_ENABLE_EXTRACT=true
NEXT_PUBLIC_ENABLE_CONVERT=true
NEXT_PUBLIC_ENABLE_BATCH_PROCESSING=true

# 文件限制
NEXT_PUBLIC_MAX_FILE_SIZE=50

# UI配置
NEXT_PUBLIC_DEFAULT_THEME=auto
NEXT_PUBLIC_DEFAULT_LANGUAGE=en
```

### 运行时配置
- 支持本地存储配置持久化
- 动态功能开关
- 文件格式和大小限制
- UI主题和语言设置

## 开发指南

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
npm start
```

### 环境配置
1. 复制 `env.example` 为 `.env.local`
2. 修改API地址和其他配置
3. 重启开发服务器

## 扩展指南

### 添加新的处理类型
1. 在 `types/index.ts` 中添加新的处理类型
2. 在 `lib/api.ts` 中添加对应的API接口
3. 在 `lib/fileProcessor.ts` 中实现处理逻辑
4. 在UI组件中添加对应的按钮和界面

### 添加新的文件格式
1. 在 `lib/config.ts` 中添加MIME类型
2. 在 `lib/fileProcessor.ts` 中更新文件类型检测
3. 在UI组件中更新文件选择器

### 自定义API接口
1. 修改 `lib/api.ts` 中的接口配置
2. 更新 `lib/fileProcessor.ts` 中的调用逻辑
3. 确保后端API接口匹配

## 部署说明

### 前端部署
- 支持Vercel、Netlify等平台
- 需要配置环境变量
- 确保API后端可访问

### 后端要求
- 支持CORS跨域请求
- 提供标准的RESTful API
- 支持文件上传和处理
- 返回统一的响应格式

## 许可证

MIT License
