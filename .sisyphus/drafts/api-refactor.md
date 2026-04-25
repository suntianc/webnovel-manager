# 开发计划草案：网文素材管理系统 API 服务

## 用户需求（已确认）
- 纯后端 API 服务（移除前端 EJS 页面）
- RESTful 风格
- 核心接口：素材 CRUD + FTS5 搜索
- 标签管理：独立的创建/查询/删除接口

## 技术决策
- 技术栈不变：Node.js + Express + SQLite + FTS5
- JSON 响应格式
- 移除 views/ 目录
- 保留 models/ 和 services/ 层（业务逻辑不变）

## 接口设计

### 素材接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/materials | 素材列表（支持筛选） |
| POST | /api/materials | 创建素材 |
| GET | /api/materials/:id | 获取素材详情 |
| PUT | /api/materials/:id | 更新素材 |
| DELETE | /api/materials/:id | 删除素材 |
| GET | /api/search | 全文搜索 |

### 标签接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/tags | 标签列表 |
| POST | /api/tags | 创建标签 |
| DELETE | /api/tags/:id | 删除标签 |

## 待确认问题
- 是否需要分类相关的独立接口？（当前分类在素材接口中作为字段）
- 是否需要保留统计接口（首页用的那些统计）？
