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
  static async parseFileWithMinerU(file: File): Promise<{ success: boolean; markdown?: string; error?: string }> {
    console.log('使用MinerU解析文件:', file.name, file.type, file.size);
    
    try {
      const response = await apiClient.parseFileWithMinerU(file);
      console.log('MinerU API响应:', response);
      
      if (response.success && response.data) {
        const result = response.data;
        console.log('MinerU解析结果:', result);
        console.log('MinerU结果类型:', typeof result);
        console.log('MinerU结果键:', Object.keys(result));
        
        // 从MinerU响应中提取Markdown内容
        if (result.results && Object.keys(result.results).length > 0) {
          console.log('MinerU results键:', Object.keys(result.results));
          const filename = Object.keys(result.results)[0];
          console.log('处理文件名:', filename);
          const fileResult = result.results[filename];
          console.log('文件结果:', fileResult);
          console.log('文件结果键:', Object.keys(fileResult));
          
          // MinerU API直接返回md_content，没有status字段
          if (fileResult.md_content) {
            console.log('成功获取Markdown内容，长度:', fileResult.md_content.length);
            return {
              success: true,
              markdown: fileResult.md_content
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

  // 批量处理文件（只支持MinerU解析）
  static async processFiles(
    files: UploadedFile[],
    processType: ProcessType = 'parse',
    options?: ProcessOptions
  ): Promise<{ success: boolean; error?: string; updatedFiles?: UploadedFile[] }> {
    console.log('开始文件处理...', { processType, filesCount: files.length });
    
    // 只处理PDF文件
    const processableFiles = files.filter(f => 
      f.status === 'uploaded' && f.type === 'pdf'
    );
    
    if (processableFiles.length === 0) {
      return { success: false, error: '没有可处理的PDF文件' };
    }

    console.log('可处理的文件:', processableFiles.map(f => ({ name: f.name, type: f.type, status: f.status })));

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

        // 完成处理
        console.log('更新文件状态为完成，内容长度:', processResult.markdown?.length);
        
        files = this.updateFileStatus(files, file.id, { 
          status: 'completed', 
          progress: 100,
          markdown: processResult.markdown
        });
        
        files = this.addProcessStep(files, file.id, { 
          type: processType, 
          status: 'completed',
          result: processResult
        });
        
        console.log('文件处理完成:', {
          fileId: file.id,
          fileName: file.name,
          status: 'completed',
          contentLength: processResult.markdown?.length
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
