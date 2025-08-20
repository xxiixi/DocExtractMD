import { UploadedFile, FileType, ProcessType, ProcessOptions } from '@/types';
import { apiClient } from './api';
import { multiGpuClient, MultiGpuOptions } from './multiGpuClient';

// 文件处理服务类
export class FileProcessor {
  // 获取文件类型
  static getFileType(file: File): FileType {
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      return 'pdf';
    } else if (file.type.startsWith('image/')) {
      return 'image';
    } else if (file.name.match(/\.(md|markdown)$/i)) {
      return 'markdown';
    } else if (file.name.match(/\.txt$/i)) {
      return 'text';
    } else if (file.type.includes('document') || file.name.match(/\.(doc|docx)$/)) {
      return 'document';
    } else {
      return 'text';
    }
  }

  // 创建文件对象
  static createFileObject(file: File, id: string): UploadedFile {
    return {
      id,
      name: file.name,
      size: file.size,
      type: this.getFileType(file),
      status: 'uploaded',
      progress: 0,
      file,
      processHistory: []
    };
  }

  // 更新文件状态
  static updateFileStatus(
    files: UploadedFile[],
    fileId: string,
    updates: Partial<UploadedFile>
  ): UploadedFile[] {
    return files.map(f => f.id === fileId ? { ...f, ...updates } : f);
  }

  // 添加处理步骤
  static addProcessStep(
    files: UploadedFile[],
    fileId: string,
    step: {
      type: ProcessType;
      status: 'pending' | 'running' | 'completed' | 'failed';
      result?: unknown;
      error?: string;
    }
  ): UploadedFile[] {
    return files.map(f => {
      if (f.id === fileId) {
        const processHistory = f.processHistory || [];
        const newStep = {
          ...step,
          startTime: step.status === 'running' ? new Date() : undefined,
          endTime: ['completed', 'failed'].includes(step.status) ? new Date() : undefined,
        };
        
        return {
          ...f,
          processHistory: [...processHistory, newStep]
        };
      }
      return f;
    });
  }

  // 使用MinerU API解析文件（直接调用）
  static async parseFileWithMinerU(file: File): Promise<{ success: boolean; markdown?: string; error?: string; images?: Record<string, string> }> {
    try {
      const response = await apiClient.parseFileWithMinerU(file);
      if (response.success && response.data) {
        const result = response.data;
        
        // 从MinerU响应中提取Markdown内容
        if (result.results && Object.keys(result.results).length > 0) {
          const filename = Object.keys(result.results)[0];
          const fileResult = result.results[filename];
          
          if (fileResult.md_content) {            
            const images = fileResult.images || {};
            return {
              success: true,
              markdown: fileResult.md_content,
              images: images
            };
          } else {
            console.error('文件结果中没有md_content:', fileResult);
            return {
              success: false,
              error: 'MinerU未返回Markdown内容'
            };
          }
        } else {
          console.error('MinerU results为空或格式不正确:', result.results);
          return {
            success: false,
            error: 'MinerU返回结果为空'
          };
        }
      } else {
        console.error('MinerU API响应错误:', response.error);
        return {
          success: false,
          error: response.error || 'MinerU解析失败'
        };
      }
    } catch (error) {
      console.error('MinerU解析错误:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'MinerU解析失败'
      };
    }
  }

  // 批量处理文件（仅支持Multi-GPU解析）
  static async processFiles(
    files: UploadedFile[],
    processType: ProcessType = 'parse',
    options?: ProcessOptions & { 
      useMultiGpu?: boolean; 
      multiGpuOptions?: Partial<MultiGpuOptions>;
      multiGpuConfig?: { serverUrl: string; maxConcurrent: number; timeout: number; retries: number };
    }
  ): Promise<{ success: boolean; error?: string; updatedFiles?: UploadedFile[] }> {
    
    // 只处理PDF文件
    const processableFiles = files.filter(f => 
      f.status === 'uploaded' && f.type === 'pdf'
    );
    
    if (processableFiles.length === 0) {
      return { success: false, error: '没有可处理的PDF文件' };
    }

    console.log('可处理的文件:', processableFiles.map(f => ({ name: f.name, type: f.type, status: f.status })));

    // 强制使用Multi-GPU模式
    const multiGpuOptions = options?.multiGpuOptions || {};
    const multiGpuConfig = options?.multiGpuConfig;

    // 更新Multi-GPU客户端配置
    if (multiGpuConfig) {
      multiGpuClient.updateConfig(multiGpuConfig);
    }

    // 始终使用Multi-GPU并发处理
    return await this.processFilesWithMultiGpu(files, processableFiles, processType, multiGpuOptions);
  }

  // 使用Multi-GPU并发处理文件
  private static async processFilesWithMultiGpu(
    files: UploadedFile[],
    processableFiles: UploadedFile[],
    processType: ProcessType,
    multiGpuOptions: Partial<MultiGpuOptions>
  ): Promise<{ success: boolean; error?: string; updatedFiles?: UploadedFile[] }> {
    
    try {
      // 将所有文件状态更新为处理中
      for (const file of processableFiles) {
        files = this.updateFileStatus(files, file.id, { status: 'processing', progress: 0 });
        files = this.addProcessStep(files, file.id, { type: processType, status: 'running' });
      }

      // 使用Multi-GPU客户端处理文件
      const results = await multiGpuClient.processUploadedFiles(
        processableFiles,
        multiGpuOptions,
        (completed, total, currentFile) => {
          // 更新进度
          const progress = Math.round((completed / total) * 100);
          console.log(`Multi-GPU 处理进度: ${completed}/${total} (${progress}%) - 当前文件: ${currentFile || 'N/A'}`);
        }
      );

      // 处理结果
      for (const file of processableFiles) {
        const result = results[file.id];
        
        if (result && result.success) {
          // 提取Markdown内容和图片
          let markdown = '';
          let images: Record<string, string> = {};

          if (result.results && Object.keys(result.results).length > 0) {
            const filename = Object.keys(result.results)[0];
            const fileResult = result.results[filename];
            
            if (fileResult.md_content) {
              markdown = fileResult.md_content;
            }
            
            if (fileResult.images) {
              images = fileResult.images;
            }
          }

          files = this.updateFileStatus(files, file.id, { 
            status: 'completed', 
            progress: 100,
            markdown: markdown,
            images: images
          });
          
          files = this.addProcessStep(files, file.id, { 
            type: processType, 
            status: 'completed',
            result: { success: true, markdown, images }
          });
        } else {
          const error = result?.error || 'Multi-GPU处理失败';
          
          files = this.updateFileStatus(files, file.id, { 
            status: 'error', 
            progress: 0,
            error: error
          });
          
          files = this.addProcessStep(files, file.id, { 
            type: processType, 
            status: 'failed',
            error: error
          });
        }
      }

      return { success: true, updatedFiles: files };

    } catch (error) {
      console.error('Multi-GPU处理过程中出错:', error);
      
      // 将所有处理中的文件标记为错误
      for (const file of processableFiles) {
        files = this.updateFileStatus(files, file.id, { 
          status: 'error', 
          progress: 0,
          error: error instanceof Error ? error.message : 'Multi-GPU处理失败'
        });
        
        files = this.addProcessStep(files, file.id, { 
          type: processType, 
          status: 'failed',
          error: error instanceof Error ? error.message : 'Multi-GPU处理失败'
        });
      }

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Multi-GPU处理失败',
        updatedFiles: files 
      };
    }
  }

  // 传统的串行处理文件
  private static async processFilesSequentially(
    files: UploadedFile[],
    processableFiles: UploadedFile[],
    processType: ProcessType
  ): Promise<{ success: boolean; error?: string; updatedFiles?: UploadedFile[] }> {
    
    for (const file of processableFiles) {
      try {
        // 更新状态为处理中
        files = this.updateFileStatus(files, file.id, { status: 'processing', progress: 0 });
        files = this.addProcessStep(files, file.id, { type: processType, status: 'running' });

        if (!file.file) {
          throw new Error('文件未找到');
        }

        // 使用MinerU解析文件
        const processResult = await this.parseFileWithMinerU(file.file);

        if (!processResult.success) {
          throw new Error(processResult.error || '解析失败');
        }
        
        files = this.updateFileStatus(files, file.id, { 
          status: 'completed', 
          progress: 100,
          markdown: processResult.markdown,
          images: processResult.images  // 保存图片数据
        });
        
        files = this.addProcessStep(files, file.id, { 
          type: processType, 
          status: 'completed',
          result: processResult
        });
      

      } catch (error) {
        console.error(`处理文件 ${file.name} 时出错:`, error);
        
        files = this.updateFileStatus(files, file.id, { 
          status: 'error', 
          progress: 0,
          error: error instanceof Error ? error.message : '未知错误'
        });
        
        files = this.addProcessStep(files, file.id, { 
          type: processType, 
          status: 'failed',
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    }

    return { success: true, updatedFiles: files };
  }
}
