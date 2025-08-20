/**
 * 应用常量
 */

// API相关常量
export const API_ENDPOINTS = {
  UPLOAD: '/api/upload',
  PARSE: '/api/parse',
} as const;

// 文件相关常量
export const FILE_CONFIG = {
  MAX_SIZE: 50 * 1024 * 1024, // 50MB
  SUPPORTED_TYPES: ['pdf', 'docx', 'doc', 'txt', 'md'],
  UPLOAD_CHUNK_SIZE: 1024 * 1024, // 1MB
} as const;

// UI相关常量
export const UI_CONFIG = {
  TOAST_DURATION: 3000,
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,
} as const;

// 状态常量
export const STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

// 文件处理状态
export const FILE_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

// MinerU API配置
export const MINERU_CONFIG = {
  // MinerU API服务地址
  API_URL: process.env.NEXT_PUBLIC_MINERU_API_URL || 'http://localhost:8000',
  
  // MinerU API端点
  ENDPOINTS: {
    PARSE: '/file_parse',
  },
  
  // 默认解析参数
  DEFAULT_PARAMS: {
    return_md: true,
    lang_list: 'ch',
    backend: 'pipeline',
    parse_method: 'auto',
    formula_enable: true,
    table_enable: true,
    return_images: true,  // 启用图片返回
  },
} as const;

// Multi-GPU配置
export const MULTI_GPU_CONFIG = {
  // Multi-GPU服务器地址
  SERVER_URL: process.env.NEXT_PUBLIC_MULTI_GPU_URL || 'http://127.0.0.1:8000',
  
  // 默认配置
  DEFAULT_CONFIG: {
    timeout: 300000, // 5分钟
    maxConcurrent: 4, // 最大并发数
    retries: 3,
  },
  
  // 默认解析选项
  DEFAULT_OPTIONS: {
    backend: 'pipeline',
    lang: 'ch',
    method: 'auto',
    formula_enable: true,
    table_enable: true,
    source: 'huggingface',
  },
} as const;

// 应用配置
export const APP_CONFIG = {
  // 支持的文件类型
  SUPPORTED_FILE_TYPES: ['.pdf', 'application/pdf'],
  
  // 最大文件大小 (MB)
  MAX_FILE_SIZE: 50,
  
  // 最大文件数量
  MAX_FILES: 10,
} as const;
