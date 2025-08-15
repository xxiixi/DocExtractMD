import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 获取output目录下的文件列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    
    const outputDir = path.join(process.cwd(), 'public', 'output');
    
    if (!fs.existsSync(outputDir)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Output directory not found' 
      });
    }
    
    // 如果没有指定文件路径，返回目录列表
    if (!filePath) {
      const directories = fs.readdirSync(outputDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => ({
          name: dirent.name,
          path: dirent.name,
          type: 'directory'
        }));
      
      return NextResponse.json({
        success: true,
        data: {
          type: 'directory_list',
          items: directories
        }
      });
    }
    
    // 如果指定了文件路径，返回文件内容
    const fullPath = path.join(outputDir, filePath);
    
    // 安全检查：确保路径在output目录内
    if (!fullPath.startsWith(outputDir)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file path' 
      });
    }
    
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ 
        success: false, 
        error: 'File not found' 
      });
    }
    
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      // 如果是目录，返回目录内容
      const items = fs.readdirSync(fullPath, { withFileTypes: true })
        .map(dirent => ({
          name: dirent.name,
          path: path.join(filePath, dirent.name),
          type: dirent.isDirectory() ? 'directory' : 'file'
        }));
      
      return NextResponse.json({
        success: true,
        data: {
          type: 'directory_content',
          path: filePath,
          items
        }
      });
    } else {
      // 如果是文件，返回文件内容
      const content = fs.readFileSync(fullPath, 'utf-8');
      return NextResponse.json({
        success: true,
        data: {
          type: 'file_content',
          path: filePath,
          content,
          size: stats.size
        }
      });
    }
    
  } catch (error) {
    console.error('Error reading output directory:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}
