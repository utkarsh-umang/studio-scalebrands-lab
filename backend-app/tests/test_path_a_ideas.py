"""Path A (idea-first) intake pipeline tests."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.core.config import config


async def _login(client: AsyncClient, email: str, password: str = "demo1234") -> dict[str, str]:
    response = await client.post(
        f"{config.API_V1_STR}/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['accessToken']}"}


async def _create_batch(client: AsyncClient) -> tuple[str, dict[str, str]]:
    admin = await _login(client, "admin@scalebrandslab.demo")
    client_headers = await _login(client, "client@scalebrandslab.demo")
    ws = await client.get(f"{config.API_V1_STR}/client/workspace", headers=client_headers)
    assert ws.status_code == 200
    client_id = ws.json()["client"]["id"]
    created = await client.post(
        f"{config.API_V1_STR}/admin/clients/{client_id}/batches",
        headers=admin,
        json={"title": f"Idea {uuid4().hex[:8]}", "creditCost": 3},
    )
    assert created.status_code == 200, created.text
    return created.json()["id"], client_headers


@pytest.mark.anyio
async def test_idea_first_happy_path_converges_to_production(client: AsyncClient) -> None:
    batch_id, client_headers = await _create_batch(client)
    smm_headers = await _login(client, "smm@scalebrandslab.demo")

    # Client requests ideas → SMM research.
    r = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/request-ideas", headers=client_headers
    )
    assert r.status_code == 200, r.text
    assert r.json()["batch"]["pipelineStage"] == "idea_research"
    assert r.json()["batch"]["intakePath"] == "idea_first"

    # SMM submits ideas → client review.
    r = await client.post(
        f"{config.API_V1_STR}/batches/{batch_id}/ideas",
        headers=smm_headers,
        json={"ideas": ["Idea one", "Idea two", "  ", "Idea three"]},
    )
    assert r.status_code == 200, r.text
    assert r.json()["batch"]["pipelineStage"] == "idea_review"
    assert r.json()["batch"]["ideaList"] == ["Idea one", "Idea two", "Idea three"]

    # Client approves → awaiting footage.
    r = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/ideas/approve", headers=client_headers
    )
    assert r.status_code == 200, r.text
    assert r.json()["batch"]["pipelineStage"] == "idea_footage_pending"

    # Client sends footage → converges into production (no clip review).
    r = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/idea-footage",
        headers=client_headers,
        json={"url": "https://drive.google.com/drive/folders/abc"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["batch"]["pipelineStage"] == "pre_split_production"
    assert r.json()["batch"]["sourceMediaUrl"] == "https://drive.google.com/drive/folders/abc"


@pytest.mark.anyio
async def test_reject_ideas_returns_to_research(client: AsyncClient) -> None:
    batch_id, client_headers = await _create_batch(client)
    smm_headers = await _login(client, "smm@scalebrandslab.demo")

    await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/request-ideas", headers=client_headers
    )
    await client.post(
        f"{config.API_V1_STR}/batches/{batch_id}/ideas",
        headers=smm_headers,
        json={"ideas": ["First attempt"]},
    )
    r = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/ideas/reject",
        headers=client_headers,
        json={"note": "Too generic"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["batch"]["pipelineStage"] == "idea_research"


@pytest.mark.anyio
async def test_submit_ideas_requires_smm(client: AsyncClient) -> None:
    batch_id, client_headers = await _create_batch(client)
    await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/request-ideas", headers=client_headers
    )
    # Client cannot submit ideas (SMM-only).
    r = await client.post(
        f"{config.API_V1_STR}/batches/{batch_id}/ideas",
        headers=client_headers,
        json={"ideas": ["nope"]},
    )
    assert r.status_code == 403, r.text


@pytest.mark.anyio
async def test_empty_ideas_rejected(client: AsyncClient) -> None:
    batch_id, client_headers = await _create_batch(client)
    smm_headers = await _login(client, "smm@scalebrandslab.demo")
    await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/request-ideas", headers=client_headers
    )
    r = await client.post(
        f"{config.API_V1_STR}/batches/{batch_id}/ideas",
        headers=smm_headers,
        json={"ideas": ["   ", ""]},
    )
    assert r.status_code == 422, r.text
