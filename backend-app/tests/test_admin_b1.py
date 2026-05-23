"""B1 admin API tests."""

import pytest
from httpx import AsyncClient

from app.core.config import config


@pytest.fixture
async def admin_headers(client: AsyncClient) -> dict[str, str]:
    login = await client.post(
        f"{config.API_V1_STR}/auth/login",
        json={"email": "admin@scalebrandslab.demo", "password": "demo1234"},
    )
    assert login.status_code == 200, login.text
    token = login.json()["accessToken"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.anyio
async def test_admin_routes_forbid_non_admin(
    client: AsyncClient,
) -> None:
    login = await client.post(
        f"{config.API_V1_STR}/auth/login",
        json={"email": "client@scalebrandslab.demo", "password": "demo1234"},
    )
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['accessToken']}"}
    response = await client.get(f"{config.API_V1_STR}/admin/clients", headers=headers)
    assert response.status_code == 403


@pytest.mark.anyio
async def test_list_clients(client: AsyncClient, admin_headers: dict[str, str]) -> None:
    response = await client.get(
        f"{config.API_V1_STR}/admin/clients",
        headers=admin_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert "clients" in body
    assert len(body["clients"]) >= 1


@pytest.mark.anyio
async def test_provision_client_and_duplicate_email(
    client: AsyncClient,
    admin_headers: dict[str, str],
) -> None:
    payload = {
        "loginId": "b1.test.client@scalebrandslab.demo",
        "displayName": "B1 Test Client",
        "password": "testpass12",
        "initialCredits": 12,
    }
    created = await client.post(
        f"{config.API_V1_STR}/admin/clients",
        headers=admin_headers,
        json=payload,
    )
    assert created.status_code == 200, created.text
    data = created.json()
    assert data["credentials"]["email"] == payload["loginId"].lower()
    assert data["credentials"]["password"] == payload["password"]
    assert data["client"]["displayName"] == payload["displayName"]
    assert "password" not in data["client"]

    dup = await client.post(
        f"{config.API_V1_STR}/admin/clients",
        headers=admin_headers,
        json=payload,
    )
    assert dup.status_code == 409

    client_id = data["client"]["id"]
    detail = await client.get(
        f"{config.API_V1_STR}/admin/clients/{client_id}",
        headers=admin_headers,
    )
    assert detail.status_code == 200
    assert detail.json()["credits"] == 12


@pytest.mark.anyio
async def test_batch_number_sequence_and_decommission_blocks_create(
    client: AsyncClient,
    admin_headers: dict[str, str],
) -> None:
    provision = await client.post(
        f"{config.API_V1_STR}/admin/clients",
        headers=admin_headers,
        json={
            "loginId": "b1.batch.client@scalebrandslab.demo",
            "displayName": "B1 Batch Client",
            "password": "testpass12",
            "initialCredits": 20,
        },
    )
    assert provision.status_code == 200
    client_id = provision.json()["client"]["id"]

    batch1 = await client.post(
        f"{config.API_V1_STR}/admin/clients/{client_id}/batches",
        headers=admin_headers,
        json={"title": "First batch", "creditCost": 3},
    )
    assert batch1.status_code == 200
    assert batch1.json()["batchNumber"] == 1

    batch2 = await client.post(
        f"{config.API_V1_STR}/admin/clients/{client_id}/batches",
        headers=admin_headers,
        json={"title": "Second batch", "creditCost": 2},
    )
    assert batch2.status_code == 200
    assert batch2.json()["batchNumber"] == 2

    decommission = await client.post(
        f"{config.API_V1_STR}/admin/clients/{client_id}/decommission",
        headers=admin_headers,
        json={"reason": "Test offboarding"},
    )
    assert decommission.status_code == 200
    assert decommission.json()["accountStatus"] == "decommissioned"

    blocked = await client.post(
        f"{config.API_V1_STR}/admin/clients/{client_id}/batches",
        headers=admin_headers,
        json={"title": "Should fail", "creditCost": 1},
    )
    assert blocked.status_code == 422


@pytest.mark.anyio
async def test_top_up_credits(client: AsyncClient, admin_headers: dict[str, str]) -> None:
    provision = await client.post(
        f"{config.API_V1_STR}/admin/clients",
        headers=admin_headers,
        json={
            "loginId": "b1.topup.client@scalebrandslab.demo",
            "displayName": "B1 Top Up",
            "password": "testpass12",
            "initialCredits": 5,
        },
    )
    client_id = provision.json()["client"]["id"]
    topped = await client.post(
        f"{config.API_V1_STR}/admin/clients/{client_id}/credits/top-up",
        headers=admin_headers,
        json={"amount": 7},
    )
    assert topped.status_code == 200
    assert topped.json()["credits"] == 12


@pytest.mark.anyio
async def test_pipeline_endpoint(client: AsyncClient, admin_headers: dict[str, str]) -> None:
    response = await client.get(
        f"{config.API_V1_STR}/admin/pipeline",
        headers=admin_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert "summary" in body
    assert "items" in body
    assert "withClient" in body["summary"]
