"""
解析策略层 - 实现策略模式处理不同文件类型的文字提取
"""
from abc import ABC, abstractmethod
import pdfplumber
from io import BytesIO
from typing import Optional


class FileParser(ABC):
    """文件解析器抽象基类 - 策略接口"""
    
    @abstractmethod
    def extract_text(self, file_content: bytes) -> str:
        """
        提取文件内容，返回文字字符串
        
        Args:
            file_content: 文件的二进制内容
            
        Returns:
            提取的文字内容
            
        Raises:
            Exception: 解析失败时抛出异常
        """
        pass


class TxtParser(FileParser):
    """TXT文件解析器"""
    
    def extract_text(self, file_content: bytes) -> str:
        """
        解析TXT文件，提取文字内容
        
        Args:
            file_content: TXT文件的二进制内容
            
        Returns:
            提取的文字内容
        """
        try:
            # 尝试UTF-8解码，如果失败则尝试其他编码
            text = file_content.decode("utf-8", errors="ignore")
            return text.strip()
        except Exception as e:
            raise Exception(f"TXT文件解析失败: {str(e)}")


class PdfParser(FileParser):
    """PDF文件解析器"""
    
    def extract_text(self, file_content: bytes) -> str:
        """
        解析PDF文件，提取文字内容
        
        Args:
            file_content: PDF文件的二进制内容
            
        Returns:
            提取的文字内容
        """
        try:
            text_parts = []
            
            # 使用pdfplumber打开PDF文件
            with pdfplumber.open(BytesIO(file_content)) as pdf:
                # 遍历每一页
                for page_num, page in enumerate(pdf.pages, 1):
                    # 提取当前页的文字
                    page_text = page.extract_text()
                    if page_text:
                        # 添加页码标识（可选）
                        text_parts.append(f"--- 第{page_num}页 ---\n{page_text}")
                    else:
                        # 如果页面没有文字，可能是图片页面
                        text_parts.append(f"--- 第{page_num}页 ---\n[图片页面，无法提取文字]")
            
            return "\n\n".join(text_parts)
            
        except Exception as e:
            raise Exception(f"PDF文件解析失败: {str(e)}")


def get_parser(file_ext: str) -> Optional[FileParser]:
    """
    解析器工厂方法 - 根据文件扩展名返回对应的解析器
    
    Args:
        file_ext: 文件扩展名（小写，不包含点号）
        
    Returns:
        对应的解析器实例，如果不支持该文件类型则返回None
    """
    parsers = {
        "txt": TxtParser(),
        "pdf": PdfParser(),
    }
    return parsers.get(file_ext.lower())


def get_supported_extensions() -> list[str]:
    """
    获取支持的文件扩展名列表
    
    Returns:
        支持的文件扩展名列表
    """
    return ["txt", "pdf"]
