# 网文素材管理系统 API 服务 - 开发计划

## TL;DR

> **快速摘要**: 将现有 SSR 项目重构为纯后端 RESTful API 服务，移除前端页面，保留数据库和业务逻辑
>
> **交付物**: RESTful API 服务，JSON 响应
>
> **预计工作量**: Small-Medium
> **并行执行**: YES - 2 waves

---

## Context

### 原项目状态
- 全栈 SSR 项目：Express + EJS + SQLite + FTS5
- 包含完整的前端页面（views/, public/）
- 业务逻辑封装在 services/ 层

### 重构目标
- 移除前端页面（views/, public/）
- 转换为纯 RESTful API
- JSON 响应格式
- 保留数据库层和业务逻辑

### 技术决策
1. ✅ 保持 SQLite + FTS5 数据库
2. ✅ 保持 services/ 业务逻辑层
3. ✅ 保持 models/ 数据模型
4. ✅ RESTful 风格：GET/POST/PUT/DELETE
5. ✅ JSON 响应格式
6. ✅ 移除 express-ejs-layouts
7. ❌ 移除 usageService（不在 MVP 范围内）

---

## Work Objectives

### 核心目标
将项目从全栈 SSR 转换为纯后端 API 服务

### 具体交付物

| 文件 | 操作 | 说明 |
|------|------|------|
| `server.js` | 重写 | API 路由注册，移除 EJS 配置 |
| `routes/api/` | 新建 | RESTful API 路由 |
| `routes/materialRoutes.js` | 删除 | 替换为 API 路由 |
| `routes/searchRoutes.js` | 删除 | 替换为 API 路由 |
| `routes/index.js` | 删除 | 首页路由已不需要 |
| `views/` | 删除 | 移除所有模板 |
| `public/` | 删除 | 移除静态资源 |
| `services/tagService.js` | 扩展 | 添加独立标签管理方法 |
| `config/categories.js` | 保留 | 分类配置 |

### Must Have
- [ ] RESTful API 素材 CRUD 接口
- [ ] FTS5 全文搜索接口
- [ ] 独立标签管理接口（创建/查询/删除）
- [ ] 分类查询接口
- [ ] 统计接口

### Must NOT Have
- ❌ 前端页面（EJS 模板）
- ❌ 静态资源（CSS/JS）
- ❌ express-ejs-layouts
- ❌ usageService（使用记录）

---

## API 设计

### 素材接口

| 方法 | 路径 | 说明 | 请求体 |
|------|------|------|--------|
| GET | `/api/materials` | 素材列表（支持分页筛选） | - |
| POST | `/api/materials` | 创建素材 | `{title, content, ...}` |
| GET | `/api/materials/:id` | 获取素材详情 | - |
| PUT | `/api/materials/:id` | 更新素材 | `{title, content, ...}` |
| DELETE | `/api/materials/:id` | 删除素材 | - |

### 搜索接口

| 方法 | 路径 | 说明 | 查询参数 |
|------|------|------|----------|
| GET | `/api/search` | FTS5 全文搜索 | `q`, `category`, `status`, `tags` |

### 标签接口

| 方法 | 路径 | 说明 | 请求体 |
|------|------|------|--------|
| GET | `/api/tags` | 标签列表 | - |
| POST | `/api/tags` | 创建标签 | `{name}` |
| DELETE | `/api/tags/:id` | 删除标签 | - |

### 辅助接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/categories` | 获取所有分类结构 |
| GET | `/api/stats` | 获取统计数据 |

---

## 数据库结构（保持不变）

```sql
-- materials 表
CREATE TABLE materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  category TEXT,
  subcategory TEXT,
  source_type TEXT DEFAULT '手动',
  source_url TEXT,
  status TEXT DEFAULT '待整理',
  value_score INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- tags 表
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  tag_type TEXT DEFAULT '内容标签',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- material_tags 表
CREATE TABLE material_tags (
  material_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (material_id, tag_id),
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- materials_fts 表 (FTS5)
CREATE VIRTUAL TABLE materials_fts USING fts5(
  title, content, summary, category, subcategory,
  content='materials', content_rowid='id'
);
```

---

## Execution Strategy

### Wave 1（并行 - 基础设施重构）
| Task | 并行 | 说明 |
|------|------|------|
| T1 | ✅ | 重写 server.js（API 路由配置） |
| T2 | ✅ | 创建 API 路由文件 |
| T3 | ✅ | 扩展 tagService（独立标签管理） |
| T4 | ✅ | 删除前端文件（views/, public/） |
| T5 | ✅ | 更新 package.json（移除 EJS 相关依赖） |

### Wave 2（并行 - API 路由实现）
| Task | 并行 | 说明 |
|------|------|------|
| T6 | ✅ | GET /api/materials - 列表接口 |
| T7 | ✅ | POST /api/materials - 创建接口 |
| T8 | ✅ | GET /api/materials/:id - 详情接口 |
| T9 | ✅ | PUT /api/materials/:id - 更新接口 |
| T10 | ✅ | DELETE /api/materials/:id - 删除接口 |
| T11 | ✅ | GET /api/search - 搜索接口 |
| T12 | ✅ | GET/POST/DELETE /api/tags - 标签接口 |
| T13 | ✅ | GET /api/categories - 分类接口 |
| T14 | ✅ | GET /api/stats - 统计接口 |

### 并行度分析
- T1-T5 可以完全并行（基础设施）
- T6-T14 可以完全并行（API 路由）
- 预计完成时间比串行快 80%

---

## TODOs

- [x] 1. **重写 server.js** ✅

  **What to do**:
  - 移除 `express-ejs-layouts` 和 EJS 配置
  - 添加 `express.json()` 中间件
  - 注册 API 路由 `/api/...`
  - 保留数据库初始化
  - 保留错误处理（JSON 格式）

  **Must NOT do**:
  - 不设置 view engine
  - 不引用 views/ 目录

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: []

  **References**:
  - `server.js` - 当前入口文件

- [x] 2. **创建 API 路由结构** ✅

  **What to do**:
  - 创建 `routes/api/` 目录
  - 创建 `routes/api/materials.js` - 素材 CRUD 路由
  - 创建 `routes/api/search.js` - 搜索路由
  - 创建 `routes/api/tags.js` - 标签路由
  - 创建 `routes/api/helpers.js` - 辅助函数（错误处理等）

  **Must NOT do**:
  - 不使用 res.render()，全部返回 JSON
  - 不引用任何 views/ 文件

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: []

- [x] 3. **扩展 tagService** ✅
- [x] 4. **删除前端文件** ✅
- [x] 5. **更新 package.json** ✅

  **What to do**:
  - 从 dependencies 移除 `ejs`
  - 从 dependencies 移除 `express-ejs-layouts`
  - 如需要可保留其他依赖

  **Must NOT do**:
  - 不改变 `better-sqlite3`

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: []

- [x] 6. **GET /api/materials - 列表接口** ✅
- [x] 7. **POST /api/materials - 创建接口** ✅
- [x] 8. **GET /api/materials/:id - 详情接口** ✅
- [x] 9. **PUT /api/materials/:id - 更新接口** ✅
- [x] 10. **DELETE /api/materials/:id - 删除接口** ✅
- [x] 11. **GET /api/search - 搜索接口** ✅
- [x] 12. **GET/POST/DELETE /api/tags - 标签接口** ✅
- [x] 13. **GET /api/categories - 分类接口** ✅
- [x] 14. **GET /api/stats - 统计接口** ✅

  **What to do**:
  - 调用 `Material.getStats()`
  - 200 OK

  **响应示例**:
  ```json
  {
    "total": 100,
    "byStatus": {"已整理": 50, "待整理": 30, ...},
    "byCategory": {"世界观": 25, "人物": 20, ...},
    "avgScore": 4.5
  }
  ```

  **QA Scenarios**:
  ```
  Scenario: 获取统计数据
    Tool: Bash (curl)
    Steps:
      curl -s http://localhost:3000/api/stats
    Expected Result: 200 OK, 返回统计对象
    Evidence: .sisyphus/evidence/task-14.json
  ```

---

## Final Verification Wave

- [x] F1. **Plan Compliance Audit** — `oracle`
  验证所有 Must Have 已实现，Must NOT Have 已移除 ✅

- [x] F2. **API Integration Test** — `unspecified-high`
  所有接口测试通过 ✅

- [x] F3. **Code Quality Review** — `unspecified-high`
  无语法错误，代码整洁 ✅

---

## Commit Strategy

- **1**: `refactor!: convert to RESTful API, remove frontend`
  - 移除 views/, public/
  - 新建 routes/api/
  - 重写 server.js

---

## Success Criteria

### API 测试命令
```bash
# 启动服务
rm -f data/materials.db && node config/initDb.js && node server.js &

# 测试素材 CRUD
curl http://localhost:3000/api/materials  # GET list
curl -X POST http://localhost:3000/api/materials -H "Content-Type: application/json" -d '{"title":"test","content":"body"}'  # POST create
curl http://localhost:3000/api/materials/1  # GET detail
curl -X PUT http://localhost:3000/api/materials/1 -H "Content-Type: application/json" -d '{"title":"updated"}'  # PUT update
curl -X DELETE http://localhost:3000/api/materials/1  # DELETE

# 测试搜索
curl "http://localhost:3000/api/search?q=test"

# 测试标签
curl http://localhost:3000/api/tags  # GET list
curl -X POST http://localhost:3000/api/tags -H "Content-Type: application/json" -d '{"name":"tag1"}'  # POST create
curl -X DELETE http://localhost:3000/api/tags/1  # DELETE

# 测试辅助接口
curl http://localhost:3000/api/categories
curl http://localhost:3000/api/stats
```

### Final Checklist
- [ ] 所有 API 接口返回正确状态码
- [ ] JSON 响应格式正确
- [ ] 前端文件已删除
- [ ] EJS 相关依赖已移除
- [ ] 数据库和 FTS5 触发器正常
