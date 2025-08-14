'use client';

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Clock, X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { UploadedFile } from '@/types';

export default function Home() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const mockMarkdownResults = [
    `# Document Analysis Report

## Executive Summary

This document provides a comprehensive analysis of the quarterly performance metrics and strategic initiatives for Q3 2024.

### Key Findings

- **Revenue Growth**: 15.3% increase compared to Q2 2024
- **Customer Acquisition**: 2,847 new customers onboarded
- **Market Expansion**: Successfully entered 3 new geographical markets

## Detailed Analysis

### Financial Performance

The financial performance for Q3 2024 shows significant improvement across all key metrics:

1. **Total Revenue**: $4.2M (vs $3.6M in Q2)
2. **Gross Margin**: 68.4% (improvement of 2.1%)
3. **Operating Expenses**: $1.8M (8% reduction)

### Customer Metrics

Our customer base continues to grow steadily:

- New customer acquisition rate increased by 23%
- Customer retention rate: 94.2%
- Average customer lifetime value: $12,450

## Recommendations

Based on the analysis, we recommend:

1. **Increase marketing spend** in high-performing regions
2. **Expand product offerings** to meet growing demand
3. **Invest in customer success** to maintain high retention rates

## Conclusion

The Q3 results demonstrate strong momentum and position us well for Q4 growth targets.`,

    `# Technical Documentation

## API Reference Guide

This document outlines the REST API endpoints and their usage patterns.

### Authentication

All API requests require authentication using Bearer tokens:

\`\`\`
Authorization: Bearer <your-api-key>
\`\`\`

### Endpoints

#### GET /api/users
Retrieves a list of all users.

**Parameters:**
- \`limit\` (optional): Number of results to return (default: 50)
- \`offset\` (optional): Number of results to skip (default: 0)

**Response:**
\`\`\`json
{
  "users": [
    {
      "id": "123",
      "name": "John Doe",
      "email": "john@example.com"
    }
  ],
  "total": 150
}
\`\`\`

#### POST /api/users
Creates a new user account.

**Request Body:**
\`\`\`json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "user"
}
\`\`\`

### Error Handling

The API returns standard HTTP status codes:

- \`200\`: Success
- \`400\`: Bad Request
- \`401\`: Unauthorized
- \`404\`: Not Found
- \`500\`: Internal Server Error`,

    `# Meeting Minutes

## Weekly Team Standup - March 15, 2024

**Attendees:** Sarah Johnson, Mike Chen, Lisa Rodriguez, David Park

### Agenda Items

1. Project updates
2. Blockers and challenges
3. Sprint planning
4. Action items

### Project Updates

#### Frontend Development (Sarah)
- Completed user authentication flow
- Working on dashboard redesign
- **Timeline**: On track for March 30th delivery

#### Backend Development (Mike)
- Implemented new API endpoints
- Database optimization completed
- **Next**: Integration testing

#### Design System (Lisa)
- Updated component library
- Created new iconography set
- **Deliverable**: Style guide v2.0

#### QA Testing (David)
- Completed regression testing
- Found 3 critical bugs (now fixed)
- **Focus**: Performance testing

### Action Items

- [ ] Sarah: Complete dashboard by March 25th
- [ ] Mike: Coordinate with DevOps for deployment
- [ ] Lisa: Review accessibility compliance
- [ ] David: Prepare test scenarios for next sprint

### Next Meeting
**Date**: March 22, 2024  
**Time**: 10:00 AM PST`
  ];

  const handleFileUpload = (uploadedFiles: FileList) => {
    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const fileId = Date.now().toString() + i;
        const newFile: UploadedFile = {
          id: fileId,
          name: file.name,
          size: file.size,
          status: 'uploaded',
          progress: 0
        };
        newFiles.push(newFile);
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleParseFiles = async () => {
    const uploadedFiles = files.filter(f => f.status === 'uploaded');
    if (uploadedFiles.length === 0) return;

    setIsProcessing(true);

    // Process files one by one
    for (const file of uploadedFiles) {
      // Change to processing status
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'processing', progress: 0 } : f
      ));

      // Simulate processing
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, progress } : f
        ));
      }

      // Complete with random markdown result
      const randomMarkdown = mockMarkdownResults[Math.floor(Math.random() * mockMarkdownResults.length)];
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { 
          ...f, 
          status: 'completed', 
          progress: 100,
          markdown: randomMarkdown
        } : f
      ));
    }

    setIsProcessing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    handleFileUpload(droppedFiles);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
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
    }
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

  const uploadedCount = files.filter(f => f.status === 'uploaded').length;
  const processingCount = files.filter(f => f.status === 'processing').length;
  const completedCount = files.filter(f => f.status === 'completed').length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <h1>Document Parser</h1>
              <p className="text-muted-foreground">Upload PDFs and get markdown results</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="md:col-span-1 space-y-6">
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
                  <p>Drag and drop PDF files here</p>
                  <p className="text-muted-foreground">or</p>
                  <Button variant="outline" asChild>
                    <label className="cursor-pointer">
                      Choose Files
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
                <p className="text-muted-foreground mt-4">PDF files only</p>
              </div>

              {/* Parse Controls */}
              {files.length > 0 && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground">
                      {uploadedCount} ready • {processingCount} processing • {completedCount} completed
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleParseFiles}
                      disabled={uploadedCount === 0 || isProcessing}
                      className="flex-1"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Parse Files ({uploadedCount})
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={clearAllFiles}
                      disabled={isProcessing}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* File List */}
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
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedFile === file.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedFile(file.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {getStatusIcon(file.status)}
                            <span className="truncate">{file.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(file.status)}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(file.id);
                              }}
                              disabled={file.status === 'processing'}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-muted-foreground mb-2">
                          <span>{formatFileSize(file.size)}</span>
                          {file.status === 'processing' && (
                            <span>{file.progress}%</span>
                          )}
                        </div>

                        {file.status === 'processing' && (
                          <Progress value={file.progress} className="h-2" />
                        )}

                        {file.error && (
                          <p className="text-destructive mt-2">{file.error}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="md:col-span-2">
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
                              This file is uploaded and ready for parsing. Click the "Parse Files" button to begin processing.
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
          </div>
        </div>
      </div>
    </div>
  );
}
