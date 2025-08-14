// 文件状态枚举
export type FileStatus = 'uploaded' | 'processing' | 'completed' | 'error' | 'extracting' | 'converting';

// 文件类型枚举
export type FileType = 'pdf' | 'image' | 'document' | 'text';

// 处理类型枚举
export type ProcessType = 'parse' | 'extract' | 'convert' | 'analyze';

// 上传的文件接口
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: FileType;
  status: FileStatus;
  progress: number;
  markdown?: string;
  content?: string; // 原始文本内容
  error?: string;
  file?: File; // 实际的文件对象
  metadata?: {
    pages?: number;
    dimensions?: { width: number; height: number };
    format?: string;
  };
  processHistory?: ProcessStep[];
}

// 处理步骤接口
export interface ProcessStep {
  type: ProcessType;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  result?: any;
  error?: string;
}

// API响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 解析响应接口
export interface ParseResponse {
  success: boolean;
  markdown?: string;
  error?: string;
  metadata?: {
    pages?: number;
    processingTime?: number;
  };
}

// 提取响应接口
export interface ExtractResponse {
  success: boolean;
  content?: string;
  error?: string;
  extractedData?: {
    text?: string;
    tables?: any[];
    images?: string[];
  };
}

// 转换响应接口
export interface ConvertResponse {
  success: boolean;
  convertedFile?: string;
  error?: string;
  format?: string;
}

// 文件处理选项接口
export interface ProcessOptions {
  parseOptions?: {
    includeImages?: boolean;
    includeTables?: boolean;
    language?: string;
  };
  extractOptions?: {
    extractText?: boolean;
    extractTables?: boolean;
    extractImages?: boolean;
  };
  convertOptions?: {
    targetFormat?: string;
    quality?: number;
    compression?: boolean;
  };
}
