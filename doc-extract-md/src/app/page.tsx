'use client';

import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { UploadedFile, ProcessType, ProcessOptions } from '@/types';
import { FileProcessor } from '@/lib/fileProcessor';
import UploadSection from '@/components/UploadSection';
import FileListSection from '@/components/FileListSection';
import PreviewSection from '@/components/PreviewSection';

export default function Home() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processType, setProcessType] = useState<ProcessType>('parse');

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
        
        // 如果是txt文件，直接读取内容
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          try {
            const text = await file.text();
            newFile.content = text;
            newFile.markdown = text; // 同时设置markdown字段用于预览
            newFile.status = 'completed';
            newFile.progress = 100;
          } catch (error) {
            console.error('Error reading txt file:', error);
            newFile.status = 'error';
            newFile.error = 'Failed to read text file';
          }
        }
        
        newFiles.push(newFile);
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleProcessFiles = async (type: ProcessType = 'parse', options?: ProcessOptions) => {
    // 对于txt文件，即使状态是completed也可以处理
    const processableFiles = files.filter(f => 
      f.status === 'uploaded' || (f.type === 'text' && f.status === 'completed')
    );
    if (processableFiles.length === 0) return;

    setIsProcessing(true);
    setProcessType(type);

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
