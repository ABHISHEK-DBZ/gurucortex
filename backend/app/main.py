import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

logger = logging.getLogger("gurucortex.api")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Local-first AI Learning Companion with RAG + Multimodal Features"
)

# CORS Configuration (allow frontend to communicate)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Next.js ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/api/v1/health")
def api_health_check():
    return {"status": "ok", "message": "API is running"}

def _register_router(module_path: str, optional: bool = False) -> bool:
    """Explicit router registration with isolated error handling and descriptive logging."""
    try:
        mod = __import__(module_path, fromlist=["router"])
        router = getattr(mod, "router", None)
        if router:
            app.include_router(router)
            logger.info(f"Mounted router: {module_path}")
            return True
        else:
            logger.error(f"Module {module_path} has no 'router' attribute")
            return False
    except Exception as exc:
        if optional:
            logger.warning(f"Optional router '{module_path}' not loaded: {exc}")
        else:
            logger.error(f"CRITICAL: Failed to mount router '{module_path}': {exc}", exc_info=True)
        return False

# 1. Core API Routers
CORE_ROUTERS = [
    "app.routers.documents",
    "app.routers.chat",
    "app.routers.conversations",
    "app.routers.assessments",
    "app.routers.analytics",
]
for mod in CORE_ROUTERS:
    _register_router(mod, optional=False)

# 2. GuruCortex 2.0 Master Intelligence Routers
GURUCORTEX_2_ROUTERS = [
    "app.routers.visual_intelligence",
    "app.routers.revision",
    "app.routers.coach",
    "app.routers.career",
    "app.routers.focus",
    "app.routers.parent",
    "app.routers.institution",
]
for mod in GURUCORTEX_2_ROUTERS:
    _register_router(mod, optional=False)

# 3. Optional & Hardware/Experimental Routers
OPTIONAL_ROUTERS = [
    "app.routers.multimodal",      # Vision / Attention tracking
    "app.routers.code_execution",  # Sandboxed code execution
    "app.routers.study_planner",   # Automated calendar/study planner
    "app.routers.gamification",    # Badges & Leaderboards
    "app.routers.podcast",         # Audio narration & podcast generator
    "app.routers.protege",         # Protege Effect tutor mode
]
for mod in OPTIONAL_ROUTERS:
    _register_router(mod, optional=True)

# Database Startup Lifecycle
@app.on_event("startup")
async def startup_event():
    """Initialize database and verify system readiness on startup."""
    try:
        from app.services.database import init_database
        await init_database()
        logger.info("Database initialized successfully.")
    except Exception as exc:
        logger.error(f"Failed to initialize database: {exc}", exc_info=True)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    """System health check"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
