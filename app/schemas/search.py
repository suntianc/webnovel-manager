from pydantic import BaseModel, Field
from typing import Optional

class SearchResult(BaseModel):
    id: int
    title: str
    snippet: str
    rank: float
    category: Optional[str] = None
    subcategory: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    status: Optional[str] = None
    created_at: Optional[str] = None