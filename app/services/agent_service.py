from app.repositories.agent_repository import AgentRepository


class AgentService:
    def __init__(self):
        self.repo = AgentRepository()

    def list_agents(self, enabled: bool | None = None) -> list[dict]:
        return self.repo.find_all(enabled=enabled)

    def get_agent(self, agent_id: int) -> dict | None:
        return self.repo.find_by_id(agent_id)

    def create_agent(self, data: dict) -> dict:
        return self.repo.create(data)

    def update_agent(self, agent_id: int, data: dict) -> dict | None:
        return self.repo.update(agent_id, data)

    def test_agent(self, agent_id: int, input_text: str, context: dict) -> dict | None:
        agent = self.get_agent(agent_id)
        if agent is None:
            return None
        context_keys = sorted(context.keys())
        preview = (
            f"{agent['name']} 已接收测试输入。当前服务端先返回 dry-run 预览；"
            f"接入 LLM 后这里会执行真实 Agent。输入长度：{len(input_text)}。"
        )
        return {
            "agent_id": agent_id,
            "agent_name": agent["name"],
            "preview": preview,
            "context_keys": context_keys,
        }
