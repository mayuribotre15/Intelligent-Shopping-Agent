"""
Intelligent Shopping Agentic AI – FastAPI Application Entry Point

Powered by IBM watsonx.ai (Llama 3.3 70B Instruct) + IBM Cloud
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api import agent, auth, lists, preferences, products, search
from app.config import get_settings
from app.database import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()

# ---------------------------------------------------------------------------
# Rate limiter
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address)


# ---------------------------------------------------------------------------
# Application lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting Intelligent Shopping AI – watsonx.ai / Llama 3.3 70B")
    try:
        await init_db()
        logger.info("✅ Database initialised")
    except Exception as exc:
        logger.warning(
            "⚠️  Database not available at startup (%s). "
            "Product search and agent endpoints (no DB required) remain fully functional. "
            "Auth and shopping-list endpoints need a database connection.",
            exc,
        )
    yield
    logger.info("👋 Shutting down")


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Intelligent Shopping Agentic AI",
    description=(
        "A smart shopping assistant powered by IBM watsonx.ai (Llama 3.3 70B Instruct). "
        "Provides personalised product recommendations, cross-platform price comparison, "
        "multimodal search, review analysis, sustainability insights, and a Smart Shopping Pulse dashboard."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(auth.router, prefix="/api/v1")
app.include_router(preferences.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(agent.router, prefix="/api/v1")
app.include_router(lists.router, prefix="/api/v1")


# ---------------------------------------------------------------------------
# Health & root
# ---------------------------------------------------------------------------

@app.get("/", tags=["Root"])
async def root():
    return {
        "application": "Intelligent Shopping Agentic AI",
        "version": "1.0.0",
        "powered_by": "IBM watsonx.ai – Llama 3.3 70B Instruct",
        "docs": "/api/docs",
        "status": "running",
    }


@app.get("/api/v1/health", tags=["Health"])
async def health():
    return {"status": "healthy", "model": settings.WATSONX_MODEL_ID}


# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s: %s", request.url, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again later."},
    )
