"""B3 client batch intake API tests."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.core.config import config
from app.db.session import get_session_factory
from app.models.batch import Batch
from app.models.enums import BatchStatus, PipelineStage
from app.services import drive_manifest_service
from app.services.drive_manifest_service import DriveManifestError


async def _login(client: AsyncClient, email: str, password: str = "demo1234") -> dict[str, str]:
    response = await client.post(
        f"{config.API_V1_STR}/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['accessToken']}"}


async def _create_intake_batch(
    client: AsyncClient,
) -> tuple[str, dict[str, str]]:
    """Admin creates a batch; returns (batch_id, client_auth_headers)."""
    admin_headers = await _login(client, "admin@scalebrandslab.demo")
    client_headers = await _login(client, "client@scalebrandslab.demo")
    client_ws = await client.get(
        f"{config.API_V1_STR}/client/workspace",
        headers=client_headers,
    )
    assert client_ws.status_code == 200
    client_id = client_ws.json()["client"]["id"]

    created = await client.post(
        f"{config.API_V1_STR}/admin/clients/{client_id}/batches",
        headers=admin_headers,
        json={"title": f"B3 intake {uuid4().hex[:8]}", "creditCost": 2},
    )
    assert created.status_code == 200, created.text
    return created.json()["id"], client_headers


@pytest.mark.anyio
async def test_submit_source_media_intake_clears_tickets(client: AsyncClient) -> None:
    batch_id, headers = await _create_intake_batch(client)
    response = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/intake",
        headers=headers,
        json={
            "intakePath": "source_media",
            "url": "https://www.youtube.com/watch?v=test-intake",
        },
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["batch"]["intakePath"] == "source_media"
    assert body["batch"]["sourceMediaUrl"] == "https://www.youtube.com/watch?v=test-intake"
    assert body["batch"]["clipReviewPhase"] == "smm_identifying"
    assert body["batch"]["pipelineStage"] == "clips_identifying"
    assert body["videos"] == []


@pytest.mark.anyio
async def test_submit_clips_ready_intake_creates_one_production_ticket_per_video(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def three_clips(_url: str) -> list[dict[str, object]]:
        return [
            {"index": 1, "name": "Customer story.mov"},
            {"index": 2, "name": "Product demo.mp4"},
            {"index": 3, "name": "Closing thought.webm"},
        ]

    monkeypatch.setattr(
        drive_manifest_service,
        "validate_clips_folder_for_intake",
        three_clips,
    )
    admin_headers = await _login(client, "admin@scalebrandslab.demo")
    provision = await client.post(
        f"{config.API_V1_STR}/admin/clients",
        headers=admin_headers,
        json={
            "loginId": f"b3.clips.{uuid4().hex[:8]}@scalebrandslab.demo",
            "displayName": "B3 Clips Client",
            "password": "testpass12",
            "initialCredits": 10,
        },
    )
    assert provision.status_code == 200, provision.text
    client_id = provision.json()["client"]["id"]
    credentials = provision.json()["credentials"]

    batch_create = await client.post(
        f"{config.API_V1_STR}/admin/clients/{client_id}/batches",
        headers=admin_headers,
        json={"title": "B3 Clips Ready Batch", "creditCost": 3},
    )
    assert batch_create.status_code == 200, batch_create.text
    batch_id = batch_create.json()["id"]

    client_headers = await _login(
        client,
        credentials["email"],
        credentials["password"],
    )
    response = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/intake",
        headers=client_headers,
        json={
            "intakePath": "clips_ready",
            "url": "https://drive.google.com/drive/folders/b3-test",
        },
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["batch"]["intakePath"] == "clips_ready"
    assert body["batch"]["clipReviewPhase"] == "approved"
    assert body["batch"]["pipelineStage"] == "production"
    assert body["batch"]["videoCount"] == 3
    assert [ticket["deliverableIndex"] for ticket in body["videos"]] == [1, 2, 3]
    assert [ticket["title"] for ticket in body["videos"]] == [
        "Customer story.mov",
        "Product demo.mp4",
        "Closing thought.webm",
    ]
    assert all(ticket["owner"] == "editor" for ticket in body["videos"])


@pytest.mark.anyio
async def test_unshared_clips_folder_does_not_advance_batch(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    batch_id, headers = await _create_intake_batch(client)

    async def no_access(_url: str) -> list[dict[str, object]]:
        raise DriveManifestError(
            "Studio cannot access this folder. Share it with the Studio service account as Viewer, then try again.",
            code="DRIVE_FOLDER_NOT_SHARED",
        )

    monkeypatch.setattr(
        drive_manifest_service,
        "validate_clips_folder_for_intake",
        no_access,
    )
    response = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/intake",
        headers=headers,
        json={
            "intakePath": "clips_ready",
            "url": "https://drive.google.com/drive/folders/not-shared",
        },
    )
    assert response.status_code == 422
    assert response.json()["error_code"] == "DRIVE_FOLDER_NOT_SHARED"

    factory = get_session_factory()
    async with factory() as session:
        batch = await session.get(Batch, batch_id)
        assert batch is not None
        assert batch.intake_path is None
        assert batch.clips_folder_url is None
        assert batch.video_count == 0
        assert batch.pipeline_stage == PipelineStage.intake_pending


@pytest.mark.anyio
async def test_intake_forbidden_for_editor(client: AsyncClient) -> None:
    batch_id, _ = await _create_intake_batch(client)
    headers = await _login(client, "editor@scalebrandslab.demo")
    response = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/intake",
        headers=headers,
        json={"intakePath": "source_media", "url": "https://example.com/v"},
    )
    assert response.status_code == 403


@pytest.mark.anyio
async def test_intake_404_for_other_client_batch(client: AsyncClient) -> None:
    admin_headers = await _login(client, "admin@scalebrandslab.demo")
    admin_ws = await client.get(
        f"{config.API_V1_STR}/admin/workspace",
        headers=admin_headers,
    )
    assert admin_ws.status_code == 200
    batches = admin_ws.json()["batches"]
    if not batches:
        pytest.skip("No batches in seed")
    batch_id = batches[0]["id"]

    client_headers = await _login(client, "client@scalebrandslab.demo")
    client_ws = await client.get(
        f"{config.API_V1_STR}/client/workspace",
        headers=client_headers,
    )
    own_ids = {b["id"] for b in client_ws.json()["batches"]}
    if batch_id in own_ids:
        pytest.skip("Single client in seed — cannot test cross-tenant 404")

    response = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/intake",
        headers=client_headers,
        json={"intakePath": "source_media", "url": "https://example.com/v"},
    )
    assert response.status_code == 404


@pytest.mark.anyio
async def test_intake_409_when_already_submitted(client: AsyncClient) -> None:
    batch_id, headers = await _create_intake_batch(client)

    first = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/intake",
        headers=headers,
        json={"intakePath": "source_media", "url": "https://example.com/first"},
    )
    assert first.status_code == 200, first.text

    second = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/intake",
        headers=headers,
        json={"intakePath": "source_media", "url": "https://example.com/second"},
    )
    assert second.status_code == 409


@pytest.mark.anyio
async def test_intake_422_empty_url(client: AsyncClient) -> None:
    batch_id, headers = await _create_intake_batch(client)
    response = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/intake",
        headers=headers,
        json={"intakePath": "source_media", "url": "   "},
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_intake_422_inactive_batch(client: AsyncClient) -> None:
    admin_headers = await _login(client, "admin@scalebrandslab.demo")
    provision = await client.post(
        f"{config.API_V1_STR}/admin/clients",
        headers=admin_headers,
        json={
            "loginId": f"b3.inactive.{uuid4().hex[:8]}@scalebrandslab.demo",
            "displayName": "B3 Inactive Batch Client",
            "password": "testpass12",
            "initialCredits": 5,
        },
    )
    assert provision.status_code == 200
    client_id = provision.json()["client"]["id"]
    credentials = provision.json()["credentials"]

    batch_create = await client.post(
        f"{config.API_V1_STR}/admin/clients/{client_id}/batches",
        headers=admin_headers,
        json={"title": "Inactive Test", "creditCost": 1},
    )
    batch_id = batch_create.json()["id"]

    factory = get_session_factory()
    async with factory() as session:
        batch = await session.get(Batch, batch_id)
        assert batch is not None
        batch.status = BatchStatus.completed
        session.add(batch)
        await session.commit()

    client_headers = await _login(
        client,
        credentials["email"],
        credentials["password"],
    )
    response = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/intake",
        headers=client_headers,
        json={"intakePath": "source_media", "url": "https://example.com/v"},
    )
    assert response.status_code == 422
