"""Production fields, drive sync snapshots, submit to SMM QA (B6)."""

from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.db.base import utc_now
from app.models.batch import Batch
from app.models.enums import (
    EmployeeKind,
    PipelineStage,
    UserRole,
    VideoPipelineOwner,
)
from app.models.video_ticket import VideoTicket
from app.schemas.production import (
    DeliverableDriveSyncRequest,
    DeliverableReadinessDto,
    DriveMediaEntryInput,
    ProductionTicketResponse,
    SubmitToSmmQaResponse,
    UpdateProductionRequest,
)
from app.services.path_b_transitions import apply_video_transition
from app.services.readiness_service import DeliverableReadiness, compute_readiness
from app.services.workspace_access import assert_employee_batch_access, assert_video_access
from app.services.workspace_mappers import (
    load_qa_comments_by_ticket_ids,
    video_to_dto,
)

MAX_TITLE_LENGTH = 512


def readiness_to_dto(readiness: DeliverableReadiness) -> DeliverableReadinessDto:
    return DeliverableReadinessDto(
        video_ready=readiness.video_ready,
        thumbnail_ready=readiness.thumbnail_ready,
        title_ready=readiness.title_ready,
        all_ready=readiness.all_ready,
    )


async def _ticket_response(
    session: AsyncSession,
    ticket: VideoTicket,
    batch: Batch,
) -> ProductionTicketResponse:
    comments = await load_qa_comments_by_ticket_ids(session, [ticket.id])
    readiness = compute_readiness(ticket, batch)
    return ProductionTicketResponse(
        ticket=video_to_dto(ticket, qa_comments=comments.get(ticket.id, [])),
        readiness=readiness_to_dto(readiness),
    )


def _assert_post_split_ticket(ticket: VideoTicket, batch: Batch) -> None:
    if ticket.deliverable_index is None or ticket.deliverable_index < 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Production commands require a post-split deliverable ticket",
            },
        )
    if not (batch.editor_deliverables_drive_url or "").strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Batch deliverables drive URL is required",
            },
        )


def _stage_lower(ticket: VideoTicket) -> str:
    return (ticket.stage_label or "").lower()


def _is_production_like_stage(ticket: VideoTicket) -> bool:
    stage = _stage_lower(ticket)
    if ticket.pipeline_stage == PipelineStage.production:
        return True
    return any(token in stage for token in ("production", "thumbnail", "title"))


def _editor_needs_production_work(ticket: VideoTicket) -> bool:
    if ticket.pipeline_owner != VideoPipelineOwner.editor:
        return False
    if "qa flagged" in _stage_lower(ticket):
        return False
    return _is_production_like_stage(ticket)


def _smm_in_asset_prep_flow(ticket: VideoTicket) -> bool:
    if ticket.pipeline_owner != VideoPipelineOwner.smm:
        return False
    return _is_production_like_stage(ticket)


def _smm_can_edit_editor_deliverable(ticket: VideoTicket, readiness: DeliverableReadiness) -> bool:
    if ticket.pipeline_owner != VideoPipelineOwner.editor:
        return False
    if "qa flagged" in _stage_lower(ticket):
        return False
    if not _is_production_like_stage(ticket):
        return False
    return not readiness.title_ready or not readiness.thumbnail_ready


def _assert_employee_production_access(
    user: CurrentUser,
    ticket: VideoTicket,
    batch: Batch,
    *,
    for_submit: bool = False,
) -> None:
    if user.role != UserRole.employee:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "FORBIDDEN",
                "message": "Insufficient permissions",
            },
        )

    readiness = compute_readiness(ticket, batch)
    if user.employee_kind == EmployeeKind.editor:
        if not _editor_needs_production_work(ticket):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "error_code": "VALIDATION_ERROR",
                    "message": "Ticket is not in editor production",
                },
            )
        return

    if user.employee_kind == EmployeeKind.smm:
        if for_submit:
            if not _smm_in_asset_prep_flow(ticket):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={
                        "error_code": "VALIDATION_ERROR",
                        "message": "Ticket is not in SMM asset prep",
                    },
                )
            return
        if _smm_in_asset_prep_flow(ticket) or _smm_can_edit_editor_deliverable(
            ticket,
            readiness,
        ):
            return
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "SMM cannot edit production for this ticket",
            },
        )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={
            "error_code": "FORBIDDEN",
            "message": "Insufficient permissions",
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
    _assert_post_split_ticket(ticket, batch)
    return ticket, batch


def _entry_to_slot_dict(entry: DriveMediaEntryInput) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "index": entry.index,
        "driveFileId": entry.drive_file_id,
        "name": entry.name,
    }
    if entry.mime_type:
        payload["mimeType"] = entry.mime_type
    if entry.modified_time:
        payload["modifiedTime"] = entry.modified_time
    return payload


async def update_production(
    session: AsyncSession,
    user: CurrentUser,
    video_ticket_id: UUID,
    payload: UpdateProductionRequest,
) -> ProductionTicketResponse:
    ticket, batch = await _get_ticket_and_batch(session, user, video_ticket_id)
    _assert_employee_production_access(user, ticket, batch)

    if payload.editor_publish_title is not None:
        trimmed = payload.editor_publish_title.strip()
        if not trimmed:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "error_code": "VALIDATION_ERROR",
                    "message": "editorPublishTitle cannot be empty",
                },
            )
        if len(trimmed) > MAX_TITLE_LENGTH:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "error_code": "VALIDATION_ERROR",
                    "message": f"Title must be at most {MAX_TITLE_LENGTH} characters",
                },
            )
        ticket.editor_publish_title = trimmed
        ticket.updated_at = utc_now()
        session.add(ticket)

    await session.flush()
    await session.refresh(ticket)
    batch.updated_at = utc_now()
    session.add(batch)
    return await _ticket_response(session, ticket, batch)


async def record_drive_sync(
    session: AsyncSession,
    user: CurrentUser,
    video_ticket_id: UUID,
    payload: DeliverableDriveSyncRequest,
) -> ProductionTicketResponse:
    ticket, batch = await _get_ticket_and_batch(session, user, video_ticket_id)
    _assert_employee_production_access(user, ticket, batch)

    index = ticket.deliverable_index or 0
    if payload.deliverable_index != index:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "deliverableIndex does not match ticket",
            },
        )

    slots: dict[str, Any] = dict(ticket.deliverable_drive_slots or {})
    if payload.video is not None:
        if payload.video.index != index:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "error_code": "VALIDATION_ERROR",
                    "message": "video.index does not match deliverable",
                },
            )
        slots["video"] = _entry_to_slot_dict(payload.video)
    if payload.thumbnail is not None:
        if payload.thumbnail.index != index:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "error_code": "VALIDATION_ERROR",
                    "message": "thumbnail.index does not match deliverable",
                },
            )
        slots["thumbnail"] = _entry_to_slot_dict(payload.thumbnail)

    ticket.deliverable_drive_slots = slots or None
    ticket.drive_slots_synced_at = utc_now()
    ticket.updated_at = utc_now()
    session.add(ticket)
    batch.updated_at = utc_now()
    session.add(batch)

    await session.flush()
    await session.refresh(ticket)
    return await _ticket_response(session, ticket, batch)


async def submit_to_smm_qa(
    session: AsyncSession,
    user: CurrentUser,
    video_ticket_id: UUID,
) -> SubmitToSmmQaResponse:
    ticket, batch = await _get_ticket_and_batch(session, user, video_ticket_id)

    if ticket.pipeline_stage == PipelineStage.smm_qa:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Ticket is already in SMM QA",
            },
        )

    readiness = compute_readiness(ticket, batch)
    if user.employee_kind == EmployeeKind.editor:
        if not _editor_needs_production_work(ticket):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "error_code": "VALIDATION_ERROR",
                    "message": "Ticket is not in editor production",
                },
            )
    elif user.employee_kind == EmployeeKind.smm:
        _assert_employee_production_access(user, ticket, batch, for_submit=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "FORBIDDEN",
                "message": "Insufficient permissions",
            },
        )

    if not readiness.all_ready:
        missing = readiness.missing_fields()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Deliverable is not ready for SMM QA",
                "readiness": readiness_to_dto(readiness).model_dump(by_alias=True),
                "missing": missing,
            },
        )

    apply_video_transition(
        ticket,
        PipelineStage.smm_qa,
        released_to_client_final_review=False,
    )
    session.add(ticket)
    batch.updated_at = utc_now()
    session.add(batch)

    await session.flush()
    await session.refresh(ticket)
    return SubmitToSmmQaResponse(
        ticket=(await _ticket_response(session, ticket, batch)).ticket,
        readiness=readiness_to_dto(compute_readiness(ticket, batch)),
        missing=[],
    )
