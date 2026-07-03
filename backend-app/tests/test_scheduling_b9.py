"""B9 scheduling and batch credit debit API tests."""

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


def _drive_entry(index: int, kind: str) -> dict:
    return {
        "index": index,
        "driveFileId": f"b9-{kind}-{index}",
        "name": f"{index}.{'mov' if kind == 'video' else 'png'}",
        "mimeType": "video/quicktime" if kind == "video" else "image/png",
        "modifiedTime": "2026-05-15T16:49:06.328Z",
    }


async def _batch_ready_for_scheduling(
    client: AsyncClient,
    *,
    deliverable_count: int = 1,
) -> tuple[str, list[str], dict[str, str], dict[str, str], dict[str, str]]:
    admin_headers = await _login(client, "admin@scalebrandslab.demo")
    client_headers = await _login(client, "client@scalebrandslab.demo")
    smm_headers = await _login(client, "smm@scalebrandslab.demo")
    editor_headers = await _login(client, "editor@scalebrandslab.demo")

    client_ws = await client.get(
        f"{config.API_V1_STR}/client/workspace",
        headers=client_headers,
    )
    client_id = client_ws.json()["client"]["id"]
    credits_before = client_ws.json()["client"]["credits"]

    created = await client.post(
        f"{config.API_V1_STR}/admin/clients/{client_id}/batches",
        headers=admin_headers,
        json={"title": f"B9 batch {uuid4().hex[:8]}", "creditCost": 2},
    )
    batch_id = created.json()["id"]

    await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/intake",
        headers=client_headers,
        json={
            "intakePath": "source_media",
            "url": "https://www.youtube.com/watch?v=b9-source",
        },
    )

    submit_clips = await client.post(
        f"{config.API_V1_STR}/batches/{batch_id}/clips-folder",
        headers=smm_headers,
        json={"clipsFolderUrl": "https://drive.google.com/drive/folders/b9-clips"},
    )
    gate = next(
        (v for v in submit_clips.json()["videos"] if v["title"] == "Clip approval"),
        submit_clips.json()["videos"][0],
    )

    await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/clips/approve",
        headers=client_headers,
        json={"videoTicketId": gate["id"], "clipCount": deliverable_count},
    )

    split = await client.post(
        f"{config.API_V1_STR}/editor/batches/{batch_id}/deliverables-drive",
        headers=editor_headers,
        json={
            "deliverablesDriveUrl": "https://drive.google.com/drive/folders/b9-deliverables",
            "deliverableCount": deliverable_count,
        },
    )
    ticket_ids = [v["id"] for v in split.json()["videos"] if v.get("deliverableIndex", 0) > 0]

    for ticket_id in ticket_ids:
        await client.patch(
            f"{config.API_V1_STR}/videos/{ticket_id}/production",
            headers=editor_headers,
            json={"editorPublishTitle": f"Title {ticket_id[:8]}"},
        )
        index = next(
            v["deliverableIndex"]
            for v in split.json()["videos"]
            if v["id"] == ticket_id
        )
        await client.post(
            f"{config.API_V1_STR}/videos/{ticket_id}/drive-sync",
            headers=editor_headers,
            json={
                "deliverableIndex": index,
                "video": _drive_entry(index, "video"),
                "thumbnail": _drive_entry(index, "thumbnail"),
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

    return batch_id, ticket_ids, smm_headers, client_headers, {
        "client_id": client_id,
        "credits_before": str(credits_before),
    }


@pytest.mark.anyio
async def test_schedule_one_video_leaves_batch_active(client: AsyncClient) -> None:
    batch_id, ticket_ids, smm_headers, _, _ = await _batch_ready_for_scheduling(
        client, deliverable_count=2
    )

    response = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_ids[0]}/schedule",
        headers=smm_headers,
        json={
            "platform": "YouTube Shorts",
            "goLiveDate": "2026-05-20",
            "goLiveTime": "17:00",
        },
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["ticket"]["owner"] == "done"
    assert body["ticket"]["pipelineStage"] == "completed"
    assert body["ticket"]["videoSchedule"]["platform"] == "YouTube Shorts"
    assert body["batch"]["id"] == batch_id
    assert body["batch"]["status"] == "active"
    assert body["batch"]["creditsDebited"] is False
    assert body["client"] is None


@pytest.mark.anyio
async def test_schedule_final_video_debits_credits_once(client: AsyncClient) -> None:
    batch_id, ticket_ids, smm_headers, client_headers, meta = await _batch_ready_for_scheduling(
        client,
        deliverable_count=2,
    )
    credits_before = int(meta["credits_before"])

    first = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_ids[0]}/schedule",
        headers=smm_headers,
        json={
            "platform": "TikTok",
            "goLiveDate": "2026-05-21",
            "goLiveTime": "12:00",
        },
    )
    assert first.status_code == 200, first.text
    assert first.json()["batch"]["creditsDebited"] is False

    second = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_ids[1]}/schedule",
        headers=smm_headers,
        json={
            "platform": "Instagram Reels",
            "goLiveDate": "2026-05-22",
            "goLiveTime": "09:30",
        },
    )
    assert second.status_code == 200, second.text
    body = second.json()
    assert body["batch"]["status"] == "completed"
    assert body["batch"]["creditsDebited"] is True
    assert body["batch"]["batchSchedule"]["platform"] == "Instagram Reels"
    assert body["client"]["credits"] == max(0, credits_before - 2)

    ws = await client.get(
        f"{config.API_V1_STR}/client/workspace",
        headers=client_headers,
    )
    assert ws.status_code == 200
    batch = next(b for b in ws.json()["batches"] if b["id"] == batch_id)
    assert batch["creditsDebited"] is True
    assert ws.json()["client"]["credits"] == body["client"]["credits"]


@pytest.mark.anyio
async def test_schedule_rejects_invalid_platform(client: AsyncClient) -> None:
    _, ticket_ids, smm_headers, _, _ = await _batch_ready_for_scheduling(client)

    response = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_ids[0]}/schedule",
        headers=smm_headers,
        json={
            "platform": "MySpace",
            "goLiveDate": "2026-05-20",
            "goLiveTime": "17:00",
        },
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_schedule_already_done_ticket_returns_422(client: AsyncClient) -> None:
    _, ticket_ids, smm_headers, _, _ = await _batch_ready_for_scheduling(client)

    payload = {
        "platform": "Facebook",
        "goLiveDate": "2026-05-20",
        "goLiveTime": "17:00",
    }
    first = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_ids[0]}/schedule",
        headers=smm_headers,
        json=payload,
    )
    assert first.status_code == 200

    again = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_ids[0]}/schedule",
        headers=smm_headers,
        json=payload,
    )
    assert again.status_code == 422
