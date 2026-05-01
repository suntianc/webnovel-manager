import json
import re
from typing import TypeVar
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import httpx
from pydantic import BaseModel
from pydantic_ai import Agent, ModelSettings
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

from app.repositories.agent_repository import AgentRepository
from app.repositories.ai_provider_repository import AIProviderRepository


OutputT = TypeVar("OutputT", bound=BaseModel)
AI_REQUEST_TIMEOUT_SECONDS = 45.0


class AgentConfigurationError(RuntimeError):
    pass


class AgentRunner:
    def __init__(self):
        self.agent_repo = AgentRepository()
        self.provider_repo = AIProviderRepository()

    def run_structured(self, agent_name: str, prompt: str, output_type: type[OutputT]) -> OutputT:
        agent_config = self._get_agent_config(agent_name)
        provider = self._get_provider_config(agent_config)
        if "minimax" in provider["name"].lower() or "minimax" in provider["base_url"].lower():
            return self._run_prompted_json(agent_config, provider, prompt, output_type)
        model = OpenAIChatModel(
            agent_config["model"],
            provider=OpenAIProvider(
                base_url=provider["base_url"],
                api_key=provider["api_key"],
                http_client=httpx.AsyncClient(timeout=httpx.Timeout(AI_REQUEST_TIMEOUT_SECONDS)),
            ),
        )
        agent = Agent(
            model,
            output_type=output_type,
            instructions=agent_config["system_prompt"],
            model_settings=ModelSettings(
                temperature=agent_config.get("temperature", 0.3),
                max_tokens=agent_config.get("max_tokens", 2000),
                timeout=AI_REQUEST_TIMEOUT_SECONDS,
            ),
            retries=1,
        )
        result = agent.run_sync(prompt)
        return result.output

    def _run_prompted_json(
        self,
        agent_config: dict,
        provider: dict,
        prompt: str,
        output_type: type[OutputT],
    ) -> OutputT:
        schema = json.dumps(output_type.model_json_schema(), ensure_ascii=False)
        messages = [
            {
                "role": "system",
                "content": (
                    f"{agent_config['system_prompt']}\n"
                    "你必须只输出一个合法 JSON 对象，不要输出 Markdown，不要解释。"
                    "JSON 必须严格符合用户给出的 JSON Schema。"
                    "保持输出紧凑：每个数组优先保留最重要的 3-5 项，证据摘录要短。"
                ),
            },
            {
                "role": "user",
                "content": f"JSON Schema:\n{schema}\n\n任务输入:\n{prompt}",
            },
        ]
        last_error = None
        for _ in range(2):
            content = self._chat_completion_content(
                provider=provider,
                model=agent_config["model"],
                messages=messages,
                temperature=agent_config.get("temperature", 0.3),
                max_tokens=max(agent_config.get("max_tokens", 2000), 3000),
            )
            try:
                return output_type.model_validate_json(self._extract_json(content))
            except Exception as exc:
                last_error = exc
                messages.append({"role": "assistant", "content": content})
                messages.append(
                    {
                        "role": "user",
                        "content": (
                            f"上一次输出无法通过校验：{str(exc)[:500]}\n"
                            "请重新输出一个严格符合 JSON Schema 的合法 JSON 对象，只输出 JSON。"
                        ),
                    }
                )
        raise RuntimeError(f"AI output validation failed: {last_error}")

    def _chat_completion_content(
        self,
        provider: dict,
        model: str,
        messages: list[dict],
        temperature: float,
        max_tokens: int,
    ) -> str:
        payload = json.dumps(
            {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
            ensure_ascii=False,
        ).encode("utf-8")
        request = Request(
            f"{provider['base_url'].rstrip('/')}/chat/completions",
            data=payload,
            headers={
                "Authorization": f"Bearer {provider['api_key']}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urlopen(request, timeout=AI_REQUEST_TIMEOUT_SECONDS) as response:
                data = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")[:500]
            raise RuntimeError(f"AI request failed with HTTP {exc.code}: {body}") from exc
        except (URLError, TimeoutError, OSError) as exc:
            raise RuntimeError(f"AI request failed: {exc}") from exc

        choices = data.get("choices") or []
        if not choices:
            raise RuntimeError(f"AI response has no choices: {str(data)[:500]}")
        message = choices[0].get("message") or {}
        content = message.get("content") or ""
        if not content:
            reasoning = message.get("reasoning_content") or ""
            raise RuntimeError(f"AI response content is empty. reasoning={reasoning[:300]}")
        return content

    def _extract_json(self, content: str) -> str:
        stripped = content.strip()
        fenced = re.search(r"```(?:json)?\s*(.*?)```", stripped, re.DOTALL)
        if fenced:
            stripped = fenced.group(1).strip()
        start = stripped.find("{")
        end = stripped.rfind("}")
        if start >= 0 and end > start:
            return stripped[start : end + 1]
        return stripped

    def _get_agent_config(self, agent_name: str) -> dict:
        agents = self.agent_repo.find_all(enabled=True)
        agent_config = next((agent for agent in agents if agent["name"] == agent_name), None)
        if agent_config is None:
            raise AgentConfigurationError(f"Agent not configured or disabled: {agent_name}")
        if not agent_config.get("provider_id"):
            raise AgentConfigurationError(f"Agent has no provider configured: {agent_name}")
        if not agent_config.get("model"):
            raise AgentConfigurationError(f"Agent has no model configured: {agent_name}")
        return agent_config

    def _get_provider_config(self, agent_config: dict) -> dict:
        provider = self.provider_repo.find_by_id(agent_config["provider_id"], include_secret=True)
        if provider is None:
            raise AgentConfigurationError(f"Provider not found for agent: {agent_config['name']}")
        if not provider.get("api_key"):
            raise AgentConfigurationError(f"Provider has no API key: {provider['name']}")
        return provider
