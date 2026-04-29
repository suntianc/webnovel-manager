from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.agent_database import ensure_agent_tables
from app.services.ai_provider_service import AIProviderService
from app.routers.api import agents, ai_providers, artifacts, materials, novels, tags, search, categories, stats, workflows

app = FastAPI(
    title="网文素材管理系统 API",
    description="提供素材管理、全文搜索、标签管理等功能",
    version="1.0.0"
)


@app.on_event("startup")
def startup():
    ensure_agent_tables()
    AIProviderService().initialize()


# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=0,
)

# 注册路由
app.include_router(materials.router)
app.include_router(tags.router)
app.include_router(search.router)
app.include_router(categories.router)
app.include_router(stats.router)
app.include_router(agents.router)
app.include_router(workflows.router)
app.include_router(artifacts.router)
app.include_router(novels.router)
app.include_router(ai_providers.router)


@app.get("/")
def root():
    return {"message": "网文素材管理系统 API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}


# 启动命令: uvicorn main:app --host 0.0.0.0 --port 3000 --reload
