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
