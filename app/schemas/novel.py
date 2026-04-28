from typing import Any, Optional

from pydantic import BaseModel, Field

from app.schemas.agent_workflow import WorkflowRunResponse


class NovelSourceResponse(BaseModel):
    id: int
    title: str
    author: Optional[str] = None
    original_filename: str
    stored_path: str
    file_size: int
    file_hash: str
    cover_path: Optional[str] = None
    status: str
    chapter_count: int
    part_count: int
    error_message: Optional[str] = None
    created_at: str
    updated_at: str


class NovelListResponse(BaseModel):
    data: list[NovelSourceResponse]
    total: int
    page: int
    limit: int


class NovelChapterResponse(BaseModel):
    id: int
    novel_id: int
    chapter_index: int
    title: str
    content: Optional[str] = None
    word_count: int
    start_offset: int
    end_offset: int
    created_at: str


class NovelPartResponse(BaseModel):
    id: int
    novel_id: int
    part_index: int
    title: str
    chapter_start: int
    chapter_end: int
    content: Optional[str] = None
    word_count: int
    status: str
    created_at: str
    updated_at: str


class PartGenerateRequest(BaseModel):
    chapters_per_part: int = Field(default=5, ge=1, le=100)
    overwrite: bool = True


class NovelAnalysisStartRequest(BaseModel):
    part_ids: list[int] = Field(default_factory=list)
    categories: list[str] = Field(default_factory=list)
    input_payload: dict[str, Any] = Field(default_factory=dict)


class NovelAnalysisStartResponse(BaseModel):
    workflow: WorkflowRunResponse
