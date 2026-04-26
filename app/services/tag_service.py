from app.repositories.tag_repository import TagRepository
from app.core.database import get_db


class TagService:
    def __init__(self):
        self.repo = TagRepository()

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

    def save_tags_for_material(self, material_id: int, tag_names: list[str]):
        """为素材保存标签关联（共用单个数据库连接）"""
        with get_db() as conn:
            conn.execute("DELETE FROM material_tags WHERE material_id = ?", (material_id,))
            for tag_name in tag_names:
                tag_id = self.repo.find_or_create(tag_name, conn=conn)
                conn.execute(
                    "INSERT INTO material_tags (material_id, tag_id) VALUES (?, ?)",
                    (material_id, tag_id),
                )
            conn.commit()

    def get_material_tags(self, material_id: int) -> list[str]:
        """获取素材的所有标签名称"""
        with get_db() as conn:
            cursor = conn.execute(
                """
                SELECT t.name
                FROM tags t
                INNER JOIN material_tags mt ON t.id = mt.tag_id
                WHERE mt.material_id = ?
                ORDER BY t.name
                """,
                (material_id,),
            )
            return [row['name'] for row in cursor.fetchall()]

    def get_all_tags(self) -> list[dict]:
        """获取所有标签"""
        return self.repo.find_all()

    def create_tag(self, name: str, tag_type: str = "内容标签") -> dict:
        """创建标签"""
        trimmed_name = name.strip() if name else ""

        if not trimmed_name:
            raise ValueError("Tag name cannot be empty")

        with get_db() as conn:
            cursor = conn.execute("SELECT id, name FROM tags WHERE name = ?", (trimmed_name,))
            existing = cursor.fetchone()
            if existing:
                raise ValueError(f'Tag "{trimmed_name}" already exists')

            cursor = conn.execute("INSERT INTO tags (name, tag_type) VALUES (?, ?)", (trimmed_name, tag_type))
            conn.commit()
            tag_id = cursor.lastrowid
            if tag_id is None:
                raise ValueError("Failed to insert tag")

        result = self.repo.find_by_id(tag_id)
        if not result:
            raise ValueError(f"Tag with id {tag_id} not found")
        return result

    def delete_tag(self, tag_id: int) -> bool:
        """删除标签"""
        with get_db() as conn:
            cursor = conn.execute("SELECT id FROM tags WHERE id = ?", (tag_id,))
            tag = cursor.fetchone()

            if not tag:
                return False

            conn.execute("DELETE FROM material_tags WHERE tag_id = ?", (tag_id,))
            conn.execute("DELETE FROM tags WHERE id = ?", (tag_id,))
            conn.commit()
            return True