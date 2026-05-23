"""Unit tests for B6 readiness_service."""

from uuid import uuid4

from app.models.batch import Batch
from app.models.video_ticket import VideoTicket
from app.services.readiness_service import compute_readiness


def test_readiness_from_drive_slots_and_title() -> None:
    batch = Batch(client_id=uuid4(), batch_number=1, title="B6")
    ticket = VideoTicket(
        batch_id=batch.id,
        client_id=batch.client_id,
        title="Deliverable 1",
        deliverable_index=1,
        editor_publish_title="My title",
        deliverable_drive_slots={
            "video": {"driveFileId": "v1", "name": "1.mov"},
            "thumbnail": {"driveFileId": "t1", "name": "1.png"},
        },
    )
    readiness = compute_readiness(ticket, batch)
    assert readiness.all_ready is True
    assert readiness.missing_fields() == []
