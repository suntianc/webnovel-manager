from fastapi import APIRouter, BackgroundTasks, File, HTTPException, Query, UploadFile

from app.schemas.novel import (
    NovelAnalysisStartRequest,
    NovelAnalysisStartResponse,
    NovelChapterResponse,
    NovelListResponse,
    NovelPartResponse,
    NovelSourceResponse,
    PartGenerateRequest,
)
from app.services.novel_service import NovelService

router = APIRouter(prefix="/api/novels", tags=["novels"])
novel_service = NovelService()


@router.post("/upload", response_model=NovelSourceResponse, status_code=201)
def upload_novel(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    try:
        novel = novel_service.upload_epub(file)
        if novel["status"] in {"uploaded", "failed"}:
            background_tasks.add_task(novel_service.parse_novel, novel["id"])
        return novel
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/", response_model=NovelListResponse)
def list_novels(
    status: str | None = None,
    keyword: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    return novel_service.list_novels({"status": status, "keyword": keyword, "page": page, "limit": limit})


@router.get("/{novel_id}", response_model=NovelSourceResponse)
def get_novel(novel_id: int):
    novel = novel_service.get_novel(novel_id)
    if novel is None:
        raise HTTPException(status_code=404, detail="Novel not found")
    return novel


@router.delete("/{novel_id}", status_code=204)
def delete_novel(novel_id: int):
    deleted = novel_service.delete_novel(novel_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Novel not found")
    return None


@router.post("/{novel_id}/parse", response_model=NovelSourceResponse)
def parse_novel(novel_id: int):
    try:
        novel = novel_service.parse_novel(novel_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    if novel is None:
        raise HTTPException(status_code=404, detail="Novel not found")
    return novel


@router.get("/{novel_id}/chapters", response_model=list[NovelChapterResponse])
def list_chapters(novel_id: int, include_content: bool = False):
    chapters = novel_service.list_chapters(novel_id, include_content=include_content)
    if chapters is None:
        raise HTTPException(status_code=404, detail="Novel not found")
    return chapters


@router.get("/{novel_id}/chapters/search", response_model=list[NovelChapterResponse])
def search_chapters(novel_id: int, q: str = Query(..., min_length=1), limit: int = Query(50, ge=1, le=200)):
    chapters = novel_service.search_chapters(novel_id, q, limit=limit)
    if chapters is None:
        raise HTTPException(status_code=404, detail="Novel not found")
    return chapters


@router.get("/{novel_id}/chapters/{chapter_id}", response_model=NovelChapterResponse)
def get_chapter(novel_id: int, chapter_id: int):
    chapter = novel_service.get_chapter(novel_id, chapter_id)
    if chapter is None:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return chapter


@router.post("/{novel_id}/parts/generate", response_model=list[NovelPartResponse])
def generate_parts(novel_id: int, request: PartGenerateRequest):
    parts = novel_service.generate_parts(
        novel_id,
        chapters_per_part=request.chapters_per_part,
        overwrite=request.overwrite,
    )
    if parts is None:
        raise HTTPException(status_code=404, detail="Novel not found")
    return parts


@router.get("/{novel_id}/parts", response_model=list[NovelPartResponse])
def list_parts(novel_id: int, include_content: bool = False):
    parts = novel_service.list_parts(novel_id, include_content=include_content)
    if parts is None:
        raise HTTPException(status_code=404, detail="Novel not found")
    return parts


@router.get("/{novel_id}/parts/{part_id}", response_model=NovelPartResponse)
def get_part(novel_id: int, part_id: int):
    part = novel_service.get_part(novel_id, part_id)
    if part is None:
        raise HTTPException(status_code=404, detail="Part not found")
    return part


@router.post("/{novel_id}/analysis/start", response_model=NovelAnalysisStartResponse, status_code=201)
def start_analysis(novel_id: int, request: NovelAnalysisStartRequest, background_tasks: BackgroundTasks):
    workflow = novel_service.start_analysis(novel_id, request.model_dump())
    if workflow is None:
        raise HTTPException(status_code=404, detail="Novel not found")
    background_tasks.add_task(novel_service.run_analysis, workflow["id"])
    return {"workflow": workflow}
