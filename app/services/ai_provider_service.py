import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import litellm
from fastapi import HTTPException

from app.repositories.ai_provider_repository import AIProviderRepository


class AIProviderService:
    DEFAULT_TEST_MODELS = {
        "DeepSeek": "deepseek-chat",
        "Moonshot": "moonshot-v1-8k",
        "OpenAI": "gpt-4o-mini",
        "Qwen": "qwen-plus",
        "SiliconFlow": "deepseek-ai/DeepSeek-V3",
        "ZhipuAI": "glm-4-flash",
    }

    def __init__(self):
        self.repo = AIProviderRepository()

    def initialize(self) -> None:
        self.repo.create_table()

    def list_providers(self) -> list[dict]:
        return self.repo.find_all()

    def get_provider(self, provider_id: int) -> dict | None:
        return self.repo.find_by_id(provider_id)

    def create_provider(self, data: dict) -> dict:
        if self.repo.find_by_name(data["name"]):
            raise HTTPException(status_code=409, detail="Provider name already exists")
        return self.repo.create(data)

    def update_provider(self, provider_id: int, data: dict) -> dict | None:
        if "name" in data and self.repo.find_by_name(data["name"], exclude_id=provider_id):
            raise HTTPException(status_code=409, detail="Provider name already exists")
        return self.repo.update(provider_id, data)

    def delete_provider(self, provider_id: int) -> bool:
        return self.repo.delete(provider_id)

    def test_connection(self, provider_id: int) -> dict:
        provider = self.repo.find_by_id(provider_id, include_secret=True)
        if not provider:
            return {"status": "error", "message": "Provider not found"}

        result = self.test_provider_config(provider)
        self.repo.update(provider_id, {"status": "connected" if result["status"] == "ok" else "failed"})
        return result

    def test_provider_config(self, provider: dict) -> dict:
        try:
            model = provider.get("models", [])
            model_name = model[0] if model else self.DEFAULT_TEST_MODELS.get(provider["name"], "gpt-4o-mini")
            litellm.completion(
                model=f"openai/{model_name}",
                messages=[{"role": "user", "content": "hi"}],
                max_tokens=5,
                api_base=provider["base_url"],
                api_key=provider["api_key"],
                timeout=10,
            )
            return {"status": "ok", "message": "连接成功"}
        except Exception as e:
            return {"status": "error", "message": str(e)[:200]}

    def fetch_models(self, provider_id: int) -> dict:
        provider = self.repo.find_by_id(provider_id, include_secret=True)
        if not provider:
            return {"models": []}

        result = self.fetch_models_for_config(provider)
        if result["models"]:
            self.repo.update(provider_id, {"models": result["models"], "status": "connected"})
        else:
            self.repo.update(provider_id, {"status": "failed"})
            result = {"models": provider.get("models", [])}
        return result

    def fetch_models_for_config(self, provider: dict) -> dict:
        models: set[str] = set()
        try:
            request = Request(
                f"{provider['base_url'].rstrip('/')}/models",
                headers={
                    "Authorization": f"Bearer {provider['api_key']}",
                    "Content-Type": "application/json",
                },
            )
            with urlopen(request, timeout=10) as response:
                payload = json.loads(response.read().decode("utf-8"))
            items = payload.get("data", payload if isinstance(payload, list) else [])
            for item in items:
                if isinstance(item, dict) and item.get("id"):
                    models.add(str(item["id"]))
                elif isinstance(item, str):
                    models.add(item)
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError, OSError):
            return {"models": []}

        result = sorted(models)
        return {"models": result}
