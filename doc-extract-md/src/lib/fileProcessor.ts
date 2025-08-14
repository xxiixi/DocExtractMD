import { UploadedFile, FileType, ProcessType, ProcessOptions } from '@/types';
import { apiClient } from './api';

// 文件处理服务类
export class FileProcessor {
  // 获取文件类型
  static getFileType(file: File): FileType {
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      return 'pdf';
    } else if (file.type.startsWith('image/')) {
      return 'image';
    } else if (file.type.includes('document') || file.name.match(/\.(doc|docx|txt)$/)) {
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

  // 读取txt文件内容
  static async readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsText(file);
    });
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

  // 上传文件
  static async uploadFile(file: File): Promise<{ success: boolean; fileName?: string; error?: string }> {
    try {
      const response = await apiClient.uploadFile(file);
      
      if (response.success && response.data) {
        return {
          success: true,
          fileName: response.data.fileName
        };
      } else {
        return {
          success: false,
          error: response.error || 'Upload failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  // 解析文件
  static async parseFile(fileName: string): Promise<{ success: boolean; markdown?: string; error?: string }> {
    try {
      const response = await apiClient.parseFile(fileName);
      
      if (response.success && response.data) {
        return {
          success: true,
          markdown: response.data.markdown
        };
      } else {
        return {
          success: false,
          error: response.error || 'Parse failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Parse failed'
      };
    }
  }

  // 提取内容（预留接口）
  static async extractContent(fileName: string, options?: ProcessOptions['extractOptions']): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      const response = await apiClient.extractContent(fileName, options);
      
      if (response.success && response.data) {
        return {
          success: true,
          content: typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
        };
      } else {
        return {
          success: false,
          error: response.error || 'Extract failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Extract failed'
      };
    }
  }

  // 转换格式（预留接口）
  static async convertFormat(fileName: string, targetFormat: string): Promise<{ success: boolean; convertedFile?: string; error?: string }> {
    try {
      const response = await apiClient.convertFormat(fileName, targetFormat);
      
      if (response.success && response.data) {
        return {
          success: true,
          convertedFile: typeof response.data === 'string' ? response.data : (response.data as { convertedFile?: string }).convertedFile
        };
      } else {
        return {
          success: false,
          error: response.error || 'Convert failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Convert failed'
      };
    }
  }

  // 批量处理文件
  static async processFiles(
    files: UploadedFile[],
    processType: ProcessType = 'parse',
    options?: ProcessOptions
  ): Promise<{ success: boolean; error?: string }> {
    // 对于txt文件，即使状态是completed也可以处理
    const processableFiles = files.filter(f => 
      f.status === 'uploaded' || (f.type === 'text' && f.status === 'completed')
    );
    
    if (processableFiles.length === 0) {
      return { success: false, error: 'No files to process' };
    }

    for (const file of processableFiles) {
      try {
        // 如果是txt文件且已经有内容，直接标记为完成
        if (file.type === 'text' && file.content && file.status === 'completed') {
          // txt文件已经处理完成，跳过
          continue;
        }

        // 更新状态为处理中
        this.updateFileStatus(files, file.id, { status: 'processing', progress: 0 });
        this.addProcessStep(files, file.id, { type: processType, status: 'running' });

        if (!file.file) {
          throw new Error('File not found');
        }

        // 上传文件
        this.updateFileStatus(files, file.id, { progress: 25 });
        const uploadResult = await this.uploadFile(file.file);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Upload failed');
        }

        // 根据处理类型执行相应操作
        this.updateFileStatus(files, file.id, { progress: 50 });
        
        let processResult;
        switch (processType) {
          case 'parse':
            processResult = await this.parseFile(uploadResult.fileName!);
            break;
          case 'extract':
            processResult = await this.extractContent(uploadResult.fileName!, options?.extractOptions);
            break;
          case 'convert':
            processResult = await this.convertFormat(uploadResult.fileName!, options?.convertOptions?.targetFormat || 'markdown');
            break;
          default:
            throw new Error(`Unsupported process type: ${processType}`);
        }

        if (!processResult.success) {
          throw new Error(processResult.error || `${processType} failed`);
        }

        // 完成处理
        const resultContent = 'markdown' in processResult ? processResult.markdown : 
                             'content' in processResult ? processResult.content : 
                             'convertedFile' in processResult ? processResult.convertedFile : '';
        this.updateFileStatus(files, file.id, { 
          status: 'completed', 
          progress: 100,
          markdown: resultContent
        });
        
        this.addProcessStep(files, file.id, { 
          type: processType, 
          status: 'completed',
          result: processResult
        });

      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        
        this.updateFileStatus(files, file.id, { 
          status: 'error', 
          progress: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        this.addProcessStep(files, file.id, { 
          type: processType, 
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { success: true };
  }
}
