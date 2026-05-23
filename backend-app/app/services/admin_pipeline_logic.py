"""Admin pipeline owner/stage rollup (ported from frontend adminPipeline.ts)."""

from uuid import UUID

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


def list_admin_deadline_tasks(
    batches: list[Batch],
    videos: list[VideoTicket],
    client_profiles: dict,
    staff_names: dict[tuple[UUID, str], str],
) -> list[dict]:
    batch_by_id = {batch.id: batch for batch in batches}
    tasks: list[dict] = []

    for video in videos:
        batch = batch_by_id.get(video.batch_id)
        if batch is None or batch.status != BatchStatus.active:
            continue
        if video.deadline_role not in ("smm", "editor"):
            continue

        profile = client_profiles.get(video.client_id)
        role = video.deadline_role
        assignee_name = "SMM" if role == "smm" else "Editor"
        if profile is not None:
            staff_id = profile.assigned_smm_id if role == "smm" else profile.assigned_editor_id
            if staff_id is not None:
                assignee_name = staff_names.get((staff_id, role), assignee_name)

        index_suffix = (
            f" #{video.deliverable_index}"
            if video.deliverable_index is not None and video.deliverable_index > 0
            else ""
        )
        due_at = None
        if video.deadline_at is not None:
            due_at = video.deadline_at.isoformat()

        tasks.append(
            {
                "id": video.id,
                "batch_id": batch.id,
                "batch_title": batch.title,
                "client_label": profile.display_name if profile else "Client",
                "assignee_role": role,
                "assignee_name": assignee_name,
                "task_label": f"{video.title}{index_suffix} · {video.stage_label}",
                "due_at": due_at,
                "updated_at": batch_to_response(batch).updated_at,
            },
        )

    def sort_key(row: dict) -> tuple[int, str]:
        due = row["due_at"]
        if due is None:
            return (1, "")
        return (0, due)

    tasks.sort(key=sort_key)
    return tasks
