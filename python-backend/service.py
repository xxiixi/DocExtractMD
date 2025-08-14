"""
业务逻辑层 - 协调文件处理流程，选择解析策略
"""
from fastapi import UploadFile
from parsers import get_parser, get_supported_extensions
import logging
from typing import Dict, Any

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FileProcessingService:
    """文件处理服务类"""
    
    def __init__(self):
        self.supported_extensions = get_supported_extensions()
        self.max_file_size = 50 * 1024 * 1024  # 50MB
    
    async def process_file(self, file: UploadFile) -> Dict[str, Any]:
        """
        处理单个文件，提取文字内容
        
        Args:
            file: 上传的文件对象
            
        Returns:
            包含处理结果的字典
        """
        try:
            # 1. 验证文件
            self._validate_file(file)
            
            # 2. 获取文件扩展名
            file_ext = self._get_file_extension(file.filename)
            
            # 3. 获取对应的解析器
            parser = get_parser(file_ext)
            if not parser:
                raise ValueError(f"不支持的文件类型: {file_ext}")
            
            # 4. 读取文件内容
            file_content = await file.read()
            
            # 5. 提取文字内容
            extracted_text = parser.extract_text(file_content)
            
            # 6. 记录处理日志
            logger.info(f"成功处理文件: {file.filename}, 大小: {len(file_content)} bytes")
            
            return {
                "filename": file.filename,
                "file_size": len(file_content),
                "file_type": file_ext,
                "extracted_text": extracted_text,
                "text_length": len(extracted_text),
                "status": "success"
            }
            
        except Exception as e:
            logger.error(f"处理文件 {file.filename} 失败: {str(e)}")
            return {
                "filename": file.filename,
                "status": "error",
                "error_message": str(e)
            }
    
    async def process_multiple_files(self, files: list[UploadFile]) -> Dict[str, Any]:
        """
        处理多个文件
        
        Args:
            files: 文件列表
            
        Returns:
            包含所有文件处理结果的字典
        """
        results = []
        total_files = len(files)
        successful_files = 0
        
        for file in files:
            result = await self.process_file(file)
            results.append(result)
            
            if result["status"] == "success":
                successful_files += 1
        
        return {
            "total_files": total_files,
            "successful_files": successful_files,
            "failed_files": total_files - successful_files,
            "results": results
        }
    
    def _validate_file(self, file: UploadFile) -> None:
        """
        验证文件的有效性
        
        Args:
            file: 上传的文件对象
            
        Raises:
            ValueError: 文件验证失败时抛出异常
        """
        if not file.filename:
            raise ValueError("文件名不能为空")
        
        file_ext = self._get_file_extension(file.filename)
        if file_ext not in self.supported_extensions:
            raise ValueError(f"不支持的文件类型: {file_ext}。支持的类型: {', '.join(self.supported_extensions)}")
    
    def _get_file_extension(self, filename: str) -> str:
        """
        获取文件扩展名
        
        Args:
            filename: 文件名
            
        Returns:
            文件扩展名（小写，不包含点号）
        """
        if '.' not in filename:
            raise ValueError("文件没有扩展名")
        
        return filename.split('.')[-1].lower()
    
    def get_supported_file_types(self) -> Dict[str, Any]:
        """
        获取支持的文件类型信息
        
        Returns:
            支持的文件类型信息
        """
        return {
            "supported_extensions": self.supported_extensions,
            "max_file_size_mb": self.max_file_size // (1024 * 1024),
            "description": "支持TXT和PDF文件的文字提取"
        }
