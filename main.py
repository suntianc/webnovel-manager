from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.api import materials, tags, search, categories, stats

app = FastAPI(
    title="网文素材管理系统 API",
    description="提供素材管理、全文搜索、标签管理等功能",
    version="1.0.0"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(materials.router)
app.include_router(tags.router)
app.include_router(search.router)
app.include_router(categories.router)
app.include_router(stats.router)

@app.get("/")
def root():
    return {"message": "网文素材管理系统 API", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}

# 启动命令: uvicorn main:app --host 0.0.0.0 --port 3000 --reload