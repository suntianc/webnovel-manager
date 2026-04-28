from typing import Any, Optional

from app.core.database import get_db


class NovelRepository:
    def create_source(self, data: dict) -> int:
        with get_db() as conn:
            cursor = conn.execute(
                """
                INSERT INTO novel_sources
                    (title, author, original_filename, stored_path, file_size, file_hash, cover_path, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    data["title"],
                    data.get("author"),
                    data["original_filename"],
                    data["stored_path"],
                    data.get("file_size", 0),
                    data["file_hash"],
                    data.get("cover_path"),
                    data.get("status", "uploaded"),
                ),
            )
            conn.commit()
            return cursor.lastrowid  # type: ignore[return-value]

    def find_source_by_hash(self, file_hash: str) -> Optional[dict]:
        with get_db() as conn:
            row = conn.execute("SELECT * FROM novel_sources WHERE file_hash = ?", (file_hash,)).fetchone()
        return dict(row) if row else None

    def find_source(self, novel_id: int) -> Optional[dict]:
        with get_db() as conn:
            row = conn.execute("SELECT * FROM novel_sources WHERE id = ?", (novel_id,)).fetchone()
        return dict(row) if row else None

    def list_sources(self, filters: dict) -> dict:
        page = max(1, int(filters.get("page", 1)))
        limit = min(100, max(1, int(filters.get("limit", 20))))
        offset = (page - 1) * limit
        where = ["1=1"]
        params: list[Any] = []
        if filters.get("status"):
            where.append("status = ?")
            params.append(filters["status"])
        if filters.get("keyword"):
            where.append("(title LIKE ? OR author LIKE ? OR original_filename LIKE ?)")
            keyword = f"%{filters['keyword']}%"
            params.extend([keyword, keyword, keyword])
        where_sql = " AND ".join(where)
        with get_db() as conn:
            total = conn.execute(f"SELECT COUNT(*) AS total FROM novel_sources WHERE {where_sql}", params).fetchone()[
                "total"
            ]
            rows = conn.execute(
                f"""
                SELECT * FROM novel_sources
                WHERE {where_sql}
                ORDER BY updated_at DESC, id DESC
                LIMIT ? OFFSET ?
                """,
                [*params, limit, offset],
            ).fetchall()
        return {"data": [dict(row) for row in rows], "total": total, "page": page, "limit": limit}

    def update_source(self, novel_id: int, data: dict) -> Optional[dict]:
        fields = []
        params: list[Any] = []
        for key in ("title", "author", "cover_path", "status", "chapter_count", "part_count", "error_message"):
            if key in data:
                fields.append(f"{key} = ?")
                params.append(data[key])
        if not fields:
            return self.find_source(novel_id)
        fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(novel_id)
        with get_db() as conn:
            cursor = conn.execute(f"UPDATE novel_sources SET {', '.join(fields)} WHERE id = ?", params)
            conn.commit()
        return self.find_source(novel_id) if cursor.rowcount else None

    def delete_source(self, novel_id: int) -> bool:
        with get_db() as conn:
            conn.execute("DELETE FROM workflow_runs WHERE biz_type = ? AND biz_id = ?", ("novel", novel_id))
            cursor = conn.execute("DELETE FROM novel_sources WHERE id = ?", (novel_id,))
            conn.commit()
            return cursor.rowcount > 0

    def replace_chapters(self, novel_id: int, chapters: list[dict]) -> None:
        with get_db() as conn:
            conn.execute("DELETE FROM novel_chapters WHERE novel_id = ?", (novel_id,))
            conn.executemany(
                """
                INSERT INTO novel_chapters
                    (novel_id, chapter_index, title, content, word_count, start_offset, end_offset)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        novel_id,
                        chapter["chapter_index"],
                        chapter["title"],
                        chapter["content"],
                        chapter["word_count"],
                        chapter.get("start_offset", 0),
                        chapter.get("end_offset", 0),
                    )
                    for chapter in chapters
                ],
            )
            conn.commit()

    def list_chapters(self, novel_id: int, include_content: bool = False) -> list[dict]:
        columns = "*" if include_content else "id, novel_id, chapter_index, title, word_count, start_offset, end_offset, created_at"
        with get_db() as conn:
            rows = conn.execute(
                f"SELECT {columns} FROM novel_chapters WHERE novel_id = ? ORDER BY chapter_index",
                (novel_id,),
            ).fetchall()
        return [dict(row) for row in rows]

    def find_chapter(self, novel_id: int, chapter_id: int) -> Optional[dict]:
        with get_db() as conn:
            row = conn.execute(
                "SELECT * FROM novel_chapters WHERE novel_id = ? AND id = ?",
                (novel_id, chapter_id),
            ).fetchone()
        return dict(row) if row else None

    def search_chapters(self, novel_id: int, keyword: str, limit: int = 50) -> list[dict]:
        with get_db() as conn:
            rows = conn.execute(
                """
                SELECT id, novel_id, chapter_index, title, word_count, start_offset, end_offset, created_at
                FROM novel_chapters
                WHERE novel_id = ? AND (title LIKE ? OR content LIKE ?)
                ORDER BY chapter_index
                LIMIT ?
                """,
                (novel_id, f"%{keyword}%", f"%{keyword}%", limit),
            ).fetchall()
        return [dict(row) for row in rows]

    def replace_parts(self, novel_id: int, parts: list[dict]) -> None:
        with get_db() as conn:
            conn.execute("DELETE FROM novel_parts WHERE novel_id = ?", (novel_id,))
            conn.executemany(
                """
                INSERT INTO novel_parts
                    (novel_id, part_index, title, chapter_start, chapter_end, content, word_count, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        novel_id,
                        part["part_index"],
                        part["title"],
                        part["chapter_start"],
                        part["chapter_end"],
                        part["content"],
                        part["word_count"],
                        part.get("status", "ready"),
                    )
                    for part in parts
                ],
            )
            conn.commit()

    def list_parts(self, novel_id: int, include_content: bool = False) -> list[dict]:
        columns = "*" if include_content else (
            "id, novel_id, part_index, title, chapter_start, chapter_end, word_count, status, created_at, updated_at"
        )
        with get_db() as conn:
            rows = conn.execute(
                f"SELECT {columns} FROM novel_parts WHERE novel_id = ? ORDER BY part_index",
                (novel_id,),
            ).fetchall()
        return [dict(row) for row in rows]

    def find_part(self, novel_id: int, part_id: int) -> Optional[dict]:
        with get_db() as conn:
            row = conn.execute("SELECT * FROM novel_parts WHERE novel_id = ? AND id = ?", (novel_id, part_id)).fetchone()
        return dict(row) if row else None
