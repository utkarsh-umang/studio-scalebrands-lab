"""B4 clips folder and client clip review API tests."""

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


async def _create_source_media_batch(
    client: AsyncClient,
) -> tuple[str, dict[str, str], dict[str, str]]:
    """Returns batch_id, client_headers, smm_headers."""
    admin_headers = await _login(client, "admin@scalebrandslab.demo")
    client_headers = await _login(client, "client@scalebrandslab.demo")
    smm_headers = await _login(client, "smm@scalebrandslab.demo")

    client_ws = await client.get(
        f"{config.API_V1_STR}/client/workspace",
        headers=client_headers,
    )
    client_id = client_ws.json()["client"]["id"]

    created = await client.post(
        f"{config.API_V1_STR}/admin/clients/{client_id}/batches",
        headers=admin_headers,
        json={"title": f"B4 batch {uuid4().hex[:8]}", "creditCost": 2},
    )
    assert created.status_code == 200, created.text
    batch_id = created.json()["id"]

    intake = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/intake",
        headers=client_headers,
        json={
            "intakePath": "source_media",
            "url": "https://www.youtube.com/watch?v=b4-source",
        },
    )
    assert intake.status_code == 200, intake.text
    return batch_id, client_headers, smm_headers


@pytest.mark.anyio
async def test_clips_folder_submit_and_client_approve_loop(client: AsyncClient) -> None:
    batch_id, client_headers, smm_headers = await _create_source_media_batch(client)

    submit = await client.post(
        f"{config.API_V1_STR}/batches/{batch_id}/clips-folder",
        headers=smm_headers,
        json={"clipsFolderUrl": "https://drive.google.com/drive/folders/b4-clips"},
    )
    assert submit.status_code == 200, submit.text
    body = submit.json()
    assert body["batch"]["clipReviewPhase"] == "awaiting_client"
    assert body["batch"]["pipelineStage"] == "clip_client_review"
    assert len(body["videos"]) >= 1
    gate = next(
        (v for v in body["videos"] if v["title"] == "Clip approval"),
        body["videos"][0],
    )

    approve = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/clips/approve",
        headers=client_headers,
        json={"videoTicketId": gate["id"], "clipCount": 6},
    )
    assert approve.status_code == 200, approve.text
    approved = approve.json()
    assert approved["batch"]["clipReviewPhase"] == "approved"
    assert approved["batch"]["pipelineStage"] == "pre_split_production"
    assert approved["batch"]["videoCount"] == 6
    assert all(v["owner"] == "editor" for v in approved["videos"] if v["deliverableIndex"] is None)


@pytest.mark.anyio
async def test_client_reject_clips_returns_to_smm(client: AsyncClient) -> None:
    batch_id, client_headers, smm_headers = await _create_source_media_batch(client)

    submit = await client.post(
        f"{config.API_V1_STR}/batches/{batch_id}/clips-folder",
        headers=smm_headers,
        json={"clipsFolderUrl": "https://drive.google.com/drive/folders/b4-reject"},
    )
    assert submit.status_code == 200
    gate_id = submit.json()["videos"][0]["id"]

    reject = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/clips/reject",
        headers=client_headers,
        json={"videoTicketId": gate_id, "note": "Clips 3 and 7 are off-brand"},
    )
    assert reject.status_code == 200, reject.text
    rejected = reject.json()
    assert rejected["batch"]["clipReviewPhase"] == "with_smm"
    assert rejected["batch"]["pipelineStage"] == "clips_identifying"

    gate = next(v for v in rejected["videos"] if v["id"] == gate_id)
    assert gate["owner"] == "smm"
    assert len(gate["qaCommentHistory"]) == 1
    assert gate["qaCommentHistory"][0]["kind"] == "clip_note"
    assert gate["qaCommentHistory"][0]["body"] == "Clips 3 and 7 are off-brand"


@pytest.mark.anyio
async def test_clips_ready_batch_rejects_b4_routes(client: AsyncClient) -> None:
    admin_headers = await _login(client, "admin@scalebrandslab.demo")
    client_headers = await _login(client, "client@scalebrandslab.demo")
    # Use the demo client so the demo SMM is deterministically assigned to it.
    client_ws = await client.get(
        f"{config.API_V1_STR}/client/workspace", headers=client_headers
    )
    client_id = client_ws.json()["client"]["id"]

    batch_create = await client.post(
        f"{config.API_V1_STR}/admin/clients/{client_id}/batches",
        headers=admin_headers,
        json={"title": f"Clips Ready Skip {uuid4().hex[:8]}", "creditCost": 1},
    )
    batch_id = batch_create.json()["id"]

    intake = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/intake",
        headers=client_headers,
        json={
            "intakePath": "clips_ready",
            "url": "https://drive.google.com/drive/folders/ready",
        },
    )
    assert intake.status_code == 200

    smm_headers = await _login(client, "smm@scalebrandslab.demo")
    submit = await client.post(
        f"{config.API_V1_STR}/batches/{batch_id}/clips-folder",
        headers=smm_headers,
        json={"clipsFolderUrl": "https://drive.google.com/drive/folders/x"},
    )
    assert submit.status_code == 422

    approve = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/clips/approve",
        headers=client_headers,
        json={"videoTicketId": intake.json()["videos"][0]["id"]},
    )
    assert approve.status_code == 422


@pytest.mark.anyio
async def test_reject_requires_note(client: AsyncClient) -> None:
    batch_id, client_headers, smm_headers = await _create_source_media_batch(client)
    submit = await client.post(
        f"{config.API_V1_STR}/batches/{batch_id}/clips-folder",
        headers=smm_headers,
        json={"clipsFolderUrl": "https://drive.google.com/drive/folders/b4"},
    )
    gate_id = submit.json()["videos"][0]["id"]

    reject = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/clips/reject",
        headers=client_headers,
        json={"videoTicketId": gate_id, "note": "   "},
    )
    assert reject.status_code == 422


@pytest.mark.anyio
async def test_editor_can_submit_clips_folder(client: AsyncClient) -> None:
    batch_id, _, editor_headers = await _create_source_media_batch(client)
    editor_headers = await _login(client, "editor@scalebrandslab.demo")
    response = await client.post(
        f"{config.API_V1_STR}/batches/{batch_id}/clips-folder",
        headers=editor_headers,
        json={"clipsFolderUrl": "https://drive.google.com/drive/folders/editor"},
    )
    assert response.status_code == 200, response.text
