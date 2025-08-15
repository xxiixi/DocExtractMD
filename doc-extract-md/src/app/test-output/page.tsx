'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiClient } from '@/services/api';

export default function TestOutputPage() {
  const [outputData, setOutputData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testOutputDirectory = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await apiClient.getOutputFile();
      console.log('Output directory response:', response);
      setOutputData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const testOutputFile = async (filePath: string) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await apiClient.getOutputFile(filePath);
      console.log('Output file response:', response);
      setOutputData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Output文件读取测试</h1>
        
        <div className="space-y-4">
          <Button 
            onClick={testOutputDirectory}
            disabled={loading}
          >
            {loading ? '加载中...' : '测试获取Output目录列表'}
          </Button>
          
          {outputData?.data?.type === 'directory_list' && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-2">Output目录列表:</h3>
              <div className="space-y-2">
                {outputData.data.items.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span>{item.name}</span>
                    <Button 
                      size="sm"
                      onClick={() => testOutputFile(item.path)}
                      disabled={loading}
                    >
                      查看内容
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
          
          {outputData?.data?.type === 'directory_content' && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-2">目录内容: {outputData.data.path}</h3>
              <div className="space-y-2">
                {outputData.data.items.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span>{item.name} ({item.type})</span>
                    {item.type === 'file' && (
                      <Button 
                        size="sm"
                        onClick={() => testOutputFile(item.path)}
                        disabled={loading}
                      >
                        查看文件
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
          
          {outputData?.data?.type === 'file_content' && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-2">文件内容: {outputData.data.path}</h3>
              <div className="text-sm text-gray-600 mb-2">
                文件大小: {outputData.data.size} 字节
              </div>
              <div className="border rounded p-4 bg-gray-50 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm">{outputData.data.content}</pre>
              </div>
            </Card>
          )}
          
          {error && (
            <Card className="p-4 border-red-200 bg-red-50">
              <h3 className="text-lg font-semibold text-red-800 mb-2">错误:</h3>
              <p className="text-red-600">{error}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
