# DocExtractMD

> 提取多种格式文件内容，并且转化为markdown。

## 环境准备

### 1. 下载模型（首次使用需要）

在启动服务之前，需要先下载必要的模型文件：

```bash
# 进入MinerU-Local目录
cd /Users/xxiixi/MinerU-Local

# 下载所有模型（pipeline + vlm）
python -m mineru.cli.models_download --source huggingface --model_type all
```

### 2. 设置环境变量

为了避免每次启动都重新下载模型，请设置环境变量：

```bash
export MINERU_MODEL_SOURCE=local
```

## 启动服务

### Start minerU

`mineru-api --host 0.0.0.0 --port 8000`

### Start Frontend
`cd doc-extract-md`
`npm run dev`

### Start mineru local (new)

使用启动脚本（自动设置环境变量）：
```bash
cd /Users/xxiixi/MinerU-Local
./start_mineru_api.sh
```

或手动启动：
```bash
export MINERU_MODEL_SOURCE=local
python -m mineru.cli.fast_api --host 0.0.0.0 --port 8000
```

## 注意事项

- 首次使用需要下载模型文件，这可能需要一些时间
- 模型文件会缓存在 `~/.cache/huggingface/` 目录下
- 配置文件 `~/mineru.json` 会自动生成，包含本地模型路径
- 设置 `MINERU_MODEL_SOURCE=local` 环境变量可以避免重复下载模型