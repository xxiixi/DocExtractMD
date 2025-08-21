'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download,
  FileText,
  ExternalLink,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PDFPreviewSimpleProps {
  file: File;
  className?: string;
}

export default function PDFPreviewSimple({ file, className }: PDFPreviewSimpleProps) {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 创建文件的URL
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    setLoading(false);

    // 清理函数
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const downloadPDF = () => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openInNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.25));
  };

  if (loading) {
    return (
      <Card className={`${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">正在准备PDF预览...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <div className="flex flex-col h-full">
        {/* PDF内容区域 */}
        <div className="flex-1 overflow-hidden">
          {pdfUrl ? (
            <div className="h-full border rounded-lg overflow-hidden">
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                className="w-full h-full"
                title="PDF预览"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  width: `${100 / scale}%`,
                  height: `${100 / scale}%`
                }}
                onError={(e) => {
                  console.error('PDF加载失败:', e);
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">PDF预览不可用</h3>
                <p className="text-muted-foreground">
                  无法加载PDF文件
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
