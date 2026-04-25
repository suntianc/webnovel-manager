from pydantic import BaseModel
from typing import Dict

class StatsResponse(BaseModel):
    total: int
    total_tags: int
    by_status: Dict[str, int]
    by_category: Dict[str, int]
    avg_score: float
    recent_count: int