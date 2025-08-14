"""
WebSocket管理器 - 处理实时进度更新
"""
import json
import asyncio
from typing import Dict, Set, Optional
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)


class WebSocketManager:
    """WebSocket连接管理器"""
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.file_progress: Dict[str, Dict] = {}  # file_id -> progress_info
    
    async def connect(self, websocket: WebSocket):
        """建立WebSocket连接"""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """断开WebSocket连接"""
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_progress_update(self, file_id: str, progress: int, step: str, status: str = "processing"):
        """发送进度更新"""
        message = {
            "type": "progress_update",
            "file_id": file_id,
            "progress": progress,
            "step": step,
            "status": status
        }
        
        # 更新本地进度缓存
        self.file_progress[file_id] = {
            "progress": progress,
            "step": step,
            "status": status
        }
        
        # 广播给所有连接的客户端
        if self.active_connections:
            await self.broadcast(json.dumps(message))
            logger.info(f"Progress update sent for file {file_id}: {progress}% - {step}")
    
    async def send_completion_update(self, file_id: str, result: Dict):
        """发送完成更新"""
        message = {
            "type": "completion_update",
            "file_id": file_id,
            "result": result,
            "status": "completed"
        }
        
        # 更新本地进度缓存
        self.file_progress[file_id] = {
            "progress": 100,
            "step": "completed",
            "status": "completed",
            "result": result
        }
        
        # 广播给所有连接的客户端
        if self.active_connections:
            await self.broadcast(json.dumps(message))
            logger.info(f"Completion update sent for file {file_id}")
    
    async def send_error_update(self, file_id: str, error: str):
        """发送错误更新"""
        message = {
            "type": "error_update",
            "file_id": file_id,
            "error": error,
            "status": "error"
        }
        
        # 更新本地进度缓存
        self.file_progress[file_id] = {
            "progress": 0,
            "step": "error",
            "status": "error",
            "error": error
        }
        
        # 广播给所有连接的客户端
        if self.active_connections:
            await self.broadcast(json.dumps(message))
            logger.info(f"Error update sent for file {file_id}: {error}")
    
    async def broadcast(self, message: str):
        """广播消息给所有连接的客户端"""
        if not self.active_connections:
            return
        
        # 创建任务列表
        tasks = []
        disconnected = set()
        
        for connection in self.active_connections:
            try:
                task = asyncio.create_task(connection.send_text(message))
                tasks.append((connection, task))
            except Exception as e:
                logger.error(f"Error sending message to WebSocket: {e}")
                disconnected.add(connection)
        
        # 移除断开的连接
        for connection in disconnected:
            self.disconnect(connection)
        
        # 等待所有发送任务完成
        if tasks:
            await asyncio.gather(*[task for _, task in tasks], return_exceptions=True)
    
    def get_file_progress(self, file_id: str) -> Optional[Dict]:
        """获取文件的当前进度"""
        return self.file_progress.get(file_id)


# 创建全局WebSocket管理器实例
websocket_manager = WebSocketManager()
