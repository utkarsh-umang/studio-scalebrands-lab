"""Shared test fixtures."""

import os

import pytest
from httpx import ASGITransport, AsyncClient

# Prefer docker-compose Postgres when host .env points at a stale port.
os.environ.setdefault("POSTGRES_PORT", "5432")
os.environ.setdefault("POSTGRES_DB", "studio_sbl")

from main import app  # noqa: E402


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture(autouse=True)
async def _reset_db_engine():
    """Dispose async engine between tests so pytest-asyncio loop changes stay safe."""
    from app.db import session as db_session

    yield
    if db_session._engine is not None:
        await db_session._engine.dispose()
    db_session._engine = None
    db_session._session_factory = None


@pytest.fixture
async def client() -> AsyncClient:
    """FastAPI async test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
