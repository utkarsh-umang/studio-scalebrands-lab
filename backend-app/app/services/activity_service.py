"""Batch activity / audit trail — append-only record of pipeline decisions."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.models.batch_activity import BatchActivity
from app.models.enums import EmployeeKind, UserRole


def actor_role_str(actor: CurrentUser) -> str:
    if actor.role == UserRole.client:
        return "client"
    if actor.role == UserRole.admin:
        return "admin"
    if actor.role == UserRole.employee and actor.employee_kind == EmployeeKind.smm:
        return "smm"
    if actor.role == UserRole.employee and actor.employee_kind == EmployeeKind.editor:
        return "editor"
    return actor.role.value


def record_activity(
    session: AsyncSession,
    *,
    batch_id: UUID,
    actor: CurrentUser,
    action: str,
    summary: str,
    video_ticket_id: UUID | None = None,
    deliverable_index: int | None = None,
    detail: str | None = None,
) -> None:
    """Append an audit event. Does NOT commit — the caller's commit persists it."""
    session.add(
        BatchActivity(
            batch_id=batch_id,
            video_ticket_id=video_ticket_id,
            deliverable_index=deliverable_index,
            actor_user_id=actor.id,
            actor_role=actor_role_str(actor),
            actor_name=actor.name,
            action=action,
            summary=summary,
            detail=detail,
        )
    )


async def list_batch_activity(session: AsyncSession, batch_id: UUID) -> list[dict]:
    rows = (
        await session.execute(
            select(BatchActivity)
            .where(BatchActivity.batch_id == batch_id)
            .order_by(BatchActivity.created_at.desc(), BatchActivity.id.desc())
        )
    ).scalars().all()
    return [
        {
            "id": row.id,
            "batchId": row.batch_id,
            "videoTicketId": row.video_ticket_id,
            "deliverableIndex": row.deliverable_index,
            "actorRole": row.actor_role,
            "actorName": row.actor_name,
            "action": row.action,
            "summary": row.summary,
            "detail": row.detail,
            "at": row.created_at,
        }
        for row in rows
    ]
