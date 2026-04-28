# FRONTEND/SRC

## OVERVIEW

Next.js 14 App Router frontend. React Query + Tailwind + Apple design tokens.

## STRUCTURE

```
src/
├── app/                 # Pages (App Router)
│   ├── page.tsx        # Dashboard home
│   ├── materials/      # Material library
│   ├── novels/         # Novel pages
│   ├── workspace/       # Placeholder
│   ├── collect-tasks/ # Placeholder
│   └── material-tasks/ # Placeholder
├── components/
│   ├── layout/        # DashboardLayout, Sidebar
│   ├── dashboard/      # DashboardHome
│   ├── materials/      # MaterialLibrary
│   └── ui/            # Icon (SVG components)
├── hooks/
│   └── useApi.ts      # React Query hooks
├── lib/
│   ├── api.ts         # API client (fetch-based)
│   └── theme.ts       # Light/dark theme
└── types/
    └── index.ts       # TypeScript types
```

## KEY FILES

| File | Purpose |
|------|---------|
| `hooks/useApi.ts` | React Query hooks (useQuery/useMutation per API op) |
| `lib/api.ts` | Fetch wrapper, organized by resource (materialsApi, tagsApi, etc.) |
| `lib/theme.ts` | Theme toggle, localStorage key `wm-theme` |
| `types/index.ts` | Material, Tag, SearchResult, Stats, PaginatedResponse types |

## API CLIENT PATTERN

```typescript
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export const materialsApi = {
  list: (params) => fetch(`${API_BASE}/api/materials/`, ...),
  get: (id) => fetch(`${API_BASE}/api/materials/${id}`),
  create: (data) => fetch(`${API_BASE}/api/materials/`, { method: 'POST', body: JSON.stringify(data) }),
  // ...
}
```

## CONVENTIONS

- TypeScript strict mode, no `as any` / `@ts-ignore`
- Path alias `@/*` → `./src/*`
- React Query: `staleTime: 60s`, `refetchOnWindowFocus: false`
- Cache keys: `['resource', params]` pattern
- Mutations: `invalidateQueries` on success

## THEME

- Light/dark toggle via `wm-theme` localStorage key
- CSS variable switching: `html[data-theme="dark"]`
- Inline script prevents FOUC
