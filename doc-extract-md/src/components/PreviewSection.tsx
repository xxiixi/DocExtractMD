'use client';

import React from 'react';
import { FileText, AlertCircle, Clock } from 'lucide-react';
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
      error: 'destructive'
    };

    const labels = {
      uploaded: 'Ready',
      processing: 'Processing',
      completed: 'Completed',
      error: 'Error'
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
                  <h3>{file.name}</h3>
                  <p className="text-muted-foreground">
                    {formatFileSize(file.size)} • {getStatusBadge(file.status)}
                  </p>
                </div>
              </div>

              {file.status === 'completed' && file.markdown ? (
                <Tabs defaultValue="preview" className="flex-1 flex flex-col">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="raw">Raw Markdown</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="preview" className="flex-1">
                    <ScrollArea className="h-full border rounded-lg p-6">
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: file.markdown
                            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                            .replace(/^\*\*(.+)\*\*:/gm, '<strong>$1:</strong>')
                            .replace(/^\- (.+)$/gm, '<li>$1</li>')
                            .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
                            .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
                            .replace(/`([^`]+)`/g, '<code>$1</code>')
                            .replace(/\n\n/g, '</p><p>')
                            .replace(/^(.+)$/gm, '<p>$1</p>')
                            .replace(/<p><h/g, '<h')
                            .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
                            .replace(/<p><li>/g, '<ul><li>')
                            .replace(/<\/li><\/p>/g, '</li></ul>')
                            .replace(/<\/ul><ul>/g, '')
                        }}
                      />
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="raw" className="flex-1">
                    <ScrollArea className="h-full">
                      <pre className="bg-muted p-6 rounded-lg overflow-x-auto">
                        <code>{file.markdown}</code>
                      </pre>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              ) : file.status === 'error' ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                    <h3>Processing Failed</h3>
                    <p className="text-muted-foreground">
                      {file.error || 'An error occurred while processing this file.'}
                    </p>
                  </div>
                </div>
              ) : file.status === 'processing' ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3>Processing Document...</h3>
                    <p className="text-muted-foreground mb-4">
                      Document is being parsed and converted to markdown
                    </p>
                    <Progress value={file.progress} className="w-64 mx-auto" />
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3>Ready to Parse</h3>
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
            <h3>Select a file to preview</h3>
            <p className="text-muted-foreground">
              Upload PDF files and click &quot;Parse Files&quot; to process them into markdown
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
