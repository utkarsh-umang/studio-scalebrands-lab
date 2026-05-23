"""Unit tests for B4 Path B clip review transitions."""

from uuid import uuid4

from app.models.batch import Batch
from app.models.enums import (
    BatchClipReviewPhase,
    BatchIntakePath,
    BatchStatus,
    PipelineStage,
    VideoPipelineOwner,
)
from app.models.video_ticket import VideoTicket
from app.services.path_b_transitions import (
    apply_approve_clips,
    apply_deliverables_split,
    apply_submit_clips_folder,
    apply_video_transition,
    create_clip_review_gate_ticket,
    create_split_deliverable_ticket,
    is_clip_review_gate_ticket,
    is_pre_split_gate_or_clip_review,
    resolve_deliverable_count,
)


def test_apply_submit_clips_folder() -> None:
    batch = Batch(
        client_id=uuid4(),
        batch_number=1,
        title="Podcast",
        status=BatchStatus.active,
        pipeline_stage=PipelineStage.clips_identifying,
        intake_path=BatchIntakePath.source_media,
    )
    apply_submit_clips_folder(batch, "https://drive.google.com/drive/folders/x")
    assert batch.clip_review_phase == BatchClipReviewPhase.awaiting_client
    assert batch.pipeline_stage == PipelineStage.clip_client_review
    assert batch.clips_folder_url == "https://drive.google.com/drive/folders/x"


def test_create_clip_review_gate_ticket() -> None:
    batch = Batch(
        client_id=uuid4(),
        batch_number=2,
        title="Show",
        status=BatchStatus.active,
        pipeline_stage=PipelineStage.clip_client_review,
    )
    batch.id = uuid4()
    ticket = create_clip_review_gate_ticket(batch)
    assert ticket.title == "Clip approval"
    assert ticket.pipeline_owner == VideoPipelineOwner.client
    assert is_clip_review_gate_ticket(ticket)


def test_apply_approve_clips_sets_video_count() -> None:
    batch = Batch(
        client_id=uuid4(),
        batch_number=3,
        title="Show",
        status=BatchStatus.active,
        pipeline_stage=PipelineStage.clip_client_review,
        video_count=0,
    )
    apply_approve_clips(batch, clip_count=4)
    assert batch.clip_review_phase == BatchClipReviewPhase.approved
    assert batch.video_count == 4


def test_resolve_deliverable_count() -> None:
    batch = Batch(
        client_id=uuid4(),
        batch_number=1,
        title="Count",
        video_count=6,
    )
    assert resolve_deliverable_count(batch, deliverable_count=4, deliverables_length=0) == 4
    assert resolve_deliverable_count(batch, deliverable_count=None, deliverables_length=3) == 3
    assert resolve_deliverable_count(batch, deliverable_count=None, deliverables_length=0) == 6
    assert resolve_deliverable_count(
        Batch(client_id=uuid4(), batch_number=2, title="Min", video_count=0),
        deliverable_count=None,
        deliverables_length=0,
    ) == 1


def test_create_split_deliverable_ticket() -> None:
    batch = Batch(
        client_id=uuid4(),
        batch_number=1,
        title="Split",
    )
    ticket = create_split_deliverable_ticket(batch, 2, "Tip #2")
    assert ticket.deliverable_index == 2
    assert ticket.title == "Tip #2"
    assert ticket.pipeline_stage == PipelineStage.production
    assert ticket.asset_versions == {"video": 1, "thumbnail": 1}


def test_apply_deliverables_split() -> None:
    batch = Batch(
        client_id=uuid4(),
        batch_number=1,
        title="Split batch",
    )
    apply_deliverables_split(batch, "https://drive.google.com/drive/folders/x", 3)
    assert batch.editor_deliverables_drive_url == "https://drive.google.com/drive/folders/x"
    assert batch.video_count == 3
    assert batch.pipeline_stage == PipelineStage.production


def test_pre_split_gate_or_clip_review() -> None:
    gate = VideoTicket(
        batch_id=uuid4(),
        client_id=uuid4(),
        title="Clip approval",
        pipeline_stage=PipelineStage.clip_client_review,
        pipeline_owner=VideoPipelineOwner.client,
        stage_label="Clip review",
    )
    assert is_pre_split_gate_or_clip_review(gate)
    apply_video_transition(gate, PipelineStage.pre_split_production)
    assert gate.pipeline_owner == VideoPipelineOwner.editor
