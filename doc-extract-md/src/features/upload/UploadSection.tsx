'use client';

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { UploadedFile } from '@/types';
import { apiClient } from '@/services/api';

interface UploadSectionProps {
  files: UploadedFile[];
  onFileUpload: (files: FileList) => void;
  onParseFiles: (useMinerU?: boolean) => void;
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
  const [useMinerU, setUseMinerU] = useState(false);
  const [mineruStatus, setMineruStatus] = useState<'checking' | 'healthy' | 'unhealthy' | 'error'>('checking');

  // 检查MinerU服务状态
  React.useEffect(() => {
    checkMinerUHealth();
  }, []);

  const checkMinerUHealth = async () => {
    try {
      const response = await apiClient.checkMinerUHealth();
      if (response.success && response.data?.status === 'healthy') {
        setMineruStatus('healthy');
      } else {
        setMineruStatus('unhealthy');
      }
    } catch (err) {
      setMineruStatus('error');
    }
  };

  const getStatusIcon = () => {
    switch (mineruStatus) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'unhealthy':
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (mineruStatus) {
      case 'healthy':
        return 'MinerU服务正常';
      case 'unhealthy':
        return 'MinerU服务异常';
      case 'error':
        return '无法连接MinerU服务';
      default:
        return '检查MinerU服务状态...';
    }
  };

  const handleParseClick = () => {
    onParseFiles(useMinerU);
  };

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
                accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp,.tiff,.doc,.docx,.txt,.md,.markdown,application/pdf,image/*"
                className="hidden"
                onChange={handleFileInputChange}
              />
            </label>
          </Button>
        </div>
        <p className="text-muted-foreground mt-4">PDF, Images, Documents, Text files, Markdown files</p>
      </div>

      {/* MinerU处理选项 */}
      <div className="mt-6 p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="mineru-switch" className="text-sm font-medium">
              使用MinerU处理PDF
            </Label>
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span className="text-xs text-gray-600">{getStatusText()}</span>
            </div>
          </div>
          <Switch
            id="mineru-switch"
            checked={useMinerU}
            onCheckedChange={setUseMinerU}
            disabled={mineruStatus !== 'healthy'}
          />
        </div>
        <p className="text-xs text-gray-500">
          {useMinerU 
            ? '将使用MinerU API进行PDF解析，提供更好的表格和公式识别能力'
            : '使用默认的后端解析服务'
          }
        </p>
      </div>

      {/* Process Section */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground">
              {uploadedCount} ready • {processingCount} processing • {completedCount} completed
            </div>
          </div>
          
          {/* Parse Button */}
          <div className="flex gap-2">
            <Button 
              onClick={handleParseClick}
              disabled={processableCount === 0 || isProcessing || (useMinerU && mineruStatus !== 'healthy')}
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              {useMinerU ? '使用MinerU解析' : '解析文件'} ({processableCount})
            </Button>
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
