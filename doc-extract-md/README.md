# DocExtractMD

一个现代化的PDF文档解析和转换应用，将PDF文件转换为Markdown格式。

## 功能特性

- 📄 **PDF文件上传** - 支持拖拽和点击上传PDF文件
- 🔄 **实时解析** - 将PDF内容转换为Markdown格式
- 👀 **实时预览** - 支持预览和原始Markdown查看
- 📊 **进度跟踪** - 实时显示文件处理进度
- 🎨 **现代化UI** - 基于shadcn/ui的优雅界面
- 📱 **响应式设计** - 支持桌面和移动设备

## 技术栈

- **前端**: Next.js 14 + React + TypeScript
- **样式**: Tailwind CSS + shadcn/ui
- **PDF解析**: pdf-parse
- **文件处理**: Multer
- **图标**: Lucide React

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发环境运行

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── upload/     # 文件上传API
│   │   └── parse/      # PDF解析API
│   ├── globals.css     # 全局样式
│   ├── layout.tsx      # 根布局
│   └── page.tsx        # 主页面
├── components/
│   └── ui/             # shadcn/ui组件
├── lib/
│   └── utils.ts        # 工具函数
└── types/
    └── index.ts        # TypeScript类型定义
```

## API接口

### 文件上传
- **POST** `/api/upload`
- 上传PDF文件到服务器

### PDF解析
- **POST** `/api/parse`
- 解析PDF文件并返回Markdown内容

## 使用说明

1. **上传文件**: 拖拽PDF文件到上传区域或点击选择文件
2. **开始解析**: 点击"Parse Files"按钮开始处理
3. **查看结果**: 在右侧预览区域查看转换后的Markdown内容
4. **切换视图**: 在"Preview"和"Raw Markdown"标签间切换

## 开发说明

### 添加新的UI组件

项目使用shadcn/ui组件库，可以通过以下命令添加新组件：

```bash
npx shadcn@latest add [component-name]
```

### 自定义样式

全局样式在 `src/app/globals.css` 中定义，支持深色模式。

## 许可证

MIT License
