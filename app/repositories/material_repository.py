import json
from app.core.database import get_db
from typing import Optional, Generator


class MaterialRepository:
    def find_all(self, filters: dict | None = None) -> list[dict]:
        if filters is None:
            filters = {}

        with get_db() as conn:
            sql = 'SELECT * FROM materials WHERE 1=1'
            params = []

            if filters.get('category'):
                sql += ' AND category = ?'
                params.append(filters['category'])
            if filters.get('subcategory'):
                sql += ' AND subcategory = ?'
                params.append(filters['subcategory'])
            if filters.get('status'):
                sql += ' AND status = ?'
                params.append(filters['status'])
            if filters.get('source_type'):
                sql += ' AND source_type = ?'
                params.append(filters['source_type'])
            if filters.get('search'):
                sql += ' AND (title LIKE ? OR content LIKE ?)'
                search_term = f'%{filters["search"]}%'
                params.extend([search_term, search_term])

            sql += ' ORDER BY created_at DESC'

            cursor = conn.execute(sql, params)
            rows = cursor.fetchall()

            # Convert to list of dicts and parse tags JSON
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
        """参考 models/material.js:findById()"""
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
        """参考 models/material.js:create()"""
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
        """参考 models/material.js:update()"""
        # First check if record exists
        existing = self.find_by_id(id)
        if existing is None:
            return False

        fields = []
        params = []

        if 'title' in data:
            fields.append('title = ?')
            params.append(data['title'])
        if 'content' in data:
            fields.append('content = ?')
            params.append(data['content'])
        if 'summary' in data:
            fields.append('summary = ?')
            params.append(data['summary'])
        if 'category' in data:
            fields.append('category = ?')
            params.append(data['category'])
        if 'subcategory' in data:
            fields.append('subcategory = ?')
            params.append(data['subcategory'])
        if 'source_type' in data:
            fields.append('source_type = ?')
            params.append(data['source_type'])
        if 'source_url' in data:
            fields.append('source_url = ?')
            params.append(data['source_url'])
        if 'status' in data:
            fields.append('status = ?')
            params.append(data['status'])
        if 'value_score' in data:
            fields.append('value_score = ?')
            params.append(data['value_score'])

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
        """参考 models/material.js:delete()"""
        with get_db() as conn:
            cursor = conn.execute('DELETE FROM materials WHERE id = ?', (id,))
            conn.commit()
            return cursor.rowcount > 0

    def get_stats(self) -> dict:
        """参考 models/material.js:getStats()"""
        with get_db() as conn:
            # Total count
            cursor = conn.execute('SELECT COUNT(*) as count FROM materials')
            total = cursor.fetchone()['count']

            # By status
            cursor = conn.execute('SELECT status, COUNT(*) as count FROM materials GROUP BY status')
            by_status_rows = cursor.fetchall()
            by_status = {row['status']: row['count'] for row in by_status_rows}

            # By category
            cursor = conn.execute(
                'SELECT category, COUNT(*) as count FROM materials WHERE category IS NOT NULL GROUP BY category'
            )
            by_category_rows = cursor.fetchall()
            by_category = {row['category']: row['count'] for row in by_category_rows}

            # Average score
            cursor = conn.execute('SELECT AVG(value_score) as avg FROM materials')
            avg = cursor.fetchone()['avg'] or 0
            avg_score = round(avg * 100) / 100

            return {
                'total': total,
                'byStatus': by_status,
                'byCategory': by_category,
                'avgScore': avg_score
            }