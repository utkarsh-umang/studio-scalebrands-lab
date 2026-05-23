"""Path B pipeline transitions shared across epics (B3+)."""

from dataclasses import dataclass
from uuid import UUID

from app.db.base import utc_now
from app.models.batch import Batch
from app.models.enums import (
    BatchClipReviewPhase,
    BatchIntakePath,
    EditorWorkflowPhase,
    PipelineStage,
    VideoPipelineOwner,
)
from app.models.video_ticket import VideoTicket

STAGE_LABELS: dict[PipelineStage, str] = {
    PipelineStage.intake_pending: "Awaiting client intake",
    PipelineStage.clips_identifying: "Clip identification",
    PipelineStage.clip_client_review: "Clip review",
    PipelineStage.clips_ready_intake: "Clips ready — production",
    PipelineStage.pre_split_production: "Awaiting deliverables folder",
    PipelineStage.production: "Production",
    PipelineStage.smm_qa: "SMM QA",
    PipelineStage.editor_fix: "QA flagged",
    PipelineStage.client_qa: "Client QA",
    PipelineStage.revision_via_smm: "Client revisions",
    PipelineStage.scheduling: "Scheduling",
    PipelineStage.completed: "Scheduled",
}


def stage_label(stage: PipelineStage) -> str:
    return STAGE_LABELS.get(stage, stage.value.replace("_", " ").title())


def owner_for_stage(stage: PipelineStage) -> VideoPipelineOwner:
    if stage in (PipelineStage.clip_client_review, PipelineStage.client_qa):
        return VideoPipelineOwner.client
    if stage in (
        PipelineStage.clips_identifying,
        PipelineStage.smm_qa,
        PipelineStage.revision_via_smm,
    ):
        return VideoPipelineOwner.smm
    if stage in (
        PipelineStage.editor_fix,
        PipelineStage.production,
        PipelineStage.pre_split_production,
        PipelineStage.clips_ready_intake,
    ):
        return VideoPipelineOwner.editor
    if stage == PipelineStage.scheduling:
        return VideoPipelineOwner.scheduling
    if stage == PipelineStage.completed:
        return VideoPipelineOwner.done
    return VideoPipelineOwner.smm


def deadline_role_for_owner(owner: VideoPipelineOwner) -> str | None:
    if owner == VideoPipelineOwner.smm:
        return "smm"
    if owner == VideoPipelineOwner.editor:
        return "editor"
    return None


@dataclass(frozen=True)
class VideoTransitionState:
    pipeline_stage: PipelineStage
    pipeline_owner: VideoPipelineOwner
    stage_label: str
    deadline_role: str | None
    editor_workflow_phase: EditorWorkflowPhase | None
    released_to_client_final_review: bool


def video_state_for_stage(
    stage: PipelineStage,
    *,
    released_to_client_final_review: bool | None = None,
) -> VideoTransitionState:
    owner = owner_for_stage(stage)
    editor_phase: EditorWorkflowPhase | None = None
    if owner == VideoPipelineOwner.editor and stage != PipelineStage.editor_fix:
        editor_phase = EditorWorkflowPhase.videos
    if released_to_client_final_review is None:
        released_to_client_final_review = stage == PipelineStage.client_qa
    return VideoTransitionState(
        pipeline_stage=stage,
        pipeline_owner=owner,
        stage_label=stage_label(stage),
        deadline_role=deadline_role_for_owner(owner),
        editor_workflow_phase=editor_phase,
        released_to_client_final_review=released_to_client_final_review,
    )


def apply_source_media_intake(batch: Batch, url: str) -> None:
    now = utc_now()
    batch.intake_path = BatchIntakePath.source_media
    batch.source_media_url = url
    batch.clip_review_phase = BatchClipReviewPhase.smm_identifying
    batch.pipeline_stage = PipelineStage.clips_identifying
    batch.updated_at = now


def apply_clips_ready_intake(batch: Batch, url: str) -> None:
    now = utc_now()
    batch.intake_path = BatchIntakePath.clips_ready
    batch.clips_folder_url = url
    batch.clip_review_phase = BatchClipReviewPhase.approved
    batch.pipeline_stage = PipelineStage.clips_ready_intake
    batch.updated_at = now


CLIP_REVIEW_GATE_TITLE = "Clip approval"


def apply_video_transition(
    ticket: VideoTicket,
    stage: PipelineStage,
    *,
    title: str | None = None,
    released_to_client_final_review: bool | None = False,
) -> None:
    state = video_state_for_stage(
        stage,
        released_to_client_final_review=released_to_client_final_review,
    )
    ticket.pipeline_stage = state.pipeline_stage
    ticket.pipeline_owner = state.pipeline_owner
    ticket.stage_label = state.stage_label
    ticket.deadline_role = state.deadline_role
    ticket.editor_workflow_phase = state.editor_workflow_phase
    ticket.released_to_client_final_review = state.released_to_client_final_review
    if title is not None:
        ticket.title = title
    ticket.updated_at = utc_now()


def apply_submit_clips_folder(batch: Batch, clips_folder_url: str) -> None:
    now = utc_now()
    batch.intake_path = BatchIntakePath.source_media
    batch.clips_folder_url = clips_folder_url
    batch.clip_review_phase = BatchClipReviewPhase.awaiting_client
    batch.pipeline_stage = PipelineStage.clip_client_review
    batch.updated_at = now


def apply_approve_clips(batch: Batch, *, clip_count: int | None = None) -> None:
    now = utc_now()
    batch.clip_review_phase = BatchClipReviewPhase.approved
    batch.pipeline_stage = PipelineStage.pre_split_production
    if clip_count is not None and clip_count > 0:
        batch.video_count = clip_count
    batch.updated_at = now


def apply_reject_clips(batch: Batch) -> None:
    now = utc_now()
    batch.clip_review_phase = BatchClipReviewPhase.with_smm
    batch.pipeline_stage = PipelineStage.clips_identifying
    batch.updated_at = now


def is_clip_identification_ticket(ticket: VideoTicket) -> bool:
    if ticket.pipeline_stage == PipelineStage.clips_identifying:
        return True
    label = (ticket.stage_label or "").lower()
    return "clip identification" in label or "identifying" in label


def is_clip_review_gate_ticket(ticket: VideoTicket) -> bool:
    if ticket.deliverable_index is not None and ticket.deliverable_index >= 1:
        return False
    if ticket.pipeline_stage == PipelineStage.clip_client_review:
        return True
    label = (ticket.stage_label or "").lower()
    return "clip review" in label or ticket.title == CLIP_REVIEW_GATE_TITLE


def is_pre_split_gate_or_clip_review(ticket: VideoTicket) -> bool:
    if ticket.deliverable_index is not None and ticket.deliverable_index >= 1:
        return False
    if is_clip_identification_ticket(ticket) or is_clip_review_gate_ticket(ticket):
        return True
    return ticket.deliverable_index is None


def create_clip_review_gate_ticket(batch: Batch) -> VideoTicket:
    state = video_state_for_stage(
        PipelineStage.clip_client_review,
        released_to_client_final_review=False,
    )
    return VideoTicket(
        batch_id=batch.id,
        client_id=batch.client_id,
        title=CLIP_REVIEW_GATE_TITLE,
        deliverable_index=None,
        pipeline_stage=state.pipeline_stage,
        pipeline_owner=state.pipeline_owner,
        stage_label=state.stage_label,
        deadline_role=state.deadline_role,
        editor_workflow_phase=state.editor_workflow_phase,
        released_to_client_final_review=state.released_to_client_final_review,
    )


def create_pre_split_gate_ticket(
    batch: Batch,
    *,
    stage: PipelineStage = PipelineStage.clips_ready_intake,
) -> VideoTicket:
    state = video_state_for_stage(stage, released_to_client_final_review=False)
    return VideoTicket(
        batch_id=batch.id,
        client_id=batch.client_id,
        title=f"Batch — {batch.title}",
        deliverable_index=None,
        pipeline_stage=state.pipeline_stage,
        pipeline_owner=state.pipeline_owner,
        stage_label=state.stage_label,
        deadline_role=state.deadline_role,
        editor_workflow_phase=state.editor_workflow_phase,
        released_to_client_final_review=state.released_to_client_final_review,
    )
