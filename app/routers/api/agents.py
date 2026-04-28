from fastapi import APIRouter, HTTPException, Query

from app.schemas.agent_workflow import (
    AgentDefinitionCreate,
    AgentDefinitionResponse,
    AgentDefinitionUpdate,
    AgentTestRequest,
    AgentTestResponse,
)
from app.services.agent_service import AgentService

router = APIRouter(prefix="/api/agents", tags=["agents"])
agent_service = AgentService()


@router.get("/", response_model=list[AgentDefinitionResponse])
def list_agents(enabled: bool | None = Query(None)):
    return agent_service.list_agents(enabled=enabled)


@router.get("/{agent_id}", response_model=AgentDefinitionResponse)
def get_agent(agent_id: int):
    agent = agent_service.get_agent(agent_id)
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.post("/", response_model=AgentDefinitionResponse, status_code=201)
def create_agent(agent: AgentDefinitionCreate):
    try:
        return agent_service.create_agent(agent.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/{agent_id}", response_model=AgentDefinitionResponse)
def update_agent(agent_id: int, agent: AgentDefinitionUpdate):
    data = {key: value for key, value in agent.model_dump().items() if value is not None}
    updated = agent_service.update_agent(agent_id, data)
    if updated is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return updated


@router.post("/{agent_id}/test", response_model=AgentTestResponse)
def test_agent(agent_id: int, request: AgentTestRequest):
    result = agent_service.test_agent(agent_id, request.input_text, request.context)
    if result is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return result
