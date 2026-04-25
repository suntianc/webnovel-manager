# 网文素材管理系统

网文素材管理系统的 REST API 服务，基于 FastAPI + SQLite + FTS5 构建。

## 技术栈

- **框架:** FastAPI (Python 3.10+)
- **数据库:** SQLite + FTS5 全文检索
- **数据验证:** Pydantic V2
- **文档:** Swagger UI (`/docs`) / ReDoc (`/redoc`)

## 项目结构

```
.
├── main.py              # FastAPI 应用入口
├── pyproject.toml     # uv 项目配置
├── app/
│   ├── core/          # 数据库连接
│   ├── schemas/       # Pydantic 数据模型
│   ├── repositories/   # 数据访问层
│   ├── services/     # 业务逻辑层
│   └── routers/      # API 路由
├── data/
│   └── materials.db  # SQLite 数据库
└── docs/             # API 文档
```

## 环境准备

### 1. 安装 uv

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 2. 创建虚拟环境并安装依赖

```bash
# 创建虚拟环境
uv venv

# 激活环境 (Linux/Mac)
source .venv/bin/activate

# 激活环境 (Windows)
.venv\Scripts\activate

# 安装依赖
uv sync
```

## 启动服务

```bash
# 开发模式启动（热重载）
uvicorn main:app --host 0.0.0.0 --port 3000 --reload

# 生产模式
uvicorn main:app --host 0.0.0.0 --port 3000 --workers 4
```

## 初始化数据库

如需重置数据库：

```bash
# 删除现有数据库
rm -f data/materials.db

# 使用 Node.js 初始化脚本（需 Node.js 环境）
node config/initDb.js
```

## 访问地址

| 服务 | 地址 |
|------|------|
| API 端点 | http://localhost:3000 |
| Swagger 文档 | http://localhost:3000/docs |
| ReDoc 文档 | http://localhost:3000/redoc |
| 健康检查 | http://localhost:3000/health |

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/materials | 素材列表 |
| POST | /api/materials | 创建素材 |
| GET | /api/materials/{id} | 素材详情 |
| PUT | /api/materials/{id} | 更新素材 |
| DELETE | /api/materials/{id} | 删除素材 |
| GET | /api/search | FTS5 全文搜索 |
| GET | /api/tags | 标签列表 |
| POST | /api/tags | 创建标签 |
| DELETE | /api/tags/{id} | 删除标签 |
| GET | /api/categories | 分类结构 |
| GET | /api/stats | 统计数据 |

详细 API 文档见 [docs/接口文档.md](docs/接口文档.md)

## 常用命令

```bash
# 安装依赖
uv sync

# 添加新依赖
uv add fastapi pydantic

# 添加开发依赖
uv add --dev pytest httpx

# 更新依赖
uv sync

# 查看已安装的包
uv pip list
```

## License

MIT
