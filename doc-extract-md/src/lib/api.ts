// API接口配置
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  endpoints: {
    upload: string;
    parse: string;
    // 可以添加更多接口
    extract?: string;
    convert?: string;
  };
}

// 默认配置
export const defaultApiConfig: ApiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  timeout: 30000,
  retries: 3,
  endpoints: {
    upload: '/api/upload',
    parse: '/api/parse',
    extract: '/api/extract',
    convert: '/api/convert',
  },
};

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UploadResponse {
  fileName: string;
  filePath: string;
  success: boolean;
}

export interface ParseResponse {
  markdown: string;
  success: boolean;
  error?: string;
}

// API客户端类
export class ApiClient {
  private config: ApiConfig;

  constructor(config: ApiConfig = defaultApiConfig) {
    this.config = config;
  }

  // 更新配置
  updateConfig(newConfig: Partial<ApiConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  // 获取完整URL
  private getFullUrl(endpoint: string): string {
    return `${this.config.baseUrl}${endpoint}`;
  }

  // 通用请求方法
  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // 文件上传
  async uploadFile(file: File): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(this.getFullUrl(this.config.endpoints.upload), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  // 解析文件
  async parseFile(fileName: string): Promise<ApiResponse<ParseResponse>> {
    return this.request<ParseResponse>(this.getFullUrl(this.config.endpoints.parse), {
      method: 'POST',
      body: JSON.stringify({ file_name: fileName }),
    });
  }

  // 提取内容（预留接口）
  async extractContent(fileName: string, options?: any): Promise<ApiResponse<any>> {
    if (!this.config.endpoints.extract) {
      return { success: false, error: 'Extract endpoint not configured' };
    }
    
    return this.request(this.getFullUrl(this.config.endpoints.extract), {
      method: 'POST',
      body: JSON.stringify({ file_name: fileName, ...options }),
    });
  }

  // 转换格式（预留接口）
  async convertFormat(fileName: string, targetFormat: string): Promise<ApiResponse<any>> {
    if (!this.config.endpoints.convert) {
      return { success: false, error: 'Convert endpoint not configured' };
    }
    
    return this.request(this.getFullUrl(this.config.endpoints.convert), {
      method: 'POST',
      body: JSON.stringify({ file_name: fileName, target_format: targetFormat }),
    });
  }
}

// 创建默认API客户端实例
export const apiClient = new ApiClient();
