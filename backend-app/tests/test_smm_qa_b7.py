"""B7 SMM internal QA and editor resubmit API tests."""

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


def _drive_entry(index: int, kind: str) -> dict:
    return {
        "index": index,
        "driveFileId": f"b7-{kind}-{index}",
        "name": f"{index}.{'mov' if kind == 'video' else 'png'}",
        "mimeType": "video/quicktime" if kind == "video" else "image/png",
        "modifiedTime": "2026-05-15T16:49:06.328Z",
    }


async def _ticket_in_smm_qa(
    client: AsyncClient,
) -> tuple[str, str, dict[str, str], dict[str, str]]:
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
        json={"title": f"B7 batch {uuid4().hex[:8]}", "creditCost": 2},
    )
    batch_id = created.json()["id"]

    await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/intake",
        headers=client_headers,
        json={
            "intakePath": "source_media",
            "url": "https://www.youtube.com/watch?v=b7-source",
        },
    )

    submit_clips = await client.post(
        f"{config.API_V1_STR}/batches/{batch_id}/clips-folder",
        headers=smm_headers,
        json={"clipsFolderUrl": "https://drive.google.com/drive/folders/b7-clips"},
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
            "deliverablesDriveUrl": "https://drive.google.com/drive/folders/b7-deliverables",
            "deliverableCount": 1,
        },
    )
    ticket_id = split.json()["videos"][0]["id"]

    await client.patch(
        f"{config.API_V1_STR}/videos/{ticket_id}/production",
        headers=editor_headers,
        json={"editorPublishTitle": "Hook — 0:45"},
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
    await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/submit-to-smm-qa",
        headers=editor_headers,
        json={},
    )

    return batch_id, ticket_id, smm_headers, editor_headers


@pytest.mark.anyio
async def test_smm_approve_releases_to_client_qa(client: AsyncClient) -> None:
    _, ticket_id, smm_headers, _ = await _ticket_in_smm_qa(client)

    approve = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/smm-qa",
        headers=smm_headers,
        json={"action": "approve"},
    )
    assert approve.status_code == 200, approve.text
    body = approve.json()
    assert body["ticket"]["owner"] == "client"
    assert body["ticket"]["pipelineStage"] == "client_qa"
    assert body["ticket"]["releasedToClientFinalReview"] is True


@pytest.mark.anyio
async def test_smm_send_back_and_editor_resubmit(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, ticket_id, smm_headers, editor_headers = await _ticket_in_smm_qa(client)

    send_back = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/smm-qa",
        headers=smm_headers,
        json={
            "action": "send_back",
            "commentBody": "Trim the hook before 0:08",
        },
    )
    assert send_back.status_code == 200, send_back.text
    flagged = send_back.json()["ticket"]
    assert flagged["owner"] == "editor"
    assert flagged["pipelineStage"] == "editor_fix"
    assert "qa flagged" in flagged["stageLabel"].lower()
    assert len(flagged["qaCommentHistory"]) == 1
    assert flagged["qaCommentHistory"][0]["body"] == "Trim the hook before 0:08"

    blocked = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/resubmit-to-smm-qa",
        headers=editor_headers,
        json={"bumpVideoVersion": False},
    )
    assert blocked.status_code == 422

    async def fake_presign(*_args: object, **_kwargs: object) -> str:
        return "https://storage.example.test/upload"

    monkeypatch.setattr(object_storage_service, "create_presigned_put", fake_presign)
    initiated = await client.post(
        f"{config.API_V1_STR}/media/videos/{ticket_id}/uploads",
        headers=editor_headers,
        json={
            "kind": "video",
            "filename": "replacement-v2.mp4",
            "contentType": "video/mp4",
            "sizeBytes": 256,
        },
    )
    assert initiated.status_code == 200, initiated.text
    asset_id = initiated.json()["asset"]["id"]
    assert initiated.json()["asset"]["version"] == 2

    async def fake_head(_object_key: str) -> dict[str, object]:
        return {
            "ContentLength": 256,
            "ETag": '"replacement-etag"',
            "Metadata": {"studio-asset-id": asset_id},
        }

    monkeypatch.setattr(object_storage_service, "head_object", fake_head)
    completed = await client.post(
        f"{config.API_V1_STR}/media/uploads/{asset_id}/complete",
        headers=editor_headers,
        json={},
    )
    assert completed.status_code == 200, completed.text

    resubmit = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/resubmit-to-smm-qa",
        headers=editor_headers,
        json={"bumpVideoVersion": False},
    )
    assert resubmit.status_code == 200, resubmit.text
    body = resubmit.json()["ticket"]
    assert body["owner"] == "smm"
    assert body["pipelineStage"] == "smm_qa"
    assert body["assetVersions"]["video"] == 2
    assert body["qaCommentHistory"][0]["deprecated"] is True


@pytest.mark.anyio
async def test_append_smm_qa_comment_without_stage_change(client: AsyncClient) -> None:
    _, ticket_id, smm_headers, _ = await _ticket_in_smm_qa(client)

    comment = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/qa-comments",
        headers=smm_headers,
        json={"body": "Optional note before approve"},
    )
    assert comment.status_code == 200, comment.text
    assert comment.json()["ticket"]["pipelineStage"] == "smm_qa"
    assert comment.json()["comment"]["body"] == "Optional note before approve"


@pytest.mark.anyio
async def test_timestamped_comment_with_image_attachment(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _, ticket_id, smm_headers, _ = await _ticket_in_smm_qa(client)

    async def fake_presign(*_args: object, **_kwargs: object) -> str:
        return "https://storage.example.test/upload"

    monkeypatch.setattr(object_storage_service, "create_presigned_put", fake_presign)
    initiated = await client.post(
        f"{config.API_V1_STR}/media/videos/{ticket_id}/uploads",
        headers=smm_headers,
        json={
            "kind": "qa_attachment",
            "filename": "reference.gif",
            "contentType": "image/gif",
            "sizeBytes": 128,
        },
    )
    assert initiated.status_code == 200, initiated.text
    asset_id = initiated.json()["asset"]["id"]

    async def fake_head(_object_key: str) -> dict[str, object]:
        return {
            "ContentLength": 128,
            "ETag": '"attachment-etag"',
            "Metadata": {"studio-asset-id": asset_id},
        }

    monkeypatch.setattr(object_storage_service, "head_object", fake_head)
    completed = await client.post(
        f"{config.API_V1_STR}/media/uploads/{asset_id}/complete",
        headers=smm_headers,
        json={},
    )
    assert completed.status_code == 200, completed.text

    comment = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/qa-comments",
        headers=smm_headers,
        json={
            "body": "Match this animation at the cut.",
            "atSeconds": 14,
            "attachmentAssetIds": [asset_id],
        },
    )
    assert comment.status_code == 200, comment.text
    body = comment.json()["comment"]
    assert body["kind"] == "timestamp"
    assert body["atSeconds"] == 14
    assert body["attachments"] == [
        {
            "assetId": asset_id,
            "fileName": "reference.gif",
            "contentType": "image/gif",
        }
    ]

    send_back = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/smm-qa",
        headers=smm_headers,
        json={"action": "send_back"},
    )
    assert send_back.status_code == 200, send_back.text
    assert send_back.json()["ticket"]["pipelineStage"] == "editor_fix"


@pytest.mark.anyio
async def test_send_back_requires_feedback(client: AsyncClient) -> None:
    _, ticket_id, smm_headers, _ = await _ticket_in_smm_qa(client)

    response = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/smm-qa",
        headers=smm_headers,
        json={"action": "send_back", "commentBody": "   "},
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_internal_smm_comments_are_hidden_from_client_reads(client: AsyncClient) -> None:
    batch_id, ticket_id, smm_headers, _ = await _ticket_in_smm_qa(client)
    client_headers = await _login(client, "client@scalebrandslab.demo")

    comment = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/qa-comments",
        headers=smm_headers,
        json={"body": "Internal pacing note", "atSeconds": 4},
    )
    assert comment.status_code == 200, comment.text
    approved = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/smm-qa",
        headers=smm_headers,
        json={"action": "approve"},
    )
    assert approved.status_code == 200, approved.text
    assert approved.json()["ticket"]["qaCommentHistory"][0]["deprecated"] is True

    workspace = await client.get(
        f"{config.API_V1_STR}/client/workspace",
        headers=client_headers,
    )
    client_ticket = next(row for row in workspace.json()["videos"] if row["id"] == ticket_id)
    assert client_ticket["qaCommentHistory"] == []

    detail = await client.get(
        f"{config.API_V1_STR}/batches/{batch_id}",
        headers=client_headers,
    )
    detail_ticket = next(row for row in detail.json()["videos"] if row["id"] == ticket_id)
    assert detail_ticket["qaCommentHistory"] == []
