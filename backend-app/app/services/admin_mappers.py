"""Map ORM rows to admin API responses."""

from datetime import datetime

from app.models.batch import Batch
from app.models.client_profile import ClientProfile
from app.models.enums import BrandGuidelinesSource
from app.models.user import User
from app.models.video_ticket import VideoTicket
from app.schemas.admin import (
    AdminBatchFolderResponse,
    AdminClientProfileResponse,
    AdminVideoTicketResponse,
    AssignedStaffResponse,
    BrandGuidelinesResponse,
)


def _iso_date(value: datetime | None) -> str | None:
    if value is None:
        return None
    return value.date().isoformat()


def _iso_datetime(value: datetime | None) -> str | None:
    if value is None:
        return None
    return value.isoformat()


def derive_guidelines_source(summary: str, google_doc_url: str | None) -> BrandGuidelinesSource:
    if google_doc_url and google_doc_url.strip():
        return BrandGuidelinesSource.google_doc
    return BrandGuidelinesSource.internal


def brand_guidelines_response(profile: ClientProfile) -> BrandGuidelinesResponse:
    return BrandGuidelinesResponse(
        source=profile.brand_guidelines_source,
        summary=profile.brand_guidelines_summary,
        google_doc_url=profile.brand_guidelines_google_doc_url,
        last_updated_at=_iso_date(profile.brand_guidelines_updated_at) or "",
    )


def assigned_staff(user: User | None, fallback_name: str = "—") -> AssignedStaffResponse:
    if user is None:
        raise ValueError("assigned staff user is required")
    return AssignedStaffResponse(id=user.id, name=user.display_name or fallback_name)


def batch_to_response(batch: Batch) -> AdminBatchFolderResponse:
    source = batch.source_media_url
    return AdminBatchFolderResponse(
        id=batch.id,
        client_id=batch.client_id,
        batch_number=batch.batch_number,
        title=batch.title,
        status=batch.status,
        video_count=batch.video_count,
        created_at=_iso_date(batch.created_at) or "",
        updated_at=_iso_date(batch.updated_at) or "",
        completed_at=_iso_date(batch.completed_at),
        footage_url=source,
        source_media_url=source,
        intake_path=batch.intake_path,
        clip_review_phase=batch.clip_review_phase,
        clips_folder_url=batch.clips_folder_url,
        editor_deliverables_drive_url=batch.editor_deliverables_drive_url,
        credit_cost=batch.credit_cost,
        credits_debited=batch.credits_debited,
        pipeline_stage=batch.pipeline_stage,
        demo_stage=batch.pipeline_stage,
    )


def video_to_response(ticket: VideoTicket) -> AdminVideoTicketResponse:
    return AdminVideoTicketResponse(
        id=ticket.id,
        batch_id=ticket.batch_id,
        client_id=ticket.client_id,
        title=ticket.title,
        owner=ticket.pipeline_owner,
        stage_label=ticket.stage_label,
        deadline_role=ticket.deadline_role,
        deadline_at=_iso_datetime(ticket.deadline_at),
        deliverable_index=ticket.deliverable_index,
        editor_publish_title=ticket.editor_publish_title,
        released_to_client_final_review=ticket.released_to_client_final_review,
    )


def client_profile_response(
    profile: ClientProfile,
    *,
    login_email: str,
    smm: User,
    editor: User,
    reserved_credits: int,
    credits_debited_total: int,
    active_batch_number: int | None,
) -> AdminClientProfileResponse:
    return AdminClientProfileResponse(
        id=profile.id,
        login_email=login_email,
        display_name=profile.display_name,
        credits=profile.credits_balance,
        account_status=profile.account_status,
        decommission_reason=profile.decommission_reason,
        decommissioned_at=_iso_date(profile.decommissioned_at),
        created_at=_iso_date(profile.created_at) or "",
        assigned_smm_id=smm.id,
        assigned_smm_name=smm.display_name,
        assigned_editor_id=editor.id,
        assigned_editor_name=editor.display_name,
        brand_guidelines=brand_guidelines_response(profile),
        reserved_credits=reserved_credits,
        credits_debited_total=credits_debited_total,
        active_batch_number=active_batch_number,
    )
