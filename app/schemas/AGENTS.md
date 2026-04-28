# SCHEMAS

## OVERVIEW

Pydantic V2 data models. Pure data, no business logic.

## FILES

| File | Models |
|------|--------|
| `material.py` | MaterialBase, MaterialCreate, MaterialUpdate, MaterialResponse, MaterialPaginatedResponse |
| `tag.py` | TagCreate, TagResponse |
| `search.py` | SearchResult |
| `category.py` | CategoriesResponse |
| `stats.py` | StatsResponse |
| `novel.py` | (exists, unused) |
| `agent_workflow.py` | (exists, unused) |

## PATTERNS

```python
class MaterialBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)

class MaterialCreate(MaterialBase):
    tags: list[str] = Field(default_factory=list)

class MaterialResponse(MaterialBase):
    id: int
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
```

## CONVENTIONS

- Use `Field()` for validation (min_length, ge, le, etc.)
- `response_model` in router for auto-serialization
- Optional fields use `Optional[X] = None`
- Paginated responses: `{ data: [...], total, page, limit }`
- Timestamps stored as ISO strings
