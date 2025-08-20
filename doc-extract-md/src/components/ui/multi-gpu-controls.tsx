'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Settings, Zap, Cpu, Gpu } from 'lucide-react';

export interface MultiGpuOptions {
  backend?: 'pipeline' | 'vlm-transformers' | 'vlm-sglang-engine' | 'vlm-sglang-client';
  lang?: 'ch' | 'ch_server' | 'ch_lite' | 'en' | 'korean' | 'japan' | 'chinese_cht' | 'ta' | 'te' | 'ka' | 'latin' | 'arabic' | 'east_slavic' | 'cyrillic' | 'devanagari';
  method?: 'auto' | 'txt' | 'ocr';
  formula_enable?: boolean;
  table_enable?: boolean;
  device?: string;
  vram?: number;
  source?: 'huggingface' | 'modelscope' | 'local';
}

export interface MultiGpuConfig {
  serverUrl: string;
  timeout: number;
  maxConcurrent: number;
  retries: number;
}

interface MultiGpuControlsProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  options: MultiGpuOptions;
  onOptionsChange: (options: MultiGpuOptions) => void;
  config: MultiGpuConfig;
  onConfigChange: (config: MultiGpuConfig) => void;
  fileCount: number;
}

export default function MultiGpuControls({
  enabled,
  onEnabledChange,
  options,
  onOptionsChange,
  config,
  onConfigChange,
  fileCount
}: MultiGpuControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateOptions = (updates: Partial<MultiGpuOptions>) => {
    onOptionsChange({ ...options, ...updates });
  };

  const updateConfig = (updates: Partial<MultiGpuConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Multi-GPU 并发处理</h3>
          <Badge variant={enabled ? "default" : "secondary"}>
            {enabled ? "已启用" : "已禁用"}
          </Badge>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
      </div>

      {enabled && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serverUrl">服务器地址</Label>
              <Input
                id="serverUrl"
                value={config.serverUrl}
                onChange={(e) => updateConfig({ serverUrl: e.target.value })}
                placeholder="http://127.0.0.1:8000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxConcurrent">最大并发数</Label>
              <Input
                id="maxConcurrent"
                type="number"
                min="1"
                max="10"
                value={config.maxConcurrent}
                onChange={(e) => updateConfig({ maxConcurrent: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="backend">处理后端</Label>
              <Select value={options.backend} onValueChange={(value) => updateOptions({ backend: value as MultiGpuOptions['backend'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pipeline">Pipeline</SelectItem>
                  <SelectItem value="vlm-transformers">VLM-Transformers</SelectItem>
                  <SelectItem value="vlm-sglang-engine">VLM-SGLang-Engine</SelectItem>
                  <SelectItem value="vlm-sglang-client">VLM-SGLang-Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lang">文档语言</Label>
              <Select value={options.lang} onValueChange={(value) => updateOptions({ lang: value as MultiGpuOptions['lang'] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ch">中文</SelectItem>
                  <SelectItem value="en">英文</SelectItem>
                  <SelectItem value="korean">韩文</SelectItem>
                  <SelectItem value="japan">日文</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                checked={options.formula_enable}
                onCheckedChange={(checked) => updateOptions({ formula_enable: checked })}
              />
              <Label>启用公式解析</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={options.table_enable}
                onCheckedChange={(checked) => updateOptions({ table_enable: checked })}
              />
              <Label>启用表格解析</Label>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Cpu className="h-4 w-4" />
                <span>并发数: {config.maxConcurrent}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Gpu className="h-4 w-4" />
                <span>后端: {options.backend}</span>
              </div>
            </div>
            <div>
              可处理文件: {fileCount} 个
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
