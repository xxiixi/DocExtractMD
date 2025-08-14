'use client';

import React from 'react';
import { FileText, CheckCircle, AlertCircle, Clock, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { UploadedFile } from '@/types';

interface FileListSectionProps {
  files: UploadedFile[];
  selectedFile: string | null;
  onFileSelect: (fileId: string) => void;
  onFileRemove: (fileId: string) => void;
  onFileRetry?: (fileId: string) => void;
}

export default function FileListSection({
  files,
  selectedFile,
  onFileSelect,
  onFileRemove,
  onFileRetry
}: FileListSectionProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploaded':
        return <FileText className="w-4 h-4 text-muted-foreground" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'extracting':
        return <FileText className="w-4 h-4 text-orange-500" />;
      case 'converting':
        return <FileText className="w-4 h-4 text-purple-500" />;
    }
  };

  // 样式常量
  const fileItemStyles = {
    base: "p-3 border rounded-lg cursor-pointer transition-colors",
    selected: "border-primary bg-primary/5",
    default: "border-border hover:border-primary/50"
  };

  const fileItemLayout = {
    header: "flex items-start justify-between mb-2",
    content: "flex items-start gap-2 flex-1 min-w-0",
    iconContainer: "flex-shrink-0 mt-0.5",
    nameContainer: "flex-1 min-w-0",
    nameText: "break-words",
    actions: "flex items-center gap-2 flex-shrink-0 ml-2",
    fileInfo: "text-muted-foreground text-sm",
    progress: "h-2 mt-2",
    error: "text-destructive mt-2 text-sm"
  };

  const getStatusBadge = (status: UploadedFile['status']) => {
    const variants: Record<UploadedFile['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
      uploaded: 'outline',
      processing: 'secondary',
      completed: 'default',
      error: 'destructive',
      extracting: 'secondary',
      converting: 'secondary'
    };

    const labels = {
      uploaded: 'Ready',
      processing: 'Processing',
      completed: 'Completed',
      error: 'Error',
      extracting: 'Extracting',
      converting: 'Converting'
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getFileItemClassName = (isSelected: boolean) => {
    return `${fileItemStyles.base} ${
      isSelected ? fileItemStyles.selected : fileItemStyles.default
    }`;
  };

  const getFileTypeBadge = (type: UploadedFile['type']) => {
    const variants = {
      pdf: 'default',
      image: 'secondary',
      document: 'outline',
      text: 'outline'
    } as const;

    const labels = {
      pdf: 'PDF',
      image: 'Image',
      document: 'Doc',
      text: 'Text'
    };

    return (
      <Badge variant={variants[type]} className="text-xs">
        {labels[type]}
      </Badge>
    );
  };

  return (
    <Card className="p-6">
      <h3 className="mb-4">Files ({files.length})</h3>
      <ScrollArea className="h-96">
        <div className="space-y-3">
          {files.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No files uploaded yet
            </p>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className={getFileItemClassName(selectedFile === file.id)}
                onClick={() => onFileSelect(file.id)}
              >
                <div className={fileItemLayout.header}>
                  <div className={fileItemLayout.content}>
                    <div className={fileItemLayout.iconContainer}>
                      {getStatusIcon(file.status)}
                    </div>
                    <div className={fileItemLayout.nameContainer}>
                      <div className={fileItemLayout.nameText}>{file.name}</div>
                    </div>
                  </div>
                  <div className={fileItemLayout.actions}>
                    {getFileTypeBadge(file.type)}
                    {getStatusBadge(file.status)}
                    {file.status === 'error' && onFileRetry && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onFileRetry(file.id);
                        }}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileRemove(file.id);
                      }}
                      disabled={file.status === 'processing' || file.status === 'extracting' || file.status === 'converting'}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className={fileItemLayout.fileInfo}>
                  <span>{formatFileSize(file.size)}</span>
                  {(file.status === 'processing' || file.status === 'extracting' || file.status === 'converting') && (
                    <span className="ml-2">• {file.progress}%</span>
                  )}
                </div>

                {(file.status === 'processing' || file.status === 'extracting' || file.status === 'converting') && (
                  <Progress value={file.progress} className={fileItemLayout.progress} />
                )}

                {file.error && (
                  <p className={fileItemLayout.error}>{file.error}</p>
                )}

                {/* 处理历史 */}
                {file.processHistory && file.processHistory.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {file.processHistory.map((step, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          step.status === 'completed' ? 'bg-green-500' :
                          step.status === 'failed' ? 'bg-red-500' :
                          step.status === 'running' ? 'bg-blue-500' : 'bg-gray-300'
                        }`} />
                        <span>{step.type}</span>
                        <span className="text-xs">
                          {step.status === 'completed' ? '✓' :
                           step.status === 'failed' ? '✗' :
                           step.status === 'running' ? '⟳' : '○'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
