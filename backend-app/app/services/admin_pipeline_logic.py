"""Admin pipeline owner/stage rollup (ported from frontend adminPipeline.ts)."""

from datetime import datetime
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


def split_videos(batch_videos: list[VideoTicket]) -> list[VideoTicket]:
    """Per-clip tickets, i.e. the batch has been split by the editor."""
    return [
        v
        for v in batch_videos
        if v.deliverable_index is not None and v.deliverable_index > 0
    ]


def is_open_video(video: VideoTicket) -> bool:
    """Still needs someone's action — scheduling and done do not."""
    return video.pipeline_owner.value in ("client", "smm", "editor")


def compute_pipeline_summary(
    batches: list[Batch],
    videos_by_batch: dict,
) -> dict[str, int]:
    """Count *videos* by owner, not batches.

    A batch with 3 clips at the editor and 2 at the SMM used to collapse to one
    "with editor" row, hiding the SMM's two. Post-split, the video is the unit of
    work. Pre-split batches still count once — there genuinely is one thing to do.
    """
    summary = {"with_client": 0, "with_smm": 0, "with_editor": 0}
    key = {"client": "with_client", "smm": "with_smm", "editor": "with_editor"}

    for batch in batches:
        if batch.status != BatchStatus.active:
            continue
        batch_videos = videos_by_batch.get(batch.id, [])
        deliverables = split_videos(batch_videos)
        if deliverables:
            for video in deliverables:
                if is_open_video(video):
                    summary[key[video.pipeline_owner.value]] += 1
        else:
            owner = pipeline_owner_for_batch(batch, batch_videos)
            summary[key.get(owner, "with_editor")] += 1
    return summary


def _schedule_label(video: VideoTicket) -> str | None:
    """"YouTube Shorts · 24 Jul 2026" for a video that has been scheduled."""
    schedule = video.video_schedule
    if not isinstance(schedule, dict):
        return None
    platform = str(schedule.get("platform") or "").strip()
    go_live = str(schedule.get("goLiveAt") or "").strip()
    if not platform and not go_live:
        return None
    when = ""
    if go_live:
        try:
            when = datetime.fromisoformat(go_live).strftime("%d %b %Y")
        except ValueError:
            when = go_live
    return " · ".join(part for part in (platform, when) if part)


def list_pipeline_items(
    batches: list[Batch],
    videos_by_batch: dict,
    client_names: dict,
) -> list[dict]:
    """Batch header rows, each followed by its per-clip video rows.

    Pre-split batches emit only the header — there are no per-clip cards yet, so
    the batch really is the unit of work.
    """
    items: list[dict] = []
    active = [b for b in batches if b.status == BatchStatus.active]
    # Sort the batches, not the flat row list — videos must stay under their header.
    active.sort(key=lambda b: batch_to_response(b).updated_at, reverse=True)

    for batch in active:
        batch_videos = videos_by_batch.get(batch.id, [])
        deliverables = sorted(
            split_videos(batch_videos),
            key=lambda v: v.deliverable_index or 0,
        )
        updated_at = batch_to_response(batch).updated_at
        client_label = client_names.get(batch.client_id, "Client")
        open_count = sum(1 for v in deliverables if is_open_video(v))

        items.append(
            {
                "id": batch.id,
                "kind": "batch",
                "batch_id": batch.id,
                "client_id": batch.client_id,
                "batch_title": batch.title,
                "client_label": client_label,
                # Header rows carry no owner chip — their videos each have one.
                "owner": None if deliverables else pipeline_owner_for_batch(batch, batch_videos),
                "stage_label": stage_label_for_batch(batch, batch_videos),
                "updated_at": updated_at,
                "open_video_count": open_count if deliverables else None,
                "total_video_count": len(deliverables) if deliverables else None,
            },
        )

        for video in deliverables:
            owner = video.pipeline_owner.value
            items.append(
                {
                    "id": video.id,
                    "kind": "video",
                    "batch_id": batch.id,
                    "client_id": batch.client_id,
                    "batch_title": batch.title,
                    "client_label": client_label,
                    "owner": owner if is_open_video(video) else None,
                    "stage_label": video.stage_label,
                    "updated_at": updated_at,
                    "deliverable_index": video.deliverable_index,
                    "schedule_label": _schedule_label(video),
                },
            )
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
