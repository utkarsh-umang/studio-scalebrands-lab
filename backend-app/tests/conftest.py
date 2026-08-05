"""Shared test fixtures."""

import os

import pytest
from httpx import ASGITransport, AsyncClient

# Prefer docker-compose Postgres when host .env points at a stale port.
os.environ.setdefault("POSTGRES_PORT", "5432")
os.environ.setdefault("POSTGRES_DB", "studio_sbl")

from main import app  # noqa: E402


@pytest.fixture(autouse=True)
def _stub_clips_ready_drive_validation(monkeypatch: pytest.MonkeyPatch) -> None:
    """Keep API tests deterministic; Drive behavior has focused tests of its own."""
    from app.services import drive_manifest_service

    async def valid_clips(_url: str) -> list[dict[str, object]]:
        return [
            {
                "index": 1,
                "driveFileId": "test-clip-1",
                "name": "Clip 1.mp4",
                "mimeType": "video/mp4",
                "modifiedTime": "2026-08-05T00:00:00+00:00",
            }
        ]

    monkeypatch.setattr(
        drive_manifest_service,
        "validate_clips_folder_for_intake",
        valid_clips,
    )


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture(autouse=True)
async def _reset_db_engine():
    """Dispose async engine between tests so pytest-asyncio loop changes stay safe."""
    from app.db import session as db_session

    yield
    try:
        if db_session._engine is not None:
            await db_session._engine.dispose()
    except Exception:
        # Loop may already be closing on teardown; the engine is reset below anyway.
        pass
    db_session._engine = None
    db_session._session_factory = None


@pytest.fixture
async def client() -> AsyncClient:
    """FastAPI async test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
