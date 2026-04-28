# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 技术栈

- **后端:** Python 3.10+ / FastAPI / SQLite + FTS5 / Pydantic V2 / uvicorn / langgraph（已安装，待接入）
- **前端:** Next.js 14.2 (App Router) / React 18 / TanStack React Query v5 / Tailwind CSS 3.4
- **包管理:** uv（后端）/ npm（前端）
- **设计系统:** Apple-style（SF Pro Display/Text → Geist, Apple color tokens）

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
- **Service:** 业务逻辑编排，可跨 Service 调用（如 NovelService 调用 WorkflowService）
- **Repository:** 纯数据访问，使用 `get_db()` context manager 获取连接，返回 `dict` 或 `list[dict]`
- **Schema:** Pydantic V2 定义请求/响应模型，不含业务逻辑
- **Database:** `app/core/database.py`（主库连接） + `app/core/agent_database.py`（Agent 工作流表创建 + 种子数据）

### 模块概览

| 模块 | Router | Service | Repository | 用途 |
|------|--------|---------|-----------|------|
| 素材 | `materials.py` | `material_service.py` | `material_repository.py` | 素材 CRUD + 标签关联 |
| 标签 | `tags.py` | `tag_service.py` | `tag_repository.py` | 标签管理 |
| 搜索 | `search.py` | `search_service.py` | — | FTS5 全文搜索 |
| 分类 | `categories.py` | — | — | 硬编码分类结构 |
| 统计 | `stats.py` | — | — | 聚合统计 |
| 小说 | `novels.py` | `novel_service.py` | `novel_repository.py` | EPUB 上传/解析/分组/分析 |
| Agent | `agents.py` | `agent_service.py` | `agent_repository.py` | Agent 定义 CRUD + 测试桩 |
| 工作流 | `workflows.py` | `workflow_service.py` | `workflow_repository.py` | 工作流编排/执行/SSE 事件流 |
| 产物 | `artifacts.py` | —（同 workflow_service） | —（同 workflow_repository） | 产物查询/更新/确认 |

### 新增模块关键模式

**小说处理流程:** `上传EPUB → 解析(epub_parser.py) → 生成章节组(parts) → 启动分析工作流`

**工作流引擎（非同步模拟执行）:**
- 路由启动工作流 → `start_workflow()` 创建运行记录和任务 → 后台线程执行 `run_workflow()` → 逐节点模拟执行（200ms 进度模拟）
- SSE 端点 `events/stream` 轮询新事件（1s 间隔）实现实时进度推送
- 人工审核节点（`human_review`）暂停运行，等待 `/resume` 恢复
- 任务输出存储为 `agent_artifacts`，支持版本递增

**工作流模板**（`workflow_templates.py`）:
- `novel_analysis`: 8 节点链（Reader → Summarizer → Character → Worldbuilding → Plot → Material 等 Agent）
- `novel_creation`: 8 节点链（Director → Worldbuilding → Character → Plot → Writing → Review → Consistency → Revision）

**种子 Agent**（`agent_database.py` 启动时写入 `agent_definitions` 表）:
10 个预定义 Agent：DirectorAgent、ReaderAgent、SummarizerAgent、WorldbuildingAgent、CharacterAgent、PlotAgent、WriterAgent、ReviewerAgent、ConsistencyAgent、MaterialAgent。当前均为干运行桩，输出占位文本。

**EPUB 解析器**（`epub_parser.py`）: 纯 Python 实现（`zipfile` + `xml.etree.ElementTree` + `html.parser`），无第三方依赖，自动处理 OPF 结构、HTML 清理、章节标题去重。

### Repository 关键模式

使用 `_build_filter_clauses()` 方法动态构建 WHERE 子句，通过 SQL 参数化防注入。所有 Repository 方法独立获取数据库连接（不共享连接）。`ALLOWED_SORT_COLUMNS` 白名单防止 SQL 注入。

### 架构约定

Repository 永远不调用 Service，Schema 不含业务逻辑，Service 使用模块级别单例而非依赖注入。

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` / `/health` | 服务信息和健康检查 |
| GET/POST | `/api/materials/` | 素材列表（分页、筛选、排序）/创建 |
| GET/PUT/DELETE | `/api/materials/{id}` | 素材详情/更新/删除 |
| GET | `/api/search/` | FTS5 全文搜索 |
| GET/POST | `/api/tags/` | 标签列表/创建 |
| DELETE | `/api/tags/{id}` | 删除标签（204） |
| GET | `/api/categories/` | 分类结构（硬编码静态数据） |
| GET | `/api/stats/` | 统计数据 |
| POST | `/api/novels/upload` | 上传 EPUB（`multipart/form-data`，自动触发后台解析） |
| GET/DELETE | `/api/novels/` / `/api/novels/{id}` | 小说列表/删除 |
| POST | `/api/novels/{id}/parse` | 触发解析 |
| GET | `/api/novels/{id}/chapters` | 章节列表（可选 `?include_content`） |
| GET | `/api/novels/{id}/chapters/search?q=` | 章节 LIKE 搜索 |
| POST | `/api/novels/{id}/parts/generate` | 分组生成（`chapters_per_part`，默认 5） |
| GET | `/api/novels/{id}/parts` | 分组列表 |
| POST | `/api/novels/{id}/analysis/start` | 启动分析工作流（201，后台任务） |
| GET/POST | `/api/agents/` | Agent 定义列表/创建 |
| GET/PUT | `/api/agents/{id}` | Agent 定义详情/更新 |
| POST | `/api/agents/{id}/test` | Agent 干运行测试 |
| POST | `/api/workflows/start` | 启动工作流（201，后台任务） |
| GET | `/api/workflows/` | 工作流列表（按 status/type/biz_type 过滤） |
| GET/POST/POST/POST | `/api/workflows/{id}` / `.../resume` / `.../cancel` / `.../retry` | 运行详情/恢复/取消/重试 |
| GET/GET | `/api/workflows/{id}/tasks` / `.../events` | 任务列表/事件列表 |
| GET | `/api/workflows/{id}/events/stream` | SSE 事件流 |
| GET | `/api/artifacts/` | 产物列表（分页，按 run_id/type/status/agent 过滤） |
| GET/PUT | `/api/artifacts/{id}` | 产物详情/更新 |
| POST | `/api/artifacts/{id}/confirm\|reject\|import` | 产物状态更新 |

### 前端架构

```
Next.js 14 App Router (pages/)
    └── React Query hooks (hooks/useApi.ts) → API client (lib/api.ts) → FastAPI backend
    └── Components (components/)
         ├── layout/        DashboardLayout + Sidebar + PlaceholderPage
         ├── dashboard/     DashboardHome（首页看板）
         ├── materials/     MaterialLibrary（素材库，含列表/卡片双视图）
         ├── novels/        NovelProcessing + NovelDetail（网文处理）
         └── ui/            Icon（SVG icon 组件，~30 个手写图标）
```

- **API client** (`lib/api.ts`): 基于 `fetch`，按资源分组（materialsApi, tagsApi, searchApi, statsApi, categoriesApi, novelsApi, workflowsApi, artifactsApi）
- **React Query hooks** (`hooks/useApi.ts`): 每个 API 操作对应一个 hook（useQuery/useMutation），mutation 成功后自动 `invalidateQueries`
- **Provider** (`Providers.tsx`): QueryClientProvider，staleTime 60s，refetchOnWindowFocus: false
- **TypeScript 类型** (`types/index.ts`): 包含 Material、NovelSource、NovelChapter、NovelPart、WorkflowRun、WorkflowTask、WorkflowEvent、Artifact 等完整类型
- **主题系统** (`lib/theme.ts`): localStorage 键 `wm-theme`，light/dark 模式切换，内联脚本防 FOUC
- **页面状态:**
  - `/` 首页看板 — 已实现
  - `/materials` 素材库 — 已实现
  - `/novels` 网文处理 — 已实现（上传/解析/分组/分析工作流）
  - `/workspace`, `/collect-tasks`, `/material-tasks` — PlaceholderPage，待开发

### 数据库

- 主文件: `data/materials.db`（gitignored）
- 原有表（素材管理）:
  - `materials`, `tags`, `material_tags`, `materials_fts`（FTS5 虚拟表）
- 新增表（小说 + Agent 工作流）:
  - `novel_sources`, `novel_chapters`, `novel_parts` — 小说上传/解析/分组
  - `agent_definitions` — Agent 配置（10 个种子行）
  - `workflow_runs`, `workflow_tasks`, `workflow_events` — 工作流编排
  - `agent_artifacts` — 产物（版本递增，支持 draft/confirmed/rejected/imported 状态）
- 素材列表使用 `raw_score` + 应用层分页的 `LIKE` 搜索；FTS5 仅用于 `/api/search`（BM25 排序）
- 标签系统通过 `material_tags` 关联表管理，素材的 `tags` JSON 字段保留为旧版兼容

## 设计系统

完整的 Apple-style 设计规范见 [DESIGN.md](DESIGN.md)。Tailwind 已配置相应 color tokens:
- `black`, `pale-gray` (#f5f5f7), `near-black` (#1d1d1f) — 主色调
- `apple-blue` (#0071e3), `link-blue` (#0066cc), `highlight-blue` (#2997ff) — 交互强调色
- `soft-border` (#d2d2d7), `mid-border` (#86868b) — 边框色
- `graphite-a` ~ `graphite-d` — 深色层级面
- 字体: Geist Sans（SF 替代）+ Geist Mono
- 圆角: sm(5px) → DEFAULT(8px) → lg(16px) → xl(18px) → 2xl(24px) → 4xl(36px) → full(9999px)

## 关键约定

- Router 前缀 `/api/{resource}`（materials 带尾部斜杠 `/api/materials/`）
- 返回值格式: 直接 JSON，无统一 wrapper
- 分页响应格式: `{ data: [...], total: number, page: number, limit: number }`
- 后台任务用 FastAPI `BackgroundTasks`（非异步队列）
- Service 使用模块级别单例而非依赖注入
- Repository 永远不调用 Service，Schema 不含业务逻辑
- 前端禁止 `as any`、`@ts-ignore`
- 后端禁止空 catch 块
- TypeScript strict 模式，路径别名 `@/*` → `./src/*`
- 数据库操作通过 Repository，直接使用 `get_db()` context manager

## 环境变量

- 复制 `.env` 文件配置以下内容：
  - **SiliconFlow API:** `EMBED_BASE_URL` / `EMBED_MODEL` / `EMBED_API_KEY`（Embedding）
  - **Rerank API:** `RERANK_BASE_URL` / `RERANK_MODEL` / `RERANK_API_KEY`
  - **图片生成:** `IMAGE_BASE_URL` / `IMAGE_MODEL` / `IMAGE_API_KEY` / `IMAGE_SIZE`
  - **日志:** `LOG_LEVEL` / `LOG_CONSOLE_LEVEL` / `LOG_FILE_LEVEL` / `LOG_FILE`
- `.env` 不应提交到 git
- 前端: `NEXT_PUBLIC_API_URL` 默认 `http://localhost:3000`
- 后端端口默认 3000，前端开发端口 3001

## 未完成事项

- LLM 节点未接入 — `workflow_service._execute_task()` 和 `agent_service.test_agent()` 均为干运行桩，输出占位文本。需接入 LangGraph/实际 LLM 调用
- 无测试基础设施（pytest + pytest-asyncio + httpx 已安装但无 test/ 目录）
- 工作流引擎为同步模拟实现，真实场景需改为异步任务队列
- `/workspace`、`/collect-tasks`、`/material-tasks` 三个页面为占位状态
- `todo/网文处理后续开发待办.md` 中的小说处理功能待完成
- 无 CI/CD 流水线配置
- AI 对话式交互界面待实现
