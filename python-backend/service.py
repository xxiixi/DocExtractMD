"""
业务逻辑层 - 协调文件处理流程，选择解析策略
"""
from fastapi import UploadFile
from parsers import get_parser, get_supported_extensions
from websocket_manager import websocket_manager
import logging
import asyncio
from typing import Dict, Any, Optional

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FileProcessingService:
    """文件处理服务类"""
    
    def __init__(self):
        self.supported_extensions = get_supported_extensions()
        self.max_file_size = 50 * 1024 * 1024  # 50MB
    
    async def process_file(self, file: UploadFile, file_id: Optional[str] = None) -> Dict[str, Any]:
        """
        处理单个文件，提取文字内容
        
        Args:
            file: 上传的文件对象
            file_id: 文件ID，用于进度更新
            
        Returns:
            包含处理结果的字典
        """
        try:
            logger.info(f"开始处理文件: {file.filename}, file_id: {file_id}")
            
            # 1. 验证文件
            await self._send_progress(file_id, 10, "验证文件")
            self._validate_file(file)
            
            # 2. 获取文件扩展名
            await self._send_progress(file_id, 20, "分析文件类型")
            file_ext = self._get_file_extension(file.filename)
            
            # 3. 获取对应的解析器
            await self._send_progress(file_id, 30, "准备解析器")
            parser = get_parser(file_ext)
            if not parser:
                raise ValueError(f"不支持的文件类型: {file_ext}")
            
            # 4. 读取文件内容
            await self._send_progress(file_id, 50, "读取文件内容")
            file_content = await file.read()
            
            # 5. 提取文字内容
            await self._send_progress(file_id, 70, "提取文字内容")
            extracted_text = parser.extract_text(file_content)
            
            # 6. 完成处理
            await self._send_progress(file_id, 90, "处理完成")
            await asyncio.sleep(0.1)  # 短暂延迟以显示进度
            
            # 7. 记录处理日志
            logger.info(f"成功处理文件: {file.filename}, 大小: {len(file_content)} bytes")
            
            result = {
                "filename": file.filename,
                "file_size": len(file_content),
                "file_type": file_ext,
                "extracted_text": extracted_text,
                "text_length": len(extracted_text),
                "status": "success"
            }
            
            # 发送完成更新
            if file_id:
                await websocket_manager.send_completion_update(file_id, result)
            
            return result
            
        except Exception as e:
            logger.error(f"处理文件 {file.filename} 失败: {str(e)}")
            
            # 发送错误更新
            if file_id:
                await websocket_manager.send_error_update(file_id, str(e))
            
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
    
    async def _send_progress(self, file_id: Optional[str], progress: int, step: str):
        """发送进度更新"""
        if file_id:
            await websocket_manager.send_progress_update(file_id, progress, step)
    
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
