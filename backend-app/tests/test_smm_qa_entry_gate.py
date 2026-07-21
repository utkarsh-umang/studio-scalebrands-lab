"""Who must finish what before a video enters SMM QA.

Entry is gated on the video plus whatever this batch assigns to the submitter.
The all-three requirement lives at client release instead — enforcing it at entry
blocked the editor on steps they do not own (an SMM-owned title is written during
review, i.e. after the handoff).
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
        "driveFileId": f"gate-{kind}-{index}",
        "name": f"{index}.{'mov' if kind == 'video' else 'png'}",
        "mimeType": "video/quicktime" if kind == "video" else "image/png",
        "modifiedTime": "2026-05-15T16:49:06.328Z",
    }


async def _batch_with_video_only(
    client: AsyncClient,
    *,
    thumbnail_owner: str | None = None,
    title_owner: str | None = None,
) -> tuple[str, dict[str, str]]:
    """Split batch where the editor has delivered the video and nothing else."""
    admin_headers = await _login(client, "admin@scalebrandslab.demo")
    client_headers = await _login(client, "client@scalebrandslab.demo")
    editor_headers = await _login(client, "editor@scalebrandslab.demo")

    workspace = await client.get(
        f"{config.API_V1_STR}/client/workspace",
        headers=client_headers,
    )
    created = await client.post(
        f"{config.API_V1_STR}/admin/clients/{workspace.json()['client']['id']}/batches",
        headers=admin_headers,
        json={"title": f"Entry gate {uuid4().hex[:8]}", "creditCost": 1},
    )
    batch_id = created.json()["id"]

    assigned = await client.patch(
        f"{config.API_V1_STR}/admin/batches/{batch_id}/assignments",
        headers=admin_headers,
        json={"thumbnailOwnerKind": thumbnail_owner, "titleOwnerKind": title_owner},
    )
    assert assigned.status_code == 200, assigned.text

    await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/intake",
        headers=client_headers,
        json={
            "intakePath": "clips_ready",
            "url": "https://drive.google.com/drive/folders/gate-clips",
        },
    )
    split = await client.post(
        f"{config.API_V1_STR}/editor/batches/{batch_id}/deliverables-drive",
        headers=editor_headers,
        json={
            "deliverablesDriveUrl": "https://drive.google.com/drive/folders/gate-deliverables",
            "deliverableCount": 1,
        },
    )
    ticket_id = next(
        v["id"] for v in split.json()["videos"] if (v.get("deliverableIndex") or 0) == 1
    )

    # Video only — no thumbnail, no title.
    synced = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/drive-sync",
        headers=editor_headers,
        json={"deliverableIndex": 1, "video": _drive_entry(1, "video")},
    )
    assert synced.status_code == 200, synced.text
    return ticket_id, editor_headers


async def _submit(client: AsyncClient, ticket_id: str, headers: dict[str, str]):
    return await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/submit-to-smm-qa",
        headers=headers,
        json={},
    )


@pytest.mark.anyio
async def test_editor_hands_off_when_title_belongs_to_smm(client: AsyncClient) -> None:
    """The case that used to deadlock: SMM writes the title during review."""
    ticket_id, editor_headers = await _batch_with_video_only(client, title_owner="smm")
    response = await _submit(client, ticket_id, editor_headers)
    assert response.status_code == 200, response.text
    assert response.json()["ticket"]["pipelineStage"] == "smm_qa"


@pytest.mark.anyio
async def test_editor_hands_off_when_thumbnail_belongs_to_client(client: AsyncClient) -> None:
    ticket_id, editor_headers = await _batch_with_video_only(client, thumbnail_owner="client")
    response = await _submit(client, ticket_id, editor_headers)
    assert response.status_code == 200, response.text


@pytest.mark.anyio
async def test_editor_hands_off_when_owners_are_unassigned(client: AsyncClient) -> None:
    """Unassigned is the admin's call to make, so it must not block the editor."""
    ticket_id, editor_headers = await _batch_with_video_only(client)
    response = await _submit(client, ticket_id, editor_headers)
    assert response.status_code == 200, response.text


@pytest.mark.anyio
async def test_editor_is_blocked_on_their_own_title(client: AsyncClient) -> None:
    ticket_id, editor_headers = await _batch_with_video_only(client, title_owner="editor")
    response = await _submit(client, ticket_id, editor_headers)
    assert response.status_code == 422, response.text
    assert response.json()["details"]["missing"] == ["title"]


@pytest.mark.anyio
async def test_editor_is_blocked_on_their_own_thumbnail(client: AsyncClient) -> None:
    ticket_id, editor_headers = await _batch_with_video_only(client, thumbnail_owner="editor")
    response = await _submit(client, ticket_id, editor_headers)
    assert response.status_code == 422, response.text
    assert response.json()["details"]["missing"] == ["thumbnail"]


@pytest.mark.anyio
async def test_client_release_still_requires_team_owned_assets(client: AsyncClient) -> None:
    """An SMM-owned title is the team's to produce, so it still gates release."""
    ticket_id, editor_headers = await _batch_with_video_only(client, title_owner="smm")
    assert (await _submit(client, ticket_id, editor_headers)).status_code == 200

    smm_headers = await _login(client, "smm@scalebrandslab.demo")
    approved = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/smm-qa",
        headers=smm_headers,
        json={"action": "approve"},
    )
    assert approved.status_code == 422, approved.text
    missing = approved.json()["details"]["missing"]
    assert "title" in missing
    assert "thumbnail" in missing


@pytest.mark.anyio
async def test_smm_writes_their_title_during_qa_then_approves(client: AsyncClient) -> None:
    """The dead end: the SMM must be able to fill their own assets while reviewing."""
    ticket_id, editor_headers = await _batch_with_video_only(
        client, title_owner="smm", thumbnail_owner="smm"
    )
    assert (await _submit(client, ticket_id, editor_headers)).status_code == 200

    smm_headers = await _login(client, "smm@scalebrandslab.demo")
    titled = await client.patch(
        f"{config.API_V1_STR}/videos/{ticket_id}/production",
        headers=smm_headers,
        json={"editorPublishTitle": "Written by the SMM during review"},
    )
    assert titled.status_code == 200, titled.text

    synced = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/drive-sync",
        headers=smm_headers,
        json={"deliverableIndex": 1, "thumbnail": _drive_entry(1, "thumbnail")},
    )
    assert synced.status_code == 200, synced.text

    approved = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/smm-qa",
        headers=smm_headers,
        json={"action": "approve"},
    )
    assert approved.status_code == 200, approved.text
    assert approved.json()["ticket"]["pipelineStage"] == "client_qa"


@pytest.mark.anyio
async def test_client_owned_thumbnail_does_not_block_client_release(
    client: AsyncClient,
) -> None:
    """The client may send thumbnails last — QA of the video should not wait."""
    ticket_id, editor_headers = await _batch_with_video_only(
        client, thumbnail_owner="client", title_owner="smm"
    )
    assert (await _submit(client, ticket_id, editor_headers)).status_code == 200

    smm_headers = await _login(client, "smm@scalebrandslab.demo")
    await client.patch(
        f"{config.API_V1_STR}/videos/{ticket_id}/production",
        headers=smm_headers,
        json={"editorPublishTitle": "Title from SMM"},
    )
    approved = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/smm-qa",
        headers=smm_headers,
        json={"action": "approve"},
    )
    assert approved.status_code == 200, approved.text
    assert approved.json()["ticket"]["pipelineStage"] == "client_qa"


@pytest.mark.anyio
async def test_scheduling_refuses_a_missing_thumbnail(client: AsyncClient) -> None:
    """Publishing is the backstop: everything must exist, whoever owned it."""
    ticket_id, editor_headers = await _batch_with_video_only(
        client, thumbnail_owner="client", title_owner="smm"
    )
    await _submit(client, ticket_id, editor_headers)

    smm_headers = await _login(client, "smm@scalebrandslab.demo")
    client_headers = await _login(client, "client@scalebrandslab.demo")
    await client.patch(
        f"{config.API_V1_STR}/videos/{ticket_id}/production",
        headers=smm_headers,
        json={"editorPublishTitle": "Title from SMM"},
    )
    await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/smm-qa",
        headers=smm_headers,
        json={"action": "approve"},
    )
    # Client approves the package even though their thumbnail is still missing.
    await client.post(
        f"{config.API_V1_STR}/client/videos/{ticket_id}/client-qa",
        headers=client_headers,
        json={"action": "approve"},
    )

    scheduled = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/schedule",
        headers=smm_headers,
        json={
            "platform": "YouTube Shorts",
            "goLiveDate": "2026-08-01",
            "goLiveTime": "18:30",
        },
    )
    assert scheduled.status_code == 422, scheduled.text
    assert scheduled.json()["details"]["missing"] == ["thumbnail"]
