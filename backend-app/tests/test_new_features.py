"""Tests for credit history, notifications, activity trail, and ownership."""

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


async def _client_id(client: AsyncClient, client_headers: dict[str, str]) -> str:
    ws = await client.get(f"{config.API_V1_STR}/client/workspace", headers=client_headers)
    assert ws.status_code == 200
    return ws.json()["client"]["id"]


async def _create_batch(client: AsyncClient, admin: dict[str, str], client_id: str) -> str:
    created = await client.post(
        f"{config.API_V1_STR}/admin/clients/{client_id}/batches",
        headers=admin,
        json={"title": f"NF {uuid4().hex[:8]}", "creditCost": 3},
    )
    assert created.status_code == 200, created.text
    return created.json()["id"]


@pytest.mark.anyio
async def test_top_up_records_credit_history(client: AsyncClient) -> None:
    admin = await _login(client, "admin@scalebrandslab.demo")
    client_headers = await _login(client, "client@scalebrandslab.demo")
    client_id = await _client_id(client, client_headers)

    # Top-up must succeed (regression: ClientProfile.touch_updated_at).
    top_up = await client.post(
        f"{config.API_V1_STR}/admin/clients/{client_id}/credits/top-up",
        headers=admin,
        json={"amount": 7},
    )
    assert top_up.status_code == 200, top_up.text

    history = await client.get(
        f"{config.API_V1_STR}/admin/clients/{client_id}/credit-history", headers=admin
    )
    assert history.status_code == 200, history.text
    items = history.json()["items"]
    assert any(i["kind"] == "top_up" and i["amount"] == 7 for i in items)


@pytest.mark.anyio
async def test_notifications_inbox_shape(client: AsyncClient) -> None:
    smm_headers = await _login(client, "smm@scalebrandslab.demo")
    resp = await client.get(f"{config.API_V1_STR}/notifications", headers=smm_headers)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "unreadCount" in body and "items" in body
    for item in body["items"]:
        assert "message" in item and "deadlineAt" in item

    seen = await client.post(f"{config.API_V1_STR}/notifications/mark-seen", headers=smm_headers)
    assert seen.status_code == 200, seen.text


@pytest.mark.anyio
async def test_activity_trail_records_intake(client: AsyncClient) -> None:
    admin = await _login(client, "admin@scalebrandslab.demo")
    client_headers = await _login(client, "client@scalebrandslab.demo")
    client_id = await _client_id(client, client_headers)
    batch_id = await _create_batch(client, admin, client_id)

    await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/request-ideas", headers=client_headers
    )
    activity = await client.get(
        f"{config.API_V1_STR}/batches/{batch_id}/activity", headers=admin
    )
    assert activity.status_code == 200, activity.text
    actions = [i["action"] for i in activity.json()["items"]]
    assert "ideas_requested" in actions


@pytest.mark.anyio
async def test_set_batch_assignments(client: AsyncClient) -> None:
    admin = await _login(client, "admin@scalebrandslab.demo")
    client_headers = await _login(client, "client@scalebrandslab.demo")
    client_id = await _client_id(client, client_headers)
    batch_id = await _create_batch(client, admin, client_id)

    resp = await client.patch(
        f"{config.API_V1_STR}/admin/batches/{batch_id}/assignments",
        headers=admin,
        json={"clipOwnerKind": "smm", "thumbnailOwnerKind": "editor", "titleOwnerKind": "smm"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["clipOwnerKind"] == "smm"
    assert body["thumbnailOwnerKind"] == "editor"
    assert body["titleOwnerKind"] == "smm"

    # Invalid value rejected.
    bad = await client.patch(
        f"{config.API_V1_STR}/admin/batches/{batch_id}/assignments",
        headers=admin,
        json={"clipOwnerKind": "nope"},
    )
    assert bad.status_code == 422, bad.text
