import hashlib
import os
import shutil
from pathlib import Path

from fastapi import UploadFile

from app.repositories.novel_repository import NovelRepository
from app.services.epub_parser import EpubParser
from app.services.workflow_service import WorkflowService


UPLOAD_DIR = Path("data/uploads/novels")


class NovelService:
    def __init__(self):
        self.repo = NovelRepository()
        self.parser = EpubParser()
        self.workflow_service = WorkflowService()

    def upload_epub(self, file: UploadFile) -> dict:
        filename = file.filename or "novel.epub"
        if not filename.lower().endswith(".epub"):
            raise ValueError("Only .epub files are supported")
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        temp_path = UPLOAD_DIR / f"upload-{os.getpid()}-{filename}"
        hasher = hashlib.sha256()
        size = 0
        with temp_path.open("wb") as output:
            while True:
                chunk = file.file.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                hasher.update(chunk)
                output.write(chunk)
        file_hash = hasher.hexdigest()
        existing = self.repo.find_source_by_hash(file_hash)
        if existing:
            temp_path.unlink(missing_ok=True)
            return existing

        stored_path = UPLOAD_DIR / f"{file_hash}.epub"
        shutil.move(str(temp_path), stored_path)
        title = Path(filename).stem
        novel_id = self.repo.create_source(
            {
                "title": title,
                "original_filename": filename,
                "stored_path": str(stored_path),
                "file_size": size,
                "file_hash": file_hash,
                "status": "uploaded",
            }
        )
        return self.repo.find_source(novel_id)

    def parse_novel(self, novel_id: int) -> dict:
        novel = self.repo.find_source(novel_id)
        if novel is None:
            raise ValueError("Novel not found")
        try:
            self.repo.update_source(novel_id, {"status": "processing", "error_message": None})
            parsed = self.parser.parse(novel["stored_path"])
            chapters = []
            offset = 0
            for index, chapter in enumerate(parsed.chapters, start=1):
                content = chapter.content.strip()
                word_count = self._word_count(content)
                start_offset = offset
                end_offset = start_offset + len(content)
                offset = end_offset
                chapters.append(
                    {
                        "chapter_index": index,
                        "title": chapter.title.strip() or f"第 {index} 章",
                        "content": content,
                        "word_count": word_count,
                        "start_offset": start_offset,
                        "end_offset": end_offset,
                    }
                )
            if not chapters:
                raise ValueError("未解析到有效章节")
            self.repo.replace_chapters(novel_id, chapters)
            return self.repo.update_source(
                novel_id,
                {
                    "title": parsed.title or novel["title"],
                    "author": parsed.author or novel.get("author"),
                    "status": "parsed",
                    "chapter_count": len(chapters),
                    "error_message": None,
                },
            )
        except Exception as exc:
            return self.repo.update_source(novel_id, {"status": "failed", "error_message": str(exc)})

    def list_novels(self, filters: dict) -> dict:
        return self.repo.list_sources(filters)

    def get_novel(self, novel_id: int) -> dict | None:
        return self.repo.find_source(novel_id)

    def delete_novel(self, novel_id: int) -> bool:
        novel = self.repo.find_source(novel_id)
        if novel is None:
            return False
        deleted = self.repo.delete_source(novel_id)
        if deleted:
            Path(novel["stored_path"]).unlink(missing_ok=True)
        return deleted

    def list_chapters(self, novel_id: int, include_content: bool = False) -> list[dict] | None:
        if self.repo.find_source(novel_id) is None:
            return None
        return self.repo.list_chapters(novel_id, include_content=include_content)

    def get_chapter(self, novel_id: int, chapter_id: int) -> dict | None:
        return self.repo.find_chapter(novel_id, chapter_id)

    def search_chapters(self, novel_id: int, keyword: str, limit: int = 50) -> list[dict] | None:
        if self.repo.find_source(novel_id) is None:
            return None
        return self.repo.search_chapters(novel_id, keyword, limit=limit)

    def generate_parts(self, novel_id: int, chapters_per_part: int = 5, overwrite: bool = True) -> list[dict] | None:
        novel = self.repo.find_source(novel_id)
        if novel is None:
            return None
        existing = self.repo.list_parts(novel_id)
        if existing and not overwrite:
            return existing
        chapters = self.repo.list_chapters(novel_id, include_content=True)
        parts = []
        for part_index, start in enumerate(range(0, len(chapters), chapters_per_part), start=1):
            group = chapters[start : start + chapters_per_part]
            if not group:
                continue
            chapter_start = group[0]["chapter_index"]
            chapter_end = group[-1]["chapter_index"]
            content = "\n\n".join(f"## {chapter['title']}\n{chapter['content']}" for chapter in group)
            parts.append(
                {
                    "part_index": part_index,
                    "title": f"第 {chapter_start}-{chapter_end} 章",
                    "chapter_start": chapter_start,
                    "chapter_end": chapter_end,
                    "content": content,
                    "word_count": self._word_count(content),
                    "status": "ready",
                }
            )
        self.repo.replace_parts(novel_id, parts)
        self.repo.update_source(novel_id, {"part_count": len(parts)})
        return self.repo.list_parts(novel_id)

    def list_parts(self, novel_id: int, include_content: bool = False) -> list[dict] | None:
        if self.repo.find_source(novel_id) is None:
            return None
        return self.repo.list_parts(novel_id, include_content=include_content)

    def get_part(self, novel_id: int, part_id: int) -> dict | None:
        return self.repo.find_part(novel_id, part_id)

    def start_analysis(self, novel_id: int, data: dict) -> dict | None:
        novel = self.repo.find_source(novel_id)
        if novel is None:
            return None
        input_payload = {
            "novel_id": novel_id,
            "part_ids": data.get("part_ids", []),
            "categories": data.get("categories", []),
            **data.get("input_payload", {}),
        }
        return self.workflow_service.start_workflow(
            {
                "workflow_type": "novel_analysis",
                "biz_type": "novel",
                "biz_id": novel_id,
                "title": f"{novel['title']} 分析工作流",
                "input_payload": input_payload,
            }
        )

    def run_analysis(self, run_id: int) -> None:
        self.workflow_service.run_workflow(run_id)

    def _word_count(self, text: str) -> int:
        return len([char for char in text if not char.isspace()])
