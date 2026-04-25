# WEBNOVEL-MANAGER

**Generated:** 2026-04-25
**Commit:** 14337e1
**Stack:** Python 3.10+ / FastAPI + Next.js 14 / SQLite + FTS5 / Pydantic V2

## OVERVIEW

REST API backend + Next.js frontend for webnovel material management. CRUD, FTS5 full-text search, tag management, statistics.

## STRUCTURE

```
.
├── main.py                    # FastAPI entry
├── pyproject.toml             # uv + dependencies
├── app/
│   ├── core/                  # Database connection
│   ├── schemas/               # Pydantic models
│   ├── repositories/          # Data access layer
│   ├── services/              # Business logic
│   └── routers/api/           # API endpoints
├── frontend/                  # Next.js 14 project
│   ├── src/
│   │   ├── app/               # Pages
│   │   ├── components/        # React components
│   │   ├── hooks/             # React Query hooks
│   │   ├── lib/               # API client
│   │   └── types/             # TypeScript types
│   └── tailwind.config.ts     # Apple design tokens
├── data/                      # SQLite DB (gitignored)
├── docs/                      # API documentation
└── DESIGN.md                  # Design system reference
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| New API endpoint | `app/routers/api/` | Create router file |
| Business logic | `app/services/` | Service orchestrates repos |
| Database queries | `app/repositories/` | Raw SQL via `get_db()` |
| Request/Response model | `app/schemas/` | Pydantic models |
| DB connection | `app/core/database.py` | SQLite context manager |
| Frontend UI | `frontend/src/app/` | Next.js pages |
| API hooks | `frontend/src/hooks/` | React Query hooks |
| API client | `frontend/src/lib/api.ts` | Fetch wrapper |

## ARCHITECTURE

```
Router → Service → Repository → Database
         ↑
         └── (can call other Services)
```

**Frontend:** Next.js 14 App Router → React Query hooks → API client

## COMMANDS

**Backend:**
```bash
uv sync                      # Install deps
uvicorn main:app --reload    # Dev server
```

**Frontend:**
```bash
cd frontend && npm run dev    # Dev server (port 3001)
npm run build                 # Production build
```

## CONVENTIONS

- Router prefix: `/api/{resource}`
- Service instantiation: module level (not DI)
- Return format: direct JSON (no wrapper)
- Frontend: React Query + Tailwind + Apple design tokens
- TypeScript strict mode with `@/*` path alias

## ANTI-PATTERNS

- Repository NEVER calls Service
- Schema is pure data, no business logic
- Frontend: no `as any`, no `@ts-ignore`
- Backend: no empty catch blocks

## NOTES

- Database: `data/materials.db` (gitignored)
- FTS5 virtual table: `materials_fts`
- CORS: `allow_origins=["*"]`
- No test infrastructure (pytest dep exists but no tests/)
- Missing `__init__.py` in `services/` and `repositories/`
