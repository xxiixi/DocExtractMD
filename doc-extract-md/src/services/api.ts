// API接口配置
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  endpoints: {
    upload: string;
    parse: string;
    // 添加更多接口
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
    upload: '/api/extract-text',
    parse: '/api/extract-text',
    extract: '/api/extract-text',
    convert: '/api/extract-text',
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
  filename: string;
  file_size: number;
  file_type: string;
  extracted_text: string;
  text_length: number;
  status: string;
  error_message?: string;
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

  // 文件上传和解析（统一使用extract-text接口）
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

  // 解析文件（直接上传并解析）
  async parseFile(file: File, fileId?: string): Promise<ApiResponse<ParseResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    if (fileId) {
      formData.append('file_id', fileId);
    }

    const url = this.getFullUrl(this.config.endpoints.parse);
    console.log('Sending request to:', url);
    console.log('File info:', { name: file.name, type: file.type, size: file.size, fileId });

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Response error:', errorData);
        throw new Error(errorData.detail || `Parse failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      // 后端返回的格式是 { success: true, data: {...} }
      if (data.success && data.data) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.detail || 'Parse failed' };
      }
    } catch (error) {
      console.error('Request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Parse failed',
      };
    }
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
