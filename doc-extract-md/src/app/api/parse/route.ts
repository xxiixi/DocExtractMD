import { NextRequest, NextResponse } from 'next/server';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';

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
    
    // 使用pdfjs-dist解析PDF
    const pdfjsLib = await import('pdfjs-dist');
    
    // 加载PDF文档
    const loadingTask = pdfjsLib.getDocument({ data: dataBuffer });
    const pdf = await loadingTask.promise;
    
    // 提取文本内容
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => {
          if ('str' in item) {
            return item.str;
          }
          return '';
        })
        .join(' ');
      fullText += pageText + '\n';
    }
    
    // 清理上传的文件
    try {
      await unlink(filePath);
    } catch (error) {
      console.warn('Failed to delete uploaded file:', error);
    }

    // 将PDF文本转换为Markdown格式
    const markdown = convertToMarkdown(fullText);

    return NextResponse.json({
      success: true,
      markdown,
      pages: pdf.numPages,
      info: {
        title: 'PDF Document',
        author: 'Unknown',
        subject: 'Converted from PDF'
      }
    });

  } catch (error) {
    console.error('Parse error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to parse PDF: ${errorMessage}` },
      { status: 500 }
    );
  }
}

function convertToMarkdown(text: string): string {
  // 清理和预处理文本
  const markdown = text
    .replace(/\r\n/g, '\n') // 统一换行符
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n') // 移除多余的空行
    .trim();

  // 分割成行
  const lines = markdown.split('\n');
  const processedLines: string[] = [];
  let inList = false;
  let inCodeBlock = false;
  let listType: 'ul' | 'ol' = 'ul';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const nextLine = lines[i + 1]?.trim() || '';

    // 跳过空行
    if (!line) {
      if (inList) {
        processedLines.push(''); // 结束列表
        inList = false;
      }
      processedLines.push('');
      continue;
    }

    // 检测代码块
    if (line.startsWith('```') || line.match(/^[A-Za-z0-9_]+:/)) {
      if (!inCodeBlock) {
        processedLines.push('```');
        inCodeBlock = true;
      }
      processedLines.push(line);
      continue;
    }

    if (inCodeBlock) {
      processedLines.push(line);
      if (line.startsWith('```')) {
        inCodeBlock = false;
      }
      continue;
    }

    // 检测标题 (基于字体大小、位置和格式)
    if (isHeading(line, nextLine)) {
      if (inList) {
        processedLines.push(''); // 结束列表
        inList = false;
      }
      
      const level = getHeadingLevel(line);
      const headingText = line.replace(/^[#\s]+/, '').trim();
      processedLines.push(`${'#'.repeat(level)} ${headingText}`);
      continue;
    }

    // 检测列表项
    if (isListItem(line)) {
      if (!inList) {
        inList = true;
        listType = line.match(/^\d+\./) ? 'ol' : 'ul';
      }
      
      const listItem = line.replace(/^[\d\-\.\s]+/, '').trim();
      if (listItem) {
        processedLines.push(`- ${listItem}`);
      }
      continue;
    }

    // 检测表格行
    if (isTableRow(line)) {
      if (inList) {
        processedLines.push(''); // 结束列表
        inList = false;
      }
      processedLines.push(line);
      continue;
    }

    // 检测引用
    if (line.startsWith('>') || line.startsWith('"') || line.startsWith('"')) {
      if (inList) {
        processedLines.push(''); // 结束列表
        inList = false;
      }
      processedLines.push(`> ${line.replace(/^[>"]+/, '').trim()}`);
      continue;
    }

    // 检测强调文本
    if (line.includes('**') || line.includes('__')) {
      if (inList) {
        processedLines.push(''); // 结束列表
        inList = false;
      }
      processedLines.push(processEmphasis(line));
      continue;
    }

    // 普通段落
    if (inList) {
      processedLines.push(''); // 结束列表
      inList = false;
    }
    
    // 处理段落中的格式
    const processedLine = processInlineFormatting(line);
    processedLines.push(processedLine);
  }

  // 后处理：清理和优化
  let result = processedLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n') // 移除多余的空行
    .trim();

  // 添加文档信息
  result += '\n\n---\n*Document converted from PDF using DocExtractMD*';

  return result;
}

function isHeading(line: string, nextLine: string): boolean {
  // 检测标题的启发式规则
  const trimmedLine = line.trim();
  
  // 如果行很短且全大写，可能是标题
  if (trimmedLine.length < 100 && trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 3) {
    return true;
  }
  
  // 如果行以数字开头且后面跟着点，可能是标题
  if (/^\d+\.\s+[A-Z]/.test(trimmedLine)) {
    return true;
  }
  
  // 如果下一行是分隔符或空行，当前行可能是标题
  if (nextLine === '' || nextLine === '---' || nextLine === '___') {
    return true;
  }
  
  // 如果行以常见的标题词开头
  const titleWords = ['chapter', 'section', 'part', 'appendix', 'introduction', 'conclusion', 'summary'];
  const lowerLine = trimmedLine.toLowerCase();
  return titleWords.some(word => lowerLine.startsWith(word));
}

function getHeadingLevel(line: string): number {
  const trimmedLine = line.trim();
  
  // 基于长度和格式判断标题级别
  if (trimmedLine.length < 50) return 1;
  if (trimmedLine.length < 80) return 2;
  return 3;
}

function isListItem(line: string): boolean {
  const trimmedLine = line.trim();
  
  // 检测有序列表
  if (/^\d+\.\s/.test(trimmedLine)) {
    return true;
  }
  
  // 检测无序列表
  if (/^[\-\*]\s/.test(trimmedLine)) {
    return true;
  }
  
  // 检测缩进的列表项
  if (/^\s+[\-\*]\s/.test(trimmedLine)) {
    return true;
  }
  
  return false;
}

function isTableRow(line: string): boolean {
  const trimmedLine = line.trim();
  
  // 检测表格分隔符
  if (/^[\|\s\-]+$/.test(trimmedLine)) {
    return true;
  }
  
  // 检测包含多个竖线的行
  if ((trimmedLine.match(/\|/g) || []).length >= 2) {
    return true;
  }
  
  return false;
}

function processEmphasis(line: string): string {
  return line
    .replace(/\*\*(.*?)\*\*/g, '**$1**')
    .replace(/__(.*?)__/g, '**$1**')
    .replace(/\*(.*?)\*/g, '*$1*')
    .replace(/_(.*?)_/g, '*$1*');
}

function processInlineFormatting(line: string): string {
  return line
    // 处理粗体
    .replace(/\*\*(.*?)\*\*/g, '**$1**')
    .replace(/__(.*?)__/g, '**$1**')
    // 处理斜体
    .replace(/\*(.*?)\*/g, '*$1*')
    .replace(/_(.*?)_/g, '*$1*')
    // 处理内联代码
    .replace(/`([^`]+)`/g, '`$1`')
    // 处理链接（简单模式）
    .replace(/(https?:\/\/[^\s]+)/g, '[$1]($1)');
}
