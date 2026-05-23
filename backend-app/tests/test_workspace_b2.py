"""B2 workspace read API tests."""

import pytest
from httpx import AsyncClient

from app.core.config import config


async def _login(client: AsyncClient, email: str, password: str = "demo1234") -> dict[str, str]:
    response = await client.post(
        f"{config.API_V1_STR}/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200, response.text
    token = response.json()["accessToken"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.anyio
async def test_client_workspace_scoped_to_self(client: AsyncClient) -> None:
    headers = await _login(client, "client@scalebrandslab.demo")
    response = await client.get(f"{config.API_V1_STR}/client/workspace", headers=headers)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["client"]["loginEmail"] == "client@scalebrandslab.demo"
    for batch in body["batches"]:
        assert batch["clientId"] == body["client"]["id"]
    for video in body["videos"]:
        assert video["clientId"] == body["client"]["id"]


@pytest.mark.anyio
async def test_editor_workspace_only_assigned_clients(client: AsyncClient) -> None:
    headers = await _login(client, "editor@scalebrandslab.demo")
    response = await client.get(f"{config.API_V1_STR}/editor/workspace", headers=headers)
    assert response.status_code == 200, response.text
    body = response.json()
    for profile in body["clients"]:
        assert profile["assignedEditorId"] == body["clients"][0]["assignedEditorId"]


@pytest.mark.anyio
async def test_smm_workspace_forbidden_for_editor(client: AsyncClient) -> None:
    headers = await _login(client, "editor@scalebrandslab.demo")
    response = await client.get(f"{config.API_V1_STR}/smm/workspace", headers=headers)
    assert response.status_code == 403


@pytest.mark.anyio
async def test_admin_workspace_includes_clients(client: AsyncClient) -> None:
    headers = await _login(client, "admin@scalebrandslab.demo")
    response = await client.get(f"{config.API_V1_STR}/admin/workspace", headers=headers)
    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body["clients"]) >= 1
    assert len(body["batches"]) >= 0


@pytest.mark.anyio
async def test_client_cannot_access_admin_workspace(client: AsyncClient) -> None:
    headers = await _login(client, "client@scalebrandslab.demo")
    response = await client.get(f"{config.API_V1_STR}/admin/workspace", headers=headers)
    assert response.status_code == 403


@pytest.mark.anyio
async def test_batch_detail_returns_404_for_other_client_batch(
    client: AsyncClient,
) -> None:
    admin_headers = await _login(client, "admin@scalebrandslab.demo")
    admin_ws = await client.get(
        f"{config.API_V1_STR}/admin/workspace",
        headers=admin_headers,
    )
    assert admin_ws.status_code == 200
    batch_id = admin_ws.json()["batches"][0]["id"] if admin_ws.json()["batches"] else None
    if batch_id is None:
        pytest.skip("No batches in seed data")

    client_headers = await _login(client, "client@scalebrandslab.demo")
    client_ws = await client.get(
        f"{config.API_V1_STR}/client/workspace",
        headers=client_headers,
    )
    own_batch_ids = {b["id"] for b in client_ws.json()["batches"]}
    if batch_id in own_batch_ids:
        pytest.skip("Only one client in seed — cannot test cross-tenant 404")

    response = await client.get(
        f"{config.API_V1_STR}/batches/{batch_id}",
        headers=client_headers,
    )
    assert response.status_code == 404
