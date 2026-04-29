# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 技术栈

- **后端:** Python 3.10+ / FastAPI / SQLite + FTS5 / Pydantic V2 / uvicorn / langgraph（已安装，待接入）
- **前端:** Next.js 14.2 (App Router) / React 18 / TanStack React Query v5 / Tailwind CSS 3.4
- **包管理:** uv（后端）/ npm（前端）
- **设计系统:** Apple-style（SF Pro Display/Text → Geist, Apple color tokens）
- **外部依赖:** LiteLLM（AI 提供商连接测试）、@lobehub/icons（提供商图标，--legacy-peer-deps 安装）

## 常用命令

### 后端

```bash
uv sync                          # 安装依赖
uv add <package>                 # 添加依赖
uv add --dev <package>           # 添加开发依赖
uvicorn main:app --reload        # 开发服务器 (localhost:3000)
```

### 前端

```bash
cd frontend && npm run dev       # 开发服务器 (localhost:3001)
cd frontend && npm run build     # 生产构建
cd frontend && npm run lint      # ESLint 检查
cd frontend && npx tsc --noEmit  # TypeScript 类型检查
```

## 架构

### 后端分层

```
Router (app/routers/api/) → Service (app/services/) → Repository (app/repositories/) → SQLite
                                ↑                           ↑
                        可调用其他Service             原始SQL查询
```

- **Router:** 只做参数提取和 HTTP 状态码，模块级别实例化 Service（非 DI）
- **Service:** 业务逻辑编排，可跨 Service 调用
- **Repository:** 纯数据访问，使用 `get_db()` context manager 获取连接，返回 `dict` 或 `list[dict]`
- **Schema:** Pydantic V2 定义请求/响应模型，含字段验证（如 Base URL 格式校验）

### 模块概览

| 模块 | Router | Service | Repository | 用途 |
|------|--------|---------|-----------|------|
| 素材 | `materials.py` | `material_service.py` | `material_repository.py` | 素材 CRUD + 标签关联 |
| 标签 | `tags.py` | `tag_service.py` | `tag_repository.py` | 标签管理 |
| 搜索 | `search.py` | `search_service.py` | — | FTS5 全文搜索 |
| 分类 | `categories.py` | — | — | 硬编码分类结构 |
| 统计 | `stats.py` | — | — | 聚合统计 |
| 小说 | `novels.py` | `novel_service.py` | `novel_repository.py` | EPUB 上传/解析/分组/分析 |
| Agent | `agents.py` | `agent_service.py` | `agent_repository.py` | Agent 定义 CRUD |
| 工作流 | `workflows.py` | `workflow_service.py` | `workflow_repository.py` | 工作流编排/SSE 事件流 |
| 产物 | `artifacts.py` | —（同 workflow_service） | —（同 workflow_repository） | 产物查询/更新/确认 |
| **AI 提供商** | `ai_providers.py` | **`ai_provider_service.py`** | **`ai_provider_repository.py`** | 供应商 CRUD + 测试 + 模型探测 |

### 新增模块说明

**AI 提供商模块**（`ai_providers`）:
- 前后端完整 CRUD，支持搜索式名称下拉选择（KNOWN_PROVIDERS）
- API Key 掩码存储（`has_api_key`/`api_key_masked` 返回前端，`include_secret=True` 获取明文）
- 名称唯一性校验（`find_by_name()` + 409 HTTP 状态码）
- 两个特殊端点：`POST /api/ai-providers/test`（直接用表单数据测试连接）和 `POST /api/ai-providers/models/fetch`（基于表单数据探测模型）
- LiteLLM `litellm.completion()` 进行连接测试
- 使用 `urllib.request` 请求 `{base_url}/models` 接口探测可用模型

**种子 Agent**（`agent_database.py` 启动时写入 `agent_definitions` 表）:
10 个预定义 Agent（DirectorAgent、ReaderAgent、SummarizerAgent 等），当前均为干运行桩。

**EPUB 解析器**（`epub_parser.py`）: 纯 Python，无第三方依赖。

**Repository 关键模式:** `_build_filter_clauses()` 动态 WHERE 子句 + 参数化查询防注入 + `ALLOWED_SORT_COLUMNS` 白名单。

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` / `/health` | 服务信息和健康检查 |
| GET/POST | `/api/materials/` | 素材列表/创建 |
| GET/PUT/DELETE | `/api/materials/{id}` | 素材详情/更新/删除 |
| GET | `/api/search/` | FTS5 全文搜索 |
| GET/POST | `/api/tags/` | 标签列表/创建 |
| DELETE | `/api/tags/{id}` | 删除标签（204） |
| GET | `/api/categories/` | 分类结构（硬编码） |
| GET | `/api/stats/` | 统计数据 |
| POST | `/api/novels/upload` | 上传 EPUB |
| GET/DELETE | `/api/novels/` / `{id}` | 小说列表/删除 |
| POST | `/api/novels/{id}/parse` | 触发解析 |
| GET | `/api/novels/{id}/chapters` | 章节列表 |
| POST | `/api/novels/{id}/parts/generate` | 分组生成 |
| POST | `/api/novels/{id}/analysis/start` | 启动分析工作流 |
| GET/POST | `/api/agents/` | Agent 列表/创建 |
| POST | `/api/workflows/start` | 启动工作流 |
| GET | `/api/workflows/{id}/events/stream` | SSE 事件流 |
| GET | `/api/artifacts/` | 产物列表 |
| **GET/POST** | **`/api/ai-providers/`** | **AI 提供商列表/创建** |
| **GET/PUT/DELETE** | **`/api/ai-providers/{id}`** | **详情/更新/删除** |
| **POST** | **`/api/ai-providers/test`** | **直接测试配置（无需保存）** |
| **POST** | **`/api/ai-providers/models/fetch`** | **探测模型列表** |
| **POST** | **`/api/ai-providers/{id}/test`** | **测试已保存的提供商** |
| **POST** | **`/api/ai-providers/{id}/models/fetch`** | **已保存提供商的模型探测** |

### 前端架构

```
Next.js 14 App Router (pages/)
    └── React Query hooks (hooks/useApi.ts) → API client (lib/api.ts) → FastAPI backend
    └── Components (components/)
         ├── layout/        DashboardLayout + Sidebar + PlaceholderPage
         ├── dashboard/     DashboardHome
         ├── materials/     MaterialLibrary
         ├── novels/        NovelProcessing + NovelDetail
         ├── ai-providers/  AIProviderList + ProviderDialog + ProviderIcon
         └── ui/            Icon
```

- **API client** (`lib/api.ts`): 8 个 API 对象，新增 `providersApi`
- **React Query hooks** (`hooks/useApi.ts`): 每个 API 操作对应 hook，新增 7 个 provider hooks
- **TypeScript 类型** (`types/index.ts`): 含 `AIProvider`, `AIProviderCreate`, `AIProviderUpdate`, `KNOWN_PROVIDERS` 常量
- **页面状态:**
  - `/` 首页看板 — 已实现
  - `/materials` 素材库 — 已实现
  - `/novels` 网文处理 — 已实现
  - `/ai-providers` AI 提供商 — 已实现
  - `/workspace`, `/collect-tasks`, `/material-tasks` — PlaceholderPage，待开发

### 数据库

- 主文件: `data/materials.db`（gitignored）
- 素材表: `materials`, `tags`, `material_tags`, `materials_fts`
- 小说表: `novel_sources`, `novel_chapters`, `novel_parts`
- 工作流表: `agent_definitions`, `workflow_runs`, `workflow_tasks`, `workflow_events`, `agent_artifacts`
- **AI 提供商表:** `ai_providers`（name/base_url/api_key/models/status，API Key 掩码返回前端）

## 关键约定

- Router 前缀 `/api/{resource}`（materials 带尾部斜杠 `/api/materials/`）
- 分页响应格式: `{ data: [...], total, page, limit }`
- 后台任务用 FastAPI `BackgroundTasks`
- Service 模块级别单例，Repository 永远不调用 Service
- 前端禁止 `as any`、`@ts-ignore`，TypeScript strict 模式
- 后端禁止空 catch 块
- API Key 默认掩码返回（`api_key_masked`），`include_secret=True` 时传递明文
- 提供商名称全局唯一（`find_by_name()` + 409）

## 未完成事项

- LLM 节点未接入（工作流/Agent 均为干运行桩）
- 无测试基础设施（pytest 已安装）
- 工作流引擎为同步模拟实现，需改为异步队列
- `/workspace`、`/collect-tasks`、`/material-tasks` 三个页面为占位状态
- `todo/网文处理后续开发待办.md` 中的功能待完成
- AI 对话式交互界面待实现
