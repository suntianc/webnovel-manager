import asyncio
import json
import time
from datetime import datetime
from typing import AsyncGenerator

from app.repositories.workflow_repository import WorkflowRepository
from app.services.material_extraction_service import MaterialExtractionService
from app.services.novel_analysis_service import NovelAnalysisService
from app.services.workflow_templates import WorkflowNode, get_workflow_template


TERMINAL_RUN_STATUSES = {"completed", "failed", "canceled"}


def _now() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")


class WorkflowService:
    def __init__(self):
        self.repo = WorkflowRepository()
        self.material_extraction_service = MaterialExtractionService()
        self.novel_analysis_service = NovelAnalysisService()

    def start_workflow(self, data: dict) -> dict:
        run_id = self.repo.create_run(data)
        template = get_workflow_template(data["workflow_type"])
        for node in template:
            self.repo.create_task(
                run_id,
                {
                    "node_name": node.node_name,
                    "agent_name": node.agent_name,
                    "task_type": node.task_type,
                },
            )
        self.repo.create_event(
            run_id,
            {
                "event_type": "workflow_created",
                "message": f"工作流已创建：{data['title']}",
                "payload": {"workflow_type": data["workflow_type"], "biz_type": data["biz_type"]},
            },
        )
        run = self.repo.find_run(run_id)
        if run is None:
            raise RuntimeError("Failed to create workflow run")
        return run

    def run_workflow(self, run_id: int) -> None:
        run = self.repo.find_run(run_id)
        if run is None or run["status"] in TERMINAL_RUN_STATUSES:
            return

        self.repo.update_run(run_id, {"status": "running", "progress": 1, "started_at": _now()})
        self.repo.create_event(run_id, {"event_type": "workflow_started", "message": "工作流开始运行"})

        tasks = self.repo.list_tasks(run_id)
        total = max(1, len(tasks))
        for index, task in enumerate(tasks, start=1):
            if task["status"] in {"completed", "skipped"}:
                continue

            latest = self.repo.find_run(run_id)
            if latest and latest["status"] == "canceled":
                self.repo.create_event(run_id, {"event_type": "workflow_canceled", "message": "工作流已取消"})
                return

            if task["task_type"] == "human_review":
                progress = min(99, int((index - 1) / total * 100))
                self.repo.update_task(task["id"], {"status": "waiting_review", "progress": 0, "started_at": _now()})
                self.repo.update_run(
                    run_id,
                    {"status": "waiting_review", "progress": progress, "current_node": task["node_name"]},
                )
                self.repo.create_event(
                    run_id,
                    {
                        "task_id": task["id"],
                        "event_type": "human_review_required",
                        "message": "工作流已暂停，等待人工确认",
                        "payload": {"node_name": task["node_name"]},
                    },
                )
                return

            self._execute_task(run_id, task, index, total)

        self._complete_run_if_ready(run_id)

    def resume_workflow(self, run_id: int) -> dict | None:
        run = self.repo.find_run(run_id)
        if run is None:
            return None
        waiting_tasks = [task for task in self.repo.list_tasks(run_id) if task["status"] == "waiting_review"]
        for task in waiting_tasks:
            self.repo.update_task(task["id"], {"status": "completed", "progress": 100, "completed_at": _now()})
            self.repo.create_event(
                run_id,
                {
                    "task_id": task["id"],
                    "event_type": "human_review_submitted",
                    "message": "人工确认已提交",
                },
            )
        self._complete_run_if_ready(run_id)
        return self.repo.find_run(run_id)

    def cancel_workflow(self, run_id: int) -> dict | None:
        run = self.repo.find_run(run_id)
        if run is None:
            return None
        if run["status"] in TERMINAL_RUN_STATUSES:
            return run
        updated = self.repo.update_run(run_id, {"status": "canceled", "completed_at": _now()})
        self.repo.create_event(run_id, {"event_type": "workflow_canceled", "message": "工作流已取消"})
        return updated

    def retry_workflow(self, run_id: int) -> dict | None:
        run = self.repo.find_run(run_id)
        if run is None:
            return None
        failed_tasks = [task for task in self.repo.list_tasks(run_id) if task["status"] == "failed"]
        for task in failed_tasks:
            self.repo.update_task(
                task["id"],
                {
                    "status": "pending",
                    "progress": 0,
                    "retry_count": task["retry_count"] + 1,
                    "error_message": None,
                },
            )
        self.repo.update_run(run_id, {"status": "pending", "error_message": None})
        self.repo.create_event(run_id, {"event_type": "workflow_retry_scheduled", "message": "失败任务已安排重试"})
        return self.repo.find_run(run_id)

    def get_workflow(self, run_id: int) -> dict | None:
        return self.repo.find_run(run_id)

    def list_workflows(self, filters: dict) -> dict:
        return self.repo.list_runs(filters)

    def list_tasks(self, run_id: int) -> list[dict]:
        return self.repo.list_tasks(run_id)

    def list_events(self, run_id: int, after_id: int = 0, limit: int = 100) -> list[dict]:
        return self.repo.list_events(run_id, after_id=after_id, limit=limit)

    async def stream_events(self, run_id: int, after_id: int = 0) -> AsyncGenerator[str, None]:
        last_id = after_id
        while True:
            events = self.repo.list_events(run_id, after_id=last_id, limit=50)
            for event in events:
                last_id = event["id"]
                data = json.dumps(event, ensure_ascii=False)
                yield f"id: {event['id']}\nevent: {event['event_type']}\ndata: {data}\n\n"

            run = self.repo.find_run(run_id)
            if run is None or (run["status"] in TERMINAL_RUN_STATUSES and not events):
                yield "event: stream_closed\ndata: {}\n\n"
                return
            await asyncio.sleep(1)

    def list_artifacts(self, filters: dict) -> dict:
        return self.repo.list_artifacts(filters)

    def get_artifact(self, artifact_id: int) -> dict | None:
        return self.repo.find_artifact(artifact_id)

    def update_artifact(self, artifact_id: int, data: dict) -> dict | None:
        return self.repo.update_artifact(artifact_id, data)

    def mark_artifact(self, artifact_id: int, status: str) -> dict | None:
        artifact = self.repo.update_artifact(artifact_id, {"status": status})
        if artifact:
            self.repo.create_event(
                artifact["run_id"],
                {
                    "task_id": artifact.get("task_id"),
                    "event_type": "artifact_updated",
                    "message": f"产物状态已更新为 {status}",
                    "payload": {"artifact_id": artifact_id, "status": status},
                },
            )
        return artifact

    def _execute_task(self, run_id: int, task: dict, index: int, total: int) -> None:
        self.repo.update_task(task["id"], {"status": "running", "progress": 1, "started_at": _now()})
        run_progress = int((index - 1) / total * 100)
        self.repo.update_run(run_id, {"status": "running", "progress": run_progress, "current_node": task["node_name"]})
        self.repo.create_event(
            run_id,
            {
                "task_id": task["id"],
                "event_type": "task_started",
                "message": f"{task['node_name']} 开始执行",
                "payload": {"agent_name": task.get("agent_name"), "task_type": task["task_type"]},
            },
        )

        try:
            for progress in (25, 60, 90):
                time.sleep(0.2)
                self.repo.update_task(task["id"], {"progress": progress})
                self.repo.update_run(run_id, {"progress": min(99, int(((index - 1) + progress / 100) / total * 100))})
                self.repo.create_event(
                    run_id,
                    {
                        "task_id": task["id"],
                        "event_type": "task_progress",
                        "message": f"{task['node_name']} 进度 {progress}%",
                        "payload": {"progress": progress},
                    },
                )

            artifact_id = self._create_task_artifact(run_id, task)
            self.repo.update_task(
                task["id"],
                {"status": "completed", "progress": 100, "output_ref": str(artifact_id), "completed_at": _now()},
            )
            self.repo.update_run(run_id, {"progress": min(99, int(index / total * 100))})
            self.repo.create_event(
                run_id,
                {
                    "task_id": task["id"],
                    "event_type": "task_completed",
                    "message": f"{task['node_name']} 已完成",
                    "payload": {"artifact_id": artifact_id},
                },
            )
        except Exception as exc:
            message = str(exc)[:500]
            self.repo.update_task(
                task["id"],
                {"status": "failed", "progress": 100, "error_message": message, "completed_at": _now()},
            )
            self.repo.update_run(
                run_id,
                {
                    "status": "failed",
                    "error_message": message,
                    "current_node": task["node_name"],
                    "completed_at": _now(),
                },
            )
            self.repo.create_event(
                run_id,
                {
                    "task_id": task["id"],
                    "event_type": "task_failed",
                    "level": "error",
                    "message": f"{task['node_name']} 执行失败：{message}",
                    "payload": {"error": message},
                },
            )
            raise

    def _create_task_artifact(self, run_id: int, task: dict) -> int | None:
        artifact_type = self._artifact_type_for_task(task["task_type"])
        if artifact_type is None:
            return None
        if task["task_type"] == "material_extraction":
            run = self.repo.find_run(run_id)
            if run is None:
                raise RuntimeError("Workflow run not found")
            return self.material_extraction_service.create_artifact_for_task(run, task)
        if task["task_type"] in {
            "parse_novel",
            "chapter_batch_notes",
            "arc_summary",
            "novel_profile",
            "character_analysis",
            "worldbuilding_analysis",
            "plot_analysis",
        }:
            run = self.repo.find_run(run_id)
            if run is None:
                raise RuntimeError("Workflow run not found")
            return self.novel_analysis_service.create_artifact_for_task(run, task)
        title = self._artifact_title(task)
        artifact_id = self.repo.create_artifact(
            {
                "run_id": run_id,
                "task_id": task["id"],
                "artifact_type": artifact_type,
                "title": title,
                "content": self._artifact_content(task),
                "structured_data": {
                    "node_name": task["node_name"],
                    "task_type": task["task_type"],
                    "status": "generated",
                },
                "source_refs": [],
                "created_by_agent": task.get("agent_name"),
            }
        )
        self.repo.create_event(
            run_id,
            {
                "task_id": task["id"],
                "event_type": "artifact_created",
                "message": f"已生成产物：{title}",
                "payload": {"artifact_id": artifact_id, "artifact_type": artifact_type},
            },
        )
        return artifact_id

    def _complete_run_if_ready(self, run_id: int) -> None:
        tasks = self.repo.list_tasks(run_id)
        if all(task["status"] in {"completed", "skipped"} for task in tasks):
            self.repo.update_run(
                run_id,
                {"status": "completed", "progress": 100, "current_node": None, "completed_at": _now()},
            )
            self.repo.create_event(run_id, {"event_type": "workflow_completed", "message": "工作流已完成"})

    def _artifact_type_for_task(self, task_type: str) -> str | None:
        mapping = {
            "parse_novel": "novel_parse_report",
            "chapter_batch_notes": "chapter_batch_note",
            "arc_summary": "arc_note",
            "novel_profile": "novel_profile",
            "character_analysis": "character_profile",
            "worldbuilding_analysis": "worldbuilding_profile",
            "plot_analysis": "plot_profile",
            "material_extraction": "material_candidate",
            "director_plan": "creation_plan",
            "worldbuilding_create": "worldbuilding_profile",
            "character_create": "character_profile",
            "plot_create": "outline",
            "chapter_writing": "chapter_draft",
            "review": "review_report",
            "consistency_check": "consistency_report",
            "revision": "chapter_draft",
        }
        return mapping.get(task_type)

    def _artifact_title(self, task: dict) -> str:
        return f"{task['node_name']} 产物"

    def _artifact_content(self, task: dict) -> str:
        return (
            f"这是 {task['node_name']} 的服务端占位产物。"
            "当前版本已完成任务编排、状态记录、事件流和产物落库；"
            "后续接入 LangGraph/LLM 节点后会替换为真实输出。"
        )
