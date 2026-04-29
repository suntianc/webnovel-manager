from urllib.parse import urlparse

from pydantic import BaseModel, Field, field_validator


class AIProviderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    base_url: str = Field(min_length=1, max_length=500)
    api_key: str = Field(min_length=1, max_length=2000)
    models: list[str] = Field(default_factory=list)

    @field_validator("name", "base_url", "api_key")
    @classmethod
    def trim_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("不能为空")
        return value

    @field_validator("base_url")
    @classmethod
    def validate_base_url(cls, value: str) -> str:
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("Base URL 必须是有效的 http(s) 地址")
        return value.rstrip("/")

    @field_validator("models")
    @classmethod
    def normalize_models(cls, value: list[str]) -> list[str]:
        seen: set[str] = set()
        models: list[str] = []
        for item in value:
            model = item.strip()
            if model and model not in seen:
                seen.add(model)
                models.append(model)
        return models


class AIProviderUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    base_url: str | None = Field(default=None, min_length=1, max_length=500)
    api_key: str | None = Field(default=None, min_length=1, max_length=2000)
    models: list[str] | None = None

    @field_validator("name", "base_url", "api_key")
    @classmethod
    def trim_optional(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("不能为空")
        return value

    @field_validator("base_url")
    @classmethod
    def validate_optional_base_url(cls, value: str | None) -> str | None:
        if value is None:
            return value
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("Base URL 必须是有效的 http(s) 地址")
        return value.rstrip("/")

    @field_validator("models")
    @classmethod
    def normalize_optional_models(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return value
        return AIProviderCreate.normalize_models(value)


class AIProviderResponse(BaseModel):
    id: int
    name: str
    provider_type: str
    base_url: str
    has_api_key: bool
    api_key_masked: str
    models: list[str]
    status: str
    created_at: str
    updated_at: str


class TestConnectionResponse(BaseModel):
    status: str
    message: str


class FetchModelsResponse(BaseModel):
    models: list[str]
