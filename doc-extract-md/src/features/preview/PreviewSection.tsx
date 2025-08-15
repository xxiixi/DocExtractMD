'use client';

import React, { useState } from 'react';
import { FileText, AlertCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UploadedFile } from '@/types';
import PDFPreview from '@/components/ui/pdf-preview';

interface PreviewSectionProps {
  files: UploadedFile[];
  selectedFile: string | null;
}

export default function PreviewSection({
  files,
  selectedFile
}: PreviewSectionProps) {
  const [expandedContent, setExpandedContent] = useState<Record<string, boolean>>({});
  
  // 内容截断配置
  const MAX_PREVIEW_LENGTH = 2000; // 字符数限制
  const MAX_PREVIEW_LINES = 50; // 行数限制
  const MIN_CONTENT_HEIGHT = '400px'; // 内容区域最小高度

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

    const labels: Record<UploadedFile['status'], string> = {
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

  // 处理内容截断
  const processContent = (content: string, fileId: string) => {
    const isExpanded = expandedContent[fileId];
    
    if (isExpanded) {
      return content;
    }

    // 按行数截断
    const lines = content.split('\n');
    if (lines.length <= MAX_PREVIEW_LINES) {
      return content;
    }

    const truncatedLines = lines.slice(0, MAX_PREVIEW_LINES);
    return truncatedLines.join('\n') + '\n...';
  };

  // 检查是否需要截断
  const needsTruncation = (content: string) => {
    const lines = content.split('\n');
    return lines.length > MAX_PREVIEW_LINES || content.length > MAX_PREVIEW_LENGTH;
  };

  // 切换展开状态
  const toggleExpanded = (fileId: string) => {
    setExpandedContent(prev => ({
      ...prev,
      [fileId]: !prev[fileId]
    }));
  };

  return (
    <Card className="p-6 h-full">
      {selectedFile ? (
        (() => {
          const file = files.find(f => f.id === selectedFile);
          if (!file) return null;

          return (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">{file.name}</h3>
                  <p className="text-muted-foreground">
                    {formatFileSize(file.size)} • {getStatusBadge(file.status)}
                  </p>
                </div>
              </div>

              {file.status === 'completed' && (file.markdown || file.content || file.type === 'text') ? (
                <Tabs defaultValue={file.type === 'pdf' ? 'pdf' : 'preview'} className="flex-1 flex flex-col min-h-0">
                  <TabsList className={`grid w-full ${file.type === 'pdf' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {file.type === 'pdf' && (
                      <TabsTrigger value="pdf">PDF Preview</TabsTrigger>
                    )}
                    <TabsTrigger value="preview">Markdown Preview</TabsTrigger>
                    <TabsTrigger value="raw">
                      {file.type === 'text' ? 'Raw Text' : 'Raw Markdown'}
                    </TabsTrigger>
                  </TabsList>
                  
                  {file.type === 'pdf' && (
                    <TabsContent value="pdf" className="flex-1 min-h-0">
                      {file.file && (
                        <PDFPreview file={file.file} className="h-full" />
                      )}
                    </TabsContent>
                  )}
                  
                  <TabsContent value="preview" className="flex-1 min-h-0">
                    <div 
                      className="border rounded-lg flex flex-col bg-card" 
                      style={{ 
                        minHeight: MIN_CONTENT_HEIGHT,
                        height: '100%'
                      }}
                    >
                      <ScrollArea className="flex-1">
                        <div className="p-6">
                          {file.type === 'text' ? (
                            <div className="prose prose-sm max-w-none">
                              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                                {processContent(file.markdown || file.content || '', file.id)}
                              </pre>
                            </div>
                          ) : (
                            <div className="prose prose-sm max-w-none overflow-auto">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                              >
                                {processContent(file.markdown || '', file.id)}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                      {needsTruncation(file.markdown || file.content || '') && (
                        <div className="border-t bg-muted/30 p-4 flex justify-center flex-shrink-0">
                          <Button
                            variant="outline"
                            onClick={() => toggleExpanded(file.id)}
                            className="flex items-center gap-2"
                          >
                            {expandedContent[file.id] ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                收起内容
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                展示更多
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="raw" className="flex-1 min-h-0">
                    <div 
                      className="border rounded-lg flex flex-col" 
                      style={{ 
                        minHeight: MIN_CONTENT_HEIGHT,
                        height: '100%'
                      }}
                    >
                      <ScrollArea className="flex-1">
                        <div className="p-6">
                          <pre className="bg-muted p-6 rounded-lg overflow-x-auto text-sm font-mono">
                            <code>{processContent(file.markdown || file.content || '', file.id)}</code>
                          </pre>
                        </div>
                      </ScrollArea>
                      {needsTruncation(file.markdown || file.content || '') && (
                        <div className="border-t bg-muted/30 p-4 flex justify-center flex-shrink-0">
                          <Button
                            variant="outline"
                            onClick={() => toggleExpanded(file.id)}
                            className="flex items-center gap-2"
                          >
                            {expandedContent[file.id] ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                收起内容
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                展示更多
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              ) : file.status === 'error' ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">处理失败</h3>
                    <p className="text-muted-foreground">
                      {file.error || '处理文件时发生错误。'}
                    </p>
                  </div>
                </div>
              ) : file.status === 'processing' ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">正在处理文档...</h3>
                    <p className="text-muted-foreground mb-4">
                      {file.currentStep || '文档正在被解析和转换'}
                    </p>
                    <Progress value={file.progress} className="w-64 mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">{file.progress}%</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">准备解析</h3>
                    <p className="text-muted-foreground">
                      文件已上传，准备进行解析。点击 &quot;Parse Files&quot; 按钮开始处理。
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })()
      ) : (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">选择文件进行预览</h3>
            <p className="text-muted-foreground">
              上传文件并点击 &quot;Parse Files&quot; 按钮处理文件内容
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
