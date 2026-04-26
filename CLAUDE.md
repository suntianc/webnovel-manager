# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 技术栈

- **后端:** Python 3.10+ / FastAPI / SQLite + FTS5 / Pydantic V2 / uvicorn
- **前端:** Next.js 14.2 (App Router) / React 18 / TanStack React Query v5 / Tailwind CSS 3.4
- **包管理:** uv (后端) / npm (前端)
- **设计系统:** Apple-style (SF Pro Display/Text → Geist, Apple color tokens)

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
```

### 同时启动

```bash
# 终端1: uvicorn main:app --reload
# 终端2: cd frontend && npm run dev
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
- **Schema:** Pydantic V2 定义请求/响应模型，不含业务逻辑
- **Database:** `app/core/database.py` — SQLite context manager，启用 WAL 模式和外键

API 端点:
| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/materials/` | 素材列表/创建 |
| GET/PUT/DELETE | `/api/materials/{id}` | 素材详情/更新/删除 |
| GET | `/api/search/` | FTS5 全文搜索 |
| GET/POST | `/api/tags/` | 标签列表/创建 |
| DELETE | `/api/tags/{id}` | 删除标签 |
| GET | `/api/categories/` | 分类结构（静态数据） |
| GET | `/api/stats/` | 统计数据 |

### 前端架构

```
Next.js 14 App Router (pages/)
    └── React Query hooks (hooks/useApi.ts) → API client (lib/api.ts) → FastAPI backend
    └── Components (components/)
         ├── layout/        DashboardLayout + Sidebar + PlaceholderPage
         ├── dashboard/     DashboardHome (首页看板)
         ├── materials/     MaterialLibrary (素材库，含列表/卡片双视图)
         └── ui/            Icon (SVG icon 组件)
```

- **API client** (`lib/api.ts`): 基于 `fetch` 的模块化函数，按资源分组（materialsApi, tagsApi, searchApi 等），`NEXT_PUBLIC_API_URL` 环境变量配置后端地址
- **React Query hooks** (`hooks/useApi.ts`): 每个 API 操作对应一个 hook（useQuery/useMutation），自动缓存失效
- **Provider** (`Providers.tsx`): QueryClientProvider，staleTime 60s
- **页面状态:**
  - `/` 首页看板 — 已实现，含 KPI 卡片、分类分布、状态统计、任务卡片，使用真实 API 数据
  - `/materials` 素材库 — 已实现，列表/卡片双视图、搜索、标签过滤、CRUD 编辑弹窗
  - `/workspace`, `/collect-tasks`, `/material-tasks` — PlaceholderPage，待开发

### 数据库

- 文件: `data/materials.db`（gitignored）
- 表: `materials`, `tags`, `material_tags`（多对多关联）, `materials_fts`（FTS5 虚拟表）
- 素材使用 `raw_score` + 应用层分页的 `LIKE` 搜索；FTS5 仅用于 `/api/search`
- 标签系统: `tags` 表存储正式标签 → `material_tags` 关联表；素材内嵌 `tags` JSON 字段作为历史兼容

## 设计系统

完整的 Apple-style 设计规范见 [DESIGN.md](DESIGN.md)。Tailwind 已配置相应 color tokens:
- `black`, `pale-gray` (#f5f5f7), `near-black` (#1d1d1f) — 主色调
- `apple-blue` (#0071e3), `link-blue` (#0066cc), `highlight-blue` (#2997ff) — 交互强调色
- `soft-border` (#d2d2d7), `mid-border` (#86868b) — 边框色
- `graphite-a` ~ `graphite-d` — 深色层级面
- 字体: Geist Sans (SF 替代) + Geist Mono
- 圆角: sm(5px) → DEFAULT(8px) → lg(16px) → xl(18px) → 2xl(24px) → 4xl(36px) → full(9999px)

## 主题系统

前端原生 light/dark 主题切换:
- 存储键: `wm-theme` (localStorage)
- 类型: `"light" | "dark"`
- 实现: `lib/theme.ts` + `layout.tsx` 内联脚本（避免 FOUC）
- 默认值: light

## 关键约定

- Router 前缀 `/api/{resource}`（注意 materials 是 `/api/materials/` 带尾部斜杠）
- 返回值格式: 直接 JSON，无统一 wrapper
- Service 使用模块级别单例而非依赖注入
- Repository 永远不调用 Service，Schema 不含业务逻辑
- 前端禁止 `as any`、`@ts-ignore`
- 后端禁止空 catch 块
- TypeScript strict 模式，路径别名 `@/*` → `./src/*`
- 数据库操作通过 Repository，直接使用 `get_db()` context manager

## 环境变量

- `.env` 文件包含 SiliconFlow API 密钥（Embedding/Rerank/Image），不应提交到 git
- 前端: `NEXT_PUBLIC_API_URL` 默认 `http://localhost:3000`
- 后端端口默认 3000

## 未完成事项

- 无测试基础设施（pytest 依赖已安装但无 test/ 目录）
- `/workspace`、`/collect-tasks`、`/material-tasks` 三个页面为占位状态
- `app/repositories/` 和 `app/services/` 缺少 `__init__.py`（不影响运行，但不是标准 Python 包）
