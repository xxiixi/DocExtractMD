'use client';

import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { UploadedFile } from '@/types';
import UploadSection from '@/components/UploadSection';
import FileListSection from '@/components/FileListSection';
import PreviewSection from '@/components/PreviewSection';

export default function Home() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        <header className="border-b bg-background">
          <div className="px-6 py-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <h1>Document Parser</h1>
                <p className="text-muted-foreground">Upload PDFs and get markdown results</p>
              </div>
            </div>
          </div>
        </header>

        <div className="px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Upload Section */}
            <div className="md:col-span-1 space-y-6">
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
              />
            </div>

            {/* Preview Section */}
            <div className="md:col-span-2">
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
