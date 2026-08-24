"""B8 client final QA and SMM revision triage API tests."""

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
        "driveFileId": f"b8-{kind}-{index}",
        "name": f"{index}.{'mov' if kind == 'video' else 'png'}",
        "mimeType": "video/quicktime" if kind == "video" else "image/png",
        "modifiedTime": "2026-05-15T16:49:06.328Z",
    }


async def _ticket_in_client_qa(
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
        json={"title": f"B8 batch {uuid4().hex[:8]}", "creditCost": 2},
    )
    batch_id = created.json()["id"]

    await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/intake",
        headers=client_headers,
        json={
            "intakePath": "source_media",
            "url": "https://www.youtube.com/watch?v=b8-source",
        },
    )

    submit_clips = await client.post(
        f"{config.API_V1_STR}/batches/{batch_id}/clips-folder",
        headers=smm_headers,
        json={"clipsFolderUrl": "https://drive.google.com/drive/folders/b8-clips"},
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
            "deliverablesDriveUrl": "https://drive.google.com/drive/folders/b8-deliverables",
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
    approve = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/smm-qa",
        headers=smm_headers,
        json={"action": "approve"},
    )
    assert approve.status_code == 200, approve.text

    return batch_id, ticket_id, client_headers, smm_headers


@pytest.mark.anyio
async def test_client_approve_moves_to_scheduling(client: AsyncClient) -> None:
    _, ticket_id, client_headers, _ = await _ticket_in_client_qa(client)

    response = await client.post(
        f"{config.API_V1_STR}/client/videos/{ticket_id}/client-qa",
        headers=client_headers,
        json={"action": "approve"},
    )
    assert response.status_code == 200, response.text
    body = response.json()["ticket"]
    assert body["owner"] == "scheduling"
    assert body["pipelineStage"] == "scheduling"
    assert body["releasedToClientFinalReview"] is False
    assert body["editorWorkflowPhase"] == "handed_off"


@pytest.mark.anyio
async def test_client_reject_routes_directly_to_editor(client: AsyncClient) -> None:
    _, ticket_id, client_headers, _ = await _ticket_in_client_qa(client)

    response = await client.post(
        f"{config.API_V1_STR}/client/videos/{ticket_id}/client-qa",
        headers=client_headers,
        json={
            "action": "reject",
            "commentBody": "Thumbnail feels off-brand",
        },
    )
    assert response.status_code == 200, response.text
    body = response.json()["ticket"]
    assert body["owner"] == "editor"
    assert body["pipelineStage"] == "editor_fix"
    assert body["lastRevisionRequestedBy"] == "client"
    comments = body["qaCommentHistory"]
    assert len(comments) == 1
    assert comments[0]["authorRole"] == "client"
    assert comments[0]["body"] == "Thumbnail feels off-brand"


@pytest.mark.anyio
async def test_client_reject_requires_feedback(client: AsyncClient) -> None:
    _, ticket_id, client_headers, _ = await _ticket_in_client_qa(client)

    response = await client.post(
        f"{config.API_V1_STR}/client/videos/{ticket_id}/client-qa",
        headers=client_headers,
        json={"action": "reject", "commentBody": "   "},
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_append_client_qa_comment_without_stage_change(client: AsyncClient) -> None:
    _, ticket_id, client_headers, _ = await _ticket_in_client_qa(client)

    response = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/qa-comments",
        headers=client_headers,
        json={"body": "Optional note before approve"},
    )
    assert response.status_code == 200, response.text
    assert response.json()["ticket"]["pipelineStage"] == "client_qa"
    assert response.json()["comment"]["authorRole"] == "client"


@pytest.mark.anyio
async def test_client_can_request_changes_from_existing_timed_comment(
    client: AsyncClient,
) -> None:
    _, ticket_id, client_headers, _ = await _ticket_in_client_qa(client)

    comment = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/qa-comments",
        headers=client_headers,
        json={"body": "Please tighten this cut", "atSeconds": 11},
    )
    assert comment.status_code == 200, comment.text
    assert comment.json()["comment"]["kind"] == "timestamp"

    response = await client.post(
        f"{config.API_V1_STR}/client/videos/{ticket_id}/client-qa",
        headers=client_headers,
        json={"action": "reject"},
    )
    assert response.status_code == 200, response.text
    assert response.json()["ticket"]["pipelineStage"] == "editor_fix"


@pytest.mark.anyio
async def test_client_revision_skips_smm_triage(client: AsyncClient) -> None:
    _, ticket_id, client_headers, smm_headers = await _ticket_in_client_qa(client)

    reject = await client.post(
        f"{config.API_V1_STR}/client/videos/{ticket_id}/client-qa",
        headers=client_headers,
        json={"action": "reject", "commentBody": "Fix the hook"},
    )
    assert reject.status_code == 200, reject.text

    to_editor = await client.post(
        f"{config.API_V1_STR}/videos/{ticket_id}/client-revision-triage",
        headers=smm_headers,
        json={"route": "editor"},
    )
    assert to_editor.status_code == 422, to_editor.text


@pytest.mark.anyio
async def test_client_can_edit_title_during_final_review(client: AsyncClient) -> None:
    _, ticket_id, client_headers, _ = await _ticket_in_client_qa(client)

    response = await client.post(
        f"{config.API_V1_STR}/client/videos/{ticket_id}/title",
        headers=client_headers,
        json={"title": "Client-approved final title"},
    )
    assert response.status_code == 200, response.text
    assert response.json()["ticket"]["editorPublishTitle"] == "Client-approved final title"
