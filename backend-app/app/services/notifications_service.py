"""Notifications inbox — derived from current pipeline ownership.

No event table: a batch is "waiting on you" when a live ticket's pipeline_owner
maps to your role for that batch. Unread = changed since you last opened the
inbox (users.notifications_last_seen_at).
"""

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.db.base import utc_now
from app.models.batch import Batch
from app.models.client_profile import ClientProfile
from app.models.enums import (
    BatchStatus,
    EmployeeKind,
    PipelineStage,
    UserRole,
    VideoPipelineOwner,
)
from app.models.user import User
from app.models.video_ticket import VideoTicket
from app.services.path_b_transitions import stage_label

_EPOCH = datetime(1970, 1, 1, tzinfo=UTC)

_STAGE_MESSAGE: dict[PipelineStage, str] = {
    PipelineStage.clip_client_review: "Approve clips",
    PipelineStage.client_qa: "Review final video",
    PipelineStage.clips_identifying: "Find clips",
    PipelineStage.smm_qa: "Run internal QA",
    PipelineStage.revision_via_smm: "Handle client revisions",
    PipelineStage.scheduling: "Schedule video",
    PipelineStage.production: "Produce video",
    PipelineStage.editor_fix: "Fix QA feedback",
    PipelineStage.pre_split_production: "Upload production files",
    PipelineStage.clips_ready_intake: "Start production",
}


def _owners_for_user(user: CurrentUser) -> list[VideoPipelineOwner] | None:
    """Which ticket owners count as 'this user's turn'. None = no personal inbox."""
    if user.role == UserRole.client:
        return [VideoPipelineOwner.client]
    if user.role == UserRole.employee and user.employee_kind == EmployeeKind.smm:
        return [VideoPipelineOwner.smm, VideoPipelineOwner.scheduling]
    if user.role == UserRole.employee and user.employee_kind == EmployeeKind.editor:
        return [VideoPipelineOwner.editor]
    return None


def _message(stage: PipelineStage, deliverable_index: int | None) -> str:
    label = _STAGE_MESSAGE.get(stage, stage_label(stage))
    if deliverable_index and deliverable_index >= 1:
        return f"{label} #{deliverable_index}"
    return label


def _aware(dt: datetime | None) -> datetime:
    if dt is None:
        return _EPOCH
    return dt if dt.tzinfo else dt.replace(tzinfo=UTC)


async def list_inbox(session: AsyncSession, user: CurrentUser) -> dict:
    owners = _owners_for_user(user)
    if not owners:
        return {"items": [], "unreadCount": 0, "lastSeenAt": None}

    query = (
        select(VideoTicket, Batch.title)
        .join(Batch, VideoTicket.batch_id == Batch.id)
        .where(VideoTicket.pipeline_owner.in_(owners))
        .where(Batch.status == BatchStatus.active)
    )
    if user.role == UserRole.client:
        query = query.where(VideoTicket.client_id == user.client_profile_id)
    else:
        query = query.join(ClientProfile, VideoTicket.client_id == ClientProfile.id)
        if user.employee_kind == EmployeeKind.smm:
            query = query.where(ClientProfile.assigned_smm_id == user.id)
        else:
            query = query.where(ClientProfile.assigned_editor_id == user.id)

    rows = (await session.execute(query)).all()

    # Fetch the caller's last-seen timestamp.
    last_seen = (
        await session.execute(
            select(User.notifications_last_seen_at).where(User.id == user.id)
        )
    ).scalar_one_or_none()
    last_seen_aware = _aware(last_seen)

    items = []
    unread_count = 0
    for ticket, batch_title in rows:
        since = ticket.updated_at
        is_unread = _aware(since) > last_seen_aware
        if is_unread:
            unread_count += 1
        items.append(
            {
                "id": ticket.id,
                "batchId": ticket.batch_id,
                "batchTitle": batch_title,
                "deliverableIndex": ticket.deliverable_index,
                "stage": ticket.pipeline_stage.value,
                "stageLabel": ticket.stage_label or stage_label(ticket.pipeline_stage),
                "message": _message(ticket.pipeline_stage, ticket.deliverable_index),
                "since": since,
                "unread": is_unread,
                "deadlineAt": ticket.deadline_at,
            }
        )

    # Deadline items first (soonest / most overdue at top), then the rest by recency.
    with_deadline = sorted(
        (i for i in items if i["deadlineAt"]), key=lambda i: _aware(i["deadlineAt"])
    )
    without_deadline = sorted(
        (i for i in items if not i["deadlineAt"]),
        key=lambda i: _aware(i["since"]),
        reverse=True,
    )
    return {
        "items": with_deadline + without_deadline,
        "unreadCount": unread_count,
        "lastSeenAt": last_seen,
    }


async def mark_seen(session: AsyncSession, user: CurrentUser) -> dict:
    now = utc_now()
    db_user = (
        await session.execute(select(User).where(User.id == user.id))
    ).scalar_one_or_none()
    if db_user is not None:
        db_user.notifications_last_seen_at = now
        session.add(db_user)
        await session.commit()
    return {"lastSeenAt": now}
