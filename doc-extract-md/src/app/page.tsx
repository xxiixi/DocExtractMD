'use client';

import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import type { UploadedFile } from '@/types';
import UploadSection from '@/features/upload/UploadSection';
import FileListSection from '@/features/file-list/FileListSection';
import PreviewSection from '@/features/preview/PreviewSection';
import { websocketClient, type ProgressUpdate } from '@/services/websocket';
import { FileProcessor } from '@/services/fileProcessor';

export default function Home() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);



  // 初始化WebSocket连接
  useEffect(() => {
    const initWebSocket = async () => {
      try {
        await websocketClient.connect();
        console.log('WebSocket connected successfully');
        
        // 设置进度更新回调
        websocketClient.onProgress((update: ProgressUpdate) => {
          console.log('WebSocket progress update received:', update);
          console.log('Current files:', files.map((f: UploadedFile) => ({ id: f.id, name: f.name, status: f.status })));
          
          setFiles(prevFiles => {
            console.log('Looking for file with ID:', update.file_id);
            console.log('Available file IDs:', prevFiles.map((f: UploadedFile) => f.id));
            
            const fileIndex = prevFiles.findIndex((f: UploadedFile) => f.id === update.file_id);
            console.log('File index found:', fileIndex);
            
            if (fileIndex !== -1) {
              const newFiles = [...prevFiles];
              const file = newFiles[fileIndex];
              console.log('Updating file:', file.name, 'with update:', update);
              
              switch (update.type) {
                case 'progress_update':
                  newFiles[fileIndex] = {
                    ...file,
                    progress: update.progress || 0,
                    currentStep: update.step || ''
                  };
                  console.log('Updated progress to:', update.progress, '%');
                  break;
                case 'completion_update':
                  newFiles[fileIndex] = {
                    ...file,
                    status: 'completed',
                    progress: 100,
                    markdown: update.result?.extracted_text || '',
                    currentStep: 'completed'
                  };
                  console.log('File completed with content length:', update.result?.extracted_text?.length);
                  break;
                case 'error_update':
                  newFiles[fileIndex] = {
                    ...file,
                    status: 'error',
                    progress: 0,
                    error: update.error || 'Unknown error',
                    currentStep: 'error'
                  };
                  console.log('File error:', update.error);
                  break;
              }
              
              return newFiles;
            } else {
              console.log('File not found with ID:', update.file_id);
            }
            return prevFiles;
          });
        });
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };

    initWebSocket();

    // 清理函数
    return () => {
      websocketClient.disconnect();
    };
  }, []);

  const handleFileUpload = async (uploadedFiles: FileList) => {
    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      // 支持更多文件类型
      if (file.type === 'application/pdf' || 
          file.name.endsWith('.pdf') ||
          file.type.startsWith('image/') ||
          file.name.match(/\.(png|jpg|jpeg|gif|bmp|tiff)$/i) ||
          file.name.match(/\.(doc|docx|txt|md|markdown)$/i)) {
        
        const fileId = Date.now().toString() + i;
        const newFile = FileProcessor.createFileObject(file, fileId);
        
        // 所有文件都通过后端处理，包括txt文件
        // 移除前端的txt文件特殊处理逻辑
        
        newFiles.push(newFile);
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleParseFiles = async (useMinerU: boolean = false) => {
    // 分离纯文本文件和其他文件
    const textFiles = files.filter(f => 
      f.status === 'uploaded' && 
      (f.name.endsWith('.md') || f.name.endsWith('.markdown') || f.name.endsWith('.txt'))
    );
    
    const otherFiles = files.filter(f => 
      f.status === 'uploaded' && 
      !f.name.endsWith('.md') && 
      !f.name.endsWith('.markdown') && 
      !f.name.endsWith('.txt')
    );
    
    if (textFiles.length === 0 && otherFiles.length === 0) return;

    setIsProcessing(true);

    // 立即更新所有文件状态为processing
    setFiles(prevFiles => 
      prevFiles.map(file => 
        (textFiles.some(tf => tf.id === file.id) || otherFiles.some(of => of.id === file.id))
          ? { ...file, status: 'processing', progress: 0 }
          : file
      )
    );

    try {
      // 1. 先处理纯文本文件（前端直接处理）
      for (const file of textFiles) {
        try {
          if (!file.file) continue;
          
          // 判断文件类型
          const isMarkdown = file.name.endsWith('.md') || file.name.endsWith('.markdown');
          const isTxt = file.name.endsWith('.txt');
          
          // 更新进度
          setFiles(prevFiles => 
            prevFiles.map(f => 
              f.id === file.id 
                ? { ...f, progress: 25, currentStep: isMarkdown ? '读取markdown文件' : '读取文本文件' }
                : f
            )
          );
          
          // 读取文件内容
          const text = await file.file.text();
          
          setFiles(prevFiles => 
            prevFiles.map(f => 
              f.id === file.id 
                ? { ...f, progress: 50, currentStep: isMarkdown ? '处理markdown内容' : '处理文本内容' }
                : f
            )
          );
          
          // 直接设置为内容
          setFiles(prevFiles => 
            prevFiles.map(f => 
              f.id === file.id 
                ? { 
                    ...f, 
                    status: 'completed', 
                    progress: 100, 
                    markdown: text,
                    currentStep: '完成'
                  }
                : f
            )
          );
          
          console.log(`${isMarkdown ? 'Markdown' : 'Text'}文件 ${file.name} 处理完成，内容长度: ${text.length}`);
          
        } catch (error) {
          const isMarkdown = file.name.endsWith('.md') || file.name.endsWith('.markdown');
          console.error(`处理${isMarkdown ? 'markdown' : 'text'}文件 ${file.name} 失败:`, error);
          setFiles(prevFiles => 
            prevFiles.map(f => 
              f.id === file.id 
                ? { 
                    ...f, 
                    status: 'error', 
                    progress: 0, 
                    error: error instanceof Error ? error.message : '处理失败',
                    currentStep: '错误'
                  }
                : f
            )
          );
        }
      }

      // 2. 处理其他文件（通过后端）
      if (otherFiles.length > 0) {
        const result = await FileProcessor.processFiles(files, 'parse', { useMinerU });
        
        if (result.success && result.updatedFiles) {
          // 更新文件状态
          console.log('Updating files state with:', result.updatedFiles.map((f: UploadedFile) => ({
            id: f.id,
            name: f.name,
            status: f.status,
            hasMarkdown: !!f.markdown,
            markdownLength: f.markdown?.length
          })));
          setFiles(result.updatedFiles);
          console.log('Files updated successfully');
        } else {
          console.error('Processing failed:', result.error);
        }
      }
    } catch (error) {
      console.error('Error during processing:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter((f: UploadedFile) => f.id !== fileId));
    if (selectedFile === fileId) {
      setSelectedFile(null);
    }
  };

  const clearAllFiles = () => {
    setFiles([]);
    setSelectedFile(null);
  };

  const retryFile = async (fileId: string) => {
    const file = files.find((f: UploadedFile) => f.id === fileId);
    if (!file || !file.file) return;

    // 重置文件状态
    setFiles(prev => FileProcessor.updateFileStatus(prev, fileId, {
      status: 'uploaded',
      progress: 0,
      error: undefined
    }));

    // 重新处理文件
    await handleParseFiles();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        <header className="border-b bg-background">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <h1>Document Processor</h1>
                  <p className="text-muted-foreground">Upload documents and process them with various tools</p>
                </div>
              </div>
              <div className="flex gap-4">
                {/* MinerU功能已集成到主页面 */}
              </div>
            </div>
          </div>
        </header>

        <div className="px-6 py-8">
          


          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Upload Section */}
            <div className="md:col-span-2 space-y-6">
              <UploadSection
                files={files}
                onFileUpload={handleFileUpload}
                onParseFiles={handleParseFiles}
                onClearAllFiles={clearAllFiles}
                isProcessing={isProcessing}
              />

              {/* File List */}
              <FileListSection
                files={files}
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                onFileRemove={removeFile}
                onFileRetry={retryFile}
              />
            </div>

            {/* Preview Section */}
            <div className="md:col-span-3">
              <PreviewSection
                files={files}
                selectedFile={selectedFile}
              />
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
