/**
 * 应用常量
 */

// API相关常量
export const API_ENDPOINTS = {
  UPLOAD: '/api/upload',
  PARSE: '/api/parse',
} as const;

// WebSocket相关常量
export const WEBSOCKET_CONFIG = {
  URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8000/ws',
  RECONNECT_INTERVAL: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
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
