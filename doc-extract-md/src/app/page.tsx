'use client';

import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { UploadedFile, ProcessType, ProcessOptions } from '@/types';
import { FileProcessor } from '@/lib/fileProcessor';
import { websocketClient } from '@/lib/websocket';
import UploadSection from '@/components/UploadSection';
import FileListSection from '@/components/FileListSection';
import PreviewSection from '@/components/PreviewSection';

export default function Home() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processType, setProcessType] = useState<ProcessType>('parse');

  // 初始化WebSocket连接
  useEffect(() => {
    const initWebSocket = async () => {
      try {
        await websocketClient.connect();
        console.log('WebSocket connected successfully');
        
        // 设置进度更新回调
        websocketClient.onProgress((update) => {
          console.log('WebSocket progress update received:', update);
          console.log('Current files:', files.map(f => ({ id: f.id, name: f.name, status: f.status })));
          
          setFiles(prevFiles => {
            console.log('Looking for file with ID:', update.file_id);
            console.log('Available file IDs:', prevFiles.map(f => f.id));
            
            const fileIndex = prevFiles.findIndex(f => f.id === update.file_id);
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
          file.name.match(/\.(doc|docx|txt)$/i)) {
        
        const fileId = Date.now().toString() + i;
        const newFile = FileProcessor.createFileObject(file, fileId);
        
        // 所有文件都通过后端处理，包括txt文件
        // 移除前端的txt文件特殊处理逻辑
        
        newFiles.push(newFile);
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleProcessFiles = async (type: ProcessType = 'parse', options?: ProcessOptions) => {
    // 所有文件都需要通过后端处理
    const processableFiles = files.filter(f => 
      f.status === 'uploaded'
    );
    if (processableFiles.length === 0) return;

    setIsProcessing(true);
    setProcessType(type);

    // 立即更新文件状态为processing，这样Progress组件就会显示
    setFiles(prevFiles => 
      prevFiles.map(file => 
        processableFiles.some(pf => pf.id === file.id) 
          ? { ...file, status: 'processing', progress: 0 }
          : file
      )
    );

    try {
      // 使用文件处理服务批量处理文件
      const result = await FileProcessor.processFiles(files, type, options);
      
      if (result.success && result.updatedFiles) {
        // 更新文件状态
        console.log('Updating files state with:', result.updatedFiles.map(f => ({
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
    } catch (error) {
      console.error('Error during processing:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParseFiles = () => {
    handleProcessFiles('parse');
  };

  const handleExtractFiles = (options?: ProcessOptions['extractOptions']) => {
    handleProcessFiles('extract', { extractOptions: options });
  };

  const handleConvertFiles = (targetFormat: string) => {
    handleProcessFiles('convert', { 
      convertOptions: { targetFormat } 
    });
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (selectedFile === fileId) {
      setSelectedFile(null);
    }
  };

  const clearAllFiles = () => {
    setFiles([]);
    setSelectedFile(null);
  };

  const retryFile = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file || !file.file) return;

    // 重置文件状态
    setFiles(prev => FileProcessor.updateFileStatus(prev, fileId, {
      status: 'uploaded',
      progress: 0,
      error: undefined
    }));

    // 重新处理文件
    await handleProcessFiles(processType);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        <header className="border-b bg-background">
          <div className="px-6 py-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <h1>Document Processor</h1>
                <p className="text-muted-foreground">Upload documents and process them with various tools</p>
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
                onExtractFiles={handleExtractFiles}
                onConvertFiles={handleConvertFiles}
                onClearAllFiles={clearAllFiles}
                isProcessing={isProcessing}
                processType={processType}
                onProcessTypeChange={setProcessType}
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
