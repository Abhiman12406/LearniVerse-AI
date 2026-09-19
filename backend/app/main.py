import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Automatically load environment variables from backend/.env or .env if present
_possible_env_files = [
    Path(__file__).resolve().parent.parent.parent / "backend" / ".env",
    Path(__file__).resolve().parent.parent / ".env",
    Path.cwd() / "backend" / ".env",
    Path.cwd() / ".env",
]
for _env_file in _possible_env_files:
    if _env_file.is_file():
        try:
            with open(_env_file, "r", encoding="utf-8") as _f:
                for _line in _f:
                    _line = _line.strip()
                    if _line and not _line.startswith("#") and "=" in _line:
                        _k, _v = _line.split("=", 1)
                        _k, _v = _k.strip(), _v.strip().strip("'").strip('"')
                        if _k and _k not in os.environ:
                            os.environ[_k] = _v
        except Exception:
            pass

from backend.app.routers.learner import router as learner_router
from backend.app.routers.world import router as world_router
from backend.app.routers.mentor import router as mentor_router
from backend.app.routers.missions import router as missions_router
from backend.app.routers.interactions import router as interactions_router
from backend.app.routers.agents import router as agents_router
from backend.app.routers.feynman import router as feynman_router
from backend.app.routers.curriculum import router as curriculum_router
from backend.app.routers.assessment import router as assessment_router
from backend.app.routers.cache import router as cache_router
from backend.app.routers.vector_db import router as vector_router

app = FastAPI(
    title="Adaptive Virtual Classroom API",
    description="Agentic AI-powered 3D Virtual Classroom Backend conforming to CONTEXT.md and FEYNMAN.md",
    version="1.0.0",
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(learner_router)
app.include_router(world_router)
app.include_router(mentor_router)
app.include_router(missions_router)
app.include_router(interactions_router)
app.include_router(agents_router)
app.include_router(feynman_router)
app.include_router(curriculum_router)
app.include_router(assessment_router)
app.include_router(cache_router)
app.include_router(vector_router)


@app.get("/")
def root_check():
    return {
        "status": "online",
        "system": "Adaptive Virtual Classroom Core Architecture",
        "version": "1.0.0",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Adaptive Virtual Classroom Core Architecture",
        "system": "Adaptive Virtual Classroom Core Architecture",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
