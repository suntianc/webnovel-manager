from typing import Literal

from pydantic import BaseModel, Field


MaterialCategory = Literal["人物", "设定", "剧情", "桥段", "金句", "物品", "势力", "地点", "其他"]


class MaterialSourceRef(BaseModel):
    type: Literal["novel_part"] = Field(..., description="Source type.")
    id: int | None = Field(None, description="Source entity id when available.")
    chapter_start: int | None = None
    chapter_end: int | None = None
    quote: str = Field(..., min_length=1, description="Short evidence quote from the source text.")


class MaterialCandidate(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    category: MaterialCategory
    subcategory: str | None = Field(None, max_length=80)
    summary: str = Field(..., min_length=1, max_length=500)
    content: str = Field(..., min_length=1)
    tags: list[str] = Field(default_factory=list)
    value_score: int = Field(..., ge=1, le=10)
    source_refs: list[MaterialSourceRef] = Field(default_factory=list)
    recommended_use: str | None = None


class MaterialExtractionResult(BaseModel):
    materials: list[MaterialCandidate] = Field(default_factory=list)
    notes: str | None = Field(None, description="Optional extraction notes, caveats, or coverage summary.")
