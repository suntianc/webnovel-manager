from fastapi import APIRouter, HTTPException

from app.schemas.ai_provider import (
    AIProviderCreate,
    AIProviderResponse,
    AIProviderUpdate,
    FetchModelsResponse,
    TestConnectionResponse,
)
from app.services.ai_provider_service import AIProviderService

router = APIRouter(prefix="/api/ai-providers", tags=["ai-providers"])
provider_service = AIProviderService()


@router.get("/", response_model=list[AIProviderResponse])
def list_providers():
    return provider_service.list_providers()


@router.post("/", response_model=AIProviderResponse, status_code=201)
def create_provider(data: AIProviderCreate):
    return provider_service.create_provider(data.model_dump())


@router.post("/test", response_model=TestConnectionResponse)
def test_provider_config(data: AIProviderCreate):
    return provider_service.test_provider_config(data.model_dump())


@router.post("/models/fetch", response_model=FetchModelsResponse)
def fetch_models_for_config(data: AIProviderCreate):
    return provider_service.fetch_models_for_config(data.model_dump())


@router.get("/{provider_id}", response_model=AIProviderResponse)
def get_provider(provider_id: int):
    provider = provider_service.get_provider(provider_id)
    if provider is None:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider


@router.put("/{provider_id}", response_model=AIProviderResponse)
def update_provider(provider_id: int, data: AIProviderUpdate):
    provider = provider_service.update_provider(provider_id, data.model_dump(exclude_none=True))
    if provider is None:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider


@router.delete("/{provider_id}", status_code=204)
def delete_provider(provider_id: int):
    if not provider_service.delete_provider(provider_id):
        raise HTTPException(status_code=404, detail="Provider not found")


@router.post("/{provider_id}/test", response_model=TestConnectionResponse)
def test_connection(provider_id: int):
    provider = provider_service.get_provider(provider_id)
    if provider is None:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider_service.test_connection(provider_id)


@router.post("/{provider_id}/models/fetch", response_model=FetchModelsResponse)
def fetch_models(provider_id: int):
    provider = provider_service.get_provider(provider_id)
    if provider is None:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider_service.fetch_models(provider_id)
