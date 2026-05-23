"""Admin pipeline owner/stage rollup (ported from frontend adminPipeline.ts)."""

from app.models.batch import Batch
from app.models.enums import BatchStatus
from app.models.video_ticket import VideoTicket
from app.services.admin_mappers import batch_to_response

PipelineOwnerKind = str

OWNER_ORDER: tuple[PipelineOwnerKind, ...] = ("client", "smm", "editor")


def batch_needs_client_intake(batch: Batch) -> bool:
    if batch.status != BatchStatus.active:
        return False
    if batch.intake_path is None:
        return True
    if batch.clip_review_phase is not None:
        return False
    if batch.intake_path.value == "source_media":
        return not (batch.source_media_url or "").strip()
    if batch.intake_path.value == "clips_ready":
        return not (batch.clips_folder_url or "").strip()
    return True


def batch_needs_smm_find_clips(batch: Batch) -> bool:
    if batch.status != BatchStatus.active:
        return False
    if batch.intake_path is not None and batch.intake_path.value == "clips_ready":
        return False
    source = (batch.source_media_url or "").strip()
    if not source:
        return False
    if (batch.clips_folder_url or "").strip():
        return False
    phase = batch.clip_review_phase
    if phase is None:
        return True
    return phase.value in ("smm_identifying", "with_smm")


def pipeline_owner_for_batch(
    batch: Batch,
    batch_videos: list[VideoTicket],
) -> PipelineOwnerKind:
    if batch_needs_client_intake(batch):
        return "client"
    if batch_needs_smm_find_clips(batch):
        return "smm"

    open_videos = [
        v
        for v in batch_videos
        if v.pipeline_owner.value in ("client", "smm", "editor")
    ]

    if not open_videos:
        if not (batch.editor_deliverables_drive_url or "").strip():
            phase = batch.clip_review_phase
            if phase is not None and phase.value == "awaiting_client":
                return "client"
            if phase is not None and phase.value == "approved":
                return "editor"
            return "smm"
        return "smm"

    counts: dict[PipelineOwnerKind, int] = {"client": 0, "smm": 0, "editor": 0}
    for video in open_videos:
        owner = video.pipeline_owner.value
        if owner in counts:
            counts[owner] += 1

    best: PipelineOwnerKind = "client"
    best_count = -1
    for key in OWNER_ORDER:
        if counts[key] > best_count:
            best_count = counts[key]
            best = key
    return best


def stage_label_for_batch(
    batch: Batch,
    batch_videos: list[VideoTicket],
) -> str:
    open_videos = [
        v
        for v in batch_videos
        if v.pipeline_owner.value not in ("done", "scheduling")
    ]
    if len(open_videos) == 1:
        return open_videos[0].stage_label
    if len(open_videos) > 1:
        owners = {v.pipeline_owner.value for v in open_videos}
        if len(owners) > 1:
            return "Mixed stages"
    if batch_needs_client_intake(batch):
        return "Awaiting client intake"
    if batch_needs_smm_find_clips(batch):
        return "Clip identification"
    return "In progress"


def compute_pipeline_summary(
    batches: list[Batch],
    videos_by_batch: dict,
) -> dict[str, int]:
    summary = {"with_client": 0, "with_smm": 0, "with_editor": 0}
    for batch in batches:
        if batch.status != BatchStatus.active:
            continue
        batch_videos = videos_by_batch.get(batch.id, [])
        owner = pipeline_owner_for_batch(batch, batch_videos)
        if owner == "client":
            summary["with_client"] += 1
        elif owner == "smm":
            summary["with_smm"] += 1
        else:
            summary["with_editor"] += 1
    return summary


def list_pipeline_items(
    batches: list[Batch],
    videos_by_batch: dict,
    client_names: dict,
) -> list[dict]:
    items: list[dict] = []
    for batch in batches:
        if batch.status != BatchStatus.active:
            continue
        batch_videos = videos_by_batch.get(batch.id, [])
        items.append(
            {
                "id": batch.id,
                "client_id": batch.client_id,
                "batch_title": batch.title,
                "client_label": client_names.get(batch.client_id, "Client"),
                "owner": pipeline_owner_for_batch(batch, batch_videos),
                "stage_label": stage_label_for_batch(batch, batch_videos),
                "updated_at": batch_to_response(batch).updated_at,
            },
        )
    items.sort(key=lambda row: row["updated_at"], reverse=True)
    return items
