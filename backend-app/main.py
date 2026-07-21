"""FastAPI application entry point."""

import uuid
import warnings

# Optional[X] = Field(alias=...) fields on our CamelModel schemas (e.g.
# SubmitDeliverablesDriveRequest.deliverables, SetVideoDeadlineRequest.deadline_at)
# make pydantic-core re-apply the raw FieldInfo while building the Optional's
# union schema and warn that the alias "has no effect" — the alias is honored
# fine at (de)serialization time; confirmed harmless (QA report 2026-06-28).
# Must run before any `app.schemas.*` module is imported (schema classes build
# their core schema at class-definition time), so this sits above those imports.
from pydantic.warnings import UnsupportedFieldAttributeWarning

warnings.filterwarnings("ignore", category=UnsupportedFieldAttributeWarning)

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from app.controllers import api_v1_router  # noqa: E402
from app.controllers.health import router as health_router  # noqa: E402
from app.core.config import config  # noqa: E402
from app.core.errors.exceptions import register_exception_handlers  # noqa: E402


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


# /docs, /redoc, and /openapi.json expose the full API surface (routes, schemas,
# auth requirements) to anyone who finds the URL — fine in dev, not something to
# leave open on the public prod domain.
_docs_enabled = config.ENVIRONMENT != "prod"

app = FastAPI(
    title="FastAPI Backend",
    version="0.1.0",
    openapi_url="/openapi.json" if _docs_enabled else None,
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
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
