"""Map ORM rows to admin API responses (delegates to workspace mappers)."""

from app.models.batch import Batch
from app.models.client_profile import ClientProfile
from app.models.user import User
from app.models.video_ticket import VideoTicket
from app.schemas.admin import (
    AdminBatchFolderResponse,
    AdminClientProfileResponse,
    AdminVideoTicketResponse,
    AssignedStaffResponse,
    BrandGuidelinesResponse,
)
from app.services import workspace_mappers as wm

derive_guidelines_source = wm.derive_guidelines_source
brand_guidelines_response = wm.brand_guidelines_response
batch_to_response = wm.batch_to_dto
video_to_response = wm.video_to_dto


def assigned_staff(user: User | None, fallback_name: str = "—") -> AssignedStaffResponse:
    if user is None:
        raise ValueError("assigned staff user is required")
    return AssignedStaffResponse(id=user.id, name=user.display_name or fallback_name)


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
    return wm.client_profile_to_dto(
        profile,
        login_email=login_email,
        smm=smm,
        editor=editor,
        reserved_credits=reserved_credits,
        credits_debited_total=credits_debited_total,
        active_batch_number=active_batch_number,
    )
