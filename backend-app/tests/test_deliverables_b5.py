"""B5 editor deliverables drive split API tests."""

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


async def _podcast_batch_ready_for_split(
    client: AsyncClient,
) -> tuple[str, dict[str, str]]:
    admin_headers = await _login(client, "admin@scalebrandslab.demo")
    client_headers = await _login(client, "client@scalebrandslab.demo")
    smm_headers = await _login(client, "smm@scalebrandslab.demo")
    editor_headers = await _login(client, "editor@scalebrandslab.demo")

    client_ws = await client.get(
        f"{config.API_V1_STR}/client/workspace",
        headers=client_headers,
    )
    client_id = client_ws.json()["client"]["id"]

    created = await client.post(
        f"{config.API_V1_STR}/admin/clients/{client_id}/batches",
        headers=admin_headers,
        json={"title": f"B5 batch {uuid4().hex[:8]}", "creditCost": 2},
    )
    assert created.status_code == 200, created.text
    batch_id = created.json()["id"]

    intake = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/intake",
        headers=client_headers,
        json={
            "intakePath": "source_media",
            "url": "https://www.youtube.com/watch?v=b5-source",
        },
    )
    assert intake.status_code == 200, intake.text

    submit_clips = await client.post(
        f"{config.API_V1_STR}/batches/{batch_id}/clips-folder",
        headers=smm_headers,
        json={"clipsFolderUrl": "https://drive.google.com/drive/folders/b5-clips"},
    )
    assert submit_clips.status_code == 200, submit_clips.text
    gate = next(
        (v for v in submit_clips.json()["videos"] if v["title"] == "Clip approval"),
        submit_clips.json()["videos"][0],
    )

    approve = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/clips/approve",
        headers=client_headers,
        json={"videoTicketId": gate["id"], "clipCount": 4},
    )
    assert approve.status_code == 200, approve.text
    return batch_id, editor_headers


@pytest.mark.anyio
async def test_editor_split_after_clip_approve(client: AsyncClient) -> None:
    batch_id, editor_headers = await _podcast_batch_ready_for_split(client)

    split = await client.post(
        f"{config.API_V1_STR}/editor/batches/{batch_id}/deliverables-drive",
        headers=editor_headers,
        json={
            "deliverablesDriveUrl": "https://drive.google.com/drive/folders/b5-deliverables",
            "deliverableCount": 4,
            "deliverables": [
                {"index": 1, "title": "Hook — 0:45"},
                {"index": 2, "title": "Tip #2"},
            ],
        },
    )
    assert split.status_code == 200, split.text
    body = split.json()
    assert body["batch"]["editorDeliverablesDriveUrl"].startswith("https://")
    assert body["batch"]["pipelineStage"] == "production"
    assert body["batch"]["videoCount"] == 4
    assert len(body["videos"]) == 4
    indices = sorted(v["deliverableIndex"] for v in body["videos"])
    assert indices == [1, 2, 3, 4]
    assert body["videos"][0]["title"] == "Hook — 0:45"
    assert body["videos"][1]["title"] == "Tip #2"
    assert body["videos"][2]["title"] == "Deliverable 3"
    assert all(v["owner"] == "editor" for v in body["videos"])
    assert all(v["pipelineStage"] == "production" for v in body["videos"])


@pytest.mark.anyio
async def test_clips_ready_split_uses_batch_video_count(client: AsyncClient) -> None:
    admin_headers = await _login(client, "admin@scalebrandslab.demo")
    editor_headers = await _login(client, "editor@scalebrandslab.demo")
    client_headers = await _login(client, "client@scalebrandslab.demo")
    # Use the demo client so the demo editor is deterministically assigned to it.
    client_ws = await client.get(
        f"{config.API_V1_STR}/client/workspace", headers=client_headers
    )
    client_id = client_ws.json()["client"]["id"]

    batch_create = await client.post(
        f"{config.API_V1_STR}/admin/clients/{client_id}/batches",
        headers=admin_headers,
        json={"title": f"Clips Ready Split {uuid4().hex[:8]}", "creditCost": 1},
    )
    batch_id = batch_create.json()["id"]
    intake = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/intake",
        headers=client_headers,
        json={
            "intakePath": "clips_ready",
            "url": "https://drive.google.com/drive/folders/b5-ready",
        },
    )
    assert intake.status_code == 200

    split = await client.post(
        f"{config.API_V1_STR}/editor/batches/{batch_id}/deliverables-drive",
        headers=editor_headers,
        json={
            "deliverablesDriveUrl": "https://drive.google.com/drive/folders/b5-ready-deliverables",
        },
    )
    assert split.status_code == 200, split.text
    body = split.json()
    assert len(body["videos"]) == 1
    assert body["videos"][0]["deliverableIndex"] == 1
    assert body["batch"]["pipelineStage"] == "production"


@pytest.mark.anyio
async def test_awaiting_clips_returns_422(client: AsyncClient) -> None:
    admin_headers = await _login(client, "admin@scalebrandslab.demo")
    client_headers = await _login(client, "client@scalebrandslab.demo")
    editor_headers = await _login(client, "editor@scalebrandslab.demo")

    client_ws = await client.get(
        f"{config.API_V1_STR}/client/workspace",
        headers=client_headers,
    )
    client_id = client_ws.json()["client"]["id"]

    created = await client.post(
        f"{config.API_V1_STR}/admin/clients/{client_id}/batches",
        headers=admin_headers,
        json={"title": f"B5 awaiting {uuid4().hex[:8]}", "creditCost": 1},
    )
    batch_id = created.json()["id"]

    intake = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/intake",
        headers=client_headers,
        json={
            "intakePath": "source_media",
            "url": "https://www.youtube.com/watch?v=b5-await",
        },
    )
    assert intake.status_code == 200

    split = await client.post(
        f"{config.API_V1_STR}/editor/batches/{batch_id}/deliverables-drive",
        headers=editor_headers,
        json={
            "deliverablesDriveUrl": "https://drive.google.com/drive/folders/b5-too-soon",
        },
    )
    assert split.status_code == 422


@pytest.mark.anyio
async def test_double_submit_returns_409(client: AsyncClient) -> None:
    batch_id, editor_headers = await _podcast_batch_ready_for_split(client)

    first = await client.post(
        f"{config.API_V1_STR}/editor/batches/{batch_id}/deliverables-drive",
        headers=editor_headers,
        json={
            "deliverablesDriveUrl": "https://drive.google.com/drive/folders/b5-first",
            "deliverableCount": 2,
        },
    )
    assert first.status_code == 200

    second = await client.post(
        f"{config.API_V1_STR}/editor/batches/{batch_id}/deliverables-drive",
        headers=editor_headers,
        json={
            "deliverablesDriveUrl": "https://drive.google.com/drive/folders/b5-second",
            "deliverableCount": 2,
        },
    )
    assert second.status_code == 409


@pytest.mark.anyio
async def test_smm_cannot_submit_deliverables_drive(client: AsyncClient) -> None:
    batch_id, _ = await _podcast_batch_ready_for_split(client)
    smm_headers = await _login(client, "smm@scalebrandslab.demo")

    response = await client.post(
        f"{config.API_V1_STR}/editor/batches/{batch_id}/deliverables-drive",
        headers=smm_headers,
        json={
            "deliverablesDriveUrl": "https://drive.google.com/drive/folders/b5-smm",
        },
    )
    assert response.status_code == 403
