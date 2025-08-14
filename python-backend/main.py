from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import json
import base64
from PIL import Image
from io import BytesIO, StringIO
import os

app = Flask(__name__)
CORS(app)  # 解决跨域问题

# 支持的文件类型及其处理函数映射
SUPPORTED_FILE_TYPES = {
    'text/csv': 'parse_csv',
    'application/json': 'parse_json',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'parse_excel',
    'application/vnd.ms-excel': 'parse_excel',
    'image/jpeg': 'parse_image',
    'image/png': 'parse_image',
    'text/plain': 'parse_text'
}

def parse_csv(file_content):
    """解析CSV文件"""
    try:
        df = pd.read_csv(StringIO(file_content.decode('utf-8')))
        return {
            'table_data': {
                'headers': df.columns.tolist(),
                'rows': df.values.tolist()
            }
        }
    except Exception as e:
        raise Exception(f"CSV解析错误: {str(e)}")

def parse_json(file_content):
    """解析JSON文件"""
    try:
        json_data = json.loads(file_content.decode('utf-8'))
        return {'json_data': json_data}
    except Exception as e:
        raise Exception(f"JSON解析错误: {str(e)}")

def parse_excel(file_content):
    """解析Excel文件"""
    try:
        df = pd.read_excel(BytesIO(file_content))
        return {
            'table_data': {
                'headers': df.columns.tolist(),
                'rows': df.values.tolist()
            }
        }
    except Exception as e:
        raise Exception(f"Excel解析错误: {str(e)}")

def parse_image(file_content):
    """解析图片文件"""
    try:
        img = Image.open(BytesIO(file_content))
        # 将图片转换为base64编码
        buffered = BytesIO()
        img.save(buffered, format=img.format)
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        return {
            'base64': img_base64,
            'width': img.width,
            'height': img.height,
            'format': img.format
        }
    except Exception as e:
        raise Exception(f"图片解析错误: {str(e)}")

def parse_text(file_content):
    """解析文本文件"""
    try:
        text = file_content.decode('utf-8')
        return {'text_data': text}
    except Exception as e:
        raise Exception(f"文本解析错误: {str(e)}")

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'message': '未找到文件'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': '未选择文件'}), 400
    
    # 检查文件类型是否支持
    if file.content_type not in SUPPORTED_FILE_TYPES:
        return jsonify({
            'message': f'不支持的文件类型: {file.content_type}'
        }), 400
    
    try:
        # 读取文件内容
        file_content = file.read()
        
        # 根据文件类型选择相应的解析函数
        parse_func_name = SUPPORTED_FILE_TYPES[file.content_type]
        parse_func = globals()[parse_func_name]
        
        # 解析文件并返回结果
        result = parse_func(file_content)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'message': str(e)}), 500

if __name__ == '__main__':
    # 确保上传目录存在
    if not os.path.exists('uploads'):
        os.makedirs('uploads')
    
    app.run(debug=True)
    