"""Direct client source uploads and per-video thumbnail permissions."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.core.config import config
from app.services import object_storage_service


async def _login(client: AsyncClient, email: str) -> dict[str, str]:
    response = await client.post(
        f"{config.API_V1_STR}/auth/login",
        json={"email": email, "password": "demo1234"},
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['accessToken']}"}


async def _new_batch(
    client: AsyncClient,
    *,
    client_headers: dict[str, str],
    admin_headers: dict[str, str],
    client_thumbnail: bool = False,
) -> str:
    workspace = await client.get(
        f"{config.API_V1_STR}/client/workspace",
        headers=client_headers,
    )
    client_id = workspace.json()["client"]["id"]
    created = await client.post(
        f"{config.API_V1_STR}/admin/clients/{client_id}/batches",
        headers=admin_headers,
        json={"title": f"Direct upload {uuid4().hex[:8]}", "creditCost": 3},
    )
    assert created.status_code == 200, created.text
    batch_id = created.json()["id"]
    if client_thumbnail:
        assigned = await client.patch(
            f"{config.API_V1_STR}/admin/batches/{batch_id}/assignments",
            headers=admin_headers,
            json={"thumbnailOwnerKind": "client"},
        )
        assert assigned.status_code == 200, assigned.text
    return batch_id


def _install_storage_fakes(monkeypatch: pytest.MonkeyPatch) -> None:
    async def fake_presign(*_args: object, **_kwargs: object) -> str:
        return "https://storage.example.test/upload"

    async def fake_head(object_key: str) -> dict[str, object]:
        asset_id = object_key.rsplit("/", 1)[-1][:36]
        return {
            "ContentLength": 128,
            "ETag": '"etag"',
            "VersionId": "storage-version",
            "Metadata": {"studio-asset-id": asset_id},
        }

    monkeypatch.setattr(object_storage_service, "create_presigned_put", fake_presign)
    monkeypatch.setattr(object_storage_service, "head_object", fake_head)


async def _prepare_complete_finalize(
    client: AsyncClient,
    batch_id: str,
    headers: dict[str, str],
    filename: str,
    *,
    append: bool,
) -> dict:
    prepared = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/source-clips/prepare",
        headers=headers,
        json={
            "files": [
                {
                    "filename": filename,
                    "contentType": "video/mp4",
                    "sizeBytes": 128,
                }
            ],
            "append": append,
        },
    )
    assert prepared.status_code == 200, prepared.text
    asset_id = prepared.json()["uploads"][0]["upload"]["asset"]["id"]
    completed = await client.post(
        f"{config.API_V1_STR}/media/uploads/{asset_id}/complete",
        headers=headers,
        json={},
    )
    assert completed.status_code == 200, completed.text
    finalized = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/source-clips/finalize",
        headers=headers,
    )
    assert finalized.status_code == 200, finalized.text
    return finalized.json()


@pytest.mark.anyio
async def test_client_can_append_source_videos_to_active_batch(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _install_storage_fakes(monkeypatch)
    admin_headers = await _login(client, "admin@scalebrandslab.demo")
    client_headers = await _login(client, "client@scalebrandslab.demo")
    batch_id = await _new_batch(
        client,
        client_headers=client_headers,
        admin_headers=admin_headers,
    )

    first = await _prepare_complete_finalize(
        client, batch_id, client_headers, "first.mp4", append=False
    )
    assert first["batch"]["videoCount"] == 1

    appended = await _prepare_complete_finalize(
        client, batch_id, client_headers, "second.mp4", append=True
    )
    tickets = sorted(appended["videos"], key=lambda item: item["deliverableIndex"])
    assert appended["batch"]["videoCount"] == 2
    assert [item["deliverableIndex"] for item in tickets] == [1, 2]
    assert [item["owner"] for item in tickets] == ["editor", "editor"]


@pytest.mark.anyio
async def test_client_can_upload_thumbnail_only_when_client_owned(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _install_storage_fakes(monkeypatch)
    admin_headers = await _login(client, "admin@scalebrandslab.demo")
    client_headers = await _login(client, "client@scalebrandslab.demo")
    batch_id = await _new_batch(
        client,
        client_headers=client_headers,
        admin_headers=admin_headers,
        client_thumbnail=True,
    )
    finalized = await _prepare_complete_finalize(
        client, batch_id, client_headers, "source.mp4", append=False
    )
    ticket_id = finalized["videos"][0]["id"]

    initiated = await client.post(
        f"{config.API_V1_STR}/media/videos/{ticket_id}/uploads",
        headers=client_headers,
        json={
            "kind": "thumbnail",
            "filename": "thumbnail.png",
            "contentType": "image/png",
            "sizeBytes": 128,
        },
    )
    assert initiated.status_code == 200, initiated.text
