# REPOSITORIES

## OVERVIEW

Data access layer: pure SQL execution, no business logic.

## DB PATTERN

```python
with get_db() as conn:
    cursor = conn.execute(sql, params)
    conn.commit()
    return cursor.fetchall()  # or fetchone()
```

Rows converted via `dict(row)` for sqlite3.Row factory.

## NO BUSINESS LOGIC

Repositories only execute SQL. No validation, no orchestration.

## FILTER PATTERN

Build WHERE clauses dynamically:

```python
sql = 'SELECT * FROM materials WHERE 1=1'
params = []
if filters.get('category'):
    sql += ' AND category = ?'
    params.append(filters['category'])
```

## FILES

| File | Responsibility |
|------|----------------|
| material_repository.py | Material CRUD, find_all(filters), stats |
| tag_repository.py | Tag CRUD, find_or_create, material-tag relations |

## TYPES

- `find_all(filters: dict | None) -> list[dict]`
- `find_by_id(id: int) -> Optional[dict]`
- `create(data: dict) -> int` (returns rowid)
- `update(id: int, data: dict) -> bool`
- `delete(id: int) -> bool`
