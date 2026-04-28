from typing import Any, Optional

from app.core.database import get_db
from app.repositories.agent_repository import _json_dumps, _json_loads


class WorkflowRepository:
    def _format_run(self, row) -> dict:
        item = dict(row)
        item["input_payload"] = _json_loads(item.get("input_payload"), {})
        return item

    def _format_task(self, row) -> dict:
        return dict(row)

    def _format_event(self, row) -> dict:
        item = dict(row)
        item["payload"] = _json_loads(item.get("payload"), {})
        return item

    def _format_artifact(self, row) -> dict:
        item = dict(row)
        item["structured_data"] = _json_loads(item.get("structured_data"), {})
        item["source_refs"] = _json_loads(item.get("source_refs"), [])
        return item

    def create_run(self, data: dict) -> int:
        with get_db() as conn:
            cursor = conn.execute(
                """
                INSERT INTO workflow_runs
                    (workflow_type, biz_type, biz_id, title, input_payload)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    data["workflow_type"],
                    data["biz_type"],
                    data.get("biz_id"),
                    data["title"],
                    _json_dumps(data.get("input_payload", {})),
                ),
            )
            conn.commit()
            return cursor.lastrowid  # type: ignore[return-value]

    def find_run(self, run_id: int) -> Optional[dict]:
        with get_db() as conn:
            row = conn.execute("SELECT * FROM workflow_runs WHERE id = ?", (run_id,)).fetchone()
        return self._format_run(row) if row else None

    def list_runs(self, filters: dict) -> dict:
        params: list[Any] = []
        where = ["1=1"]
        if filters.get("status"):
            where.append("status = ?")
            params.append(filters["status"])
        if filters.get("workflow_type"):
            where.append("workflow_type = ?")
            params.append(filters["workflow_type"])
        if filters.get("biz_type"):
            where.append("biz_type = ?")
            params.append(filters["biz_type"])
        page = max(1, int(filters.get("page", 1)))
        limit = min(100, max(1, int(filters.get("limit", 20))))
        offset = (page - 1) * limit
        where_sql = " AND ".join(where)
        with get_db() as conn:
            total = conn.execute(f"SELECT COUNT(*) AS total FROM workflow_runs WHERE {where_sql}", params).fetchone()[
                "total"
            ]
            rows = conn.execute(
                f"""
                SELECT * FROM workflow_runs
                WHERE {where_sql}
                ORDER BY created_at DESC, id DESC
                LIMIT ? OFFSET ?
                """,
                [*params, limit, offset],
            ).fetchall()
        return {"data": [self._format_run(row) for row in rows], "total": total, "page": page, "limit": limit}

    def update_run(self, run_id: int, data: dict) -> Optional[dict]:
        fields = []
        params: list[Any] = []
        for key in ("status", "progress", "current_node", "error_message", "started_at", "completed_at"):
            if key in data:
                fields.append(f"{key} = ?")
                params.append(data[key])
        if not fields:
            return self.find_run(run_id)
        fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(run_id)
        with get_db() as conn:
            cursor = conn.execute(f"UPDATE workflow_runs SET {', '.join(fields)} WHERE id = ?", params)
            conn.commit()
        return self.find_run(run_id) if cursor.rowcount else None

    def create_task(self, run_id: int, task: dict) -> int:
        with get_db() as conn:
            cursor = conn.execute(
                """
                INSERT INTO workflow_tasks (run_id, node_name, agent_name, task_type, input_ref)
                VALUES (?, ?, ?, ?, ?)
                """,
                (run_id, task["node_name"], task.get("agent_name"), task["task_type"], task.get("input_ref")),
            )
            conn.commit()
            return cursor.lastrowid  # type: ignore[return-value]

    def list_tasks(self, run_id: int) -> list[dict]:
        with get_db() as conn:
            rows = conn.execute("SELECT * FROM workflow_tasks WHERE run_id = ? ORDER BY id", (run_id,)).fetchall()
        return [self._format_task(row) for row in rows]

    def find_task(self, task_id: int) -> Optional[dict]:
        with get_db() as conn:
            row = conn.execute("SELECT * FROM workflow_tasks WHERE id = ?", (task_id,)).fetchone()
        return self._format_task(row) if row else None

    def update_task(self, task_id: int, data: dict) -> Optional[dict]:
        fields = []
        params: list[Any] = []
        for key in ("status", "progress", "output_ref", "retry_count", "error_message", "started_at", "completed_at"):
            if key in data:
                fields.append(f"{key} = ?")
                params.append(data[key])
        if not fields:
            return self.find_task(task_id)
        fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(task_id)
        with get_db() as conn:
            cursor = conn.execute(f"UPDATE workflow_tasks SET {', '.join(fields)} WHERE id = ?", params)
            conn.commit()
        return self.find_task(task_id) if cursor.rowcount else None

    def create_event(self, run_id: int, event: dict) -> int:
        with get_db() as conn:
            cursor = conn.execute(
                """
                INSERT INTO workflow_events (run_id, task_id, event_type, level, message, payload)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    run_id,
                    event.get("task_id"),
                    event["event_type"],
                    event.get("level", "info"),
                    event["message"],
                    _json_dumps(event.get("payload", {})),
                ),
            )
            conn.commit()
            return cursor.lastrowid  # type: ignore[return-value]

    def list_events(self, run_id: int, after_id: int = 0, limit: int = 100) -> list[dict]:
        with get_db() as conn:
            rows = conn.execute(
                """
                SELECT * FROM workflow_events
                WHERE run_id = ? AND id > ?
                ORDER BY id ASC
                LIMIT ?
                """,
                (run_id, after_id, limit),
            ).fetchall()
        return [self._format_event(row) for row in rows]

    def create_artifact(self, data: dict) -> int:
        with get_db() as conn:
            cursor = conn.execute(
                """
                INSERT INTO agent_artifacts
                    (run_id, task_id, artifact_type, title, content, structured_data, source_refs, created_by_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    data["run_id"],
                    data.get("task_id"),
                    data["artifact_type"],
                    data["title"],
                    data.get("content"),
                    _json_dumps(data.get("structured_data", {})),
                    _json_dumps(data.get("source_refs", [])),
                    data.get("created_by_agent"),
                ),
            )
            conn.commit()
            return cursor.lastrowid  # type: ignore[return-value]

    def list_artifacts(self, filters: dict) -> dict:
        params: list[Any] = []
        where = ["1=1"]
        for key in ("run_id", "artifact_type", "status", "created_by_agent"):
            if filters.get(key) is not None:
                where.append(f"{key} = ?")
                params.append(filters[key])
        page = max(1, int(filters.get("page", 1)))
        limit = min(100, max(1, int(filters.get("limit", 20))))
        offset = (page - 1) * limit
        where_sql = " AND ".join(where)
        with get_db() as conn:
            total = conn.execute(f"SELECT COUNT(*) AS total FROM agent_artifacts WHERE {where_sql}", params).fetchone()[
                "total"
            ]
            rows = conn.execute(
                f"""
                SELECT * FROM agent_artifacts
                WHERE {where_sql}
                ORDER BY created_at DESC, id DESC
                LIMIT ? OFFSET ?
                """,
                [*params, limit, offset],
            ).fetchall()
        return {"data": [self._format_artifact(row) for row in rows], "total": total, "page": page, "limit": limit}

    def find_artifact(self, artifact_id: int) -> Optional[dict]:
        with get_db() as conn:
            row = conn.execute("SELECT * FROM agent_artifacts WHERE id = ?", (artifact_id,)).fetchone()
        return self._format_artifact(row) if row else None

    def update_artifact(self, artifact_id: int, data: dict) -> Optional[dict]:
        fields = []
        params: list[Any] = []
        for key in ("title", "content", "status"):
            if key in data:
                fields.append(f"{key} = ?")
                params.append(data[key])
        if "structured_data" in data:
            fields.append("structured_data = ?")
            params.append(_json_dumps(data["structured_data"]))
        if "source_refs" in data:
            fields.append("source_refs = ?")
            params.append(_json_dumps(data["source_refs"]))
        if fields:
            fields.append("version = version + 1")
            fields.append("updated_at = CURRENT_TIMESTAMP")
        else:
            return self.find_artifact(artifact_id)
        params.append(artifact_id)
        with get_db() as conn:
            cursor = conn.execute(f"UPDATE agent_artifacts SET {', '.join(fields)} WHERE id = ?", params)
            conn.commit()
        return self.find_artifact(artifact_id) if cursor.rowcount else None
