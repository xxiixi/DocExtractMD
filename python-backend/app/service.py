"""
业务逻辑层 - 文件处理服务
"""
import os
import uuid
import asyncio
import logging
from typing import Dict, Any, List
from fastapi import UploadFile, HTTPException
import aiofiles
from .parsers import TxtParser, PdfParser
from .websocket_manager import websocket_manager

logger = logging.getLogger(__name__)

class FileProcessingService:
    """文件处理服务类"""
    
    def __init__(self):
        self.parsers = {
            'text': TxtParser(),
            'pdf': PdfParser(),
        }
        self.upload_dir = 'uploads'
        
        # 确保上传目录存在
        if not os.path.exists(self.upload_dir):
            os.makedirs(self.upload_dir)
    
    def get_supported_file_types(self) -> Dict[str, Any]:
        """获取支持的文件类型信息"""
        return {
            "supported_types": {
                "pdf": [".pdf"],
                "image": [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff"],
                "document": [".doc", ".docx"]
            },
            "max_file_size": "10MB",
            "description": "支持文本、PDF、图片和文档文件的文字提取"
        }
    
    def _get_file_type(self, filename: str) -> str:
        """根据文件名判断文件类型"""
        ext = os.path.splitext(filename.lower())[1]
        
        if ext == '.pdf':
            return 'pdf'
        elif ext in ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff']:
            return 'image'
        elif ext in ['.doc', '.docx']:
            return 'document'
        else:
            return 'document' 
    
    async def process_file(self, file: UploadFile, file_id: str = None) -> Dict[str, Any]:
        """
        处理单个文件
        
        Args:
            file: 上传的文件
            file_id: 文件ID，用于进度更新
            
        Returns:
            处理结果
        """
        try:
            logger.info(f"开始处理文件: {file.filename}, file_id: {file_id}")
            
            # 生成文件ID
            if not file_id:
                file_id = str(uuid.uuid4())
            
            # 获取文件类型
            file_type = self._get_file_type(file.filename)
            logger.info(f"文件类型: {file_type}")
            
            # 发送进度更新
            await self._send_progress_update(file_id, 10, f"开始处理{file_type}文件")
            
            # 保存文件
            file_path = os.path.join(self.upload_dir, f"{file_id}_{file.filename}")
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
            
            await self._send_progress_update(file_id, 30, "文件保存完成")
            
            # 根据文件类型选择解析器
            parser = self.parsers.get(file_type)
            if not parser:
                raise HTTPException(status_code=400, detail=f"不支持的文件类型: {file_type}")
            
            await self._send_progress_update(file_id, 50, f"使用{file_type}解析器处理")
            
            # 解析文件
            extracted_text = parser.extract_text(content)
            result = {"text": extracted_text, "metadata": {}}
            
            await self._send_progress_update(file_id, 90, "解析完成")
            
            # 清理临时文件
            try:
                os.remove(file_path)
            except:
                pass
            
            await self._send_progress_update(file_id, 100, "处理完成")
            
            # 发送完成通知
            await self._send_completion_update(file_id, result)
            
            return {
                "status": "success",
                "filename": file.filename,
                "file_size": len(content),
                "file_type": file_type,
                "extracted_text": result.get("text", ""),
                "text_length": len(result.get("text", "")),
                "metadata": result.get("metadata", {})
            }
            
        except Exception as e:
            logger.error(f"处理文件失败: {str(e)}")
            await self._send_error_update(file_id, str(e))
            raise HTTPException(status_code=500, detail=f"处理失败: {str(e)}")
    
    async def process_multiple_files(self, files: List[UploadFile]) -> Dict[str, Any]:
        """
        处理多个文件
        
        Args:
            files: 文件列表
            
        Returns:
            所有文件的处理结果
        """
        results = []
        
        for i, file in enumerate(files):
            try:
                result = await self.process_file(file)
                results.append(result)
            except Exception as e:
                results.append({
                    "status": "error",
                    "filename": file.filename,
                    "error_message": str(e)
                })
        
        return {
            "total_files": len(files),
            "successful_files": len([r for r in results if r["status"] == "success"]),
            "failed_files": len([r for r in results if r["status"] == "error"]),
            "results": results
        }
    
    async def _send_progress_update(self, file_id: str, progress: int, step: str):
        """发送进度更新"""
        try:
            await websocket_manager.broadcast({
                "type": "progress_update",
                "file_id": file_id,
                "progress": progress,
                "step": step
            })
        except Exception as e:
            logger.error(f"发送进度更新失败: {str(e)}")
    
    async def _send_completion_update(self, file_id: str, result: Dict[str, Any]):
        """发送完成通知"""
        try:
            await websocket_manager.broadcast({
                "type": "completion_update",
                "file_id": file_id,
                "result": result
            })
        except Exception as e:
            logger.error(f"发送完成通知失败: {str(e)}")
    
    async def _send_error_update(self, file_id: str, error: str):
        """发送错误通知"""
        try:
            await websocket_manager.broadcast({
                "type": "error_update",
                "file_id": file_id,
                "error": error
            })
        except Exception as e:
            logger.error(f"发送错误通知失败: {str(e)}")

    async def get_output_files(self, file_path: str = None) -> Dict[str, Any]:
        """
        获取output目录下的文件
        
        Args:
            file_path: 文件路径，如果为None则返回目录列表
            
        Returns:
            文件或目录信息
        """
        try:
            output_dir = os.path.join(os.path.dirname(__file__), '..', 'output')
            
            if not os.path.exists(output_dir):
                return {
                    "success": False,
                    "error": "Output directory not found"
                }
            
            # 如果没有指定文件路径，返回目录列表
            if not file_path:
                directories = []
                for item in os.listdir(output_dir):
                    item_path = os.path.join(output_dir, item)
                    if os.path.isdir(item_path):
                        directories.append({
                            "name": item,
                            "path": item,
                            "type": "directory",
                            "modified": os.path.getmtime(item_path)
                        })
                
                # 按修改时间排序
                directories.sort(key=lambda x: x["modified"], reverse=True)
                
                return {
                    "success": True,
                    "data": {
                        "type": "directory_list",
                        "items": directories
                    }
                }
            
            # 如果指定了文件路径，返回文件内容
            full_path = os.path.join(output_dir, file_path)
            
            # 安全检查：确保路径在output目录内
            if not full_path.startswith(os.path.abspath(output_dir)):
                return {
                    "success": False,
                    "error": "Invalid file path"
                }
            
            if not os.path.exists(full_path):
                return {
                    "success": False,
                    "error": "File not found"
                }
            
            stats = os.stat(full_path)
            
            if os.path.isdir(full_path):
                # 如果是目录，返回目录内容
                items = []
                for item in os.listdir(full_path):
                    item_path = os.path.join(full_path, item)
                    items.append({
                        "name": item,
                        "path": os.path.join(file_path, item),
                        "type": "directory" if os.path.isdir(item_path) else "file",
                        "modified": os.path.getmtime(item_path)
                    })
                
                return {
                    "success": True,
                    "data": {
                        "type": "directory_content",
                        "path": file_path,
                        "items": items
                    }
                }
            else:
                # 如果是文件，返回文件内容
                async with aiofiles.open(full_path, 'r', encoding='utf-8') as f:
                    content = await f.read()
                
                return {
                    "success": True,
                    "data": {
                        "type": "file_content",
                        "path": file_path,
                        "content": content,
                        "size": stats.st_size,
                        "modified": stats.st_mtime
                    }
                }
                
        except Exception as e:
            logger.error(f"获取output文件失败: {str(e)}")
            return {
                "success": False,
                "error": f"Internal server error: {str(e)}"
            }
