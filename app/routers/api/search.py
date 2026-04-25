from fastapi import APIRouter, Query
from typing import Optional
from app.schemas.search import SearchResult
from app.services.search_service import SearchService

router = APIRouter(prefix="/api/search", tags=["search"])
search_service = SearchService()

@router.get("/", response_model=list[SearchResult])
def search(
    q: str = Query(None, min_length=1),
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    status: Optional[str] = None,
    tags: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100)
):
    return search_service.search_by_filters(
        keyword=q,
        category=category,
        subcategory=subcategory,
        status=status,
        tags=tags,
        limit=limit
    )