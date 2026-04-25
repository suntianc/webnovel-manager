from fastapi import APIRouter, HTTPException
from typing import Optional
from app.schemas.tag import TagCreate, TagResponse
from app.services.tag_service import TagService

router = APIRouter(prefix="/api/tags", tags=["tags"])
tag_service = TagService()


@router.get("/", response_model=list[TagResponse])
def list_tags():
    return tag_service.get_all_tags()


@router.post("/", response_model=TagResponse, status_code=201)
def create_tag(tag: TagCreate):
    try:
        return tag_service.create_tag(tag.name, tag.tag_type)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{tag_id}", status_code=204)
def delete_tag(tag_id: int):
    success = tag_service.delete_tag(tag_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tag not found")
    return None