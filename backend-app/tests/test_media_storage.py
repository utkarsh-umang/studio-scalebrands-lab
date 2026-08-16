"""Studio-owned object storage API tests."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.core.config import config
from app.services import object_storage_service


async def _login(client: AsyncClient, email: str, password: str = "demo1234") -> dict[str, str]:
    response = await client.post(
        f"{config.API_V1_STR}/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['accessToken']}"}


async def _production_ticket(
    client: AsyncClient,
) -> tuple[str, str, dict[str, str], dict[str, str]]:
    admin_headers = await _login(client, "admin@scalebrandslab.demo")
    client_headers = await _login(client, "client@scalebrandslab.demo")
    editor_headers = await _login(client, "editor@scalebrandslab.demo")
    workspace = await client.get(
        f"{config.API_V1_STR}/client/workspace",
        headers=client_headers,
    )
    client_id = workspace.json()["client"]["id"]
    created = await client.post(
        f"{config.API_V1_STR}/admin/clients/{client_id}/batches",
        headers=admin_headers,
        json={"title": f"Media {uuid4().hex[:8]}", "creditCost": 2},
    )
    batch_id = created.json()["id"]
    intake = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/intake",
        headers=client_headers,
        json={
            "intakePath": "clips_ready",
            "url": "https://drive.google.com/drive/folders/client-clips-media",
        },
    )
    assert intake.status_code == 200, intake.text
    ticket_id = intake.json()["videos"][0]["id"]
    return batch_id, ticket_id, editor_headers, client_headers


@pytest.mark.anyio
async def test_editor_upload_is_verified_and_becomes_current(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, ticket_id, editor_headers, _ = await _production_ticket(client)

    async def fake_presign(*_args: object, **_kwargs: object) -> str:
        return "https://storage.example.test/upload"

    monkeypatch.setattr(object_storage_service, "create_presigned_put", fake_presign)
    initiated = await client.post(
        f"{config.API_V1_STR}/media/videos/{ticket_id}/uploads",
        headers=editor_headers,
        json={
            "kind": "video",
            "filename": "Final cut.mp4",
            "contentType": "video/mp4",
            "sizeBytes": 128,
        },
    )
    assert initiated.status_code == 200, initiated.text
    body = initiated.json()
    asset_id = body["asset"]["id"]
    assert body["asset"]["status"] == "pending"
    assert body["asset"]["version"] == 1
    assert body["uploadMethod"] == "PUT"
    assert body["uploadUrl"] == "https://storage.example.test/upload"
    assert body["uploadHeaders"]["Content-Type"] == "video/mp4"

    async def fake_head(_object_key: str) -> dict[str, object]:
        return {
            "ContentLength": 128,
            "ETag": '"etag-1"',
            "VersionId": "storage-v1",
            "Metadata": {"studio-asset-id": asset_id},
        }

    monkeypatch.setattr(object_storage_service, "head_object", fake_head)
    completed = await client.post(
        f"{config.API_V1_STR}/media/uploads/{asset_id}/complete",
        headers=editor_headers,
        json={},
    )
    assert completed.status_code == 200, completed.text
    assert completed.json()["asset"]["status"] == "ready"
    assert completed.json()["asset"]["isCurrent"] is True
    assert completed.json()["asset"]["sizeBytes"] == 128

    listed = await client.get(
        f"{config.API_V1_STR}/media/videos/{ticket_id}/assets",
        headers=editor_headers,
    )
    assert listed.status_code == 200
    assert [asset["id"] for asset in listed.json()["assets"]] == [asset_id]


@pytest.mark.anyio
async def test_upload_rejects_wrong_media_type(client: AsyncClient) -> None:
    _, ticket_id, editor_headers, _ = await _production_ticket(client)
    response = await client.post(
        f"{config.API_V1_STR}/media/videos/{ticket_id}/uploads",
        headers=editor_headers,
        json={
            "kind": "video",
            "filename": "notes.pdf",
            "contentType": "application/pdf",
            "sizeBytes": 10,
        },
    )
    assert response.status_code == 422
    assert response.json()["error_code"] == "UNSUPPORTED_MEDIA_TYPE"


@pytest.mark.anyio
async def test_client_cannot_upload_finished_video(client: AsyncClient) -> None:
    _, ticket_id, _, client_headers = await _production_ticket(client)
    response = await client.post(
        f"{config.API_V1_STR}/media/videos/{ticket_id}/uploads",
        headers=client_headers,
        json={
            "kind": "video",
            "filename": "final.mp4",
            "contentType": "video/mp4",
            "sizeBytes": 10,
        },
    )
    assert response.status_code == 403
