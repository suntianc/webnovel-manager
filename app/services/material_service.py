from app.repositories.material_repository import MaterialRepository
from app.services.tag_service import TagService
from app.core.database import get_db


class MaterialService:
    def __init__(self):
        self.repo = MaterialRepository()
        self.tag_service = TagService()

    def normalize_tags(self, tag_string: str) -> list[str]:
        """将逗号分隔的标签字符串转为列表，中文逗号转英文，去重"""
        if not tag_string or not isinstance(tag_string, str):
            return []

        tags = [
            tag.strip()
            for tag in tag_string.replace("，", ",").split(",")
            if tag.strip()
        ]

        return list(dict.fromkeys(tags))

    def create_material(self, data: dict) -> dict:
        """创建素材"""
        normalized_tags = self.normalize_tags(data.get('tags', ''))

        material_id = self.repo.create(data)
        if not material_id:
            raise Exception('Failed to create material')

        if normalized_tags:
            self.tag_service.save_tags_for_material(material_id, normalized_tags)

        result = self.get_material_with_tags(material_id)
        if result is None:
            raise Exception('Failed to fetch created material')
        return result

    def update_material(self, id: int, data: dict) -> dict | None:
        """更新素材"""
        normalized_tags = self.normalize_tags(data.get('tags', ''))

        existing = self.repo.find_by_id(id)
        if not existing:
            return None

        success = self.repo.update(id, data)
        if not success:
            return None

        with get_db() as conn:
            conn.execute('DELETE FROM material_tags WHERE material_id = ?', (id,))
            conn.commit()

        if normalized_tags:
            self.tag_service.save_tags_for_material(id, normalized_tags)

        result = self.get_material_with_tags(id)
        return result

    def delete_material(self, id: int) -> bool:
        """删除素材"""
        return self.repo.delete(id)

    def list_materials(self, filters: dict | None = None) -> dict:
        """列出素材（带分页）"""
        if filters is None:
            filters = {}

        page = max(1, int(filters.get('page', 1)))
        limit = min(100, max(1, int(filters.get('limit', 20))))
        offset = (page - 1) * limit

        query_filters = dict(filters)
        query_filters['page'] = page
        query_filters['limit'] = limit
        query_filters['offset'] = offset

        with get_db() as conn:
            count_sql = 'SELECT COUNT(*) as total FROM materials WHERE 1=1'
            count_params = []

            if filters.get('category'):
                count_sql += ' AND category = ?'
                count_params.append(filters['category'])
            if filters.get('subcategory'):
                count_sql += ' AND subcategory = ?'
                count_params.append(filters['subcategory'])
            if filters.get('status'):
                count_sql += ' AND status = ?'
                count_params.append(filters['status'])
            if filters.get('search'):
                count_sql += ' AND (title LIKE ? OR content LIKE ?)'
                search_term = f'%{filters["search"]}%'
                count_params.extend([search_term, search_term])

            cursor = conn.execute(count_sql, count_params)
            total = cursor.fetchone()['total']

        materials = self.repo.find_all(query_filters)

        materials_with_tags = []
        for material in materials:
            material['tags'] = self.tag_service.get_material_tags(material['id'])
            materials_with_tags.append(material)

        return {
            'materials': materials_with_tags,
            'total': total,
            'page': page,
            'limit': limit
        }

    def get_material_with_tags(self, id: int) -> dict | None:
        """获取素材详情（含标签）"""
        material = self.repo.find_by_id(id)
        if not material:
            return None

        material['tags'] = self.tag_service.get_material_tags(id)
        return material