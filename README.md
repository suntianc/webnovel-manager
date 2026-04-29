# 墨境书台 — 网文素材管理系统

全栈网文创作辅助平台，提供素材管理、小说解析、AI 工作流编排和一站式 AI 提供商配置。

## 技术栈

| 层级 | 技术 |
|------|------|
| **后端** | Python 3.10+ / FastAPI / SQLite + FTS5 / Pydantic V2 |
| **前端** | Next.js 14.2 (App Router) / React 18 / TanStack React Query v5 / Tailwind CSS 3.4 |
| **设计系统** | Apple-style（Geist 字体，自定义 Apple 色板） |
| **包管理** | uv（后端）/ npm（前端） |
| **外部依赖** | LiteLLM（AI 提供商连接测试）、@lobehub/icons（AI 品牌图标） |

## 项目结构

```
webnovel-manager/
├── main.py                      # FastAPI 入口
├── app/
│   ├── core/                    # 数据库连接与表创建
│   │   ├── database.py          # SQLite 连接管理器
│   │   └── agent_database.py    # 工作流表 + 种子 Agent
│   ├── schemas/                 # Pydantic V2 数据模型
│   ├── repositories/            # 数据访问层（原始 SQL）
│   ├── services/                # 业务逻辑层
│   └── routers/api/             # API 路由
├── frontend/
│   └── src/
│       ├── app/                 # 页面路由
│       │   ├── page.tsx         # 首页看板
│       │   ├── materials/       # 素材库
│       │   ├── novels/          # 网文处理
│       │   ├── ai-providers/    # AI 提供商管理
│       │   ├── workspace/       # 创作台（占位）
│       │   ├── collect-tasks/   # 采集任务（占位）
│       │   └── material-tasks/  # 素材任务（占位）
│       ├── components/          # React 组件
│       │   ├── dashboard/       # 看板卡片
│       │   ├── materials/       # 素材库组件
│       │   ├── novels/          # 网文处理组件
│       │   ├── ai-providers/    # AI 提供商组件
│       │   ├── layout/          # 布局框架
│       │   └── ui/              # 通用 UI 组件
│       ├── hooks/useApi.ts      # React Query hooks
│       ├── lib/
│       │   ├── api.ts           # API 客户端
│       │   └── theme.ts         # 主题系统
│       └── types/index.ts       # TypeScript 类型定义
├── designs/                     # Pencil 设计文件 (.pen)
├── docs/                        # 设计文档
├── todo/                        # 开发待办
└── data/                        # SQLite 数据库（gitignored）
```

## 快速开始

### 1. 环境准备

```bash
# 安装 uv（包管理器）
curl -LsSf https://astral.sh/uv/install.sh | sh

# 创建并激活虚拟环境
uv venv
source .venv/bin/activate

# 安装后端依赖
uv sync
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

配置以下环境变量（如需使用 AI 功能）：

| 变量 | 说明 |
|------|------|
| `EMBED_BASE_URL` / `EMBED_API_KEY` / `EMBED_MODEL` | Embedding 服务 |
| `RERANK_BASE_URL` / `RERANK_API_KEY` / `RERANK_MODEL` | Rerank 服务 |
| `IMAGE_BASE_URL` / `IMAGE_API_KEY` / `IMAGE_MODEL` / `IMAGE_SIZE` | 图片生成 |
| `LOG_LEVEL` / `LOG_CONSOLE_LEVEL` / `LOG_FILE_LEVEL` / `LOG_FILE` | 日志配置 |

前端 API 地址通过 `NEXT_PUBLIC_API_URL` 配置（默认 `http://localhost:3000`）。

### 3. 启动开发服务器

```bash
# 终端 1 — 后端（端口 3000）
uvicorn main:app --reload

# 终端 2 — 前端（端口 3001）
cd frontend && npm run dev
```

访问：
- 前端界面：http://localhost:3001
- API 文档：http://localhost:3000/docs
- 健康检查：http://localhost:3000/health

## 功能模块

### 📦 素材管理
素材 CRUD，支持标签分类、FTS5 全文搜索、评分筛选、列表/卡片双视图。

### 📖 网文处理
上传 EPUB 文件，自动解析章节、统计字数、按章节组分批，并可启动 AI 分析工作流。

### 🤖 AI 提供商管理
集中管理 AI 服务商配置：
- **支持供应商**：OpenAI、Anthropic、SiliconFlow、DeepSeek 等 12+ 常见提供商
- **快捷配置**：选择名称自动填充 Base URL
- **连接测试**：基于 LiteLLM 验证 API 可用性
- **模型探测**：自动请求 `/v1/models` 接口获取可用模型列表
- **安全存储**：API Key 掩码存储和展示

### 🔄 Agent 工作流引擎
预置 10 个专业 Agent（Reader、Summarizer、Character、Plot 等），支持小说分析/创作两种工作流模板。当前为干运行桩，输出占位文本，待接入真实 LLM。

### ⚙️ 工作流特性
- 实时进度推送（SSE 事件流）
- 人工审核节点（暂停等待确认后恢复）
- 失败重试机制
- 产物版本管理

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/materials/` | 素材管理 |
| GET | `/api/search/` | 全文搜索 |
| GET/POST | `/api/tags/` | 标签管理 |
| POST | `/api/novels/upload` | 小说上传 |
| POST | `/api/novels/{id}/analysis/start` | 启动分析工作流 |
| GET/POST | `/api/ai-providers/` | AI 提供商管理 |
| POST | `/api/ai-providers/test` | 测试提供商配置 |
| POST | `/api/ai-providers/models/fetch` | 探测可用模型 |
| GET | `/api/workflows/` | 工作流管理 |
| GET | `/api/workflows/{id}/events/stream` | SSE 事件流 |
| GET | `/api/artifacts/` | 产物查看 |

完整接口文档见 http://localhost:3000/docs（Swagger UI）。

## 架构说明

### 后端分层

```
Router → Service → Repository → SQLite
  ↑          ↑
HTTP 参数   业务逻辑编排
```

- **Router**：参数提取 + HTTP 状态码，模块级 Service 单例
- **Service**：编排业务逻辑，可跨 Service 调用
- **Repository**：原始 SQL 操作，参数化查询防注入
- **Schema**：Pydantic V2 请求/响应模型 + 字段验证

### 设计系统

Apple 风格设计规范，详见 [DESIGN.md](DESIGN.md)。Tailwind 配置了完整色板（apple-blue、pale-gray、graphite 等）和圆角体系。

## 常用命令

```bash
# 后端
uv sync                    # 安装/更新依赖
uv add <package>           # 添加依赖
uvicorn main:app --reload  # 开发服务器

# 前端
cd frontend && npm run dev       # 开发服务器
cd frontend && npm run build     # 生产构建
cd frontend && npx tsc --noEmit  # 类型检查
```

## 状态

- ✅ 素材管理 CRUD
- ✅ 标签分类 + FTS5 搜索
- ✅ EPUB 上传/解析/分组
- ✅ AI 提供商管理 + LiteLLM 测试
- ✅ 工作流引擎（干运行桩）
- ✅ Apple 风格设计系统
- 🔄 LLM 节点接入（待开发）
- 🔄 测试基础设施（待搭建）
