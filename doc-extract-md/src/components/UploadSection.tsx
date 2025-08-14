'use client';

import React, { useState } from 'react';
import { Upload, Play, FileText, Image, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UploadedFile, ProcessType, ProcessOptions } from '@/types';

interface UploadSectionProps {
  files: UploadedFile[];
  onFileUpload: (files: FileList) => void;
  onParseFiles: () => void;
  onExtractFiles?: (options?: ProcessOptions['extractOptions']) => void;
  onConvertFiles?: (targetFormat: string) => void;
  onClearAllFiles: () => void;
  isProcessing: boolean;
  processType: ProcessType;
  onProcessTypeChange: (type: ProcessType) => void;
}

export default function UploadSection({
  files,
  onFileUpload,
  onParseFiles,
  onExtractFiles,
  onConvertFiles,
  onClearAllFiles,
  isProcessing,
  processType,
  onProcessTypeChange
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
  // 所有文件都需要通过后端处理
  const processableCount = files.filter(f => 
    f.status === 'uploaded'
  ).length;

  const getProcessButton = () => {
    switch (processType) {
      case 'parse':
        return (
          <Button 
            onClick={onParseFiles}
            disabled={processableCount === 0 || isProcessing}
            className="flex-1"
          >
            <FileText className="w-4 h-4 mr-2" />
            Parse Files ({processableCount})
          </Button>
        );
      case 'extract':
        return (
          <Button 
            onClick={() => onExtractFiles?.()}
            disabled={processableCount === 0 || isProcessing}
            className="flex-1"
          >
            <Image className="w-4 h-4 mr-2" />
            Extract Content ({processableCount})
          </Button>
        );
      case 'convert':
        return (
          <Button 
            onClick={() => onConvertFiles?.('markdown')}
            disabled={processableCount === 0 || isProcessing}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Convert Files ({processableCount})
          </Button>
        );
      default:
        return (
          <Button 
            onClick={onParseFiles}
            disabled={processableCount === 0 || isProcessing}
            className="flex-1"
          >
            <Play className="w-4 h-4 mr-2" />
            Process Files ({processableCount})
          </Button>
        );
    }
  };

  return (
    <Card className="p-6">
      <h3 className="mb-4">Upload Documents</h3>
      
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
          <p>Drag and drop files here</p>
          <p className="text-muted-foreground">or</p>
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              Choose Files
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp,.tiff,.doc,.docx,.txt,application/pdf,image/*"
                className="hidden"
                onChange={handleFileInputChange}
              />
            </label>
          </Button>
        </div>
        <p className="text-muted-foreground mt-4">PDF, Images, Documents, Text files</p>
      </div>

      {/* Process Type Selection */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground">
              {uploadedCount} ready • {processingCount} processing • {completedCount} completed
            </div>
          </div>
          
          {/* Process Type Buttons */}
          <div className="flex gap-2">
            <Button
              variant={processType === 'parse' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onProcessTypeChange('parse')}
              disabled={isProcessing}
            >
              <FileText className="w-4 h-4 mr-1" />
              Parse
            </Button>
            <Button
              variant={processType === 'extract' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onProcessTypeChange('extract')}
              disabled={isProcessing}
            >
              <Image className="w-4 h-4 mr-1" />
              Extract
            </Button>
            <Button
              variant={processType === 'convert' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onProcessTypeChange('convert')}
              disabled={isProcessing}
            >
              <Download className="w-4 h-4 mr-1" />
              Convert
            </Button>
          </div>
          
          {/* Process Button */}
          <div className="flex gap-2">
            {getProcessButton()}
            <Button 
              variant="outline" 
              onClick={onClearAllFiles}
              disabled={isProcessing}
            >
              Clear All
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
