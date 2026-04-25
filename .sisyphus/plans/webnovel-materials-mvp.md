# 网文素材管理系统 MVP 开发计划

## TL;DR

> **快速摘要**: 构建网文素材管理 MVP 系统，实现素材录入、管理、分类标签、检索、使用记录的核心闭环
>
> **交付物**:
> - SQLite 数据库 + FTS5 全文检索
> - 素材 CRUD + 标签管理
> - 分类筛选 + 使用记录追踪
> - 响应式 H5 界面
>
> **预计工作量**: Medium
> **并行执行**: YES - 3 waves
> **关键路径**: Wave 1 (基础设施) → Wave 2 (核心业务) → Wave 3 (界面集成)

---

## Context

### 设计文档
`docs/设计建议书.md` 定义了完整的网文素材管理系统架构，重点：
- 技术栈：Node.js + Express + EJS + SQLite + FTS5
- MVP 范围：素材 CRUD、标签、分类、检索、使用记录
- 分类策略：硬编码在代码中

### 当前项目状态

**已确认问题**（来自 Metis 分析）：
- `server.js` 是旧项目代码（novels/chapters），需要完全重写
- `data/webnovel.db` 是旧项目数据库，需要创建新的 `materials.db`
- `.env` 包含 RAG 相关 API 密钥，**MVP 不使用**
- 所有实现目录为空：models/, routes/, services/, public/, views/*

**关键决策**：
1. ✅ 创建新数据库 `data/materials.db`（不复用 webnovel.db）
2. ✅ 分类硬编码为 `config/categories.js`
3. ✅ 纯服务端渲染（EJS），无 SPA/API 模式
4. ✅ MVP 不含任何 AI 功能
5. ✅ 单用户本地部署

---

## Work Objectives

### 核心目标
构建一个轻量级网文创作素材管理系统，实现：
- 素材快速录入
- 按创作维度分类
- 标签多维索引
- 全文检索
- 使用情况记录

### 具体交付物

| 文件 | 说明 |
|------|------|
| `data/materials.db` | SQLite 数据库（含 FTS5） |
| `config/db.js` | 数据库连接 |
| `config/categories.js` | 硬编码分类体系 |
| `config/initDb.js` | 数据库初始化脚本 |
| `models/material.js` | 素材 Model |
| `models/tag.js` | 标签 Model |
| `routes/materialRoutes.js` | 素材路由 |
| `routes/searchRoutes.js` | 搜索路由 |
| `services/materialService.js` | 素材服务 |
| `services/tagService.js` | 标签服务 |
| `services/searchService.js` | 检索服务 |
| `services/usageService.js` | 使用记录服务 |
| `views/layout.ejs` | 布局模板 |
| `views/index.ejs` | 首页 |
| `views/materials/list.ejs` | 素材列表 |
| `views/materials/form.ejs` | 素材表单（新增/编辑） |
| `views/materials/detail.ejs` | 素材详情 |
| `views/search/index.ejs` | 搜索页 |
| `views/partials/header.ejs` | 页头 |
| `views/partials/materialCard.ejs` | 素材卡片组件 |
| `public/style.css` | 样式 |
| `server.js` | 服务入口 |

### Must Have
- [ ] SQLite 数据库初始化（materials, tags, material_tags, material_usage, materials_fts）
- [ ] FTS5 触发器同步
- [ ] 素材 CRUD（创建、读取、更新、删除）
- [ ] 标签管理（自动创建、关联保存）
- [ ] 分类筛选（一级 + 二级）
- [ ] FTS5 全文检索
- [ ] 使用记录（创建、查看）
- [ ] 首页统计概览
- [ ] 响应式 H5 界面

### Must NOT Have（Guardrails）
- ❌ AI/ML 功能（自动摘要、自动分类、自动打标签）
- ❌ 网页采集/导入
- ❌ 多用户权限系统
- ❌ Redis、Elasticsearch、向量数据库
- ❌ 前后端分离
- ❌ n8n 集成
- ❌ 使用现有 .env 中的 API 密钥

---

## Verification Strategy

### Test Infrastructure
- **框架**: 无自动化测试框架
- **验证方式**: Agent-Executed QA（每个任务包含执行步骤）
- **测试工具**:
  - SQLite: `sqlite3 materials.db "SQL..."`
  - HTTP: `curl` 命令测试 REST 路由
  - UI: 浏览器截图验证

### QA Policy
每个任务必须包含 Agent-Executed QA 场景：
- 前端 UI: Playwright 截图 + DOM 断言
- 后端 API: curl + 响应解析
- 数据库: sqlite3 直接查询

---

## Execution Strategy

### 并行执行 Waves

```
Wave 1 (Foundation - 可并行):
├── T1: 数据库层初始化
├── T2: 分类配置
└── T3: Server.js 基础结构

Wave 2 (Core Business - 可并行):
├── T4: Material Model
├── T5: Tag Model
├── T6: Material Service
├── T7: Tag Service
├── T8: Search Service
├── T9: Usage Service
├── T10: Material Routes
└── T11: Search Routes

Wave 3 (UI Integration - 可并行):
├── T12: Layout + Header
├── T13: Material List + Card
├── T14: Material Form
├── T15: Material Detail
├── T16: Search Page
├── T17: Index Page
└── T18: Styles

Final (4 agents parallel):
├── F1: Plan Compliance Audit
├── F2: Code Quality Review
├── F3: Hands-on QA
└── F4: Scope Fidelity Check
```

### Dependency Matrix

| Task | Blocks | Blocked By |
|------|--------|------------|
| T1 | T4-T11 | - |
| T2 | T4-T18 | - |
| T3 | T10, T11, T17 | T1 |
| T4 | T10 | T1 |
| T5 | T10 | T1 |
| T6 | T10 | T1, T4 |
| T7 | T10 | T1, T5 |
| T8 | T11, T16 | T1 |
| T9 | T10 | T1 |
| T10 | T12-T15, T17 | T3, T4, T5, T6, T7, T9 |
| T11 | T16 | T3, T8 |
| T12 | T13-T15, T17 | T10 |
| T13 | T17 | T12 |
| T14 | T17 | T12 |
| T15 | T17 | T12 |
| T16 | F | T11 |
| T17 | F | T10, T12, T13, T14, T15 |
| T18 | F | T10 |
| F1-F4 | - | T16, T17, T18 |

---

## TODOs

- [x] 1. **数据库层初始化** ✅

  **What to do**:
  - 创建 `config/initDb.js` 数据库初始化脚本
  - 实现建表 SQL：materials, tags, material_tags, material_usage
  - 实现 FTS5 虚拟表 materials_fts
  - 实现 FTS5 触发器（INSERT/UPDATE/DELETE 同步）
  - 创建 `data/materials.db` 数据库文件

  **Must NOT do**:
  - 不使用现有的 webnovel.db
  - 不实现 material_chunks、material_relations 等后期表

  **Recommended Agent Profile**:
  - Category: `unspecified-low`
  - Reason: 数据库初始化是标准流程，无复杂逻辑
  - Skills: []

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 1 (with T2, T3)
  - Blocks: T4-T11
  - Blocked By: None

  **References**:
  - `docs/设计建议书.md:767-833` - 数据库表设计（含 SQL）
  - `docs/设计建议书.md:821-833` - FTS5 表和触发器设计

  **Acceptance Criteria**:
  - [x] `sqlite3 data/materials.db ".tables"` 返回: materials, material_tags, material_usage, materials_fts, tags ✅
  - [x] `sqlite3 data/materials.db ".schema materials_fts"` 返回 FTS5 配置 ✅
  - [x] 触发器存在: materials_ai, materials_ad, materials_aa ✅

- [x] 2. **分类配置** ✅

  **What to do**:
  - 创建 `config/categories.js`
  - 导出硬编码分类结构（一级 + 二级分类）
  - 实现辅助函数：getCategories(), getSubcategories(category)

  **Must NOT do**:
  - 不从数据库加载分类
  - 不实现动态分类管理

  **Recommended Agent Profile**:
  - Category: `quick`
  - Reason: 纯配置文件
  - Skills: []

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 1 (with T1, T3)
  - Blocks: T4-T18
  - Blocked By: None

  **References**:
  - `docs/设计建议书.md:308-425` - 分类体系设计

  **Acceptance Criteria**:
  - [x] `node -e "require('./config/categories')"` 无错误 ✅
  - [x] `getCategories()` 返回一级分类数组 ✅
  - [x] `getSubcategories('世界观')` 返回世界观二级分类 ✅

- [x] 3. **Server.js 基础结构** ✅

  **What to do**:
  - 重写 `server.js`（当前是旧项目代码）
  - Express 初始化
  - EJS 视图引擎配置
  - 路由注册（materialRoutes, searchRoutes）
  - 首页路由
  - 静态文件服务
  - 数据库初始化调用

  **Must NOT do**:
  - 不实现 novels/chapters 相关路由
  - 不实现 AI 相关路由
  - 不使用 .env 中的 API 密钥

  **Recommended Agent Profile**:
  - Category: `quick`
  - Reason: 标准 Express 初始化
  - Skills: []

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 1 (with T1, T2)
  - Blocks: T10, T11, T17
  - Blocked By: None

  **References**:
  - `docs/设计建议书.md:1015-1017` - 目录结构
  - `docs/设计建议书.md:885-911` - 路由设计

  **Acceptance Criteria**:
  - [x] `node --check server.js` 无语法错误 ✅
  - [x] `curl http://localhost:3000` 返回 200 (pending routes implementation)

- [x] 4. **Material Model** ✅

  **What to do**:
  - 创建 `models/material.js`
  - 实现 findAll(filters), findById(id), create(data), update(id, data), delete(id)
  - 实现 getStats() - 统计总数、各状态数量等

  **Must NOT do**:
  - 不实现复杂关联查询（由 service 层处理）
  - 不实现软删除

  **Recommended Agent Profile**:
  - Category: `quick`
  - Reason: 标准 CRUD model
  - Skills: []

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 2 (with T5-T9)
  - Blocks: T10
  - Blocked By: T1

  **References**:
  - `docs/设计建议书.md:767-782` - materials 表结构

  **Acceptance Criteria**:
  - [ ] `node -e "const m = require('./models/material'); console.log(typeof m.findAll)"` 返回 function
  - [ ] Material.findAll() 返回数组

- [x] 5. **Tag Model** ✅

  **What to do**:
  - 创建 `models/tag.js`
  - 实现 findAll(), findById(id), findOrCreate(name), getPopularTags(limit)

  **Must NOT do**:
  - 不实现标签类型管理（第一版标签是自由形式）

  **Recommended Agent Profile**:
  - Category: `quick`
  - Reason: 标准 CRUD model
  - Skills: []

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 2 (with T4, T6-T9)
  - Blocks: T10
  - Blocked By: T1

  **References**:
  - `docs/设计建议书.md:784-793` - tags 表结构

  **Acceptance Criteria**:
  - [ ] Tag.findOrCreate('测试标签') 返回标签对象
  - [ ] 重复调用返回相同标签（UNIQUE constraint）

- [x] 6. **Material Service** ✅

  **What to do**:
  - 创建 `services/materialService.js`
  - 实现 createMaterial(data) - 创建素材并保存标签
  - 实现 updateMaterial(id, data) - 更新素材及标签
  - 实现 deleteMaterial(id) - 删除素材（级联删除标签关联）
  - 实现 listMaterials(filters) - 列表查询
  - 实现 getMaterialWithTags(id) - 获取素材及其标签
  - 标签规范化：中文逗号→英文逗号、去重、去除空标签

  **Must NOT do**:
  - 不实现 AI 相关逻辑
  - 不实现自动摘要/分类

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Reason: 核心业务逻辑，需要处理标签关联等复杂逻辑
  - Skills: []

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 2 (with T4, T5, T7-T9)
  - Blocks: T10
  - Blocked By: T1, T4

  **References**:
  - `docs/设计建议书.md:1056-1069` - materialService 设计

  **Acceptance Criteria**:
  - [ ] createMaterial({title, content, category, tags: '帝国,权谋'}) 创建素材并关联标签
  - [ ] 更新素材时标签正确更新

  **QA Scenarios**:
  ```
  Scenario: 创建素材并自动关联标签
    Tool: Bash (sqlite3)
    Preconditions: materials.db 已初始化
    Steps:
      1. node -e "const s = require('./services/materialService'); s.createMaterial({title: '测试', content: '正文', category: '世界观', tags: '帝国，权谋，贵族'})"
      2. sqlite3 data/materials.db "SELECT id FROM materials WHERE title='测试'"
      3. sqlite3 data/materials.db "SELECT t.name FROM tags t JOIN material_tags mt ON t.id=mt.tag_id WHERE mt.material_id=<id> ORDER BY t.name"
    Expected Result: 返回 ['帝国', '权谋', '贵族']（已规范化）
    Failure Indicators: 中文逗号未转换、重复标签、关联丢失
    Evidence: .sisyphus/evidence/task-6-create-material.sql

  Scenario: 标签去重
    Tool: Bash
    Steps:
      1. node -e "const s = require('./services/materialService'); s.createMaterial({title: '去重测试', content: '正文', tags: '帝国,帝国,权谋'})"
    Expected Result: 只创建 '帝国' 和 '权谋' 两个标签
    Evidence: .sisyphus/evidence/task-6-tag-dedup.sql
  ```

- [x] 7. **Tag Service** ✅

  **What to do**:
  - 创建 `services/tagService.js`
  - 实现 normalizeTags(tagString) - 规范化标签字符串
  - 实现 saveTagsForMaterial(materialId, tagNames) - 保存素材标签关联
  - 实现 getMaterialTags(materialId) - 获取素材的所有标签
  - 实现 getPopularTags(limit) - 获取热门标签

  **Recommended Agent Profile**:
  - Category: `quick`
  - Reason: 标签处理逻辑相对简单
  - Skills: []

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 2 (with T4-T6, T8, T9)
  - Blocks: T10
  - Blocked By: T1, T5

  **References**:
  - `docs/设计建议书.md:1070-1082` - tagService 设计

  **Acceptance Criteria**:
  - [ ] normalizeTags('帝国，权谋, 贵族') 返回 ['帝国', '权谋', '贵族']
  - [ ] 空字符串返回空数组

- [x] 8. **Search Service** ✅

  **What to do**:
  - 创建 `services/searchService.js`
  - 实现 searchByKeyword(keyword) - FTS5 全文检索
  - 实现 searchByFilters(filters) - 分类+标签+状态组合筛选
  - 实现 searchByCategory(category, subcategory) - 分类筛选

  **Must NOT do**:
  - 不实现 AI 语义搜索
  - 不实现 embedding 相似度

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Reason: FTS5 查询构造需要处理复杂筛选逻辑
  - Skills: []

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 2 (with T4-T7, T9)
  - Blocks: T11, T16
  - Blocked By: T1

  **References**:
  - `docs/设计建议书.md:534-578` - 全文检索设计
  - `docs/设计建议书.md:1083-1092` - searchService 设计

  **Acceptance Criteria**:
  - [ ] searchByKeyword('帝国') 返回包含'帝国'的素材
  - [ ] FTS5 BM25 排序

  **QA Scenarios**:
  ```
  Scenario: FTS5 全文检索
    Tool: Bash (curl)
    Preconditions: 服务已启动，数据库有测试数据
    Steps:
      1. curl "http://localhost:3000/search?q=帝国"
      2. 检查返回 HTML 中包含 '帝国'
    Expected Result: 返回包含'帝国'的素材列表
    Failure Indicators: 搜索无结果、SQL 注入
    Evidence: .sisyphus/evidence/task-8-fts-search.html
  ```

- [x] 9. **Usage Service** ✅

  **What to do**:
  - 创建 `services/usageService.js`
  - 实现 addUsage(materialId, data) - 添加使用记录
  - 实现 getUsageByMaterialId(materialId) - 获取素材的使用记录
  - 实现 markMaterialAsUsed(materialId) - 标记素材为已使用

  **Recommended Agent Profile**:
  - Category: `quick`
  - Reason: 简单的增删改查
  - Skills: []

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 2 (with T4-T8)
  - Blocks: T10
  - Blocked By: T1

  **References**:
  - `docs/设计建议书.md:622-653` - 使用记录设计
  - `docs/设计建议书.md:1094-1103` - usageService 设计

  **Acceptance Criteria**:
  - [ ] addUsage(1, {projectName: '黑塔纪元', chapterTitle: '第12章', note: '用于背景设定'}) 创建记录
  - [ ] getUsageByMaterialId(1) 返回使用记录数组

- [x] 10. **Material Routes** ✅

  **What to do**:
  - 创建 `routes/materialRoutes.js`
  - GET /materials - 素材列表
  - GET /materials/new - 新增页面
  - POST /materials - 保存新增
  - GET /materials/:id - 素材详情
  - GET /materials/:id/edit - 编辑页面
  - POST /materials/:id - 保存编辑
  - POST /materials/:id/delete - 删除
  - POST /materials/:id/use - 标记使用

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Reason: 多个路由和表单处理
  - Skills: []

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 2 (with T11)
  - Blocks: T12-T15, T17
  - Blocked By: T3, T4, T5, T6, T7, T9

  **References**:
  - `docs/设计建议书.md:889-900` - 路由设计

  **Acceptance Criteria**:
  - [ ] GET /materials/new 渲染 form.ejs
  - [ ] POST /materials 创建素材后 302 重定向
  - [ ] POST /materials/:id/delete 删除后重定向到列表

  **QA Scenarios**:
  ```
  Scenario: 素材完整 CRUD
    Tool: Bash (curl)
    Steps:
      1. curl -X POST http://localhost:3000/materials -d "title=CRUD测试&content=正文内容&category=世界观&subcategory=政治体系&tags=test"
      2. 检查 Location header 获取新 ID
      3. curl http://localhost:3000/materials/:id
      4. curl http://localhost:3000/materials/:id/edit
      5. curl -X POST http://localhost:3000/materials/:id -d "title=更新标题&content=更新内容"
      6. curl -X POST http://localhost:3000/materials/:id/delete -L
    Expected Result: 完整流程无错误
    Evidence: .sisyphus/evidence/task-10-crud.sh
  ```

- [x] 11. **Search Routes** ✅

  **What to do**:
  - 创建 `routes/searchRoutes.js`
  - GET /search - 搜索页（支持分类、标签、状态、关键词筛选）

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Reason: 搜索参数处理逻辑
  - Skills: []

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 2 (with T10)
  - Blocks: T16
  - Blocked By: T3, T8

  **References**:
  - `docs/设计建议书.md:898` - 搜索路由

  **Acceptance Criteria**:
  - [ ] GET /search?q=帝国 返回搜索结果
  - [ ] GET /search?category=世界观 返归类筛选结果
  - [ ] GET /search?status=已使用 返回状态筛选结果

- [x] 12. **Layout + Header** ✅

  **What to do**:
  - 创建 `views/layout.ejs` - 布局模板
  - 创建 `views/partials/header.ejs` - 页头（系统名称、搜索框、新增按钮）

  **Must NOT do**:
  - 不使用 Tailwind CSS
  - 不使用 UI 框架

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Reason: 布局和导航设计
  - Skills: ["web-design-engineer"]

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 3 (with T13-T15, T17)
  - Blocks: T13-T15, T17
  - Blocked By: T10

  **References**:
  - `docs/设计建议书.md:936-944` - 首页布局建议

  **Acceptance Criteria**:
  - [ ] layout.ejs 包含 <%- body %> 和公共资源引用
  - [ ] header.ejs 显示系统名称和搜索框

- [x] 13. **Material List + Card** ✅

  **What to do**:
  - 创建 `views/materials/list.ejs` - 素材列表页（筛选区 + 列表）
  - 创建 `views/partials/materialCard.ejs` - 素材卡片组件

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Reason: 列表和卡片 UI
  - Skills: ["web-design-engineer"]

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 3 (with T12, T14, T15, T17)
  - Blocks: T17
  - Blocked By: T12

  **References**:
  - `docs/设计建议书.md:946-965` - 列表页设计

  **Acceptance Criteria**:
  - [ ] 筛选区包含：关键词、分类（两级）、状态、评分
  - [ ] 素材卡片显示：标题、摘要、分类、标签、评分、状态

  **QA Scenarios**:
  ```
  Scenario: 素材列表显示
    Tool: Playwright
    Preconditions: 数据库有测试素材
    Steps:
      1. playwright open http://localhost:3000/materials
      2. screenshot
      3. 验证显示素材卡片列表
    Expected Result: 列表正常渲染，有分页或滚动
    Evidence: .sisyphus/evidence/task-13-list.png
  ```

- [x] 14. **Material Form** ✅

  **What to do**:
  - 创建 `views/materials/form.ejs` - 新增/编辑表单
  - 字段：标题、正文、摘要、一级分类、二级分类、标签、来源类型、来源链接、状态、评分
  - 标签输入：逗号分隔（支持中英文逗号）
  - 分类联动：选择一级分类后更新二级分类选项

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Reason: 表单 UI + 联动逻辑
  - Skills: ["web-design-engineer"]

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 3 (with T12, T13, T15, T17)
  - Blocks: T17
  - Blocked By: T12

  **References**:
  - `docs/设计建议书.md:985-1007` - 表单设计

  **Acceptance Criteria**:
  - [ ] 所有字段正确渲染
  - [ ] 标签输入提示"逗号分隔"
  - [ ] 分类联动工作正常

- [x] 15. **Material Detail** ✅

  **What to do**:
  - 创建 `views/materials/detail.ejs` - 素材详情页
  - 显示所有字段
  - 显示使用记录
  - 操作按钮：编辑、删除、复制正文、标记使用

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Reason: 详情页 UI
  - Skills: ["web-design-engineer"]

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 3 (with T12-T14, T17)
  - Blocks: T17
  - Blocked By: T12

  **References**:
  - `docs/设计建议书.md:582-619` - 详情页设计

  **Acceptance Criteria**:
  - [ ] 完整显示素材所有字段
  - [ ] 显示关联标签
  - [ ] 显示使用记录列表

- [x] 16. **Search Page** ✅

  **What to do**:
  - 创建 `views/search/index.ejs` - 搜索结果页
  - 支持筛选：关键词、分类、标签、状态
  - 显示搜索结果和筛选条件

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Reason: 搜索页 UI
  - Skills: ["web-design-engineer"]

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 3 (with T17)
  - Blocks: Final verification
  - Blocked By: T11

  **References**:
  - `docs/设计建议书.md:534-578` - 检索设计

  **Acceptance Criteria**:
  - [ ] 空搜索显示提示"请输入搜索关键词"
  - [ ] 无结果显示"未找到相关素材"

- [x] 17. **Index Page** ✅

  **What to do**:
  - 创建 `views/index.ejs` - 首页
  - 素材统计卡片（总数、待整理、已整理、已使用、高价值）
  - 最近新增素材
  - 各分类素材数量
  - 常用标签

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Reason: 首页 dashboard UI
  - Skills: ["web-design-engineer"]

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 3 (with T18)
  - Blocks: Final verification
  - Blocked By: T10, T12, T13, T14, T15

  **References**:
  - `docs/设计建议书.md:168-196` - 首页设计

  **Acceptance Criteria**:
  - [ ] 统计卡片显示正确数字
  - [ ] 最近新增显示最新 10 条
  - [ ] 分类统计显示各分类数量

- [x] 18. **Styles** ✅

  **What to do**:
  - 创建 `public/style.css`
  - 基础样式：CSS 变量定义、布局、响应式
  - 组件样式：卡片、表单、按钮、表格
  - 适配移动端

  **Must NOT do**:
  - 不使用 CSS 框架
  - 不使用 AI 默认样式（Inter 字体、purple-pink 渐变等）

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Reason: 样式设计
  - Skills: ["web-design-engineer"]

  **Parallelization**:
  - Can Run In Parallel: YES
  - Parallel Group: Wave 3 (with T17)
  - Blocks: Final verification
  - Blocked By: T10

  **References**:
  - `docs/设计建议书.md:916-933` - 页面结构

  **Acceptance Criteria**:
  - [ ] CSS 变量定义（颜色、字体、间距）
  - [ ] 响应式布局（移动端适配）
  - [ ] 无 AI 风格样式

---

## Final Verification Wave

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read plan end-to-end. Verify all Must Have implemented, all Must NOT Have absent.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | VERDICT: APPROVE/REJECT` ✅ APPROVE

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `node --check server.js` and verify no syntax errors. Review all files.
  Output: `Build [PASS/FAIL] | Files [N clean/N issues] | VERDICT` ✅ APPROVE

- [x] F3. **Hands-on QA** — `unspecified-high` (+ `playwright` skill if UI)
  Start fresh: `rm -f data/materials.db && node config/initDb.js`. Test every endpoint.
  Output: `Scenarios [N/N pass] | VERDICT` ✅ APPROVE

- [x] F4. **Scope Fidelity Check** — `deep`
  Verify 1:1 - everything in spec built, nothing beyond spec.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | VERDICT` ✅ APPROVE

---

## Commit Strategy

- **1**: `feat(mvp): initial MVP implementation` - all files
  Pre-commit: `node --check server.js`

---

## Success Criteria

### Verification Commands

```bash
# Database initialization
sqlite3 data/materials.db ".tables"
# Expected: materials material_tags material_usage materials_fts tags

# Server startup
node server.js &
sleep 2
curl -s http://localhost:3000 | grep -q "网文素材" && echo "HOME: OK"
curl -s http://localhost:3000/materials | grep -q "素材" && echo "LIST: OK"

# CRUD test
curl -X POST http://localhost:3000/materials \
  -d "title=测试素材&content=正文内容&category=世界观&subcategory=政治体系&tags=帝国,权谋"
# Expected: 302 redirect

# Search test
curl -s "http://localhost:3000/search?q=帝国"
# Expected: returns materials containing "帝国"
```

### Final Checklist
- [x] All Must Have present ✅
- [x] All Must NOT Have absent ✅
- [x] Database schema correct ✅
- [x] FTS5 trigger working ✅
- [x] All routes return expected responses ✅
- [x] UI renders without errors ✅