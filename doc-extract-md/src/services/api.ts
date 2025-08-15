// API接口配置
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  endpoints: {
    upload: string;
    parse: string;
    // MinerU API接口
    mineruParse: string;
    // 后端代理的MinerU接口
    mineruProxy: string;
    mineruHealth: string;
    // 后端output文件接口
    outputFiles: string;
    // 添加更多接口
    extract?: string;
    convert?: string;
  };
}

// 默认配置
export const defaultApiConfig: ApiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001',
  timeout: 30000,
  retries: 3,
  endpoints: {
    upload: '/api/extract-text',
    parse: '/api/extract-text',
    // MinerU API接口（直接调用）
    mineruParse: '/file_parse',
    // 后端代理的MinerU接口
    mineruProxy: '/api/mineru/parse-pdf',
    mineruHealth: '/api/mineru/health',
    // 后端output文件接口
    outputFiles: '/api/output',
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

// MinerU API响应类型
export interface MinerUParseResponse {
  results: {
    [fileName: string]: {
      md_content: string;
      status: string;
      error_message?: string;
    };
  };
  status: string;
  message?: string;
}

// 后端代理的MinerU响应类型
export interface MinerUProxyResponse {
  filename: string;
  md_content: string;
  status: string;
  source: string;
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

  // MinerU API直接调用（可能遇到跨域问题）
  async parseFileWithMinerU(file: File): Promise<ApiResponse<MinerUParseResponse>> {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('return_md', 'true');
    formData.append('lang_list', 'ch');
    formData.append('backend', 'pipeline');
    formData.append('parse_method', 'auto');
    formData.append('formula_enable', 'true');
    formData.append('table_enable', 'true');

    const url = this.getFullUrl(this.config.endpoints.mineruParse);
    console.log('Sending MinerU request to:', url);
    console.log('File info:', { name: file.name, type: file.type, size: file.size });

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      console.log('MinerU Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('MinerU Response error:', errorText);
        throw new Error(`MinerU API failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('MinerU Response data:', data);
      
      return { success: true, data };
    } catch (error) {
      console.error('MinerU Request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'MinerU parse failed',
      };
    }
  }

  // 通过后端代理调用MinerU API（推荐，解决跨域问题）
  async parseFileWithMinerUProxy(file: File): Promise<ApiResponse<MinerUProxyResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    const url = this.getFullUrl(this.config.endpoints.mineruProxy);
    console.log('Sending MinerU proxy request to:', url);
    console.log('File info:', { name: file.name, type: file.type, size: file.size });

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      console.log('MinerU Proxy Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('MinerU Proxy Response error:', errorData);
        throw new Error(errorData.detail || `MinerU proxy failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('MinerU Proxy Response data:', data);
      
      if (data.success && data.data) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.detail || 'MinerU proxy failed' };
      }
    } catch (error) {
      console.error('MinerU Proxy Request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'MinerU proxy failed',
      };
    }
  }

  // 检查MinerU服务健康状态
  async checkMinerUHealth(): Promise<ApiResponse<any>> {
    const url = this.getFullUrl(this.config.endpoints.mineruHealth);
    console.log('Checking MinerU health at:', url);

    try {
      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
      };
    }
  }

  // 获取output目录下的文件
  async getOutputFile(filePath?: string): Promise<ApiResponse<any>> {
    const url = this.getFullUrl(this.config.endpoints.outputFiles) + (filePath ? `?path=${encodeURIComponent(filePath)}` : '');
    console.log('Getting output file at:', url);

    try {
      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to get output file: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get output file',
      };
    }
  }

  // 提取内容（预留接口）
  async extractContent(fileName: string, options?: unknown): Promise<ApiResponse<unknown>> {
    if (!this.config.endpoints.extract) {
      return { success: false, error: 'Extract endpoint not configured' };
    }
    
    return this.request(this.getFullUrl(this.config.endpoints.extract), {
      method: 'POST',
      body: JSON.stringify({ file_name: fileName, ...options }),
    });
  }

  // 转换格式（预留接口）
  async convertFormat(fileName: string, targetFormat: string): Promise<ApiResponse<unknown>> {
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
