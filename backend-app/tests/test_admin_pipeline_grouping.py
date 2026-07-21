"""Admin pipeline: video-level rows grouped under batch headers.

The pipeline used to report one row (and one summary count) per batch, choosing
a single owner by majority vote. A batch with clips split across the editor and
the SMM therefore hid half its work. These cover the video-level replacement.
"""

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
        "driveFileId": f"pipe-{kind}-{index}",
        "name": f"{index}.{'mov' if kind == 'video' else 'png'}",
        "mimeType": "video/quicktime" if kind == "video" else "image/png",
        "modifiedTime": "2026-05-15T16:49:06.328Z",
    }


async def _split_batch(client: AsyncClient, deliverable_count: int = 3) -> tuple[str, list[dict]]:
    """Clips-ready batch split into per-clip tickets, all sitting with the editor."""
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
        json={"title": f"Pipeline {uuid4().hex[:8]}", "creditCost": 2},
    )
    batch_id = created.json()["id"]

    await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/intake",
        headers=client_headers,
        json={
            "intakePath": "clips_ready",
            "url": "https://drive.google.com/drive/folders/pipe-clips",
        },
    )
    split = await client.post(
        f"{config.API_V1_STR}/editor/batches/{batch_id}/deliverables-drive",
        headers=editor_headers,
        json={
            "deliverablesDriveUrl": "https://drive.google.com/drive/folders/pipe-deliverables",
            "deliverableCount": deliverable_count,
        },
    )
    assert split.status_code == 200, split.text
    tickets = [v for v in split.json()["videos"] if (v.get("deliverableIndex") or 0) > 0]
    assert len(tickets) == deliverable_count
    return batch_id, tickets


async def _pipeline(client: AsyncClient) -> dict:
    admin_headers = await _login(client, "admin@scalebrandslab.demo")
    response = await client.get(f"{config.API_V1_STR}/admin/pipeline", headers=admin_headers)
    assert response.status_code == 200, response.text
    return response.json()


def _rows_for_batch(body: dict, batch_id: str) -> list[dict]:
    return [row for row in body["items"] if row["batchId"] == batch_id]


@pytest.mark.anyio
async def test_batch_header_is_followed_by_its_video_rows(client: AsyncClient) -> None:
    batch_id, tickets = await _split_batch(client, deliverable_count=3)
    rows = _rows_for_batch(await _pipeline(client), batch_id)

    assert rows[0]["kind"] == "batch"
    assert rows[0]["totalVideoCount"] == 3
    assert rows[0]["openVideoCount"] == 3
    # Header carries no owner chip once split — each video owns its own.
    assert rows[0]["owner"] is None

    videos = rows[1:]
    assert [r["kind"] for r in videos] == ["video"] * 3
    assert [r["deliverableIndex"] for r in videos] == [1, 2, 3]
    assert {r["id"] for r in videos} == {t["id"] for t in tickets}


@pytest.mark.anyio
async def test_summary_counts_videos_not_batches(client: AsyncClient) -> None:
    before = (await _pipeline(client))["summary"]
    await _split_batch(client, deliverable_count=3)
    after = (await _pipeline(client))["summary"]

    # Three clips with the editor must move the count by three, not by one.
    assert after["withEditor"] - before["withEditor"] == 3


@pytest.mark.anyio
async def test_mixed_owners_are_all_visible(client: AsyncClient) -> None:
    """The case the old majority-vote rollup silently dropped."""
    batch_id, tickets = await _split_batch(client, deliverable_count=3)
    editor_headers = await _login(client, "editor@scalebrandslab.demo")

    before = (await _pipeline(client))["summary"]

    # Push one clip to SMM QA; the other two stay with the editor.
    moved = tickets[0]
    index = moved["deliverableIndex"]
    await client.patch(
        f"{config.API_V1_STR}/videos/{moved['id']}/production",
        headers=editor_headers,
        json={"editorPublishTitle": "Mixed owner clip"},
    )
    await client.post(
        f"{config.API_V1_STR}/videos/{moved['id']}/drive-sync",
        headers=editor_headers,
        json={
            "deliverableIndex": index,
            "video": _drive_entry(index, "video"),
            "thumbnail": _drive_entry(index, "thumbnail"),
        },
    )
    submitted = await client.post(
        f"{config.API_V1_STR}/videos/{moved['id']}/submit-to-smm-qa",
        headers=editor_headers,
        json={},
    )
    assert submitted.status_code == 200, submitted.text

    after = (await _pipeline(client))["summary"]
    assert after["withSmm"] - before["withSmm"] == 1
    assert after["withEditor"] - before["withEditor"] == -1

    owners = {
        row["deliverableIndex"]: row["owner"]
        for row in _rows_for_batch(await _pipeline(client), batch_id)
        if row["kind"] == "video"
    }
    assert owners[index] == "smm"
    assert sorted(owners.values()) == ["editor", "editor", "smm"]


@pytest.mark.anyio
async def test_presplit_batch_emits_only_a_header_with_an_owner(client: AsyncClient) -> None:
    """Before the split there are no per-clip cards, so the batch is the unit."""
    admin_headers = await _login(client, "admin@scalebrandslab.demo")
    client_headers = await _login(client, "client@scalebrandslab.demo")
    workspace = await client.get(
        f"{config.API_V1_STR}/client/workspace",
        headers=client_headers,
    )
    created = await client.post(
        f"{config.API_V1_STR}/admin/clients/{workspace.json()['client']['id']}/batches",
        headers=admin_headers,
        json={"title": f"Pre-split {uuid4().hex[:8]}", "creditCost": 1},
    )
    batch_id = created.json()["id"]

    rows = _rows_for_batch(await _pipeline(client), batch_id)
    assert len(rows) == 1
    assert rows[0]["kind"] == "batch"
    assert rows[0]["owner"] == "client"  # awaiting client intake
    assert rows[0]["totalVideoCount"] is None
