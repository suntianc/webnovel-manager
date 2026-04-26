from fastapi import APIRouter, HTTPException, Query, Path
from typing import Optional
from app.schemas.material import MaterialCreate, MaterialUpdate, MaterialResponse, MaterialPaginatedResponse
from app.services.material_service import MaterialService

router = APIRouter(prefix="/api/materials", tags=["materials"])
material_service = MaterialService()


@router.get("/", response_model=MaterialPaginatedResponse)
def list_materials(
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    status: Optional[str] = None,
    min_score: Optional[int] = Query(None, ge=0, le=5),
    max_score: Optional[int] = Query(None, ge=0, le=5),
    tag: Optional[str] = None,
    keyword: Optional[str] = None,
    sort: str = Query("created_at"),
    order: str = Query("desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    filters = {'page': page, 'limit': limit, 'sort': sort, 'order': order}
    if category:
        filters['category'] = category
    if subcategory:
        filters['subcategory'] = subcategory
    if status:
        filters['status'] = status
    if min_score is not None:
        filters['min_score'] = min_score
    if max_score is not None:
        filters['max_score'] = max_score
    if tag:
        filters['tag'] = tag
    if keyword:
        filters['search'] = keyword

    result = material_service.list_materials(filters)
    return result


@router.get("/{material_id}", response_model=MaterialResponse)
def get_material(material_id: int = Path(..., gt=0)):
    material = material_service.get_material_with_tags(material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return material


@router.post("/", response_model=MaterialResponse, status_code=201)
def create_material(material: MaterialCreate):
    data = material.model_dump()
    created = material_service.create_material(data)
    return created


@router.put("/{material_id}", response_model=MaterialResponse)
def update_material(material_id: int, material: MaterialUpdate):
    data = {k: v for k, v in material.model_dump().items() if v is not None}
    success = material_service.update_material(material_id, data)
    if not success:
        raise HTTPException(status_code=404, detail="Material not found")
    return material_service.get_material_with_tags(material_id)


@router.delete("/{material_id}", status_code=204)
def delete_material(material_id: int):
    success = material_service.delete_material(material_id)
    if not success:
        raise HTTPException(status_code=404, detail="Material not found")
    return None
