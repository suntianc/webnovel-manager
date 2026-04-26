import json
from app.core.database import get_db
from typing import Optional


class MaterialRepository:
    ALLOWED_SORT_COLUMNS = {"created_at", "updated_at", "value_score", "title"}

    def _build_filter_clauses(self, filters: dict) -> tuple[str, list]:
        """构建公共的 WHERE 子句和参数，供 find_all 和 count_all 共享"""
        sql_parts = []
        params = []

        if filters.get('category'):
            sql_parts.append('AND m.category = ?')
            params.append(filters['category'])
        if filters.get('subcategory'):
            sql_parts.append('AND m.subcategory = ?')
            params.append(filters['subcategory'])
        if filters.get('status'):
            sql_parts.append('AND m.status = ?')
            params.append(filters['status'])
        if filters.get('source_type'):
            sql_parts.append('AND m.source_type = ?')
            params.append(filters['source_type'])
        if filters.get('min_score') is not None:
            sql_parts.append('AND m.value_score >= ?')
            params.append(filters['min_score'])
        if filters.get('max_score') is not None:
            sql_parts.append('AND m.value_score <= ?')
            params.append(filters['max_score'])
        if filters.get('search'):
            sql_parts.append('AND (m.title LIKE ? OR m.content LIKE ? OR m.summary LIKE ?)')
            search_term = f'%{filters["search"]}%'
            params.extend([search_term, search_term, search_term])
        if filters.get('tag'):
            sql_parts.append('AND m.id IN (SELECT mt.material_id FROM material_tags mt JOIN tags t ON t.id = mt.tag_id WHERE t.name = ?)')
            params.append(filters['tag'])

        return ' '.join(sql_parts), params

    def _get_sort_clause(self, filters: dict) -> str:
        sort = filters.get('sort', 'created_at')
        order = filters.get('order', 'desc')
        if sort not in self.ALLOWED_SORT_COLUMNS:
            sort = 'created_at'
        direction = 'DESC' if order.lower() == 'desc' else 'ASC'
        return f'ORDER BY m.{sort} {direction}'

    def count_all(self, filters: dict | None = None) -> int:
        if filters is None:
            filters = {}
        extra_sql, params = self._build_filter_clauses(filters)
        sql = f'SELECT COUNT(*) as total FROM materials m WHERE 1=1 {extra_sql}'
        with get_db() as conn:
            cursor = conn.execute(sql, params)
            return cursor.fetchone()['total']

    def find_all(self, filters: dict | None = None) -> list[dict]:
        if filters is None:
            filters = {}

        extra_sql, params = self._build_filter_clauses(filters)
        sort_clause = self._get_sort_clause(filters)

        sql = f'SELECT m.* FROM materials m WHERE 1=1 {extra_sql} {sort_clause}'

        limit = filters.get('limit')
        offset = filters.get('offset')
        if limit is not None:
            sql += ' LIMIT ?'
            params.append(limit)
        if offset is not None:
            sql += ' OFFSET ?'
            params.append(offset)

        with get_db() as conn:
            cursor = conn.execute(sql, params)
            rows = cursor.fetchall()

        materials = []
        for row in rows:
            mat = dict(row)
            if 'tags' in mat and mat['tags']:
                mat['tags'] = json.loads(mat['tags']) if isinstance(mat['tags'], str) else mat['tags']
            else:
                mat['tags'] = []
            materials.append(mat)

        return materials

    def find_by_id(self, id: int) -> Optional[dict]:
        with get_db() as conn:
            cursor = conn.execute('SELECT * FROM materials WHERE id = ?', (id,))
            row = cursor.fetchone()
            if row is None:
                return None
            mat = dict(row)
            if 'tags' in mat and mat['tags']:
                mat['tags'] = json.loads(mat['tags']) if isinstance(mat['tags'], str) else mat['tags']
            else:
                mat['tags'] = []
            return mat

    def create(self, data: dict) -> int:
        with get_db() as conn:
            cursor = conn.execute('''
                INSERT INTO materials (title, content, summary, category, subcategory, source_type, source_url, status, value_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                data.get('title'),
                data.get('content'),
                data.get('summary'),
                data.get('category'),
                data.get('subcategory'),
                data.get('source_type', '手动'),
                data.get('source_url'),
                data.get('status', '待整理'),
                data.get('value_score', 0)
            ))
            conn.commit()
            return cursor.lastrowid  # type: ignore[return-value]

    def update(self, id: int, data: dict) -> bool:
        existing = self.find_by_id(id)
        if existing is None:
            return False

        fields = []
        params = []

        for key in ('title', 'content', 'summary', 'category', 'subcategory',
                    'source_type', 'source_url', 'status', 'value_score'):
            if key in data:
                fields.append(f'{key} = ?')
                params.append(data[key])

        if not fields:
            return True

        fields.append('updated_at = CURRENT_TIMESTAMP')
        params.append(id)

        sql = f'UPDATE materials SET {", ".join(fields)} WHERE id = ?'
        with get_db() as conn:
            conn.execute(sql, params)
            conn.commit()
            return True

    def delete(self, id: int) -> bool:
        with get_db() as conn:
            cursor = conn.execute('DELETE FROM materials WHERE id = ?', (id,))
            conn.commit()
            return cursor.rowcount > 0

    def get_stats(self) -> dict:
        with get_db() as conn:
            cursor = conn.execute('SELECT COUNT(*) as count FROM materials')
            total = cursor.fetchone()['count']

            cursor = conn.execute('SELECT status, COUNT(*) as count FROM materials GROUP BY status')
            by_status = {row['status']: row['count'] for row in cursor.fetchall()}

            cursor = conn.execute(
                'SELECT category, COUNT(*) as count FROM materials WHERE category IS NOT NULL GROUP BY category'
            )
            by_category = {row['category']: row['count'] for row in cursor.fetchall()}

            cursor = conn.execute('SELECT AVG(value_score) as avg FROM materials')
            avg = cursor.fetchone()['avg'] or 0

            return {
                'total': total,
                'byStatus': by_status,
                'byCategory': by_category,
                'avgScore': round(avg * 100) / 100
            }
