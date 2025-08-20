import { UploadedFile } from '@/types';

// Multi-GPU API 配置
export interface MultiGpuConfig {
  serverUrl: string;
  timeout: number;
  maxConcurrent: number;
  retries: number;
}

// Multi-GPU 解析选项
export interface MultiGpuOptions {
  backend?: 'pipeline' | 'vlm-transformers' | 'vlm-sglang-engine' | 'vlm-sglang-client';
  lang?: 'ch' | 'ch_server' | 'ch_lite' | 'en' | 'korean' | 'japan' | 'chinese_cht' | 'ta' | 'te' | 'ka' | 'latin' | 'arabic' | 'east_slavic' | 'cyrillic' | 'devanagari';
  method?: 'auto' | 'txt' | 'ocr';
  formula_enable?: boolean;
  table_enable?: boolean;
  device?: string;
  vram?: number;
  source?: 'huggingface' | 'modelscope' | 'local';
}

// Multi-GPU 响应类型
export interface MultiGpuResponse {
  success: boolean;
  output_dir?: string;
  error?: string;
  results?: {
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

// 默认配置
export const defaultMultiGpuConfig: MultiGpuConfig = {
  serverUrl: process.env.NEXT_PUBLIC_MULTI_GPU_URL || 'http://127.0.0.1:8000',
  timeout: 300000, // 5分钟
  maxConcurrent: 4, // 最大并发数
  retries: 3,
};

// 默认解析选项
export const defaultMultiGpuOptions: MultiGpuOptions = {
  backend: 'pipeline',
  lang: 'ch',
  method: 'auto',
  formula_enable: true,
  table_enable: true,
  source: 'huggingface',
};

// Multi-GPU 客户端类
export class MultiGpuClient {
  private config: MultiGpuConfig;
  private options: MultiGpuOptions;

  constructor(config: Partial<MultiGpuConfig> = {}, options: Partial<MultiGpuOptions> = {}) {
    this.config = { ...defaultMultiGpuConfig, ...config };
    this.options = { ...defaultMultiGpuOptions, ...options };
  }

  // 更新配置
  updateConfig(newConfig: Partial<MultiGpuConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  // 更新选项
  updateOptions(newOptions: Partial<MultiGpuOptions>) {
    this.options = { ...this.options, ...newOptions };
  }

  // 将文件转换为 base64
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 单个文件解析
  async parseFile(file: File, customOptions?: Partial<MultiGpuOptions>): Promise<MultiGpuResponse> {
    try {
      const options = { ...this.options, ...customOptions };
      const fileBase64 = await this.fileToBase64(file);

      const payload = {
        file: fileBase64,
        options: options
      };

      console.log(`发送文件 ${file.name} 到 Multi-GPU 服务器:`, this.config.serverUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.serverUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Multi-GPU 服务器错误 (${file.name}):`, errorText);
        return {
          success: false,
          error: `服务器错误: ${response.status} - ${errorText}`
        };
      }

      const result = await response.json();
      console.log(`文件 ${file.name} 处理完成:`, result);

      return {
        success: true,
        output_dir: result.output_dir,
        results: result.results || {}
      };

    } catch (error) {
      console.error(`处理文件 ${file.name} 时出错:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  // 批量处理文件（带并发控制）
  async parseFilesBatch(
    files: File[],
    customOptions?: Partial<MultiGpuOptions>,
    onProgress?: (completed: number, total: number, currentFile?: string) => void
  ): Promise<{ [fileName: string]: MultiGpuResponse }> {
    const results: { [fileName: string]: MultiGpuResponse } = {};
    let completed = 0;
    const total = files.length;

    // 分批处理，控制并发数
    for (let i = 0; i < files.length; i += this.config.maxConcurrent) {
      const batch = files.slice(i, i + this.config.maxConcurrent);
      
      const batchPromises = batch.map(async (file) => {
        try {
          onProgress?.(completed, total, file.name);
          
          const result = await this.parseFile(file, customOptions);
          results[file.name] = result;
          
          completed++;
          onProgress?.(completed, total);
          
          return { fileName: file.name, result };
        } catch (error) {
          console.error(`批量处理文件 ${file.name} 时出错:`, error);
          results[file.name] = {
            success: false,
            error: error instanceof Error ? error.message : '批量处理失败'
          };
          
          completed++;
          onProgress?.(completed, total);
          
          return { fileName: file.name, result: results[file.name] };
        }
      });

      // 等待当前批次完成
      await Promise.allSettled(batchPromises);
    }

    return results;
  }

  // 处理 UploadedFile 数组
  async processUploadedFiles(
    uploadedFiles: UploadedFile[],
    customOptions?: Partial<MultiGpuOptions>,
    onProgress?: (completed: number, total: number, currentFile?: string) => void
  ): Promise<{ [fileId: string]: MultiGpuResponse }> {
    // 过滤出可处理的文件
    const processableFiles = uploadedFiles.filter(f => 
      f.status === 'uploaded' && f.type === 'pdf' && f.file
    );

    if (processableFiles.length === 0) {
      return {};
    }

    const files = processableFiles.map(f => f.file!);
    const results = await this.parseFilesBatch(files, customOptions, onProgress);

    // 将文件名映射回文件ID
    const resultsById: { [fileId: string]: MultiGpuResponse } = {};
    processableFiles.forEach(uploadedFile => {
      if (results[uploadedFile.name]) {
        resultsById[uploadedFile.id] = results[uploadedFile.name];
      }
    });

    return resultsById;
  }

  // 更新服务器配置
  updateServerConfig(serverUrl: string) {
    this.config.serverUrl = serverUrl;
  }
}

// 创建默认 Multi-GPU 客户端实例
export const multiGpuClient = new MultiGpuClient();
