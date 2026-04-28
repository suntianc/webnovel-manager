from fastapi import APIRouter, HTTPException, Query

from app.schemas.agent_workflow import ArtifactResponse, ArtifactUpdate, PaginatedArtifactsResponse
from app.services.workflow_service import WorkflowService

router = APIRouter(prefix="/api/artifacts", tags=["artifacts"])
workflow_service = WorkflowService()


@router.get("/", response_model=PaginatedArtifactsResponse)
def list_artifacts(
    run_id: int | None = None,
    artifact_type: str | None = None,
    status: str | None = None,
    created_by_agent: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    return workflow_service.list_artifacts(
        {
            "run_id": run_id,
            "artifact_type": artifact_type,
            "status": status,
            "created_by_agent": created_by_agent,
            "page": page,
            "limit": limit,
        }
    )


@router.get("/{artifact_id}", response_model=ArtifactResponse)
def get_artifact(artifact_id: int):
    artifact = workflow_service.get_artifact(artifact_id)
    if artifact is None:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return artifact


@router.put("/{artifact_id}", response_model=ArtifactResponse)
def update_artifact(artifact_id: int, artifact: ArtifactUpdate):
    data = {key: value for key, value in artifact.model_dump().items() if value is not None}
    updated = workflow_service.update_artifact(artifact_id, data)
    if updated is None:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return updated


@router.post("/{artifact_id}/confirm", response_model=ArtifactResponse)
def confirm_artifact(artifact_id: int):
    artifact = workflow_service.mark_artifact(artifact_id, "confirmed")
    if artifact is None:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return artifact


@router.post("/{artifact_id}/reject", response_model=ArtifactResponse)
def reject_artifact(artifact_id: int):
    artifact = workflow_service.mark_artifact(artifact_id, "rejected")
    if artifact is None:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return artifact


@router.post("/{artifact_id}/import", response_model=ArtifactResponse)
def import_artifact(artifact_id: int):
    artifact = workflow_service.mark_artifact(artifact_id, "imported")
    if artifact is None:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return artifact
