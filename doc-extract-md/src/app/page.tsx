'use client';

import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import type { UploadedFile } from '@/types';
import UploadSection from '@/features/upload/UploadSection';
import FileListSection from '@/features/file-list/FileListSection';
import PreviewSection from '@/features/preview/PreviewSection';
import { FileProcessor } from '@/services/fileProcessor';

export default function Home() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (uploadedFiles: FileList) => {
    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      // 只支持PDF文件
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const fileId = Date.now().toString() + i;
        const newFile = FileProcessor.createFileObject(file, fileId);
        newFiles.push(newFile);
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleParseFiles = async () => {
    const pdfFiles = files.filter(f => 
      f.status === 'uploaded' && f.type === 'pdf'
    );
    
    if (pdfFiles.length === 0) return;

    setIsProcessing(true);

    // 立即更新所有文件状态为processing
    setFiles(prevFiles => 
      prevFiles.map(file => 
        pdfFiles.some(pf => pf.id === file.id)
          ? { ...file, status: 'processing', progress: 0 }
          : file
      )
    );

    try {
      const result = await FileProcessor.processFiles(files, 'parse');
      
      if (result.success && result.updatedFiles) {
        console.log('文件处理完成，更新文件状态');
        setFiles(result.updatedFiles);
      } else {
        console.error('处理失败:', result.error);
      }
    } catch (error) {
      console.error('处理过程中出错:', error);
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
      {/* 设置width为full（浏览器宽度 */}
      <div className="w-full"> 
        <header className="border-b bg-background">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <h1>MinerU PDF解析器</h1>
                  <p className="text-muted-foreground">上传PDF文档并使用MinerU AI模型进行智能解析</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-8">
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
            <div className="md:col-span-5">
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
