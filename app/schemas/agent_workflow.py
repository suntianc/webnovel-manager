from typing import Any, Optional

from pydantic import BaseModel, Field


class AgentDefinitionBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    role: str = Field(..., min_length=1, max_length=80)
    description: Optional[str] = None
    system_prompt: str = Field(..., min_length=1)
    model: str = "gpt-4o-mini"
    temperature: float = Field(default=0.3, ge=0, le=2)
    tools: list[str] = Field(default_factory=list)
    output_schema: Optional[dict[str, Any]] = None
    enabled: bool = True


class AgentDefinitionCreate(AgentDefinitionBase):
    pass


class AgentDefinitionUpdate(BaseModel):
    role: Optional[str] = Field(None, min_length=1, max_length=80)
    description: Optional[str] = None
    system_prompt: Optional[str] = Field(None, min_length=1)
    model: Optional[str] = None
    temperature: Optional[float] = Field(None, ge=0, le=2)
    tools: Optional[list[str]] = None
    output_schema: Optional[dict[str, Any]] = None
    enabled: Optional[bool] = None


class AgentDefinitionResponse(AgentDefinitionBase):
    id: int
    created_at: str
    updated_at: str


class AgentTestRequest(BaseModel):
    input_text: str = Field(..., min_length=1)
    context: dict[str, Any] = Field(default_factory=dict)


class AgentTestResponse(BaseModel):
    agent_id: int
    agent_name: str
    preview: str
    context_keys: list[str]


class WorkflowStartRequest(BaseModel):
    workflow_type: str = Field(..., min_length=1)
    biz_type: str = Field(..., min_length=1)
    biz_id: Optional[int] = None
    title: str = Field(..., min_length=1, max_length=200)
    input_payload: dict[str, Any] = Field(default_factory=dict)


class WorkflowRunResponse(BaseModel):
    id: int
    workflow_type: str
    biz_type: str
    biz_id: Optional[int] = None
    title: str
    status: str
    progress: int
    current_node: Optional[str] = None
    input_payload: dict[str, Any] = Field(default_factory=dict)
    error_message: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    created_at: str
    updated_at: str


class WorkflowTaskResponse(BaseModel):
    id: int
    run_id: int
    node_name: str
    agent_name: Optional[str] = None
    task_type: str
    status: str
    progress: int
    input_ref: Optional[str] = None
    output_ref: Optional[str] = None
    retry_count: int
    error_message: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    created_at: str
    updated_at: str


class WorkflowEventResponse(BaseModel):
    id: int
    run_id: int
    task_id: Optional[int] = None
    event_type: str
    level: str
    message: str
    payload: dict[str, Any] = Field(default_factory=dict)
    created_at: str


class ArtifactUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = None
    structured_data: Optional[dict[str, Any]] = None
    source_refs: Optional[list[dict[str, Any]]] = None
    status: Optional[str] = None


class ArtifactResponse(BaseModel):
    id: int
    run_id: int
    task_id: Optional[int] = None
    artifact_type: str
    title: str
    content: Optional[str] = None
    structured_data: dict[str, Any] = Field(default_factory=dict)
    version: int
    status: str
    source_refs: list[dict[str, Any]] = Field(default_factory=list)
    created_by_agent: Optional[str] = None
    created_at: str
    updated_at: str


class PaginatedArtifactsResponse(BaseModel):
    data: list[ArtifactResponse]
    total: int
    page: int
    limit: int
