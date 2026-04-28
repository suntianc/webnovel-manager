from fastapi import APIRouter, BackgroundTasks, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.schemas.agent_workflow import (
    WorkflowEventResponse,
    WorkflowRunResponse,
    WorkflowStartRequest,
    WorkflowTaskResponse,
)
from app.services.workflow_service import WorkflowService

router = APIRouter(prefix="/api/workflows", tags=["workflows"])
workflow_service = WorkflowService()


@router.post("/start", response_model=WorkflowRunResponse, status_code=201)
def start_workflow(request: WorkflowStartRequest, background_tasks: BackgroundTasks):
    run = workflow_service.start_workflow(request.model_dump())
    background_tasks.add_task(workflow_service.run_workflow, run["id"])
    return run


@router.get("/", response_model=dict)
def list_workflows(
    status: str | None = None,
    workflow_type: str | None = None,
    biz_type: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    return workflow_service.list_workflows(
        {
            "status": status,
            "workflow_type": workflow_type,
            "biz_type": biz_type,
            "page": page,
            "limit": limit,
        }
    )


@router.get("/{run_id}", response_model=WorkflowRunResponse)
def get_workflow(run_id: int):
    run = workflow_service.get_workflow(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return run


@router.post("/{run_id}/resume", response_model=WorkflowRunResponse)
def resume_workflow(run_id: int):
    run = workflow_service.resume_workflow(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return run


@router.post("/{run_id}/cancel", response_model=WorkflowRunResponse)
def cancel_workflow(run_id: int):
    run = workflow_service.cancel_workflow(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return run


@router.post("/{run_id}/retry", response_model=WorkflowRunResponse)
def retry_workflow(run_id: int, background_tasks: BackgroundTasks):
    run = workflow_service.retry_workflow(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    background_tasks.add_task(workflow_service.run_workflow, run_id)
    return run


@router.get("/{run_id}/tasks", response_model=list[WorkflowTaskResponse])
def list_tasks(run_id: int):
    if workflow_service.get_workflow(run_id) is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow_service.list_tasks(run_id)


@router.get("/{run_id}/events", response_model=list[WorkflowEventResponse])
def list_events(run_id: int, after_id: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500)):
    if workflow_service.get_workflow(run_id) is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow_service.list_events(run_id, after_id=after_id, limit=limit)


@router.get("/{run_id}/events/stream")
def stream_events(run_id: int, after_id: int = Query(0, ge=0)):
    if workflow_service.get_workflow(run_id) is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return StreamingResponse(
        workflow_service.stream_events(run_id, after_id=after_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
