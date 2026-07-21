"""Client-owned thumbnails folder and titles.

Some clients produce their own thumbnails and titles and only outsource the
editing. The admin marks those steps client-owned on the batch, which is what
opens the client's write paths — without that flag the team owns the asset and
the client must not be able to overwrite it.
"""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.core.config import config

THUMBS_URL = "https://drive.google.com/drive/folders/client-thumbs-abc123"


async def _login(client: AsyncClient, email: str, password: str = "demo1234") -> dict[str, str]:
    response = await client.post(
        f"{config.API_V1_STR}/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['accessToken']}"}


async def _batch_with_owners(
    client: AsyncClient,
    **owners: str | None,
) -> tuple[str, dict[str, str], dict[str, str]]:
    """Create a batch and set its shared-step owners.

    Returns (batch_id, client_headers, admin_headers).
    """
    admin_headers = await _login(client, "admin@scalebrandslab.demo")
    client_headers = await _login(client, "client@scalebrandslab.demo")
    workspace = await client.get(
        f"{config.API_V1_STR}/client/workspace",
        headers=client_headers,
    )
    client_id = workspace.json()["client"]["id"]

    created = await client.post(
        f"{config.API_V1_STR}/admin/clients/{client_id}/batches",
        headers=admin_headers,
        json={"title": f"Client assets {uuid4().hex[:8]}", "creditCost": 2},
    )
    assert created.status_code == 200, created.text
    batch_id = created.json()["id"]

    assigned = await client.patch(
        f"{config.API_V1_STR}/admin/batches/{batch_id}/assignments",
        headers=admin_headers,
        json={
            "clipOwnerKind": owners.get("clip"),
            "thumbnailOwnerKind": owners.get("thumbnail"),
            "titleOwnerKind": owners.get("title"),
        },
    )
    assert assigned.status_code == 200, assigned.text
    return batch_id, client_headers, admin_headers


@pytest.mark.anyio
async def test_admin_can_assign_client_as_owner(client: AsyncClient) -> None:
    _, _, _ = await _batch_with_owners(client, thumbnail="client", title="client")


@pytest.mark.anyio
async def test_assignments_still_reject_unknown_owner(client: AsyncClient) -> None:
    batch_id, _, admin_headers = await _batch_with_owners(client)
    response = await client.patch(
        f"{config.API_V1_STR}/admin/batches/{batch_id}/assignments",
        headers=admin_headers,
        json={"thumbnailOwnerKind": "nobody"},
    )
    assert response.status_code == 422, response.text


@pytest.mark.anyio
async def test_client_submits_own_thumbnails_folder(client: AsyncClient) -> None:
    batch_id, headers, _ = await _batch_with_owners(client, thumbnail="client")
    response = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/thumbnails-folder",
        headers=headers,
        json={"url": THUMBS_URL},
    )
    assert response.status_code == 200, response.text
    assert response.json()["batch"]["clientThumbnailsFolderUrl"] == THUMBS_URL


@pytest.mark.anyio
async def test_client_can_resubmit_to_correct_a_wrong_link(client: AsyncClient) -> None:
    batch_id, headers, _ = await _batch_with_owners(client, thumbnail="client")
    for url in (THUMBS_URL, f"{THUMBS_URL}-corrected"):
        response = await client.post(
            f"{config.API_V1_STR}/client/batches/{batch_id}/thumbnails-folder",
            headers=headers,
            json={"url": url},
        )
        assert response.status_code == 200, response.text
    assert response.json()["batch"]["clientThumbnailsFolderUrl"] == f"{THUMBS_URL}-corrected"


@pytest.mark.anyio
async def test_client_thumbnails_rejected_when_team_owns_them(client: AsyncClient) -> None:
    batch_id, headers, _ = await _batch_with_owners(client, thumbnail="smm")
    response = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/thumbnails-folder",
        headers=headers,
        json={"url": THUMBS_URL},
    )
    assert response.status_code == 403, response.text


@pytest.mark.anyio
async def test_client_thumbnails_rejected_when_owner_unset(client: AsyncClient) -> None:
    """Unassigned is not the same as client-owned — it must not open the path."""
    batch_id, headers, _ = await _batch_with_owners(client)
    response = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/thumbnails-folder",
        headers=headers,
        json={"url": THUMBS_URL},
    )
    assert response.status_code == 403, response.text


@pytest.mark.anyio
async def test_client_thumbnails_requires_url(client: AsyncClient) -> None:
    batch_id, headers, _ = await _batch_with_owners(client, thumbnail="client")
    response = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/thumbnails-folder",
        headers=headers,
        json={"url": "   "},
    )
    assert response.status_code == 422, response.text


async def _split_batch(
    client: AsyncClient,
    title_owner: str | None,
) -> tuple[str, dict[str, str], dict[str, str]]:
    """Take a clips-ready batch through the split so per-clip tickets exist.

    Returns (first_ticket_id, client_headers, editor_headers).
    """
    batch_id, client_headers, admin_headers = await _batch_with_owners(
        client, title=title_owner
    )
    editor_headers = await _login(client, "editor@scalebrandslab.demo")

    intake = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/intake",
        headers=client_headers,
        json={
            "intakePath": "clips_ready",
            "url": "https://drive.google.com/drive/folders/client-clips",
        },
    )
    assert intake.status_code == 200, intake.text

    split = await client.post(
        f"{config.API_V1_STR}/editor/batches/{batch_id}/deliverables-drive",
        headers=editor_headers,
        json={
            "deliverablesDriveUrl": "https://drive.google.com/drive/folders/deliverables",
            "deliverableCount": 2,
        },
    )
    assert split.status_code == 200, split.text
    tickets = [v for v in split.json()["videos"] if v["deliverableIndex"] is not None]
    assert tickets, split.text
    return tickets[0]["id"], client_headers, editor_headers


@pytest.mark.anyio
async def test_client_sets_title_when_client_owned(client: AsyncClient) -> None:
    ticket_id, headers, _ = await _split_batch(client, "client")
    response = await client.post(
        f"{config.API_V1_STR}/client/videos/{ticket_id}/title",
        headers=headers,
        json={"title": "How we cut churn in half"},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["ticket"]["editorPublishTitle"] == "How we cut churn in half"
    # The title is one of the three gates on entering SMM QA.
    assert body["readiness"]["titleReady"] is True


@pytest.mark.anyio
async def test_client_title_rejected_when_team_owns_it(client: AsyncClient) -> None:
    ticket_id, headers, _ = await _split_batch(client, "smm")
    response = await client.post(
        f"{config.API_V1_STR}/client/videos/{ticket_id}/title",
        headers=headers,
        json={"title": "Should not stick"},
    )
    assert response.status_code == 403, response.text


@pytest.mark.anyio
async def test_client_title_rejects_blank(client: AsyncClient) -> None:
    ticket_id, headers, _ = await _split_batch(client, "client")
    response = await client.post(
        f"{config.API_V1_STR}/client/videos/{ticket_id}/title",
        headers=headers,
        json={"title": "   "},
    )
    assert response.status_code == 422, response.text


@pytest.mark.anyio
async def test_editor_title_path_still_works_when_client_owned(client: AsyncClient) -> None:
    """Client ownership is about permission, not exclusivity — the team can still fix a typo."""
    ticket_id, _, editor_headers = await _split_batch(client, "client")
    response = await client.patch(
        f"{config.API_V1_STR}/videos/{ticket_id}/production",
        headers=editor_headers,
        json={"editorPublishTitle": "Team-corrected title"},
    )
    assert response.status_code == 200, response.text
    assert response.json()["ticket"]["editorPublishTitle"] == "Team-corrected title"


@pytest.mark.anyio
async def test_client_cannot_title_another_clients_video(client: AsyncClient) -> None:
    ticket_id, _, _ = await _split_batch(client, "client")
    other = await _login(client, "smm@scalebrandslab.demo")
    response = await client.post(
        f"{config.API_V1_STR}/client/videos/{ticket_id}/title",
        headers=other,
        json={"title": "Not yours"},
    )
    assert response.status_code == 403, response.text


@pytest.mark.anyio
async def test_employee_cannot_use_the_client_thumbnails_route(client: AsyncClient) -> None:
    batch_id, _, _ = await _batch_with_owners(client, thumbnail="client")
    smm_headers = await _login(client, "smm@scalebrandslab.demo")
    response = await client.post(
        f"{config.API_V1_STR}/client/batches/{batch_id}/thumbnails-folder",
        headers=smm_headers,
        json={"url": THUMBS_URL},
    )
    assert response.status_code == 403, response.text
