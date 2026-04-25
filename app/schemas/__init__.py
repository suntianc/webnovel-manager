from app.schemas.material import MaterialBase, MaterialCreate, MaterialUpdate, MaterialResponse
from app.schemas.tag import TagCreate, TagResponse
from app.schemas.search import SearchResult
from app.schemas.category import CategoriesResponse
from app.schemas.stats import StatsResponse

__all__ = [
    "MaterialBase",
    "MaterialCreate",
    "MaterialUpdate",
    "MaterialResponse",
    "TagCreate",
    "TagResponse",
    "SearchResult",
    "CategoriesResponse",
    "StatsResponse",
]