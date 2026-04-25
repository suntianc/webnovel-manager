from pydantic import BaseModel, Field
from typing import Optional

class MaterialBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    summary: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    source_type: str = "手动"
    source_url: Optional[str] = None
    status: str = "待整理"
    value_score: int = Field(default=0, ge=0, le=5)

class MaterialCreate(MaterialBase):
    tags: list[str] = Field(default_factory=list)

class MaterialUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    summary: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    source_type: Optional[str] = None
    source_url: Optional[str] = None
    status: Optional[str] = None
    value_score: Optional[int] = Field(None, ge=0, le=5)
    tags: Optional[list[str]] = None

class MaterialResponse(MaterialBase):
    id: int
    tags: list[str] = Field(default_factory=list)
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True