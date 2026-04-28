import json
from typing import Any, Optional

from app.core.database import get_db


def _json_dumps(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


def _json_loads(value: Any, fallback: Any) -> Any:
    if value is None or value == "":
        return fallback
    if not isinstance(value, str):
        return value
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return fallback


class AgentRepository:
    def _format_agent(self, row) -> dict:
        item = dict(row)
        item["tools"] = _json_loads(item.get("tools"), [])
        item["output_schema"] = _json_loads(item.get("output_schema"), None)
        item["enabled"] = bool(item.get("enabled"))
        return item

    def find_all(self, enabled: Optional[bool] = None) -> list[dict]:
        params: list[Any] = []
        sql = "SELECT * FROM agent_definitions WHERE 1=1"
        if enabled is not None:
            sql += " AND enabled = ?"
            params.append(1 if enabled else 0)
        sql += " ORDER BY id"
        with get_db() as conn:
            rows = conn.execute(sql, params).fetchall()
        return [self._format_agent(row) for row in rows]

    def find_by_id(self, agent_id: int) -> Optional[dict]:
        with get_db() as conn:
            row = conn.execute("SELECT * FROM agent_definitions WHERE id = ?", (agent_id,)).fetchone()
        return self._format_agent(row) if row else None

    def create(self, data: dict) -> dict:
        with get_db() as conn:
            cursor = conn.execute(
                """
                INSERT INTO agent_definitions
                    (name, role, description, system_prompt, model, temperature, tools, output_schema, enabled)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    data["name"],
                    data["role"],
                    data.get("description"),
                    data["system_prompt"],
                    data.get("model", "gpt-4o-mini"),
                    data.get("temperature", 0.3),
                    _json_dumps(data.get("tools", [])),
                    _json_dumps(data.get("output_schema")) if data.get("output_schema") is not None else None,
                    1 if data.get("enabled", True) else 0,
                ),
            )
            conn.commit()
            agent_id = cursor.lastrowid
        result = self.find_by_id(agent_id)
        if result is None:
            raise RuntimeError("Failed to fetch created agent")
        return result

    def update(self, agent_id: int, data: dict) -> Optional[dict]:
        fields = []
        params: list[Any] = []
        for key in ("role", "description", "system_prompt", "model", "temperature"):
            if key in data:
                fields.append(f"{key} = ?")
                params.append(data[key])
        if "tools" in data:
            fields.append("tools = ?")
            params.append(_json_dumps(data["tools"]))
        if "output_schema" in data:
            fields.append("output_schema = ?")
            params.append(_json_dumps(data["output_schema"]) if data["output_schema"] is not None else None)
        if "enabled" in data:
            fields.append("enabled = ?")
            params.append(1 if data["enabled"] else 0)
        if not fields:
            return self.find_by_id(agent_id)
        fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(agent_id)
        with get_db() as conn:
            cursor = conn.execute(
                f"UPDATE agent_definitions SET {', '.join(fields)} WHERE id = ?",
                params,
            )
            conn.commit()
        if cursor.rowcount == 0:
            return None
        return self.find_by_id(agent_id)
