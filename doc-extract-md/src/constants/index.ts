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

// 应用配置
export const APP_CONFIG = {
  // 支持的文件类型
  SUPPORTED_FILE_TYPES: ['.pdf', 'application/pdf'],
  
  // 最大文件大小 (MB)
  MAX_FILE_SIZE: 50,
  
  // 最大文件数量
  MAX_FILES: 10,
} as const;
