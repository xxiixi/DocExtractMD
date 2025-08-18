'use client';

import React, { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UploadedFile } from '@/types';

interface UploadSectionProps {
  files: UploadedFile[];
  onFileUpload: (files: FileList) => void;
  onParseFiles: () => void;
  onClearAllFiles: () => void;
  isProcessing: boolean;
}

export default function UploadSection({
  files,
  onFileUpload,
  onParseFiles,
  onClearAllFiles,
  isProcessing
}: UploadSectionProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    onFileUpload(droppedFiles);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFileUpload(e.target.files);
    }
  };

  const uploadedCount = files.filter(f => f.status === 'uploaded').length;
  const processingCount = files.filter(f => f.status === 'processing').length;
  const completedCount = files.filter(f => f.status === 'completed').length;
  // 只处理PDF文件
  const processableCount = files.filter(f => 
    f.status === 'uploaded' && f.type === 'pdf'
  ).length;

  return (
    <Card className="p-6">
      <h3 className="mb-4">上传PDF文档</h3>
      
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
      >
        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <div className="space-y-2">
          <p>拖拽PDF文件到这里</p>
          <p className="text-muted-foreground">或者</p>
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              选择文件
              <input
                type="file"
                multiple
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileInputChange}
              />
            </label>
          </Button>
        </div>
        <p className="text-muted-foreground mt-4">支持PDF文件格式</p>
      </div>

      {/* MinerU处理说明 */}
      <div className="mt-6 p-4 border rounded-sm bg-blue-50">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">MinerU PDF解析</span>
        </div>
        <p className="text-xs text-blue-600">
          使用MinerU AI模型进行PDF解析
        </p>
      </div>

      {/* Process Section */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground">
              {uploadedCount} 待处理 • {processingCount} 处理中 • {completedCount} 已完成
            </div>
          </div>
          
          {/* Parse Button */}
          <div className="flex gap-2">
            <Button 
              onClick={onParseFiles}
              disabled={processableCount === 0 || isProcessing}
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              使用MinerU解析 ({processableCount})
            </Button>
            <Button 
              variant="outline" 
              onClick={onClearAllFiles}
              disabled={isProcessing}
            >
              清空所有
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
