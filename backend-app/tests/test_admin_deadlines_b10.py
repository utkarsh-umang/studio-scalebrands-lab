"""B10 admin deadlines and pipeline API tests."""

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


@pytest.mark.anyio
async def test_admin_deadlines_list(client: AsyncClient) -> None:
    headers = await _login(client, "admin@scalebrandslab.demo")
    response = await client.get(
        f"{config.API_V1_STR}/admin/deadlines",
        headers=headers,
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert "tasks" in body
    if body["tasks"]:
        task = body["tasks"][0]
        assert task["assigneeRole"] in ("smm", "editor")
        assert "taskLabel" in task


@pytest.mark.anyio
async def test_set_and_clear_video_deadline(client: AsyncClient) -> None:
    headers = await _login(client, "admin@scalebrandslab.demo")
    listed = await client.get(
        f"{config.API_V1_STR}/admin/deadlines",
        headers=headers,
    )
    assert listed.status_code == 200
    tasks = listed.json()["tasks"]
    if not tasks:
        pytest.skip("No deadline tasks in demo seed")

    video_id = tasks[0]["id"]
    set_deadline = await client.patch(
        f"{config.API_V1_STR}/admin/videos/{video_id}/deadline",
        headers=headers,
        json={"deadlineAt": "2026-06-01T18:00:00.000Z"},
    )
    assert set_deadline.status_code == 200, set_deadline.text
    assert set_deadline.json()["ticket"]["deadlineAt"] is not None

    cleared = await client.patch(
        f"{config.API_V1_STR}/admin/videos/{video_id}/deadline",
        headers=headers,
        json={"deadlineAt": None},
    )
    assert cleared.status_code == 200, cleared.text
    assert cleared.json()["ticket"]["deadlineAt"] is None


@pytest.mark.anyio
async def test_set_deadline_rejects_scheduling_ticket(client: AsyncClient) -> None:
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
        json={"title": f"B10 deadline reject {uuid4().hex[:8]}", "creditCost": 1},
    )
    batch_id = created.json()["id"]

    await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/intake",
        headers=client_headers,
        json={
            "intakePath": "source_media",
            "url": "https://www.youtube.com/watch?v=b10-source",
        },
    )

    submit_clips = await client.post(
        f"{config.API_V1_STR}/batches/{batch_id}/clips-folder",
        headers=smm_headers,
        json={"clipsFolderUrl": "https://drive.google.com/drive/folders/b10-clips"},
    )
    gate = next(
        (v for v in submit_clips.json()["videos"] if v["title"] == "Clip approval"),
        submit_clips.json()["videos"][0],
    )
    await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/clips/approve",
        headers=client_headers,
        json={"videoTicketId": gate["id"], "clipCount": 1},
    )

    split = await client.post(
        f"{config.API_V1_STR}/editor/batches/{batch_id}/deliverables-drive",
        headers=editor_headers,
        json={
            "deliverablesDriveUrl": "https://drive.google.com/drive/folders/b10-del",
            "deliverableCount": 1,
        },
    )
    ticket_id = split.json()["videos"][0]["id"]

    await client.patch(
        f"{config.API_V1_STR}/videos/{ticket_id}/production",
        headers=editor_headers,
        json={"editorPublishTitle": "B10 title"},
    )
    await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/drive-sync",
        headers=editor_headers,
        json={
            "deliverableIndex": 1,
            "video": {
                "index": 1,
                "driveFileId": "b10-vid-1",
                "name": "1.mov",
                "mimeType": "video/quicktime",
                "modifiedTime": "2026-05-15T16:49:06.328Z",
            },
            "thumbnail": {
                "index": 1,
                "driveFileId": "b10-thumb-1",
                "name": "1.png",
                "mimeType": "image/png",
                "modifiedTime": "2026-05-15T16:49:06.328Z",
            },
        },
    )
    await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/submit-to-smm-qa",
        headers=editor_headers,
        json={},
    )
    await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/smm-qa",
        headers=smm_headers,
        json={"action": "approve"},
    )
    await client.post(
        f"{config.API_V1_STR}/client/videos/{ticket_id}/client-qa",
        headers=client_headers,
        json={"action": "approve"},
    )

    response = await client.patch(
        f"{config.API_V1_STR}/admin/videos/{ticket_id}/deadline",
        headers=admin_headers,
        json={"deadlineAt": "2026-06-01T18:00:00.000Z"},
    )
    assert response.status_code == 422
