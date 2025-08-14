"""
表现层 - FastAPI应用入口，处理HTTP请求和响应
"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List
import uvicorn
import os

from service import FileProcessingService

# 创建FastAPI应用实例
app = FastAPI(
    title="文档文字提取服务",
    description="支持TXT和PDF文件的文字内容提取",
    version="1.0.0"
)

# 配置CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境中应该指定具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 创建文件处理服务实例
file_service = FileProcessingService()


@app.get("/")
async def root():
    """根路径，返回服务信息"""
    return {
        "message": "文档文字提取服务",
        "version": "1.0.0",
        "description": "支持TXT和PDF文件的文字内容提取"
    }


@app.get("/api/supported-types")
async def get_supported_file_types():
    """获取支持的文件类型信息"""
    return file_service.get_supported_file_types()


@app.post("/api/extract-text")
async def extract_text_from_file(file: UploadFile = File(...)):
    """
    从单个文件提取文字内容
    
    Args:
        file: 上传的文件
        
    Returns:
        提取的文字内容
    """
    try:
        # 调用业务逻辑层处理文件
        result = await file_service.process_file(file)
        
        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result["error_message"])
        
        return {
            "success": True,
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")


@app.post("/api/extract-text-multiple")
async def extract_text_from_multiple_files(files: List[UploadFile] = File(...)):
    """
    从多个文件提取文字内容
    
    Args:
        files: 上传的文件列表
        
    Returns:
        所有文件的提取结果
    """
    try:
        if not files:
            raise HTTPException(status_code=400, detail="请至少上传一个文件")
        
        # 调用业务逻辑层处理多个文件
        result = await file_service.process_multiple_files(files)
        
        return {
            "success": True,
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"服务器内部错误: {str(e)}")


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """全局异常处理器"""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "服务器内部错误",
            "detail": str(exc)
        }
    )


if __name__ == "__main__":
    # 确保上传目录存在
    if not os.path.exists('uploads'):
        os.makedirs('uploads')
    
    # 启动服务器
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
    