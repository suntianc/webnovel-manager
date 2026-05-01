from pydantic import BaseModel

from app.repositories.novel_repository import NovelRepository
from app.repositories.workflow_repository import WorkflowRepository
from app.schemas.novel_analysis import (
    ArcSummaryResult,
    BatchReadingResult,
    CharacterAnalysisResult,
    NovelProfileResult,
    PlotAnalysisResult,
    WorldbuildingAnalysisResult,
)
from app.services.agent_runner import AgentRunner


MAX_PARTS_PER_ANALYSIS = 1
MAX_CHARS_PER_PART = 2200
MAX_CONTEXT_CHARS = 6000


TASK_OUTPUTS: dict[str, type[BaseModel]] = {
    "chapter_batch_notes": BatchReadingResult,
    "arc_summary": ArcSummaryResult,
    "novel_profile": NovelProfileResult,
    "character_analysis": CharacterAnalysisResult,
    "worldbuilding_analysis": WorldbuildingAnalysisResult,
    "plot_analysis": PlotAnalysisResult,
}


TASK_INSTRUCTIONS = {
    "chapter_batch_notes": "阅读原文分组，抽取事实、事件、人物、设定和疑问，所有 evidence.quote 必须来自原文。",
    "arc_summary": "基于前序阅读笔记归纳篇章/剧情阶段，保留关键转折和未解决线索。",
    "novel_profile": "形成小说整体档案，包括题材、风格、核心冲突、主题和阅读摘要。",
    "character_analysis": "分析主要人物、目标、关系和当前状态，不要补写未出现的信息。",
    "worldbuilding_analysis": "分析世界观、地点、势力、物品、规则和限制，并标注缺失上下文。",
    "plot_analysis": "分析主线、冲突、伏笔、回收、节奏和可复用桥段。",
}


class NovelAnalysisService:
    def __init__(self):
        self.agent_runner = AgentRunner()
        self.novel_repo = NovelRepository()
        self.workflow_repo = WorkflowRepository()

    def create_artifact_for_task(self, run: dict, task: dict) -> int:
        if run["biz_type"] != "novel" or not run.get("biz_id"):
            raise ValueError("Novel analysis requires a novel workflow run")

        novel = self.novel_repo.find_source(run["biz_id"])
        if novel is None:
            raise ValueError("Novel not found for analysis")

        parts = self.novel_repo.list_parts(run["biz_id"], include_content=True)
        if task["task_type"] == "parse_novel":
            return self._create_parse_report(run, task, novel, parts)
        if not parts:
            raise ValueError("No novel parts available for analysis")

        output_type = TASK_OUTPUTS.get(task["task_type"])
        if output_type is None:
            raise ValueError(f"Unsupported novel analysis task: {task['task_type']}")
        if not task.get("agent_name"):
            raise ValueError(f"Task has no agent configured: {task['node_name']}")

        selected_parts = parts[:MAX_PARTS_PER_ANALYSIS]
        prompt = self._build_prompt(novel, task, selected_parts, len(parts), self._previous_context(run["id"]))
        result = self.agent_runner.run_structured(task["agent_name"], prompt, output_type)
        structured = result.model_dump()
        structured.update(
            {
                "node_name": task["node_name"],
                "task_type": task["task_type"],
                "status": "generated",
                "coverage": {
                    "selected_parts": len(selected_parts),
                    "total_parts": len(parts),
                    "truncated": len(parts) > len(selected_parts),
                    "max_chars_per_part": MAX_CHARS_PER_PART,
                },
            }
        )

        artifact_id = self.workflow_repo.create_artifact(
            {
                "run_id": run["id"],
                "task_id": task["id"],
                "artifact_type": self._artifact_type(task["task_type"]),
                "title": self._artifact_title(novel, task),
                "content": self._render_result(result),
                "structured_data": structured,
                "source_refs": self._source_refs(selected_parts),
                "created_by_agent": task.get("agent_name"),
            }
        )
        self.workflow_repo.create_event(
            run["id"],
            {
                "task_id": task["id"],
                "event_type": "artifact_created",
                "message": f"已生成产物：{self._artifact_title(novel, task)}",
                "payload": {
                    "artifact_id": artifact_id,
                    "artifact_type": self._artifact_type(task["task_type"]),
                    "agent_name": task.get("agent_name"),
                },
            },
        )
        return artifact_id

    def _create_parse_report(self, run: dict, task: dict, novel: dict, parts: list[dict]) -> int:
        total_words = sum(part.get("word_count", 0) for part in parts)
        content = (
            f"小说：{novel['title']}\n"
            f"作者：{novel.get('author') or '未知'}\n"
            f"章节数：{novel.get('chapter_count', 0)}\n"
            f"分组数：{len(parts)}\n"
            f"分组总字数：{total_words:,}\n"
            "解析状态：已完成"
        )
        artifact_id = self.workflow_repo.create_artifact(
            {
                "run_id": run["id"],
                "task_id": task["id"],
                "artifact_type": "novel_parse_report",
                "title": f"{novel['title']} 解析报告",
                "content": content,
                "structured_data": {
                    "node_name": task["node_name"],
                    "task_type": task["task_type"],
                    "status": "generated",
                    "chapter_count": novel.get("chapter_count", 0),
                    "part_count": len(parts),
                    "word_count": total_words,
                },
                "source_refs": self._source_refs(parts),
                "created_by_agent": task.get("agent_name"),
            }
        )
        self.workflow_repo.create_event(
            run["id"],
            {
                "task_id": task["id"],
                "event_type": "artifact_created",
                "message": f"已生成解析报告：{novel['title']}",
                "payload": {"artifact_id": artifact_id, "artifact_type": "novel_parse_report"},
            },
        )
        return artifact_id

    def _build_prompt(
        self,
        novel: dict,
        task: dict,
        parts: list[dict],
        total_parts: int,
        previous_context: str,
    ) -> str:
        part_blocks = []
        for part in parts:
            content = part["content"][:MAX_CHARS_PER_PART]
            if len(part["content"]) > MAX_CHARS_PER_PART:
                content += "\n[内容已截断]"
            part_blocks.append(
                "\n".join(
                    [
                        f"分组 ID: {part['id']}",
                        f"分组: {part['title']}",
                        f"章节范围: 第 {part['chapter_start']}-{part['chapter_end']} 章",
                        f"字数: {part['word_count']}",
                        "原文:",
                        content,
                    ]
                )
            )

        return (
            f"任务：{TASK_INSTRUCTIONS[task['task_type']]}\n"
            "输出要求：必须符合目标 JSON schema；不要输出 schema 之外的闲聊内容。"
            "所有可追溯结论都应附 evidence；evidence.quote 必须来自输入原文或前序产物。\n\n"
            f"小说: {novel['title']}\n"
            f"作者: {novel.get('author') or '未知'}\n"
            f"总分组数: {total_parts}\n"
            f"本次输入分组数: {len(parts)}\n\n"
            f"前序产物上下文:\n{previous_context or '无'}\n\n"
            "原文分组:\n"
            + "\n\n---\n\n".join(part_blocks)
        )

    def _previous_context(self, run_id: int) -> str:
        artifacts = self.workflow_repo.list_artifacts({"run_id": run_id, "limit": 20})["data"]
        chunks = []
        for artifact in reversed(artifacts):
            content = artifact.get("content") or ""
            if not content:
                continue
            chunks.append(f"[{artifact['artifact_type']}] {artifact['title']}\n{content[:1200]}")
        context = "\n\n".join(chunks)
        return context[:MAX_CONTEXT_CHARS]

    def _render_result(self, result: BaseModel) -> str:
        data = result.model_dump()
        lines: list[str] = []
        for key, value in data.items():
            if value in (None, "", [], {}):
                continue
            title = self._label(key)
            if isinstance(value, list):
                lines.append(f"{title}：")
                for index, item in enumerate(value, start=1):
                    lines.append(f"{index}. {self._compact(item)}")
            else:
                lines.append(f"{title}：{self._compact(value)}")
        return "\n".join(lines) or "未生成有效内容。"

    def _compact(self, value) -> str:
        if isinstance(value, dict):
            parts = []
            for key in ("title", "name", "kind", "role", "summary", "current_state"):
                if value.get(key):
                    parts.append(str(value[key]))
            return " · ".join(parts) if parts else str(value)
        if isinstance(value, list):
            return "、".join(str(item) for item in value)
        return str(value)

    def _label(self, key: str) -> str:
        labels = {
            "coverage": "覆盖范围",
            "key_facts": "关键事实",
            "timeline_events": "时间线事件",
            "characters": "人物",
            "settings": "设定",
            "open_questions": "待确认问题",
            "notes": "备注",
            "arcs": "剧情阶段",
            "timeline_summary": "时间线摘要",
            "unresolved_threads": "未解决线索",
            "premise": "故事前提",
            "genre_tags": "题材标签",
            "style_notes": "风格笔记",
            "core_conflicts": "核心冲突",
            "main_themes": "主题",
            "reading_summary": "阅读摘要",
            "relationship_notes": "关系笔记",
            "risk_notes": "风险提示",
            "items": "设定条目",
            "consistency_notes": "一致性笔记",
            "missing_context": "缺失上下文",
            "main_plotline": "主线",
            "conflicts": "冲突",
            "foreshadowing": "伏笔",
            "payoffs": "回收",
            "pacing_notes": "节奏笔记",
            "reusable_beats": "可复用桥段",
        }
        return labels.get(key, key)

    def _artifact_type(self, task_type: str) -> str:
        mapping = {
            "chapter_batch_notes": "chapter_batch_note",
            "arc_summary": "arc_note",
            "novel_profile": "novel_profile",
            "character_analysis": "character_profile",
            "worldbuilding_analysis": "worldbuilding_profile",
            "plot_analysis": "plot_profile",
        }
        return mapping[task_type]

    def _artifact_title(self, novel: dict, task: dict) -> str:
        titles = {
            "chapter_batch_notes": "阅读笔记",
            "arc_summary": "篇章摘要",
            "novel_profile": "作品档案",
            "character_analysis": "人物分析",
            "worldbuilding_analysis": "世界观分析",
            "plot_analysis": "剧情分析",
        }
        return f"{novel['title']} {titles[task['task_type']]}"

    def _source_refs(self, parts: list[dict]) -> list[dict]:
        return [
            {
                "type": "novel_part",
                "id": part["id"],
                "chapter_start": part["chapter_start"],
                "chapter_end": part["chapter_end"],
            }
            for part in parts
        ]
