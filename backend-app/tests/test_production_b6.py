"""B6 production package and submit to SMM QA API tests."""

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


async def _split_batch_for_production(client: AsyncClient) -> tuple[str, str, dict[str, str]]:
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
        json={"title": f"B6 batch {uuid4().hex[:8]}", "creditCost": 2},
    )
    batch_id = created.json()["id"]

    intake = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/intake",
        headers=client_headers,
        json={
            "intakePath": "source_media",
            "url": "https://www.youtube.com/watch?v=b6-source",
        },
    )
    assert intake.status_code == 200

    submit_clips = await client.post(
        f"{config.API_V1_STR}/batches/{batch_id}/clips-folder",
        headers=smm_headers,
        json={"clipsFolderUrl": "https://drive.google.com/drive/folders/b6-clips"},
    )
    gate = next(
        (v for v in submit_clips.json()["videos"] if v["title"] == "Clip approval"),
        submit_clips.json()["videos"][0],
    )

    approve = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/clips/approve",
        headers=client_headers,
        json={"videoTicketId": gate["id"], "clipCount": 2},
    )
    assert approve.status_code == 200

    split = await client.post(
        f"{config.API_V1_STR}/editor/batches/{batch_id}/deliverables-drive",
        headers=editor_headers,
        json={
            "deliverablesDriveUrl": "https://drive.google.com/drive/folders/b6-deliverables",
            "deliverableCount": 2,
        },
    )
    assert split.status_code == 200
    ticket_id = split.json()["videos"][0]["id"]
    return batch_id, ticket_id, editor_headers


def _drive_entry(index: int, kind: str) -> dict:
    return {
        "index": index,
        "driveFileId": f"b6-{kind}-{index}",
        "name": f"{index}.{ 'mov' if kind == 'video' else 'png'}",
        "mimeType": "video/quicktime" if kind == "video" else "image/png",
        "modifiedTime": "2026-05-15T16:49:06.328Z",
    }


@pytest.mark.anyio
async def test_production_ready_and_submit_to_smm_qa(client: AsyncClient) -> None:
    _, ticket_id, editor_headers = await _split_batch_for_production(client)

    patch = await client.patch(
        f"{config.API_V1_STR}/videos/{ticket_id}/production",
        headers=editor_headers,
        json={"editorPublishTitle": "Hook — 0:45"},
    )
    assert patch.status_code == 200, patch.text
    assert patch.json()["readiness"]["titleReady"] is True
    assert patch.json()["readiness"]["allReady"] is False

    sync = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/drive-sync",
        headers=editor_headers,
        json={
            "deliverableIndex": 1,
            "video": _drive_entry(1, "video"),
            "thumbnail": _drive_entry(1, "thumbnail"),
            "syncedAt": "2026-05-15T16:49:06.328Z",
        },
    )
    assert sync.status_code == 200, sync.text
    assert sync.json()["readiness"]["allReady"] is True

    submit = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/submit-to-smm-qa",
        headers=editor_headers,
        json={},
    )
    assert submit.status_code == 200, submit.text
    body = submit.json()
    assert body["ticket"]["owner"] == "smm"
    assert body["ticket"]["pipelineStage"] == "smm_qa"
    assert "smm qa" in body["ticket"]["stageLabel"].lower()


@pytest.mark.anyio
async def test_submit_not_ready_returns_422_with_missing(client: AsyncClient) -> None:
    _, ticket_id, editor_headers = await _split_batch_for_production(client)

    submit = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/submit-to-smm-qa",
        headers=editor_headers,
        json={},
    )
    assert submit.status_code == 422
    detail = submit.json()["detail"]
    assert "video" in detail["missing"]
    assert "thumbnail" in detail["missing"]
    assert "title" in detail["missing"]


@pytest.mark.anyio
async def test_double_submit_to_smm_qa_returns_422(client: AsyncClient) -> None:
    _, ticket_id, editor_headers = await _split_batch_for_production(client)

    await client.patch(
        f"{config.API_V1_STR}/videos/{ticket_id}/production",
        headers=editor_headers,
        json={"editorPublishTitle": "Ready title"},
    )
    await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/drive-sync",
        headers=editor_headers,
        json={
            "deliverableIndex": 1,
            "video": _drive_entry(1, "video"),
            "thumbnail": _drive_entry(1, "thumbnail"),
        },
    )
    first = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/submit-to-smm-qa",
        headers=editor_headers,
        json={},
    )
    assert first.status_code == 200

    second = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/submit-to-smm-qa",
        headers=editor_headers,
        json={},
    )
    assert second.status_code == 422
