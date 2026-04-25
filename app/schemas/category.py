from pydantic import BaseModel
from typing import Dict

class CategoriesResponse(BaseModel):
    categories: Dict[str, list[str]]