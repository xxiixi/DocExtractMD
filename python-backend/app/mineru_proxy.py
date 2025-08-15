"""
MinerU API代理模块
用于转发前端请求到MinerU API服务，解决跨域问题
"""
import aiohttp
import aiofiles
import os
import tempfile
from fastapi import UploadFile, HTTPException
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class MinerUProxy:
    """MinerU API代理类"""
    
    def __init__(self, mineru_base_url: str = "http://localhost:8000"):
        self.mineru_base_url = mineru_base_url
        self.file_parse_endpoint = f"{mineru_base_url}/file_parse"
    
    async def process_pdf_with_mineru(self, file: UploadFile) -> Dict[str, Any]:
        """
        使用MinerU API处理PDF文件
        
        Args:
            file: 上传的PDF文件
            
        Returns:
            包含处理结果的字典
        """
        try:
            logger.info(f"开始使用MinerU处理PDF文件: {file.filename}")
            
            # 验证文件类型
            if not file.filename.lower().endswith('.pdf'):
                raise HTTPException(status_code=400, detail="只支持PDF文件")
            
            # 创建临时文件
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                # 读取上传的文件内容
                content = await file.read()
                temp_file.write(content)
                temp_file.flush()
                
                # 准备发送到MinerU API的数据
                async with aiofiles.open(temp_file.name, 'rb') as f:
                    file_content = await f.read()
                
                # 准备FormData
                data = aiohttp.FormData()
                data.add_field('files', file_content, filename=file.filename, content_type='application/pdf')
                data.add_field('return_md', 'true')
                data.add_field('lang_list', 'ch')
                data.add_field('backend', 'pipeline')
                data.add_field('parse_method', 'auto')
                data.add_field('formula_enable', 'true')
                data.add_field('table_enable', 'true')
                
                # 指定输出目录为python-backend目录下的output文件夹
                import os
                output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'output')
                if not os.path.exists(output_dir):
                    os.makedirs(output_dir)
                data.add_field('output_dir', output_dir)
                
                # 发送请求到MinerU API
                async with aiohttp.ClientSession() as session:
                    async with session.post(self.file_parse_endpoint, data=data) as response:
                        if response.status != 200:
                            error_text = await response.text()
                            logger.error(f"MinerU API错误: {response.status} - {error_text}")
                            raise HTTPException(
                                status_code=response.status, 
                                detail=f"MinerU API错误: {error_text}"
                            )
                        
                        result = await response.json()
                        logger.info(f"MinerU处理成功: {file.filename}")
                        
                        # 清理临时文件
                        try:
                            os.unlink(temp_file.name)
                        except:
                            pass
                        
                        # 尝试从输出目录读取生成的Markdown文件
                        md_content = await self._read_output_markdown_file(file.filename)
                        if md_content:
                            return {
                                "success": True,
                                "data": {
                                    "filename": file.filename,
                                    "md_content": md_content,
                                    "status": "success",
                                    "source": "mineru_output_file"
                                }
                            }
                        
                        # 如果无法读取输出文件，则使用API返回的结果
                        return self._process_mineru_response(result, file.filename)
                        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"处理PDF文件失败: {str(e)}")
            raise HTTPException(status_code=500, detail=f"处理失败: {str(e)}")
    
    def _process_mineru_response(self, mineru_result: Dict[str, Any], filename: str) -> Dict[str, Any]:
        """
        处理MinerU API的响应
        
        Args:
            mineru_result: MinerU API的原始响应
            filename: 文件名
            
        Returns:
            处理后的结果
        """
        try:
            # 从文件名中提取key（去掉.pdf扩展名）
            file_key = filename.replace('.pdf', '')
            
            # 检查结果中是否包含该文件
            if 'results' not in mineru_result or file_key not in mineru_result['results']:
                raise HTTPException(status_code=500, detail="MinerU返回结果中未找到文件")
            
            file_result = mineru_result['results'][file_key]
            
            # 检查处理状态
            if file_result.get('status') != 'success':
                error_msg = file_result.get('error_message', '未知错误')
                raise HTTPException(status_code=500, detail=f"MinerU处理失败: {error_msg}")
            
            # 提取Markdown内容
            md_content = file_result.get('md_content', '')
            
            return {
                "success": True,
                "data": {
                    "filename": filename,
                    "md_content": md_content,
                    "status": "success",
                    "source": "mineru"
                }
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"处理MinerU响应失败: {str(e)}")
            raise HTTPException(status_code=500, detail=f"处理响应失败: {str(e)}")
    
    async def _read_output_markdown_file(self, filename: str) -> str:
        """
        从MinerU输出目录读取生成的Markdown文件
        
        Args:
            filename: 原始文件名
            
        Returns:
            Markdown文件内容，如果文件不存在则返回空字符串
        """
        try:
            base_name = filename.replace('.pdf', '')
            # 使用后端目录下的output文件夹
            output_base_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'output')
            
            logger.info(f"查找输出目录: {output_base_dir}")
            
            # 查找最新的输出目录
            if not os.path.exists(output_base_dir):
                logger.warning(f"输出目录不存在: {output_base_dir}")
                return ""
            
            # 获取所有子目录，按修改时间排序
            subdirs = []
            for item in os.listdir(output_base_dir):
                item_path = os.path.join(output_base_dir, item)
                if os.path.isdir(item_path):
                    subdirs.append((item_path, os.path.getmtime(item_path)))
            
            if not subdirs:
                logger.warning("输出目录中没有找到子目录")
                return ""
            
            # 按修改时间排序，获取最新的目录
            subdirs.sort(key=lambda x: x[1], reverse=True)
            latest_dir = subdirs[0][0]
            
            logger.info(f"使用最新的输出目录: {latest_dir}")
            
            # 在最新目录中查找对应的文件目录
            file_dir = os.path.join(latest_dir, base_name)
            if not os.path.exists(file_dir):
                logger.warning(f"文件目录不存在: {file_dir}")
                return ""
            
            # 查找auto目录
            auto_dir = os.path.join(file_dir, 'auto')
            if not os.path.exists(auto_dir):
                logger.warning(f"auto目录不存在: {auto_dir}")
                return ""
            
            # 查找Markdown文件
            md_file_path = os.path.join(auto_dir, f'{base_name}.md')
            logger.info(f"尝试读取输出文件: {md_file_path}")
            
            if os.path.exists(md_file_path):
                async with aiofiles.open(md_file_path, 'r', encoding='utf-8') as f:
                    content = await f.read()
                    logger.info(f"成功读取输出文件，内容长度: {len(content)}")
                    return content
            else:
                logger.warning(f"输出文件不存在: {md_file_path}")
                return ""
                
        except Exception as e:
            logger.error(f"读取输出文件失败: {str(e)}")
            return ""

    async def health_check(self) -> Dict[str, Any]:
        """
        检查MinerU API服务是否可用
        
        Returns:
            健康检查结果
        """
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.mineru_base_url}/docs") as response:
                    if response.status == 200:
                        return {
                            "status": "healthy",
                            "mineru_url": self.mineru_base_url,
                            "message": "MinerU API服务正常运行"
                        }
                    else:
                        return {
                            "status": "unhealthy",
                            "mineru_url": self.mineru_base_url,
                            "message": f"MinerU API服务响应异常: {response.status}"
                        }
        except Exception as e:
            return {
                "status": "unhealthy",
                "mineru_url": self.mineru_base_url,
                "message": f"无法连接到MinerU API服务: {str(e)}"
            }


# 创建全局代理实例
mineru_proxy = MinerUProxy()
