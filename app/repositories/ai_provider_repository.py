import json
from app.core.database import get_db


class AIProviderRepository:
    ALLOWED_UPDATE_FIELDS = {"name", "base_url", "api_key", "models", "status"}

    def create_table(self) -> None:
        with get_db() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS ai_providers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    provider_type TEXT DEFAULT 'Chat API',
                    base_url TEXT NOT NULL,
                    api_key TEXT NOT NULL,
                    models TEXT DEFAULT '[]',
                    status TEXT DEFAULT 'untested',
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.commit()

    def create(self, data: dict) -> dict:
        with get_db() as conn:
            cur = conn.execute(
                """INSERT INTO ai_providers (name, base_url, api_key, models)
                   VALUES (?, ?, ?, ?)""",
                (data["name"], data["base_url"], data["api_key"],
                 json.dumps(data.get("models", []))),
            )
            conn.commit()
            return self.find_by_id(cur.lastrowid)

    def find_by_name(self, name: str, exclude_id: int | None = None) -> dict | None:
        query = "SELECT * FROM ai_providers WHERE lower(name) = lower(?)"
        params: list[object] = [name]
        if exclude_id is not None:
            query += " AND id != ?"
            params.append(exclude_id)
        with get_db() as conn:
            row = conn.execute(query, params).fetchone()
            return self._format(row) if row else None

    def find_all(self) -> list[dict]:
        with get_db() as conn:
            rows = conn.execute(
                "SELECT * FROM ai_providers ORDER BY created_at DESC"
            ).fetchall()
            return [self._format(row) for row in rows]

    def find_by_id(self, provider_id: int, include_secret: bool = False) -> dict | None:
        with get_db() as conn:
            row = conn.execute(
                "SELECT * FROM ai_providers WHERE id = ?", (provider_id,)
            ).fetchone()
            return self._format(row, include_secret=include_secret) if row else None

    def update(self, provider_id: int, data: dict) -> dict | None:
        fields = {k: v for k, v in data.items() if k in self.ALLOWED_UPDATE_FIELDS and v is not None}
        if not fields:
            return self.find_by_id(provider_id)
        if "models" in fields:
            fields["models"] = json.dumps(fields["models"])
        set_clause = ", ".join(f"{k} = ?" for k in fields)
        values = list(fields.values()) + [provider_id]
        with get_db() as conn:
            conn.execute(
                f"UPDATE ai_providers SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                values,
            )
            conn.commit()
            return self.find_by_id(provider_id)

    def delete(self, provider_id: int) -> bool:
        with get_db() as conn:
            cur = conn.execute("DELETE FROM ai_providers WHERE id = ?", (provider_id,))
            conn.commit()
            return cur.rowcount > 0

    def _mask_key(self, api_key: str) -> str:
        if len(api_key) <= 8:
            return "••••"
        return f"{api_key[:4]}••••{api_key[-4:]}"

    def _format(self, row, include_secret: bool = False) -> dict:
        data = {
            "id": row["id"],
            "name": row["name"],
            "provider_type": row["provider_type"],
            "base_url": row["base_url"],
            "has_api_key": bool(row["api_key"]),
            "api_key_masked": self._mask_key(row["api_key"]) if row["api_key"] else "",
            "models": json.loads(row["models"]) if row["models"] else [],
            "status": row["status"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }
        if include_secret:
            data["api_key"] = row["api_key"]
        return data
