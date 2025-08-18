import { MINERU_CONFIG } from '@/constants';

// API接口配置
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  endpoints: {
    // MinerU API接口（直接调用）
    mineruParse: string;
  };
}

// 默认配置
export const defaultApiConfig: ApiConfig = {
  baseUrl: '',  // 直接调用MinerU，不需要baseUrl
  timeout: 30000,
  retries: 3,
  endpoints: {
    // MinerU API接口（直接调用）
    mineruParse: `${MINERU_CONFIG.API_URL}${MINERU_CONFIG.ENDPOINTS.PARSE}`,
  },
};

// API响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// MinerU API响应类型
export interface MinerUParseResponse {
  backend: string;
  version: string;
  results: {
    [fileName: string]: {
      md_content?: string;
      middle_json?: string;
      model_output?: string;
      content_list?: string;
      images?: {
        [imageName: string]: string;
      };
    };
  };
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
    // 如果是完整URL，直接返回
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    return `${this.config.baseUrl}${endpoint}`;
  }

  // MinerU API直接调用
  async parseFileWithMinerU(file: File): Promise<ApiResponse<MinerUParseResponse>> {
    const formData = new FormData();
    formData.append('files', file);
    
    // 使用配置中的默认参数
    Object.entries(MINERU_CONFIG.DEFAULT_PARAMS).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    const url = this.getFullUrl(this.config.endpoints.mineruParse);
    console.log('发送MinerU请求到:', url);
    console.log('文件信息:', { name: file.name, type: file.type, size: file.size });

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      console.log('MinerU响应状态:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('MinerU响应错误:', errorText);
        throw new Error(`MinerU API失败: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('MinerU响应数据:', data);
      
      return { success: true, data };
    } catch (error) {
      console.error('MinerU请求错误:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'MinerU解析失败',
      };
    }
  }
}

// 创建默认API客户端实例
export const apiClient = new ApiClient();
