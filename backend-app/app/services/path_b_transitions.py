"""Path B pipeline transitions shared across epics (B3+)."""

from dataclasses import dataclass

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
    PipelineStage.idea_research: "Idea research",
    PipelineStage.idea_review: "Idea approval",
    PipelineStage.idea_footage_pending: "Awaiting footage",
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
    if stage in (
        PipelineStage.clip_client_review,
        PipelineStage.client_qa,
        PipelineStage.idea_review,
        PipelineStage.idea_footage_pending,
    ):
        return VideoPipelineOwner.client
    if stage in (
        PipelineStage.clips_identifying,
        PipelineStage.smm_qa,
        PipelineStage.revision_via_smm,
        PipelineStage.idea_research,
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


def apply_clips_ready_intake(batch: Batch, url: str, clip_count: int) -> None:
    now = utc_now()
    batch.intake_path = BatchIntakePath.clips_ready
    batch.clips_folder_url = url
    batch.clip_review_phase = BatchClipReviewPhase.approved
    batch.video_count = clip_count
    batch.pipeline_stage = PipelineStage.production
    batch.updated_at = now


CLIP_REVIEW_GATE_TITLE = "Clip approval"
IDEA_GATE_TITLE = "Video ideas"


# ── Path A (idea-first) ──


def apply_request_ideas(batch: Batch) -> None:
    """Client asks for ideas — no footage yet. SMM starts researching."""
    now = utc_now()
    batch.intake_path = BatchIntakePath.idea_first
    batch.pipeline_stage = PipelineStage.idea_research
    batch.updated_at = now


def apply_submit_ideas(batch: Batch, ideas: list[str]) -> None:
    now = utc_now()
    batch.idea_list = ideas
    batch.pipeline_stage = PipelineStage.idea_review
    batch.updated_at = now


def apply_approve_ideas(batch: Batch) -> None:
    now = utc_now()
    batch.pipeline_stage = PipelineStage.idea_footage_pending
    batch.updated_at = now


def apply_reject_ideas(batch: Batch) -> None:
    now = utc_now()
    batch.pipeline_stage = PipelineStage.idea_research
    batch.updated_at = now


def apply_submit_idea_footage(batch: Batch, url: str) -> None:
    """Ideas were approved; client sends footage → straight to production (no clip review)."""
    now = utc_now()
    batch.source_media_url = url
    batch.pipeline_stage = PipelineStage.pre_split_production
    batch.updated_at = now


def create_idea_gate_ticket(batch: Batch) -> VideoTicket:
    state = video_state_for_stage(
        PipelineStage.idea_research,
        released_to_client_final_review=False,
    )
    return VideoTicket(
        batch_id=batch.id,
        client_id=batch.client_id,
        title=IDEA_GATE_TITLE,
        deliverable_index=None,
        pipeline_stage=state.pipeline_stage,
        pipeline_owner=state.pipeline_owner,
        stage_label=state.stage_label,
        deadline_role=state.deadline_role,
        editor_workflow_phase=state.editor_workflow_phase,
        released_to_client_final_review=state.released_to_client_final_review,
    )


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


def apply_deliverables_split(batch: Batch, deliverables_drive_url: str, deliverable_count: int) -> None:
    now = utc_now()
    batch.editor_deliverables_drive_url = deliverables_drive_url
    batch.video_count = deliverable_count
    batch.pipeline_stage = PipelineStage.production
    batch.updated_at = now


def create_split_deliverable_ticket(
    batch: Batch,
    index: int,
    title: str,
) -> VideoTicket:
    state = video_state_for_stage(
        PipelineStage.production,
        released_to_client_final_review=False,
    )
    return VideoTicket(
        batch_id=batch.id,
        client_id=batch.client_id,
        title=title,
        deliverable_index=index,
        pipeline_stage=state.pipeline_stage,
        pipeline_owner=state.pipeline_owner,
        stage_label=state.stage_label,
        deadline_role=state.deadline_role,
        editor_workflow_phase=state.editor_workflow_phase,
        released_to_client_final_review=state.released_to_client_final_review,
        asset_versions={"video": 1, "thumbnail": 1},
    )


def resolve_deliverable_count(
    batch: Batch,
    *,
    deliverable_count: int | None,
    deliverables_length: int,
) -> int:
    if deliverable_count is not None and deliverable_count >= 1:
        n = deliverable_count
    elif deliverables_length >= 1:
        n = deliverables_length
    elif batch.video_count > 0:
        n = batch.video_count
    else:
        n = 1
    return max(n, 1)


def default_deliverable_title(index: int) -> str:
    return f"Deliverable {index}"
