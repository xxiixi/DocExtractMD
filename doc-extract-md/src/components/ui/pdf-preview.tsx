'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  Download,
  FileText
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PDFPreviewProps {
  file: File;
  className?: string;
}

export default function PDFPreview({ file, className }: PDFPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<any>(null);

  // PDF.js 相关状态
  const [pdfjsLib, setPdfjsLib] = useState<any>(null);

  useEffect(() => {
    // 动态加载 PDF.js
    const loadPDFJS = async () => {
      try {
        // 这里可以配置 PDF.js 的 CDN 路径
        const pdfjs = await import('pdfjs-dist');
        
        // 修复CORS问题：禁用worker以避免CDN问题
        pdfjs.GlobalWorkerOptions.workerSrc = '';
        
        setPdfjsLib(pdfjs);
      } catch (err) {
        console.error('Failed to load PDF.js:', err);
        setError('无法加载PDF查看器');
      }
    };

    loadPDFJS();
  }, []);

  useEffect(() => {
    if (!pdfjsLib || !file) return;

    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        pdfRef.current = pdf;
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load PDF:', err);
        setError('无法加载PDF文件');
        setLoading(false);
      }
    };

    loadPDF();
  }, [pdfjsLib, file]);

  useEffect(() => {
    if (!pdfjsLib || !pdfRef.current || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        const page = await pdfRef.current.getPage(currentPage);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        const viewport = page.getViewport({ scale, rotation });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error('Failed to render page:', err);
        setError('无法渲染PDF页面');
      }
    };

    renderPage();
  }, [pdfjsLib, currentPage, scale, rotation]);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.25));
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

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

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">正在加载PDF...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">PDF预览不可用</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={downloadPDF} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              下载PDF
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex flex-col h-full">
        {/* 工具栏 */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevPage}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-sm font-medium">
              第 {currentPage} 页，共 {totalPages} 页
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            
            <Badge variant="secondary" className="min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </Badge>
            
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            
            <Button variant="outline" size="sm" onClick={rotate}>
              <RotateCw className="w-4 h-4" />
            </Button>
            
            <Button variant="outline" size="sm" onClick={downloadPDF}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* PDF内容区域 */}
        <div className="flex-1 overflow-auto">
          <ScrollArea className="h-full">
            <div className="flex justify-center p-4">
              <canvas
                ref={canvasRef}
                className="border rounded-lg shadow-sm"
                style={{
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />
            </div>
          </ScrollArea>
        </div>
      </div>
    </Card>
  );
}
