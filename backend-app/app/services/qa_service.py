"""SMM internal QA, editor resubmit (B7), and client final QA (B8)."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.db.base import utc_now
from app.models.batch import Batch
from app.models.enums import (
    EditorWorkflowPhase,
    EmployeeKind,
    MediaAssetKind,
    MediaAssetStatus,
    PipelineStage,
    QaCommentKind,
    QaMediaSlot,
    UserRole,
    VideoPipelineOwner,
)
from app.models.media_asset import MediaAsset
from app.models.qa_comment import QaComment
from app.models.video_ticket import VideoTicket
from app.schemas.production import DeliverableReadinessDto
from app.schemas.qa import (
    AppendQaCommentRequest,
    AppendQaCommentResponse,
    ClientQaRequest,
    ClientRevisionTriageRequest,
    QaTicketResponse,
    ResubmitToSmmQaRequest,
    SubmitSmmQaRequest,
    TimestampFlagInput,
)
from app.services.activity_service import record_activity
from app.services.path_b_transitions import (
    apply_video_transition,
    is_clip_review_gate_ticket,
)
from app.services.production_service import client_release_missing
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
    user: CurrentUser,
) -> QaTicketResponse:
    comments = await load_qa_comments_by_ticket_ids(session, [ticket.id])
    visible = comments.get(ticket.id, [])
    if user.role == UserRole.client:
        visible = [comment for comment in visible if comment.author_role == "client"]
    return QaTicketResponse(
        ticket=video_to_dto(ticket, qa_comments=visible),
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


def _assert_client_user(user: CurrentUser) -> None:
    if user.role != UserRole.client:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "FORBIDDEN",
                "message": "Client role required",
            },
        )


def _assert_in_client_final_qa(ticket: VideoTicket) -> None:
    if is_clip_review_gate_ticket(ticket):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Clip review uses batch clip endpoints",
            },
        )
    if (
        ticket.pipeline_stage != PipelineStage.client_qa
        or ticket.pipeline_owner != VideoPipelineOwner.client
        or not ticket.released_to_client_final_review
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Ticket is not in client final QA",
            },
        )


def _assert_in_client_revision_via_smm(ticket: VideoTicket) -> None:
    if (
        ticket.pipeline_stage != PipelineStage.revision_via_smm
        or ticket.pipeline_owner != VideoPipelineOwner.smm
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Ticket is not awaiting SMM client-revision triage",
            },
        )
    if ticket.last_revision_requested_by != "client":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Client revision triage requires client-originated revision",
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
    author_role: str,
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
                author_role=author_role,
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
                    author_role=author_role,
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
                    author_role=author_role,
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


async def append_qa_comment(
    session: AsyncSession,
    user: CurrentUser,
    video_ticket_id: UUID,
    payload: AppendQaCommentRequest,
) -> AppendQaCommentResponse:
    ticket, batch = await _get_ticket_and_batch(session, user, video_ticket_id)

    trimmed = payload.body.strip()
    if not trimmed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Comment body is required",
            },
        )

    if user.role == UserRole.client:
        _assert_client_user(user)
        _assert_in_client_final_qa(ticket)
        author_role = "client"
    elif user.role == UserRole.employee and user.employee_kind == EmployeeKind.smm:
        _assert_in_smm_qa(ticket)
        author_role = "smm"
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "FORBIDDEN",
                "message": "Insufficient permissions",
            },
        )

    attachments: list[dict[str, str]] = []
    if payload.attachment_asset_ids:
        result = await session.execute(
            select(MediaAsset).where(MediaAsset.id.in_(payload.attachment_asset_ids))
        )
        assets = {asset.id: asset for asset in result.scalars().all()}
        for asset_id in payload.attachment_asset_ids:
            asset = assets.get(asset_id)
            if (
                asset is None
                or asset.video_ticket_id != ticket.id
                or asset.kind != MediaAssetKind.qa_attachment
                or asset.status != MediaAssetStatus.ready
                or asset.uploaded_by_user_id != user.id
            ):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={
                        "error_code": "VALIDATION_ERROR",
                        "message": "Every attachment must be a completed upload for this review.",
                    },
                )
            attachments.append(
                {
                    "assetId": str(asset.id),
                    "fileName": asset.original_filename,
                    "contentType": asset.content_type,
                }
            )

    comment = QaComment(
        video_ticket_id=ticket.id,
        slot=QaMediaSlot.video,
        asset_version=_video_asset_version(ticket),
        kind=(
            QaCommentKind.timestamp
            if payload.at_seconds is not None
            else QaCommentKind.general
        ),
        author_role=author_role,
        author_user_id=user.id,
        at_seconds=payload.at_seconds,
        body=trimmed,
        attachments=attachments,
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
    visible = comments.get(ticket.id, [])
    if user.role == UserRole.client:
        visible = [row for row in visible if row.author_role == "client"]
    return AppendQaCommentResponse(
        ticket=video_to_dto(ticket, qa_comments=visible),
        comment=qa_comment_to_dto(comment),
    )


async def append_smm_qa_comment(
    session: AsyncSession,
    user: CurrentUser,
    video_ticket_id: UUID,
    payload: AppendQaCommentRequest,
) -> AppendQaCommentResponse:
    _assert_smm_user(user)
    return await append_qa_comment(session, user, video_ticket_id, payload)


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
        has_payload_feedback = _has_send_back_feedback(
            comment_body=comment_body,
            timestamp_flags=timestamp_flags,
            general_note=general_note,
        )
        existing_comment = None
        if not has_payload_feedback:
            existing_comment = await session.scalar(
                select(QaComment.id)
                .where(
                    QaComment.video_ticket_id == ticket.id,
                    QaComment.slot == QaMediaSlot.video,
                    QaComment.asset_version == _video_asset_version(ticket),
                    QaComment.author_role == "smm",
                    QaComment.deprecated.is_(False),
                )
                .limit(1)
            )
        if not has_payload_feedback and existing_comment is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "error_code": "VALIDATION_ERROR",
                    "message": "Add at least one review comment before sending this video back.",
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
            author_role="smm",
            author_user_id=user.id,
        ):
            session.add(row)
    elif payload.action == "approve":
        readiness = compute_readiness(ticket, batch)
        missing = client_release_missing(readiness, batch)
        if missing:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "error_code": "VALIDATION_ERROR",
                    "message": "Deliverable must be ready before client release",
                    # Nest under `details` so the error handler passes it through.
                    "details": {
                        "readiness": DeliverableReadinessDto(
                            video_ready=readiness.video_ready,
                            thumbnail_ready=readiness.thumbnail_ready,
                            title_ready=readiness.title_ready,
                            all_ready=readiness.all_ready,
                        ).model_dump(by_alias=True),
                        "missing": missing,
                    },
                },
            )
        _apply_smm_qa_approve(ticket)
        # Notes left during an approved internal pass remain available to the
        # team as history, but must not look like unresolved editor feedback if
        # the client later requests a separate revision on this version.
        await session.execute(
            update(QaComment)
            .where(
                QaComment.video_ticket_id == ticket.id,
                QaComment.slot == QaMediaSlot.video,
                QaComment.asset_version == _video_asset_version(ticket),
                QaComment.author_role == "smm",
                QaComment.deprecated.is_(False),
            )
            .values(deprecated=True)
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Invalid action",
            },
        )

    if payload.action == "approve":
        record_activity(
            session,
            batch_id=batch.id,
            actor=user,
            action="smm_qa_approved",
            summary=f"SMM QA passed video #{ticket.deliverable_index} — released to client",
            video_ticket_id=ticket.id,
            deliverable_index=ticket.deliverable_index,
        )
    else:
        record_activity(
            session,
            batch_id=batch.id,
            actor=user,
            action="smm_qa_flagged",
            summary=f"SMM QA sent video #{ticket.deliverable_index} back to editor",
            video_ticket_id=ticket.id,
            deliverable_index=ticket.deliverable_index,
            detail=general_note or comment_body or None,
        )

    ticket.updated_at = utc_now()
    session.add(ticket)
    batch.updated_at = utc_now()
    session.add(batch)

    await session.flush()
    await session.refresh(ticket)
    return await _qa_ticket_response(session, ticket, user)


async def resubmit_editor_video(
    session: AsyncSession,
    user: CurrentUser,
    video_ticket_id: UUID,
    payload: ResubmitToSmmQaRequest,
) -> QaTicketResponse:
    _assert_editor_user(user)
    ticket, batch = await _get_ticket_and_batch(session, user, video_ticket_id)
    _assert_in_editor_fix(ticket)

    current_version = _video_asset_version(ticket)
    feedback_version = await session.scalar(
        select(QaComment.asset_version)
        .where(
            QaComment.video_ticket_id == ticket.id,
            QaComment.slot == QaMediaSlot.video,
            QaComment.deprecated.is_(False),
        )
        .order_by(QaComment.asset_version.desc())
        .limit(1)
    )
    replacement_asset = await session.scalar(
        select(MediaAsset.id)
        .where(
            MediaAsset.video_ticket_id == ticket.id,
            MediaAsset.kind == MediaAssetKind.video,
            MediaAsset.status == MediaAssetStatus.ready,
            MediaAsset.is_current.is_(True),
            MediaAsset.version == current_version,
        )
        .limit(1)
    )
    if (
        feedback_version is None
        or current_version <= feedback_version
        or replacement_asset is None
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Upload a completed replacement video before resubmitting to SMM QA.",
            },
        )

    await session.execute(
        update(QaComment)
        .where(QaComment.video_ticket_id == ticket.id)
        .where(QaComment.slot == QaMediaSlot.video)
        .where(QaComment.asset_version < current_version)
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

    record_activity(
        session,
        batch_id=batch.id,
        actor=user,
        action="editor_resubmitted",
        summary=(
            f"Editor uploaded video v{current_version} and resubmitted "
            f"video #{ticket.deliverable_index} for SMM QA"
        ),
        video_ticket_id=ticket.id,
        deliverable_index=ticket.deliverable_index,
    )

    await session.flush()
    await session.refresh(ticket)
    return await _qa_ticket_response(session, ticket, user)


async def submit_client_qa(
    session: AsyncSession,
    user: CurrentUser,
    video_ticket_id: UUID,
    payload: ClientQaRequest,
) -> QaTicketResponse:
    _assert_client_user(user)
    ticket, batch = await _get_ticket_and_batch(session, user, video_ticket_id)
    _assert_in_client_final_qa(ticket)

    comment_body = (payload.comment_body or "").strip()
    general_note = (payload.general_note or "").strip()
    timestamp_flags = payload.timestamp_flags or []

    if payload.action == "reject":
        has_payload_feedback = _has_send_back_feedback(
            comment_body=comment_body,
            timestamp_flags=timestamp_flags,
            general_note=general_note,
        )
        existing_comment = None
        if not has_payload_feedback:
            existing_comment = await session.scalar(
                select(QaComment.id)
                .where(
                    QaComment.video_ticket_id == ticket.id,
                    QaComment.slot == QaMediaSlot.video,
                    QaComment.asset_version == _video_asset_version(ticket),
                    QaComment.author_role == "client",
                    QaComment.deprecated.is_(False),
                )
                .limit(1)
            )
        if not has_payload_feedback and existing_comment is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "error_code": "VALIDATION_ERROR",
                    "message": "Add at least one review comment before requesting changes.",
                },
            )
        apply_video_transition(
            ticket,
            PipelineStage.editor_fix,
            released_to_client_final_review=False,
        )
        ticket.last_revision_requested_by = "client"
        for row in _build_send_back_comments(
            ticket,
            comment_body=comment_body,
            timestamp_flags=timestamp_flags,
            general_note=general_note,
            author_role="client",
            author_user_id=user.id,
        ):
            session.add(row)
    elif payload.action == "approve":
        readiness = compute_readiness(ticket, batch)
        # Same rule as release: a client approving their own package must not be
        # blocked by an asset they themselves still owe. schedule_video is the
        # backstop that refuses to publish while anything is genuinely absent.
        missing = client_release_missing(readiness, batch)
        if missing:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "error_code": "VALIDATION_ERROR",
                    "message": "Deliverable must be ready before scheduling",
                    "details": {
                        "readiness": DeliverableReadinessDto(
                            video_ready=readiness.video_ready,
                            thumbnail_ready=readiness.thumbnail_ready,
                            title_ready=readiness.title_ready,
                            all_ready=readiness.all_ready,
                        ).model_dump(by_alias=True),
                        "missing": missing,
                    },
                },
            )
        apply_video_transition(
            ticket,
            PipelineStage.scheduling,
            released_to_client_final_review=False,
        )
        ticket.editor_workflow_phase = EditorWorkflowPhase.handed_off
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Invalid action",
            },
        )

    if payload.action == "approve":
        record_activity(
            session,
            batch_id=batch.id,
            actor=user,
            action="client_qa_approved",
            summary=f"Client approved final video #{ticket.deliverable_index}",
            video_ticket_id=ticket.id,
            deliverable_index=ticket.deliverable_index,
        )
    else:
        record_activity(
            session,
            batch_id=batch.id,
            actor=user,
            action="client_qa_rejected",
            summary=f"Client requested changes on video #{ticket.deliverable_index}",
            video_ticket_id=ticket.id,
            deliverable_index=ticket.deliverable_index,
            detail=general_note or comment_body or None,
        )

    ticket.updated_at = utc_now()
    session.add(ticket)
    batch.updated_at = utc_now()
    session.add(batch)

    await session.flush()
    await session.refresh(ticket)
    return await _qa_ticket_response(session, ticket, user)


async def triage_client_revision(
    session: AsyncSession,
    user: CurrentUser,
    video_ticket_id: UUID,
    payload: ClientRevisionTriageRequest,
) -> QaTicketResponse:
    _assert_smm_user(user)
    ticket, batch = await _get_ticket_and_batch(session, user, video_ticket_id)
    _assert_in_client_revision_via_smm(ticket)

    if payload.route == "editor":
        apply_video_transition(
            ticket,
            PipelineStage.editor_fix,
            released_to_client_final_review=False,
        )
        # Preserve the source so the editor workspace can state loudly whether
        # the request came from the client or internal QA.
        ticket.last_revision_requested_by = "client"
        ticket.editor_workflow_phase = None
    elif payload.route == "smm_assets":
        apply_video_transition(
            ticket,
            PipelineStage.production,
            released_to_client_final_review=False,
        )
        ticket.pipeline_owner = VideoPipelineOwner.smm
        ticket.deadline_role = "smm"
        ticket.editor_workflow_phase = None
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Invalid route",
            },
        )

    ticket.updated_at = utc_now()
    session.add(ticket)
    batch.updated_at = utc_now()
    session.add(batch)

    await session.flush()
    await session.refresh(ticket)
    return await _qa_ticket_response(session, ticket, user)
