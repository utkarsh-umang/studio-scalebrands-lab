"""Unit tests for Path B transition helpers (B3)."""

from uuid import uuid4

from app.models.batch import Batch
from app.models.enums import (
    BatchClipReviewPhase,
    BatchIntakePath,
    BatchStatus,
    EditorWorkflowPhase,
    PipelineStage,
    VideoPipelineOwner,
)
from app.services.path_b_transitions import (
    apply_clips_ready_intake,
    apply_source_media_intake,
    apply_uploaded_clips_intake,
    create_pre_split_gate_ticket,
    stage_label,
    video_state_for_stage,
)


def test_stage_label_clips_ready_intake() -> None:
    assert stage_label(PipelineStage.clips_ready_intake) == "Clips ready — production"


def test_video_state_for_clips_ready_intake() -> None:
    state = video_state_for_stage(PipelineStage.clips_ready_intake)
    assert state.pipeline_owner == VideoPipelineOwner.editor
    assert state.deadline_role == "editor"
    assert state.editor_workflow_phase == EditorWorkflowPhase.videos
    assert state.released_to_client_final_review is False


def test_apply_source_media_intake_fields() -> None:
    batch = Batch(
        client_id=uuid4(),
        batch_number=1,
        title="Test",
        status=BatchStatus.active,
        pipeline_stage=PipelineStage.intake_pending,
    )
    apply_source_media_intake(batch, "https://youtube.com/watch?v=abc")
    assert batch.intake_path == BatchIntakePath.source_media
    assert batch.source_media_url == "https://youtube.com/watch?v=abc"
    assert batch.clip_review_phase == BatchClipReviewPhase.smm_identifying
    assert batch.pipeline_stage == PipelineStage.clips_identifying


def test_create_pre_split_gate_ticket() -> None:
    batch = Batch(
        client_id=uuid4(),
        batch_number=2,
        title="July",
        status=BatchStatus.active,
        pipeline_stage=PipelineStage.clips_ready_intake,
    )
    batch.id = uuid4()
    ticket = create_pre_split_gate_ticket(batch)
    assert ticket.title == "Batch — July"
    assert ticket.deliverable_index is None
    assert ticket.pipeline_stage == PipelineStage.clips_ready_intake
    assert ticket.pipeline_owner == VideoPipelineOwner.editor


def test_apply_clips_ready_intake_fields() -> None:
    batch = Batch(
        client_id=uuid4(),
        batch_number=3,
        title="Clips",
        status=BatchStatus.active,
        pipeline_stage=PipelineStage.intake_pending,
    )
    apply_clips_ready_intake(batch, "https://drive.google.com/drive/folders/x", 4)
    assert batch.intake_path == BatchIntakePath.clips_ready
    assert batch.clips_folder_url == "https://drive.google.com/drive/folders/x"
    assert batch.clip_review_phase == BatchClipReviewPhase.approved
    assert batch.video_count == 4
    assert batch.pipeline_stage == PipelineStage.production


def test_apply_uploaded_clips_intake_has_no_drive_dependency() -> None:
    batch = Batch(
        client_id=uuid4(),
        batch_number=4,
        title="Direct uploads",
        status=BatchStatus.active,
        pipeline_stage=PipelineStage.intake_pending,
        source_media_url="https://example.com/old-source",
        clips_folder_url="https://drive.google.com/drive/folders/old",
    )
    apply_uploaded_clips_intake(batch, 7)
    assert batch.intake_path == BatchIntakePath.clips_ready
    assert batch.source_media_url is None
    assert batch.clips_folder_url is None
    assert batch.clip_review_phase == BatchClipReviewPhase.approved
    assert batch.video_count == 7
    assert batch.pipeline_stage == PipelineStage.production
