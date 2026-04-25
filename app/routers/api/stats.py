from fastapi import APIRouter
from app.schemas.stats import StatsResponse
from app.repositories.material_repository import MaterialRepository
from app.repositories.tag_repository import TagRepository
from app.core.database import get_db

router = APIRouter(prefix="/api/stats", tags=["stats"])

@router.get("/", response_model=StatsResponse)
def get_stats():
    mat_repo = MaterialRepository()
    tag_repo = TagRepository()

    stats = mat_repo.get_stats()

    all_tags = tag_repo.find_all()
    total_tags = len(all_tags)

    with get_db() as conn:
        cursor = conn.execute('''
            SELECT COUNT(*) as count FROM materials
            WHERE created_at >= datetime('now', '-7 days')
        ''')
        recent_count = cursor.fetchone()['count']

    return {
        "total": stats['total'],
        "total_tags": total_tags,
        "by_status": stats['byStatus'],
        "by_category": stats['byCategory'],
        "avg_score": stats['avgScore'],
        "recent_count": recent_count
    }