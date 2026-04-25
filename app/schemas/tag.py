from pydantic import BaseModel, Field
from typing import Optional

class TagCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    tag_type: str = "内容标签"

class TagResponse(TagCreate):
    id: int
    created_at: str

    class Config:
        from_attributes = True