'use client';

import React, { useState } from 'react';
import { FileText, AlertCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
    const variants: Record<UploadedFile['status'], 'ready' | 'processing' | 'success' | 'destructive' | 'extracting' | 'converting'> = {
      uploaded: 'ready',
      processing: 'processing',
      completed: 'success',
      error: 'destructive',
      extracting: 'extracting',
      converting: 'converting'
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

  // 处理图片路径转换
  const processImagePath = (src: string, fileId?: string) => {
    // 如果是相对路径（以images/开头），说明是MinerU生成的图片
    if (src.startsWith('images/')) {
      console.warn('MinerU生成的图片路径:', src);
      
      // 从文件对象中获取图片数据
      if (fileId) {
        const file = files.find(f => f.id === fileId);
        
        if (file?.images && file.images[src]) {
          return file.images[src]; // 返回base64数据
        } else {
          // 尝试匹配不同的键名格式
          const imageKeys = Object.keys(file?.images || {});
          for (const key of imageKeys) {
            if (key.includes(src.split('/').pop() || '')) {
              return file?.images?.[key] || '';
            }
          }
        }
      }
      
      // 如果没有找到图片数据，返回空字符串（图片将不显示）
      return '';
    }
    
    // 如果是完整的URL，直接使用
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
      return src;
    }
    
    return src;
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
                <div className="flex-1 flex flex-col min-h-0">
                  {file.type === 'pdf' ? (
                    // PDF文件：并排显示PDF预览和Markdown预览
                    <div className="grid grid-cols-2 gap-4 h-full">
                      {/* PDF Preview */}
                      <div className="flex flex-col">
                        <h4 className="text-sm font-medium mb-2">PDF Preview</h4>
                        <div className="flex-1 overflow-hidden">
                          {file.file && (
                            <PDFPreview file={file.file} className="h-full" />
                          )}
                        </div>
                      </div>
                      
                      {/* Markdown Preview */}
                      <div className="flex flex-col">
                        <h4 className="text-sm font-medium mb-2">Markdown Preview</h4>
                        <div 
                          className="border rounded-lg flex flex-col bg-card flex-1" 
                          style={{ 
                            minHeight: MIN_CONTENT_HEIGHT
                          }}
                        >
                          <ScrollArea className="flex-1">
                            <div className="p-6">
                              <div className="prose prose-sm max-w-none overflow-auto">
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    img: ({ src, alt, ...props }) => {
                                      const srcString = typeof src === 'string' ? src : '';
                                      const processedSrc = processImagePath(srcString, file.id);
                                      
                                      // 如果没有有效的图片源，不渲染图片
                                      if (!processedSrc) {
                                        return null;
                                      }
                                      
                                      return (
                                        <span className="block my-4">
                                          <img 
                                            src={processedSrc} 
                                            alt={alt || 'MinerU生成的图片'} 
                                            {...props}
                                            className="max-w-full h-auto border rounded-lg shadow-sm"
                                            onError={(e) => {
                                              console.error('图片加载失败:', processedSrc);
                                              e.currentTarget.style.display = 'none'; // 隐藏图片
                                            }}
                                          />
                                          {srcString && srcString.startsWith('images/') && (
                                            <span className="block text-xs text-muted-foreground mt-2 text-center">
                                              MinerU生成的图片: {srcString}
                                            </span>
                                          )}
                                        </span>
                                      );
                                    }
                                  }}
                                >
                                  {processContent(file.markdown || '', file.id)}
                                </ReactMarkdown>
                              </div>
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
                      </div>
                    </div>
                  ) : (
                    // 非PDF文件：只显示Markdown预览
                    <div className="flex flex-col">
                      <h4 className="text-sm font-medium mb-2">Markdown Preview</h4>
                      <div 
                        className="border rounded-lg flex flex-col bg-card flex-1" 
                        style={{ 
                          minHeight: MIN_CONTENT_HEIGHT
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
                                  components={{
                                    img: ({ src, alt, ...props }) => {
                                      const srcString = typeof src === 'string' ? src : '';
                                      const processedSrc = processImagePath(srcString, file.id);
                                      
                                      // 如果没有有效的图片源，不渲染图片
                                      if (!processedSrc) {
                                        return null;
                                      }
                                      
                                      return (
                                        <span className="block my-4">
                                          <img 
                                            src={processedSrc} 
                                            alt={alt || 'MinerU生成的图片'} 
                                            {...props}
                                            className="max-w-full h-auto border rounded-lg shadow-sm"
                                            onError={(e) => {
                                              console.error('图片加载失败:', processedSrc);
                                              e.currentTarget.style.display = 'none'; // 隐藏图片
                                            }}
                                          />
                                          {srcString && srcString.startsWith('images/') && (
                                            <span className="block text-xs text-muted-foreground mt-2 text-center">
                                              MinerU生成的图片: {srcString}
                                            </span>
                                          )}
                                        </span>
                                      );
                                    }
                                  }}
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
                    </div>
                  )}
                </div>
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
