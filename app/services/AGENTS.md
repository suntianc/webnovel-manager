# SERVICES

Business logic layer. Services orchestrate repositories and other services.

## OVERVIEW

Services contain business logic, return dicts (not Pydantic models), and delegate DB access to repositories.

## SERVICE DEPENDENCIES

```
MaterialService → TagService → TagRepository
     ↓
MaterialRepository
```

MaterialService coordinates tags on create/update. SearchService uses get_db() directly for FTS5 queries.

## KEY PATTERNS

| Pattern | Location | Description |
|---------|----------|-------------|
| normalize_tags() | MaterialService, TagService | Split comma-string, convert Chinese comma, deduplicate |
| get_material_with_tags() | MaterialService | Fetch material, attach tags via TagService |
| search_by_filters() | SearchService | Combine FTS5 BM25 keyword + category/status/tag filters |
| save_tags_for_material() | TagService | Replace material_tags entries, find-or-create tags |

## METHOD CONTRACTS

- create_material(data: dict) → dict: Normalize tags → repo.create → tag_service.save_tags_for_material → get_material_with_tags
- update_material(id, data: dict) → dict|None: Normalize tags → repo.update → clear material_tags → tag_service.save_tags_for_material
- list_materials(filters) → dict: Paginate → repo.find_all → attach tags per material
- search_by_keyword(keyword, limit) → list[dict]: FTS5 MATCH with BM25 ranking
- search_by_filters(keyword, category, subcategory, status, tags, limit) → list[dict]: Combine FTS5 + SQL conditions + tag filter
- get_material_tags(material_id) → list[dict]: JOIN tags + material_tags

## NO REPOSITORY CALLS FROM SERVICES

Exception: SearchService calls get_db() directly for FTS5 queries.
