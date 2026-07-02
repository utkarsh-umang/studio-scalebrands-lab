"""FastAPI application entry point."""

import uuid

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.controllers import api_v1_router
from app.controllers.health import router as health_router
from app.core.config import config
from app.core.errors.exceptions import register_exception_handlers


class RequestIdMiddleware:
    """Pure-ASGI request-ID middleware.

    Deliberately not BaseHTTPMiddleware: that runs the app in a separate anyio
    task, which breaks async DB sessions under the test client ("attached to a
    different loop"). Pure ASGI keeps everything on one loop.
    """

    def __init__(self, app) -> None:
        self.app = app

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] == "http":
            scope.setdefault("state", {})["request_id"] = str(uuid.uuid4())
        await self.app(scope, receive, send)


def add_request_id_middleware(app: FastAPI) -> None:
    """Add request-ID middleware."""
    app.add_middleware(RequestIdMiddleware)


app = FastAPI(
    title="FastAPI Backend",
    version="0.1.0",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Range", "Accept-Ranges", "Content-Length"],
)

add_request_id_middleware(app)
register_exception_handlers(app)

app.include_router(health_router, prefix="/health", tags=["health"])
app.include_router(api_v1_router, prefix=config.API_V1_STR)
