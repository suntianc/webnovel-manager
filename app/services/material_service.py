from app.repositories.material_repository import MaterialRepository
from app.services.tag_service import TagService
from app.core.database import get_db


class MaterialService:
    def __init__(self):
        self.repo = MaterialRepository()
        self.tag_service = TagService()

    def normalize_tags(self, tag_value: str | list[str] | None) -> list[str]:
        if not tag_value:
            return []
        if isinstance(tag_value, list):
            tags = [str(tag).strip() for tag in tag_value if str(tag).strip()]
        elif isinstance(tag_value, str):
            tags = [
                tag.strip()
                for tag in tag_value.replace("，", ",").split(",")
                if tag.strip()
            ]
        else:
            return []
        return list(dict.fromkeys(tags))

    def create_material(self, data: dict) -> dict:
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
        return self.repo.delete(id)

    def list_materials(self, filters: dict | None = None) -> dict:
        if filters is None:
            filters = {}

        page = max(1, int(filters.get('page', 1)))
        limit = min(100, max(1, int(filters.get('limit', 20))))
        offset = (page - 1) * limit

        query_filters = dict(filters)
        query_filters['limit'] = limit
        query_filters['offset'] = offset

        total = self.repo.count_all(query_filters)
        materials = self.repo.find_all(query_filters)

        materials_with_tags = []
        for material in materials:
            material['tags'] = self.tag_service.get_material_tags(material['id'])
            materials_with_tags.append(material)

        return {
            'data': materials_with_tags,
            'total': total,
            'page': page,
            'limit': limit
        }

    def get_material_with_tags(self, id: int) -> dict | None:
        material = self.repo.find_by_id(id)
        if not material:
            return None
        material['tags'] = self.tag_service.get_material_tags(id)
        return material
