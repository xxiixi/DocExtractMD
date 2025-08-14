'use client';

import React, { useState } from 'react';
import { Upload, Play } from 'lucide-react';
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
              onClick={onParseFiles}
              disabled={uploadedCount === 0 || isProcessing}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              Parse Files ({uploadedCount})
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
