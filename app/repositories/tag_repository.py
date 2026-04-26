from app.core.database import get_db
from typing import Optional


class TagRepository:
    def find_all(self) -> list[dict]:
        """参考 models/tag.js:findAll()"""
        with get_db() as conn:
            cursor = conn.execute('SELECT * FROM tags ORDER BY name')
            return [dict(row) for row in cursor.fetchall()]

    def find_by_id(self, id: int) -> Optional[dict]:
        """参考 models/tag.js:findById()"""
        with get_db() as conn:
            cursor = conn.execute('SELECT * FROM tags WHERE id = ?', (id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def find_or_create(self, name: str, conn=None) -> int:
        """查找或创建标签，可选传入已有连接"""
        own_conn = conn is None
        if own_conn:
            conn = get_db().__enter__()
        try:
            cursor = conn.execute('SELECT * FROM tags WHERE name = ?', (name,))
            existing = cursor.fetchone()
            if existing:
                return existing['id']
            cursor = conn.execute('INSERT INTO tags (name) VALUES (?)', (name,))
            if own_conn:
                conn.commit()
            return cursor.lastrowid  # type: ignore[return-value]
        finally:
            if own_conn:
                get_db().__exit__(None, None, None)

    def get_popular_tags(self, limit: int = 10) -> list[dict]:
        """参考 models/tag.js:getPopularTags()"""
        with get_db() as conn:
            cursor = conn.execute('''
                SELECT t.*, COUNT(mt.material_id) as usage_count
                FROM tags t
                LEFT JOIN material_tags mt ON t.id = mt.tag_id
                GROUP BY t.id
                ORDER BY usage_count DESC, t.name
                LIMIT ?
            ''', (limit,))
            return [dict(row) for row in cursor.fetchall()]