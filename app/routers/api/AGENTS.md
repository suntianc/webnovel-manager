# ROUTERS/API

## OVERVIEW

API endpoint handlers. Each router maps to a resource and delegates business logic to services.

## KEY FILES

- `materials.py` - CRUD for materials (list, get, create, update, delete)
- `tags.py` - Tag management (list, create, delete)
- `search.py` - FTS5 full-text search with filters
- `categories.py` - Static category/subcategory structure
- `stats.py` - Aggregated statistics from repositories

## PATTERNS

Request validation via Pydantic schemas (MaterialCreate, TagCreate):
```
@router.post("/", response_model=MaterialResponse, status_code=201)
def create_material(material: MaterialCreate):
    data = material.model_dump()
    created = material_service.create_material(data)
    return created
```

Path parameter validation with Query/Path:
```
material_id: int = Path(..., gt=0)
limit: int = Query(20, ge=1, le=100)
```

Error handling with HTTPException:
```
if not material:
    raise HTTPException(status_code=404, detail="Material not found")
```

Optional filters with defaults:
```
category: Optional[str] = None
```

## CONVENTIONS

- `response_model` specifies return type; FastAPI auto-serializes
- Service instantiated at module level: `material_service = MaterialService()`
- 404 if resource not found; 400 for validation errors
- Delete returns `None` with `status_code=204`
- No `{"data": ...}` wrapper; return object directly
