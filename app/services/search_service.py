from app.core.database import get_db
from typing import Optional


class SearchService:
    def search_by_keyword(self, keyword: str, limit: int = 20) -> list[dict]:
        """FTS5 BM25 搜索"""
        if not keyword or not isinstance(keyword, str) or keyword.strip() == '':
            return []

        safe_keyword = keyword.strip().replace('"', '').replace("'", '')
        if safe_keyword == '':
            return []

        with get_db() as conn:
            cursor = conn.execute('''
                SELECT m.*, bm25(materials_fts) as rank FROM materials m
                JOIN materials_fts fts ON m.id = fts.rowid
                WHERE materials_fts MATCH ?
                ORDER BY bm25(materials_fts)
                LIMIT ?
            ''', (f'{safe_keyword}*', limit))

            results = [dict(row) for row in cursor.fetchall()]
            return self._format_results(results)

    def search_by_filters(
        self,
        keyword: Optional[str] = None,
        category: Optional[str] = None,
        subcategory: Optional[str] = None,
        status: Optional[str] = None,
        tags: Optional[str] = None,
        limit: int = 20
    ) -> list[dict]:
        """组合条件搜索"""
        conditions = []
        params = []

        if category:
            conditions.append('m.category = ?')
            params.append(category)

        if subcategory:
            conditions.append('m.subcategory = ?')
            params.append(subcategory)

        if status:
            conditions.append('m.status = ?')
            params.append(status)

        results = []

        if keyword and isinstance(keyword, str) and keyword.strip() != '':
            safe_keyword = keyword.strip().replace('"', '').replace("'", '')
            if safe_keyword != '':
                sql = '''
                    SELECT m.*, bm25(materials_fts) as rank FROM materials m
                    JOIN materials_fts fts ON m.id = fts.rowid
                    WHERE materials_fts MATCH ?
                '''
                params.insert(0, f'{safe_keyword}*')

                if conditions:
                    sql += f' AND {" AND ".join(conditions)}'

                sql += ' ORDER BY bm25(materials_fts) LIMIT ?'
                params.append(limit)

                with get_db() as conn:
                    cursor = conn.execute(sql, params)
                    results = [dict(row) for row in cursor.fetchall()]
            else:
                results = self._search_by_conditions(conditions, params, limit)
        else:
            results = self._search_by_conditions(conditions, params, limit)

        if tags and isinstance(tags, str) and tags.strip():
            tag_list = [t.strip() for t in tags.split(',') if t.strip()]
            if tag_list:
                results = self._filter_by_tags(results, tag_list)

        return self._format_results(results)

    def _search_by_conditions(self, conditions: list[str], params: list, limit: int) -> list[dict]:
        sql = 'SELECT m.* FROM materials m'

        if conditions:
            sql += f' WHERE {" AND ".join(conditions)}'

        sql += ' ORDER BY m.updated_at DESC, m.id DESC LIMIT ?'
        params.append(limit)

        with get_db() as conn:
            cursor = conn.execute(sql, params)
            return [dict(row) for row in cursor.fetchall()]

    def _filter_by_tags(self, materials: list[dict], tag_list: list[str]) -> list[dict]:
        filtered = []
        for material in materials:
            material_tags = self._get_material_tags(material['id'])
            if any(tag in material_tags for tag in tag_list):
                filtered.append(material)
        return filtered

    def _get_material_tags(self, material_id: int) -> list[str]:
        with get_db() as conn:
            cursor = conn.execute('''
                SELECT t.name FROM tags t
                JOIN material_tags mt ON t.id = mt.tag_id
                WHERE mt.material_id = ?
            ''', (material_id,))
            return [row['name'] for row in cursor.fetchall()]

    def _format_results(self, materials: list[dict]) -> list[dict]:
        """将 material 数据格式化为 SearchResult 格式"""
        formatted = []
        for mat in materials:
            # 生成 snippet (取内容前100个字符)
            content = mat.get('content', '')
            snippet = content[:100] + '...' if len(content) > 100 else content

            # rank 字段处理
            rank = mat.pop('rank', None) if 'rank' in mat else None

            result = {
                'id': mat['id'],
                'title': mat.get('title', ''),
                'snippet': snippet,
                'rank': rank if rank is not None else 0.0,
                'category': mat.get('category'),
                'subcategory': mat.get('subcategory'),
                'tags': self._get_material_tags(mat['id']),
                'status': mat.get('status'),
                'created_at': mat.get('created_at')
            }
            formatted.append(result)
        return formatted
