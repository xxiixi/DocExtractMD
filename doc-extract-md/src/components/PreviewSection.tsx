'use client';

import React from 'react';
import { FileText, AlertCircle, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { UploadedFile } from '@/types';

interface PreviewSectionProps {
  files: UploadedFile[];
  selectedFile: string | null;
}

export default function PreviewSection({
  files,
  selectedFile
}: PreviewSectionProps) {
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
                <Tabs defaultValue="preview" className="flex-1 flex flex-col">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="raw">
                      {file.type === 'text' ? 'Raw Text' : 'Raw Markdown'}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="preview" className="flex-1">
                    <ScrollArea className="h-full border rounded-lg p-6">
                      {file.type === 'text' ? (
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                            {file.markdown || file.content}
                          </pre>
                        </div>
                      ) : (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({children}) => <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0">{children}</h1>,
                              h2: ({children}) => <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>,
                              h3: ({children}) => <h3 className="text-lg font-semibold mb-2 mt-4">{children}</h3>,
                              p: ({children}) => <p className="mb-3 leading-relaxed">{children}</p>,
                              ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                              li: ({children}) => <li className="ml-4">{children}</li>,
                              code: ({children, className}) => {
                                const isInline = !className;
                                if (isInline) {
                                  return <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">{children}</code>;
                                }
                                return (
                                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-3">
                                    <code className="text-sm font-mono">{children}</code>
                                  </pre>
                                );
                              },
                              blockquote: ({children}) => (
                                <blockquote className="border-l-4 border-primary pl-4 italic mb-3">
                                  {children}
                                </blockquote>
                              ),
                              strong: ({children}) => <strong className="font-bold">{children}</strong>,
                              em: ({children}) => <em className="italic">{children}</em>,
                              table: ({children}) => (
                                <div className="overflow-x-auto mb-3">
                                  <table className="min-w-full border-collapse border border-border">
                                    {children}
                                  </table>
                                </div>
                              ),
                              th: ({children}) => (
                                <th className="border border-border px-3 py-2 bg-muted font-semibold text-left">
                                  {children}
                                </th>
                              ),
                              td: ({children}) => (
                                <td className="border border-border px-3 py-2">
                                  {children}
                                </td>
                              ),
                            }}
                          >
                            {file.markdown}
                          </ReactMarkdown>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="raw" className="flex-1">
                    <ScrollArea className="h-full">
                      <pre className="bg-muted p-6 rounded-lg overflow-x-auto text-sm font-mono">
                        <code>{file.markdown || file.content}</code>
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              ) : file.status === 'error' ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Processing Failed</h3>
                    <p className="text-muted-foreground">
                      {file.error || 'An error occurred while processing this file.'}
                    </p>
                  </div>
                </div>
              ) : file.status === 'processing' ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Processing Document...</h3>
                    <p className="text-muted-foreground mb-4">
                      Document is being parsed and converted to markdown
                    </p>
                    <Progress value={file.progress} className="w-64 mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">{file.progress}%</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Ready to Parse</h3>
                    <p className="text-muted-foreground">
                      This file is uploaded and ready for parsing. Click the &quot;Parse Files&quot; button to begin processing.
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
            <h3 className="text-lg font-semibold mb-2">Select a file to preview</h3>
            <p className="text-muted-foreground">
              Upload PDF files and click &quot;Parse Files&quot; to process them into markdown
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
