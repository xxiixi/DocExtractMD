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

  // 移除本地txt文件读取方法，所有文件都通过后端处理

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
          fileName: response.data.fileName || file.name
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

  // 解析文件（使用原有后端）
  static async parseFile(file: File, fileId?: string): Promise<{ success: boolean; markdown?: string; error?: string }> {
    console.log('Parsing file:', file.name, file.type, file.size, 'fileId:', fileId);
    
    try {
      const response = await apiClient.parseFile(file, fileId);
      console.log('API response:', response);
      
      if (response.success && response.data) {
        // 后端返回的数据格式
        const result = response.data;
        console.log('Parse result:', result);
        
        if (result.status === 'success') {
          return {
            success: true,
            markdown: result.extracted_text || ''
          };
        } else {
          return {
            success: false,
            error: result.error_message || 'Parse failed'
          };
        }
      } else {
        console.error('API response error:', response.error);
        return {
          success: false,
          error: response.error || 'Parse failed'
        };
      }
    } catch (error) {
      console.error('Parse error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Parse failed'
      };
    }
  }

  // 使用MinerU API解析文件（通过后端代理）
  static async parseFileWithMinerU(file: File): Promise<{ success: boolean; markdown?: string; error?: string }> {
    console.log('Parsing file with MinerU proxy:', file.name, file.type, file.size);
    
    try {
      const response = await apiClient.parseFileWithMinerUProxy(file);
      console.log('MinerU proxy API response:', response);
      
      if (response.success && response.data) {
        const result = response.data;
        console.log('MinerU proxy parse result:', result);
        
        if (result.md_content) {
          return {
            success: true,
            markdown: result.md_content
          };
        } else {
          // 如果API没有返回内容，尝试从output目录读取
          console.log('API没有返回内容，尝试从output目录读取文件');
          return await this.readOutputFile(file.name);
        }
      } else {
        console.error('MinerU proxy API response error:', response.error);
        // 即使API失败，也尝试从output目录读取
        console.log('API失败，尝试从output目录读取文件');
        return await this.readOutputFile(file.name);
      }
    } catch (error) {
      console.error('MinerU proxy parse error:', error);
      // 即使发生错误，也尝试从output目录读取
      console.log('发生错误，尝试从output目录读取文件');
      return await this.readOutputFile(file.name);
    }
  }

  // 从output目录读取文件
  static async readOutputFile(filename: string): Promise<{ success: boolean; markdown?: string; error?: string }> {
    try {
      console.log('尝试从output目录读取文件:', filename);
      
      // 首先获取output目录列表
      const dirResponse = await apiClient.getOutputFile();
      if (!dirResponse.success || !dirResponse.data) {
        return {
          success: false,
          error: '无法获取output目录列表'
        };
      }
      
      const directories = dirResponse.data.items;
      if (!directories || directories.length === 0) {
        return {
          success: false,
          error: 'output目录为空'
        };
      }
      
      // 获取最新的目录（按名称排序，通常最新的目录名包含最新的时间戳）
      const sortedDirs = directories.sort((a: any, b: any) => b.name.localeCompare(a.name));
      const latestDir = sortedDirs[0];
      
      console.log('使用最新的输出目录:', latestDir.name);
      
      // 构建文件路径
      const baseName = filename.replace('.pdf', '');
      const filePath = `${latestDir.name}/${baseName}/auto/${baseName}.md`;
      
      console.log('尝试读取文件路径:', filePath);
      
      // 读取文件内容
      const fileResponse = await apiClient.getOutputFile(filePath);
      if (!fileResponse.success || !fileResponse.data) {
        return {
          success: false,
          error: `无法读取文件: ${fileResponse.error || '未知错误'}`
        };
      }
      
      if (fileResponse.data.type === 'file_content' && fileResponse.data.content) {
        console.log('成功从output目录读取文件，内容长度:', fileResponse.data.content.length);
        return {
          success: true,
          markdown: fileResponse.data.content
        };
      } else {
        return {
          success: false,
          error: '文件内容为空或格式错误'
        };
      }
      
    } catch (error) {
      console.error('读取output文件失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '读取output文件失败'
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
    options?: ProcessOptions & { useMinerU?: boolean }
  ): Promise<{ success: boolean; error?: string; updatedFiles?: UploadedFile[] }> {
    console.log('Starting file processing...', { processType, filesCount: files.length, useMinerU: options?.useMinerU });
    
    // 过滤掉纯文本文件，它们在前端处理
    const processableFiles = files.filter(f => 
      f.status === 'uploaded' && f.type !== 'markdown' && f.type !== 'text'
    );
    
    if (processableFiles.length === 0) {
      return { success: false, error: 'No files to process' };
    }

    console.log('Processable files:', processableFiles.map(f => ({ name: f.name, type: f.type, status: f.status })));

    for (const file of processableFiles) {
      try {
        // 更新状态为处理中
        files = this.updateFileStatus(files, file.id, { status: 'processing', progress: 0 });
        files = this.addProcessStep(files, file.id, { type: processType, status: 'running' });

        if (!file.file) {
          throw new Error('File not found');
        }

        // 根据处理类型执行相应操作
        let processResult;
        switch (processType) {
          case 'parse':
            // 根据选项决定使用哪个API
            if (options?.useMinerU) {
              processResult = await this.parseFileWithMinerU(file.file!);
            } else {
              processResult = await this.parseFile(file.file!, file.id);
            }
            break;
          case 'extract':
            const uploadResult = await this.uploadFile(file.file);
            if (!uploadResult.success) {
              throw new Error(uploadResult.error || 'Upload failed');
            }
            processResult = await this.extractContent(uploadResult.fileName!, options?.extractOptions);
            break;
          case 'convert':
            const uploadResult2 = await this.uploadFile(file.file);
            if (!uploadResult2.success) {
              throw new Error(uploadResult2.error || 'Upload failed');
            }
            processResult = await this.convertFormat(uploadResult2.fileName!, options?.convertOptions?.targetFormat || 'markdown');
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
        
        console.log('Updating file status to completed with content length:', resultContent?.length);
        
        files = this.updateFileStatus(files, file.id, { 
          status: 'completed', 
          progress: 100,
          markdown: resultContent
        });
        
        files = this.addProcessStep(files, file.id, { 
          type: processType, 
          status: 'completed',
          result: processResult
        });
        
        console.log('File processing completed:', {
          fileId: file.id,
          fileName: file.name,
          status: 'completed',
          contentLength: resultContent?.length
        });

      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        
        files = this.updateFileStatus(files, file.id, { 
          status: 'error', 
          progress: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        files = this.addProcessStep(files, file.id, { 
          type: processType, 
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { success: true, updatedFiles: files };
  }
}
