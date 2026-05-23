"""SMM internal QA and editor resubmit (B7)."""

from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.db.base import utc_now
from app.models.batch import Batch
from app.models.enums import (
    EmployeeKind,
    PipelineStage,
    QaCommentKind,
    QaMediaSlot,
    UserRole,
    VideoPipelineOwner,
)
from app.models.qa_comment import QaComment
from app.models.video_ticket import VideoTicket
from app.schemas.production import DeliverableReadinessDto
from app.schemas.qa import (
    AppendQaCommentRequest,
    AppendQaCommentResponse,
    QaTicketResponse,
    ResubmitToSmmQaRequest,
    SubmitSmmQaRequest,
    TimestampFlagInput,
)
from app.services.path_b_transitions import apply_video_transition
from app.services.readiness_service import compute_readiness
from app.services.workspace_access import assert_employee_batch_access, assert_video_access
from app.services.workspace_mappers import (
    load_qa_comments_by_ticket_ids,
    qa_comment_to_dto,
    video_to_dto,
)


def _video_asset_version(ticket: VideoTicket) -> int:
    if ticket.asset_versions and isinstance(ticket.asset_versions, dict):
        version = ticket.asset_versions.get("video")
        if isinstance(version, int) and version > 0:
            return version
    return 1


async def _qa_ticket_response(
    session: AsyncSession,
    ticket: VideoTicket,
) -> QaTicketResponse:
    comments = await load_qa_comments_by_ticket_ids(session, [ticket.id])
    return QaTicketResponse(
        ticket=video_to_dto(ticket, qa_comments=comments.get(ticket.id, [])),
    )


def _assert_post_split_ticket(ticket: VideoTicket) -> None:
    if ticket.deliverable_index is None or ticket.deliverable_index < 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "QA commands require a post-split deliverable ticket",
            },
        )


async def _get_ticket_and_batch(
    session: AsyncSession,
    user: CurrentUser,
    video_ticket_id: UUID,
) -> tuple[VideoTicket, Batch]:
    ticket = await assert_video_access(session, user, video_ticket_id)
    batch = await session.get(Batch, ticket.batch_id)
    if batch is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error_code": "NOT_FOUND",
                "message": f"Batch {ticket.batch_id} not found",
            },
        )
    if user.role == UserRole.employee:
        await assert_employee_batch_access(session, user, batch.id)
    _assert_post_split_ticket(ticket)
    return ticket, batch


def _assert_smm_user(user: CurrentUser) -> None:
    if user.role != UserRole.employee or user.employee_kind != EmployeeKind.smm:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "FORBIDDEN",
                "message": "SMM role required",
            },
        )


def _assert_editor_user(user: CurrentUser) -> None:
    if user.role != UserRole.employee or user.employee_kind != EmployeeKind.editor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "FORBIDDEN",
                "message": "Editor role required",
            },
        )


def _assert_in_smm_qa(ticket: VideoTicket) -> None:
    if ticket.pipeline_stage != PipelineStage.smm_qa or ticket.pipeline_owner != VideoPipelineOwner.smm:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Ticket is not in SMM QA",
            },
        )


def _assert_in_editor_fix(ticket: VideoTicket) -> None:
    if (
        ticket.pipeline_stage != PipelineStage.editor_fix
        or ticket.pipeline_owner != VideoPipelineOwner.editor
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Ticket is not awaiting editor QA fixes",
            },
        )


def _has_send_back_feedback(
    *,
    comment_body: str,
    timestamp_flags: list[TimestampFlagInput],
    general_note: str,
) -> bool:
    return (
        bool(comment_body.strip())
        or len(timestamp_flags) > 0
        or bool(general_note.strip())
    )


def _build_send_back_comments(
    ticket: VideoTicket,
    *,
    comment_body: str,
    timestamp_flags: list[TimestampFlagInput],
    general_note: str,
    author_user_id: UUID | None,
) -> list[QaComment]:
    video_version = _video_asset_version(ticket)
    comments: list[QaComment] = []
    trimmed_body = comment_body.strip()
    if trimmed_body:
        comments.append(
            QaComment(
                video_ticket_id=ticket.id,
                slot=QaMediaSlot.video,
                asset_version=video_version,
                kind=QaCommentKind.general,
                author_role="smm",
                author_user_id=author_user_id,
                body=trimmed_body,
                deprecated=False,
            ),
        )
    else:
        for flag in timestamp_flags:
            note = flag.note.strip()
            if not note:
                continue
            comments.append(
                QaComment(
                    video_ticket_id=ticket.id,
                    slot=QaMediaSlot.video,
                    asset_version=video_version,
                    kind=QaCommentKind.timestamp,
                    author_role="smm",
                    author_user_id=author_user_id,
                    at_seconds=flag.at_seconds,
                    body=note,
                    deprecated=False,
                ),
            )
        trimmed_general = general_note.strip()
        if trimmed_general:
            comments.append(
                QaComment(
                    video_ticket_id=ticket.id,
                    slot=QaMediaSlot.video,
                    asset_version=video_version,
                    kind=QaCommentKind.general,
                    author_role="smm",
                    author_user_id=author_user_id,
                    body=trimmed_general,
                    deprecated=False,
                ),
            )
    return comments


def _apply_smm_qa_approve(ticket: VideoTicket) -> None:
    apply_video_transition(
        ticket,
        PipelineStage.client_qa,
        released_to_client_final_review=True,
    )
    ticket.qa_flags = None
    ticket.qa_general_note = None


def _apply_smm_qa_send_back(
    ticket: VideoTicket,
    *,
    comment_body: str,
    timestamp_flags: list[TimestampFlagInput],
    general_note: str,
) -> None:
    apply_video_transition(
        ticket,
        PipelineStage.editor_fix,
        released_to_client_final_review=False,
    )
    ticket.last_revision_requested_by = "smm"
    ticket.editor_workflow_phase = None
    if timestamp_flags:
        ticket.qa_flags = [
            {"atSeconds": flag.at_seconds, "note": flag.note.strip()}
            for flag in timestamp_flags
            if flag.note.strip()
        ]
    else:
        ticket.qa_flags = None
    trimmed_general = general_note.strip()
    trimmed_body = comment_body.strip()
    ticket.qa_general_note = trimmed_general or trimmed_body or None


async def append_smm_qa_comment(
    session: AsyncSession,
    user: CurrentUser,
    video_ticket_id: UUID,
    payload: AppendQaCommentRequest,
) -> AppendQaCommentResponse:
    _assert_smm_user(user)
    ticket, batch = await _get_ticket_and_batch(session, user, video_ticket_id)
    _assert_in_smm_qa(ticket)

    trimmed = payload.body.strip()
    if not trimmed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Comment body is required",
            },
        )

    comment = QaComment(
        video_ticket_id=ticket.id,
        slot=QaMediaSlot.video,
        asset_version=_video_asset_version(ticket),
        kind=QaCommentKind.general,
        author_role="smm",
        author_user_id=user.id,
        body=trimmed,
        deprecated=False,
    )
    session.add(comment)
    ticket.updated_at = utc_now()
    session.add(ticket)
    batch.updated_at = utc_now()
    session.add(batch)

    await session.flush()
    await session.refresh(ticket)
    await session.refresh(comment)

    comments = await load_qa_comments_by_ticket_ids(session, [ticket.id])
    return AppendQaCommentResponse(
        ticket=video_to_dto(ticket, qa_comments=comments.get(ticket.id, [])),
        comment=qa_comment_to_dto(comment),
    )


async def submit_smm_qa_review(
    session: AsyncSession,
    user: CurrentUser,
    video_ticket_id: UUID,
    payload: SubmitSmmQaRequest,
) -> QaTicketResponse:
    _assert_smm_user(user)
    ticket, batch = await _get_ticket_and_batch(session, user, video_ticket_id)
    _assert_in_smm_qa(ticket)

    comment_body = (payload.comment_body or "").strip()
    general_note = (payload.general_note or "").strip()
    timestamp_flags = payload.timestamp_flags or []

    if payload.action == "send_back":
        if not _has_send_back_feedback(
            comment_body=comment_body,
            timestamp_flags=timestamp_flags,
            general_note=general_note,
        ):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "error_code": "VALIDATION_ERROR",
                    "message": "Send back requires commentBody, timestampFlags, or generalNote",
                },
            )
        _apply_smm_qa_send_back(
            ticket,
            comment_body=comment_body,
            timestamp_flags=timestamp_flags,
            general_note=general_note,
        )
        for row in _build_send_back_comments(
            ticket,
            comment_body=comment_body,
            timestamp_flags=timestamp_flags,
            general_note=general_note,
            author_user_id=user.id,
        ):
            session.add(row)
    elif payload.action == "approve":
        readiness = compute_readiness(ticket, batch)
        if not readiness.all_ready:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "error_code": "VALIDATION_ERROR",
                    "message": "Deliverable must be fully ready before client release",
                    "readiness": DeliverableReadinessDto(
                        video_ready=readiness.video_ready,
                        thumbnail_ready=readiness.thumbnail_ready,
                        title_ready=readiness.title_ready,
                        all_ready=readiness.all_ready,
                    ).model_dump(by_alias=True),
                    "missing": readiness.missing_fields(),
                },
            )
        _apply_smm_qa_approve(ticket)
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Invalid action",
            },
        )

    ticket.updated_at = utc_now()
    session.add(ticket)
    batch.updated_at = utc_now()
    session.add(batch)

    await session.flush()
    await session.refresh(ticket)
    return await _qa_ticket_response(session, ticket)


async def resubmit_editor_video(
    session: AsyncSession,
    user: CurrentUser,
    video_ticket_id: UUID,
    payload: ResubmitToSmmQaRequest,
) -> QaTicketResponse:
    _assert_editor_user(user)
    ticket, batch = await _get_ticket_and_batch(session, user, video_ticket_id)
    _assert_in_editor_fix(ticket)

    if payload.bump_video_version:
        versions: dict[str, Any] = dict(ticket.asset_versions or {})
        next_version = _video_asset_version(ticket) + 1
        versions["video"] = next_version
        ticket.asset_versions = versions

        await session.execute(
            update(QaComment)
            .where(QaComment.video_ticket_id == ticket.id)
            .where(QaComment.slot == QaMediaSlot.video)
            .where(QaComment.deprecated.is_(False))
            .values(deprecated=True),
        )

    apply_video_transition(
        ticket,
        PipelineStage.smm_qa,
        released_to_client_final_review=False,
    )
    ticket.qa_flags = None
    ticket.qa_general_note = None
    ticket.updated_at = utc_now()
    session.add(ticket)
    batch.updated_at = utc_now()
    session.add(batch)

    await session.flush()
    await session.refresh(ticket)
    return await _qa_ticket_response(session, ticket)
