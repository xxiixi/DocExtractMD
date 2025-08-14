import { NextRequest, NextResponse } from 'next/server';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import pdf from 'pdf-parse';

export async function POST(request: NextRequest) {
  try {
    const { fileName } = await request.json();
    
    if (!fileName) {
      return NextResponse.json(
        { error: 'No file name provided' },
        { status: 400 }
      );
    }

    const filePath = join(process.cwd(), 'uploads', fileName);
    
    // 读取PDF文件
    const dataBuffer = await readFile(filePath);
    
    // 解析PDF
    const data = await pdf(dataBuffer);
    
    // 清理上传的文件
    try {
      await unlink(filePath);
    } catch (error) {
      console.warn('Failed to delete uploaded file:', error);
    }

    // 将PDF文本转换为Markdown格式
    const markdown = convertToMarkdown(data.text);

    return NextResponse.json({
      success: true,
      markdown,
      pages: data.numpages,
      info: data.info
    });

  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { error: 'Failed to parse PDF' },
      { status: 500 }
    );
  }
}

function convertToMarkdown(text: string): string {
  // 简单的PDF文本到Markdown转换
  let markdown = text;
  
  // 移除多余的空白字符
  markdown = markdown.replace(/\s+/g, ' ').trim();
  
  // 尝试识别标题 (基于字体大小和位置，这里用简单的启发式方法)
  const lines = markdown.split('\n');
  const processedLines = lines.map((line, index) => {
    const trimmedLine = line.trim();
    
    // 如果行很短且全大写，可能是标题
    if (trimmedLine.length < 100 && trimmedLine === trimmedLine.toUpperCase()) {
      return `## ${trimmedLine}`;
    }
    
    // 如果行以数字开头，可能是列表项
    if (/^\d+\./.test(trimmedLine)) {
      return trimmedLine;
    }
    
    // 如果行以破折号开头，可能是列表项
    if (trimmedLine.startsWith('-')) {
      return trimmedLine;
    }
    
    return trimmedLine;
  });
  
  // 添加基本的文档结构
  const result = `# Document Content

${processedLines.join('\n\n')}

---
*Converted from PDF using DocExtractMD*`;

  return result;
}
