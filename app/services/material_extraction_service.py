from app.repositories.novel_repository import NovelRepository
from app.repositories.workflow_repository import WorkflowRepository
from app.schemas.material_extraction import MaterialExtractionResult
from app.services.agent_runner import AgentRunner
from app.services.material_service import MaterialService


MAX_PARTS_PER_EXTRACTION = 1
MAX_CHARS_PER_PART = 1800
MAX_CONTEXT_CHARS = 2500


class MaterialExtractionService:
    def __init__(self):
        self.agent_runner = AgentRunner()
        self.novel_repo = NovelRepository()
        self.workflow_repo = WorkflowRepository()
        self.material_service = MaterialService()

    def create_artifact_for_task(self, run: dict, task: dict) -> int:
        if run["biz_type"] != "novel" or not run.get("biz_id"):
            raise ValueError("Material extraction requires a novel workflow run")

        novel = self.novel_repo.find_source(run["biz_id"])
        if novel is None:
            raise ValueError("Novel not found for material extraction")

        parts = self.novel_repo.list_parts(run["biz_id"], include_content=True)
        if not parts:
            raise ValueError("No novel parts available for material extraction")

        selected_parts = parts[:MAX_PARTS_PER_EXTRACTION]
        prompt = self._build_prompt(novel, selected_parts, len(parts), self._previous_context(run["id"]))
        result = self.agent_runner.run_structured("MaterialAgent", prompt, MaterialExtractionResult)
        result = self._filter_unsupported_materials(result, selected_parts)
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
                "artifact_type": "material_candidate",
                "title": f"{novel['title']} 素材候选",
                "content": self._render_content(result),
                "structured_data": structured,
                "source_refs": self._source_refs(selected_parts),
                "created_by_agent": task.get("agent_name"),
            }
        )
        imported_materials = self._import_materials(run, artifact_id, result)
        structured["imported_material_ids"] = [material["id"] for material in imported_materials]
        structured["imported_material_count"] = len(imported_materials)
        self.workflow_repo.update_artifact(
            artifact_id,
            {
                "status": "imported",
                "structured_data": structured,
            },
        )
        self.workflow_repo.create_event(
            run["id"],
            {
                "task_id": task["id"],
                "event_type": "materials_imported",
                "message": f"已导入素材：{len(imported_materials)} 条",
                "payload": {
                    "artifact_id": artifact_id,
                    "artifact_type": "material_candidate",
                    "material_count": len(result.materials),
                    "imported_material_count": len(imported_materials),
                    "imported_material_ids": [material["id"] for material in imported_materials],
                    "truncated": len(parts) > len(selected_parts),
                },
            },
        )
        return artifact_id

    def _build_prompt(self, novel: dict, parts: list[dict], total_parts: int, previous_context: str) -> str:
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
            "请从以下网文分组中提取可复用素材候选，输出必须符合指定结构。\n"
            "要求：\n"
            "1. 只抽取输入文本中能找到证据的内容，不要补写或推测。\n"
            "2. 每条素材必须有 title/category/summary/content/tags/value_score/source_refs。\n"
            "3. category 限定为：人物、设定、剧情、桥段、金句、物品、势力、地点、其他。\n"
            "4. source_refs.id 必须填写对应的分组 ID；source_refs.quote 必须是原文短摘录，且尽量控制在 80 字以内。\n"
            "5. 价值评分 value_score 为 1-10，越适合复用和归档分数越高。\n"
            "6. 最多输出 5 条素材候选，优先保留证据最明确、复用价值最高的素材。\n\n"
            f"小说: {novel['title']}\n"
            f"作者: {novel.get('author') or '未知'}\n"
            f"总分组数: {total_parts}\n"
            f"本次处理分组数: {len(parts)}\n\n"
            f"前序分析产物:\n{previous_context or '无'}\n\n"
            "原文分组:\n"
            + "\n\n---\n\n".join(part_blocks)
        )

    def _render_content(self, result: MaterialExtractionResult) -> str:
        if not result.materials:
            return result.notes or "未提取到素材候选。"
        lines = []
        for index, material in enumerate(result.materials, start=1):
            tags = "、".join(material.tags)
            lines.append(
                f"{index}. {material.title}\n"
                f"   分类：{material.category}{f' / {material.subcategory}' if material.subcategory else ''}\n"
                f"   摘要：{material.summary}\n"
                f"   标签：{tags or '无'}\n"
                f"   价值：{material.value_score}/10"
            )
        if result.notes:
            lines.append(f"\n备注：{result.notes}")
        return "\n\n".join(lines)

    def _filter_unsupported_materials(
        self,
        result: MaterialExtractionResult,
        parts: list[dict],
    ) -> MaterialExtractionResult:
        part_text = {part["id"]: part["content"] for part in parts}
        supported = []
        removed = 0
        for material in result.materials:
            valid_refs = []
            for ref in material.source_refs:
                source_text = part_text.get(ref.id or -1, "")
                if self._quote_supported(ref.quote, source_text):
                    valid_refs.append(ref)
            if valid_refs:
                material.source_refs = valid_refs
                supported.append(material)
            else:
                removed += 1

        notes = result.notes
        if removed:
            suffix = f"已过滤 {removed} 条缺少原文证据的素材候选。"
            notes = f"{notes} {suffix}" if notes else suffix
        return MaterialExtractionResult(materials=supported, notes=notes)

    def _quote_supported(self, quote: str, source_text: str) -> bool:
        if not quote or not source_text:
            return False
        if quote in source_text:
            return True
        compact_quote = "".join(quote.split())
        compact_source = "".join(source_text.split())
        return bool(compact_quote and compact_quote in compact_source)

    def _previous_context(self, run_id: int) -> str:
        artifacts = self.workflow_repo.list_artifacts({"run_id": run_id, "limit": 20})["data"]
        chunks = []
        for artifact in reversed(artifacts):
            if artifact["artifact_type"] == "material_candidate":
                continue
            content = artifact.get("content") or ""
            if content:
                chunks.append(f"[{artifact['artifact_type']}] {artifact['title']}\n{content[:1000]}")
        return "\n\n".join(chunks)[:MAX_CONTEXT_CHARS]

    def _import_materials(self, run: dict, artifact_id: int, result: MaterialExtractionResult) -> list[dict]:
        imported = []
        for material in result.materials:
            source_refs = [
                f"part:{ref.id}:chapter:{ref.chapter_start or ''}-{ref.chapter_end or ''}"
                for ref in material.source_refs
            ]
            imported.append(
                self.material_service.create_material(
                    {
                        "title": material.title,
                        "content": material.content,
                        "summary": material.summary,
                        "category": material.category,
                        "subcategory": material.subcategory,
                        "source_type": "AI提取",
                        "source_url": f"novel:{run['biz_id']};run:{run['id']};artifact:{artifact_id};{','.join(source_refs)}",
                        "status": "已整理",
                        "value_score": min(5, max(1, (material.value_score + 1) // 2)),
                        "tags": material.tags,
                    }
                )
            )
        return imported

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
