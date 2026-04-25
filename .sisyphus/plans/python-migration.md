# 网文素材管理系统 - Python 改造计划

## TL;DR

> **Quick Summary**: 将 Node.js/Express 后端迁移至 Python/FastAPI，保留 SQLite + FTS5 数据库
>
> **Deliverables**:
> - FastAPI 应用（main.py）+ 11 个 API 端点
> - 分层架构：routers/services/repositories/schemas
> - Pydantic V2 请求/响应模型
> - 自动 OpenAPI 文档（/docs）
>
> **Estimated Effort**: Medium-Large
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: T1 → T2 → T4 → T6 → T7

---

## Context

### Original Request
用户需求搞错了，需要重新制定开发计划。去掉前端页面，只要后台服务，对外暴露接口。

### 技术栈变更

| 项目 | 原（Node.js） | 新（Python） |
|------|---------------|--------------|
| 框架 | Express 5.x | FastAPI |
| 数据库 | SQLite + FTS5 (better-sqlite3) | SQLite + FTS5 (sqlite3) |
| 验证 | 无 | Pydantic V2 |
| 文档 | 手动 | 自动 OpenAPI (/docs) |
| 端口 | 3000 | 3000（保持一致） |

### 迁移范围

**保留**:
- SQLite 数据库文件 `data/materials.db`
- FTS5 触发器逻辑
- 分类配置（硬编码）
- API 端点功能（1:1 映射）

**删除**:
- 所有 Node.js 代码（server.js, routes/, services/, models/, config/）

**新增**:
- Python/FastAPI 项目结构
- requirements.txt
- Pydantic schemas

---

## Work Objectives

### Core Objective
将现有 Node.js REST API 完全迁移至 Python/FastAPI，保持 API 行为完全一致。

### Concrete Deliverables

1. `main.py` - FastAPI 应用入口
2. `app/routers/api/materials.py` - 素材 CRUD 路由
3. `app/routers/api/search.py` - FTS5 搜索路由
4. `app/routers/api/tags.py` - 标签管理路由
5. `app/routers/api/categories.py` - 分类路由
6. `app/routers/api/stats.py` - 统计路由
7. `app/services/material_service.py` - 素材业务逻辑
8. `app/services/tag_service.py` - 标签业务逻辑
9. `app/services/search_service.py` - 搜索业务逻辑（FTS5 BM25）
10. `app/repositories/material_repository.py` - 素材数据访问
11. `app/repositories/tag_repository.py` - 标签数据访问
12. `app/schemas/material.py` - Pydantic 模型
13. `app/schemas/tag.py` - Pydantic 模型
14. `app/schemas/search.py` - Pydantic 模型
15. `app/core/database.py` - SQLite 连接管理
16. `requirements.txt` - 依赖清单
17. `docs/接口文档.md` - 更新后的 API 文档

### Definition of Done

- [ ] 所有 11 个 API 端点返回与 Node.js 版本相同的数据结构
- [ ] FTS5 搜索结果顺序与原版本一致
- [ ] OpenAPI 文档可访问（/docs）
- [ ] 错误响应格式正确（400/404/500）

### Must Have

- 保留现有 SQLite 数据库文件
- API 路径完全一致（/api/materials 等）
- JSON 响应结构与原版一致
- 支持中文内容处理

### Must NOT Have（Guardrails）

- ❌ 添加认证/授权系统
- ❌ 修改数据库表结构
- ❌ 添加 Redis/PostgreSQL 等新基础设施
- ❌ 修改 FTS5 触发器逻辑
- ❌ 添加缓存层
- ❌ 更改端口号（保持 3000）
- ❌ 添加管理员面板

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO（全新项目）
- **Automated tests**: Tests-after
- **Framework**: pytest

### QA Policy
Every task MUST include agent-executed QA scenarios.
使用 curl 验证每个端点的 HTTP 状态码和 JSON 响应结构。

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation - 5 tasks):
├── T1: 项目脚手架 + 依赖安装
├── T2: 数据库连接层 (database.py)
├── T3: Pydantic Schemas 定义
├── T4: Repositories 数据访问层
└── T5: Categories 路由（简单，直接迁移）

Wave 2 (Core Business - 5 tasks):
├── T6: Material Service（normalizeTags, createMaterial 等）
├── T7: Material Router（5个端点）
├── T8: Tag Service + Router
├── T9: Search Service + Router（FTS5 BM25）
└── T10: Stats Router

Wave 3 (Integration - 2 tasks):
├── T11: Main.py 整合 + CORS 配置
└── T12: 接口文档更新

Wave FINAL:
└── T13: 验证测试（curl 逐端点验证）
```

### Dependency Matrix

| Task | Blocks | Blocked By |
|------|--------|------------|
| T1 | - | None |
| T2 | T4, T6, T8, T9, T10 | None |
| T3 | T6, T7, T8 | None |
| T4 | T6, T7 | T2 |
| T5 | T11 | T2 |
| T6 | T7 | T2, T3, T4 |
| T7 | - | T3, T6 |
| T8 | - | T2, T3, T4 |
| T9 | - | T2, T3, T4 |
| T10 | - | T2, T4 |
| T11 | T12 | T5, T6, T7, T8, T9, T10 |
| T12 | T13 | T11 |
| T13 | - | T11, T12 |

---

## TODOs

- [x] 1. 项目脚手架 + 依赖安装

  **What to do**:
  - 创建 `app/` 目录结构
  - 创建 `requirements.txt`：
    ```
    fastapi>=0.115.0
    uvicorn[standard]>=0.30.0
    pydantic>=2.0.0
    pytest>=8.0.0
    pytest-asyncio>=0.23.0
    httpx>=0.27.0
    ```
  - 创建 `app/__init__.py`
  - 创建 `app/core/__init__.py`
  - 创建 `app/routers/__init__.py`
  - 创建 `app/routers/api/__init__.py`
  - 创建 `app/services/__init__.py`
  - 创建 `app/repositories/__init__.py`
  - 创建 `app/schemas/__init__.py`

  **Must NOT do**:
  - 不要创建虚拟环境配置（用户自行管理）
  - 不要添加认证相关依赖

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - **Reason**: 纯文件创建，无复杂逻辑

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T2, T3, T4, T5)
  - **Blocks**: T11 (main.py needs structure)
  - **Blocked By**: None

  **Acceptance Criteria**:
  - [ ] `requirements.txt` 创建完成
  - [ ] 目录结构创建完成
  - [ ] `pip install -r requirements.txt` 成功

  **Commit**: YES
  - Message: `feat: initialize Python FastAPI project structure`
  - Files: `requirements.txt`, `app/` (directories + __init__.py files)

- [x] 2. 数据库连接层

  **What to do**:
  - 创建 `app/core/database.py`
  - 实现 `get_db()` 连接函数（标准库 sqlite3）
  - 启用 WAL 模式和外键约束
  - 参考 Node.js `config/db.js` 的连接参数

  ```python
  import sqlite3
  from contextlib import contextmanager
  from typing import Generator

  DATABASE_PATH = "data/materials.db"

  @contextmanager
  def get_db() -> Generator[sqlite3.Connection, None, None]:
      conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
      conn.execute("PRAGMA foreign_keys = ON")
      conn.execute("PRAGMA journal_mode = WAL")
      try:
          yield conn
      finally:
          conn.close()
  ```

  **References**:
  - `config/db.js` - Node.js 版本的连接配置（PRAGMA 设置）

  **Must NOT do**:
  - 不要使用 aiosqlite（同步实现即可）
  - 不要修改数据库路径

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - **Reason**: 简单函数实现

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: T4, T6, T8, T9, T10
  - **Blocked By**: None

  **Acceptance Criteria**:
  - [ ] `python -c "from app.core.database import get_db; print('OK')"` 成功

  **QA Scenarios**:

  Scenario: 数据库连接正常
    Tool: Bash
    Preconditions: 已存在 `data/materials.db`
    Steps:
      1. `python -c "from app.core.database import get_db; import sqlite3; conn = next(get_db()); print(type(conn)); conn.close()"`
    Expected Result: 输出 `<class 'sqlite3.Connection'>`
    Failure Indicators: ImportError 或连接失败
    Evidence: .sisyphus/evidence/t2-db-connection.txt

  **Commit**: YES
  - Message: `feat: add SQLite database connection layer`
  - Files: `app/core/database.py`

- [x] 3. Pydantic Schemas 定义

  **What to do**:
  - 创建 `app/schemas/material.py`:
    ```python
    from pydantic import BaseModel, Field
    from typing import Optional

    class MaterialBase(BaseModel):
        title: str = Field(..., min_length=1, max_length=200)
        content: str = Field(..., min_length=1)
        summary: Optional[str] = None
        category: Optional[str] = None
        subcategory: Optional[str] = None
        source_type: str = "手动"
        source_url: Optional[str] = None
        status: str = "待整理"
        value_score: int = Field(default=0, ge=0, le=5)

    class MaterialCreate(MaterialBase):
        tags: list[str] = Field(default_factory=list)

    class MaterialUpdate(BaseModel):
        title: Optional[str] = Field(None, min_length=1, max_length=200)
        content: Optional[str] = Field(None, min_length=1)
        summary: Optional[str] = None
        category: Optional[str] = None
        subcategory: Optional[str] = None
        source_type: Optional[str] = None
        source_url: Optional[str] = None
        status: Optional[str] = None
        value_score: Optional[int] = Field(None, ge=0, le=5)
        tags: Optional[list[str]] = None

    class MaterialResponse(MaterialBase):
        id: int
        tags: list[str] = Field(default_factory=list)
        created_at: str
        updated_at: str

        class Config:
            from_attributes = True
    ```

  - 创建 `app/schemas/tag.py`:
    ```python
    from pydantic import BaseModel, Field
    from typing import Optional

    class TagCreate(BaseModel):
        name: str = Field(..., min_length=1, max_length=50)
        tag_type: str = "内容标签"

    class TagResponse(TagCreate):
        id: int
        created_at: str

        class Config:
            from_attributes = True
    ```

  - 创建 `app/schemas/search.py`:
    ```python
    from pydantic import BaseModel, Field
    from typing import Optional

    class SearchResult(BaseModel):
        id: int
        title: str
        snippet: str
        rank: float
        category: Optional[str] = None
        subcategory: Optional[str] = None
        tags: list[str] = Field(default_factory=list)
        status: Optional[str] = None
        created_at: Optional[str] = None
    ```

  - 创建 `app/schemas/category.py`:
    ```python
    from pydantic import BaseModel
    from typing import Dict

    class CategoriesResponse(BaseModel):
        categories: Dict[str, list[str]]
    ```

  - 创建 `app/schemas/stats.py`:
    ```python
    from pydantic import BaseModel
    from typing import Dict

    class StatsResponse(BaseModel):
        total: int
        total_tags: int
        by_status: Dict[str, int]
        by_category: Dict[str, int]
        avg_score: float
        recent_count: int
    ```

  **References**:
  - `routes/api/materials.js` - API 响应字段定义
  - `routes/api/stats.js` - stats 响应结构

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - **Reason**: 数据模型定义，简单

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: T6, T7, T8
  - **Blocked By**: None

  **Acceptance Criteria**:
  - [ ] `python -c "from app.schemas import MaterialCreate, MaterialResponse; print('OK')"` 成功

  **Commit**: YES
  - Message: `feat: define Pydantic schemas for API request/response`
  - Files: `app/schemas/material.py`, `app/schemas/tag.py`, `app/schemas/search.py`, `app/schemas/category.py`, `app/schemas/stats.py`

- [x] 4. Repositories 数据访问层

  **What to do**:
  - 创建 `app/repositories/material_repository.py`:
    - `find_all(filters)` - 参考 `models/material.js:findAll()`
    - `find_by_id(id)` - 参考 `models/material.js:findById()`
    - `create(data)` - 参考 `models/material.js:create()`
    - `update(id, data)` - 参考 `models/material.js:update()`
    - `delete(id)` - 参考 `models/material.js:delete()`
    - `get_stats()` - 参考 `models/material.js:getStats()`

  - 创建 `app/repositories/tag_repository.py`:
    - `find_all()` - 参考 `models/tag.js:findAll()`
    - `find_by_id(id)` - 参考 `models/tag.js:findById()`
    - `find_or_create(name)` - 参考 `models/tag.js:findOrCreate()`
    - `get_popular_tags(limit)` - 参考 `models/tag.js:getPopularTags()`

  **References**:
  - `models/material.js` - Material 模型的 SQL 查询
  - `models/tag.js` - Tag 模型的 SQL 查询

  **Must NOT do**:
  - 不要在 Repository 中处理业务逻辑（normalizeTags 等）
  - 不要直接返回 Model 实例，返回 dict
  - tags 字段存储为 JSON 字符串（与 Node.js 一致）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - **Reason**: 需要理解 SQLite 查询模式和数据映射

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: T6, T7, T8, T10
  - **Blocked By**: T2

  **Acceptance Criteria**:
  - [ ] `python -c "from app.repositories.material_repository import MaterialRepository; print('OK')"` 成功
  - [ ] `python -c "from app.repositories.tag_repository import TagRepository; print('OK')"` 成功

  **QA Scenarios**:

  Scenario: MaterialRepository 查询正常
    Tool: Bash
    Preconditions: 数据库有测试数据
    Steps:
      1. `python -c "from app.repositories.material_repository import MaterialRepository; r = MaterialRepository(); items = r.find_all(); print(len(items) >= 0)"`
    Expected Result: True
    Failure Indicators: Exception
    Evidence: .sisyphus/evidence/t4-repo-material.txt

  **Commit**: YES
  - Message: `feat: implement repositories for data access layer`
  - Files: `app/repositories/material_repository.py`, `app/repositories/tag_repository.py`

- [x] 5. Categories 路由

  **What to do**:
  - 创建 `app/routers/api/categories.py`
  - 迁移 `routes/api/categories.js` 的硬编码分类逻辑

  ```python
  from fastapi import APIRouter
  from app.schemas.category import CategoriesResponse

  router = APIRouter(prefix="/api/categories", tags=["categories"])

  # 从 config/categories.js 迁移的分类数据
  ALL_CATEGORIES = {
      "世界观": ["政治体系", "经济体系", "文化体系", "力量体系", "宗教体系", "地理环境", "历史背景", "种族阵营", "法律制度", "科技水平"],
      "人物": ["外貌", "性格", "身份", "动机", "成长线", "人物关系", "说话方式", "行为习惯", "人物弧光", "反差设定"],
      "剧情": ["开局", "冲突", "反转", "高潮", "结局", "背叛", "救场", "成长", "副本任务", "打脸桥段"],
      "场景": ["宏大场景", "细微描写", "感情描写", "战斗场景", "日常场景", "恐怖场景", "压迫场景", "暧昧场景"],
      "文风": ["搞笑", "黑暗", "热血", "悬疑", "冷峻", "轻松", "史诗感", "压迫感", "白话爽文", "古风"],
      "金手指": ["系统流", "穿越流", "重生流", "无限流", "模拟器", "熟练度面板", "签到系统", "抽奖系统", "梦境能力", "时间能力", "空间能力", "知识差外挂"],
      "资料考据": ["历史制度", "军事战争", "经济贸易", "宗教神话", "官职体系", "古代生活", "地理气候", "武器装备", "社会结构"]
  }

  @router.get("/", response_model=CategoriesResponse)
  def get_categories():
      return {"categories": ALL_CATEGORIES}
  ```

  **References**:
  - `routes/api/categories.js` - 现有实现
  - `config/categories.js` - 分类数据来源

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - **Reason**: 简单路由，参考现有代码

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: T11
  - **Blocked By**: T2

  **Acceptance Criteria**:
  - [ ] `curl http://localhost:3000/api/categories` 返回 200
  - [ ] 响应结构 `{"categories": {...}}`

  **QA Scenarios**:

  Scenario: Categories 端点返回正确结构
    Tool: Bash
    Preconditions: FastAPI 服务运行中
    Steps:
      1. `curl -s http://localhost:3000/api/categories | python -c "import sys,json; d=json.load(sys.stdin); print('categories' in d and len(d['categories']) > 0)"`
    Expected Result: True
    Failure Indicators: KeyError 或空 categories
    Evidence: .sisyphus/evidence/t5-categories.txt

  **Commit**: YES
  - Message: `feat: implement categories endpoint`
  - Files: `app/routers/api/categories.py`

---

## Final Verification Wave

- [x] F1. **Plan Compliance Audit** — `oracle` (APPROVE - Must Have 4/4 | Must NOT Have 6/6)
  读取计划文件，对比每个 Must Have 是否实现。每个 Must NOT Have 检查代码是否存在对应模式。
  Output: `Must Have [N/N] | Must NOT Have [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **API Contract Verification** — `unspecified-high` (PASS - App imports OK, 17 routes registered)
- [x] F3. **Code Quality Review** — `unspecified-high` (PASS - All 12 Python files syntax valid)
- [x] F4. **OpenAPI Documentation** — `unspecified-high` (PASS - OpenAPI 3.1.0 schema with correct title and 9 paths)

---

## Commit Strategy

每完成一个 Wave 进行一次 commit：

- **Wave 1**: `feat: implement foundation layer (database, schemas, repositories)`
- **Wave 2**: `feat: implement core business logic and API routes`
- **Wave 3**: `feat: integrate application and update documentation`

---

## Success Criteria

### Verification Commands
```bash
# 启动服务
uvicorn main:app --host 0.0.0.0 --port 3000 --reload

# API 测试
curl http://localhost:3000/api/materials
curl http://localhost:3000/api/search?q=test
curl http://localhost:3000/api/stats

# OpenAPI 文档
open http://localhost:3000/docs
```

### Final Checklist
- [ ] 所有 11 个 API 端点工作正常
- [ ] FTS5 搜索返回正确结果
- [ ] OpenAPI 文档可访问
- [ ] 代码无语法错误
- [ ] 响应结构与 Node.js 版本一致

---

## 项目结构（最终）

```
webnovel-manager/
├── main.py                      # FastAPI 应用入口
├── requirements.txt              # 依赖清单
├── data/
│   └── materials.db            # SQLite 数据库
├── app/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   └── database.py         # SQLite 连接管理
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── material.py         # 素材 Pydantic 模型
│   │   ├── tag.py              # 标签 Pydantic 模型
│   │   ├── search.py           # 搜索 Pydantic 模型
│   │   ├── category.py          # 分类 Pydantic 模型
│   │   └── stats.py             # 统计 Pydantic 模型
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── material_repository.py
│   │   └── tag_repository.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── material_service.py
│   │   ├── tag_service.py
│   │   └── search_service.py
│   └── routers/
│       ├── __init__.py
│       └── api/
│           ├── __init__.py
│           ├── materials.py
│           ├── search.py
│           ├── tags.py
│           ├── categories.py
│           └── stats.py
└── docs/
    └── 接口文档.md              # API 文档
```

---

*计划生成时间: 2026-04-25*
