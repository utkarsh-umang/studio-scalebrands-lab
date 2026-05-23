"""Admin client provisioning and profile management."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.db.base import utc_now
from app.models.client_profile import ClientProfile
from app.models.credit_adjustment import CreditAdjustment
from app.models.enums import ClientAccountStatus, EmployeeKind, UserRole
from app.models.user import User
from app.schemas.admin import (
    AdminClientListItemResponse,
    AdminClientListResponse,
    AdminClientProfileResponse,
    CredentialsResponse,
    DecommissionClientRequest,
    ProvisionClientRequest,
    ProvisionClientResponse,
    TopUpCreditsRequest,
    UpdateBrandGuidelinesRequest,
    UpdateClientTeamRequest,
)
from app.services.admin_helpers import (
    active_batch_number,
    assert_client_active,
    credits_debited_total,
    first_employee_by_kind,
    get_client_login_email,
    get_profile_or_404,
    load_staff_user,
    reserved_credits_for_client,
)
from app.services.admin_mappers import (
    assigned_staff,
    client_profile_response,
    derive_guidelines_source,
)
from app.services.auth_service import get_user_by_email, normalize_email
from app.utils.security import hash_password


async def _build_profile_response(session: AsyncSession, profile: ClientProfile) -> AdminClientProfileResponse:
    smm = await session.get(User, profile.assigned_smm_id)
    editor = await session.get(User, profile.assigned_editor_id)
    if smm is None or editor is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error_code": "INTERNAL_ERROR",
                "message": "Client team assignment is incomplete",
            },
        )
    login_email = await get_client_login_email(session, profile.id)
    return client_profile_response(
        profile,
        login_email=login_email,
        smm=smm,
        editor=editor,
        reserved_credits=await reserved_credits_for_client(session, profile.id),
        credits_debited_total=await credits_debited_total(session, profile.id),
        active_batch_number=await active_batch_number(session, profile.id),
    )


async def list_clients(session: AsyncSession) -> AdminClientListResponse:
    result = await session.execute(
        select(ClientProfile).order_by(ClientProfile.created_at.desc()),
    )
    profiles = list(result.scalars().all())
    items: list[AdminClientListItemResponse] = []
    for profile in profiles:
        smm = await session.get(User, profile.assigned_smm_id)
        editor = await session.get(User, profile.assigned_editor_id)
        if smm is None or editor is None:
            continue
        login_email = await get_client_login_email(session, profile.id)
        items.append(
            AdminClientListItemResponse(
                id=profile.id,
                display_name=profile.display_name,
                login_email=login_email,
                credits=profile.credits_balance,
                account_status=profile.account_status,
                active_batch_number=await active_batch_number(session, profile.id),
                reserved_credits=await reserved_credits_for_client(session, profile.id),
                assigned_smm=assigned_staff(smm),
                assigned_editor=assigned_staff(editor),
                created_at=profile.created_at.date().isoformat(),
            ),
        )
    return AdminClientListResponse(clients=items)


async def get_client(session: AsyncSession, client_id: UUID) -> AdminClientProfileResponse:
    profile = await get_profile_or_404(session, client_id)
    return await _build_profile_response(session, profile)


async def provision_client(
    session: AsyncSession,
    body: ProvisionClientRequest,
) -> ProvisionClientResponse:
    login_email = normalize_email(body.login_id)
    if await get_user_by_email(session, login_email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error_code": "CONFLICT",
                "message": "A user with this login already exists",
            },
        )

    smm = await first_employee_by_kind(session, EmployeeKind.smm)
    editor = await first_employee_by_kind(session, EmployeeKind.editor)
    if smm is None or editor is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "Provision at least one SMM and one editor before creating clients",
            },
        )

    now = utc_now()
    profile = ClientProfile(
        display_name=body.display_name.strip(),
        credits_balance=body.initial_credits,
        account_status=ClientAccountStatus.active,
        assigned_smm_id=smm.id,
        assigned_editor_id=editor.id,
        brand_guidelines_updated_at=now,
    )
    session.add(profile)
    await session.flush()

    user = User(
        email=login_email,
        password_hash=hash_password(body.password),
        display_name=body.display_name.strip(),
        role=UserRole.client,
        client_profile_id=profile.id,
        is_active=True,
    )
    session.add(user)
    await session.flush()
    await session.refresh(profile)

    client = await _build_profile_response(session, profile)
    return ProvisionClientResponse(
        client=client,
        credentials=CredentialsResponse(email=login_email, password=body.password),
    )


async def top_up_credits(
    session: AsyncSession,
    client_id: UUID,
    body: TopUpCreditsRequest,
    admin: CurrentUser,
) -> AdminClientProfileResponse:
    profile = await get_profile_or_404(session, client_id)
    await assert_client_active(profile)
    profile.credits_balance += body.amount
    profile.touch_updated_at()
    session.add(profile)
    session.add(
        CreditAdjustment(
            client_id=profile.id,
            amount=body.amount,
            kind="top_up",
            created_by_user_id=admin.id,
        ),
    )
    await session.flush()
    return await _build_profile_response(session, profile)


async def decommission_client(
    session: AsyncSession,
    client_id: UUID,
    body: DecommissionClientRequest,
) -> AdminClientProfileResponse:
    profile = await get_profile_or_404(session, client_id)
    now = utc_now()
    profile.account_status = ClientAccountStatus.decommissioned
    profile.decommission_reason = body.reason.strip()
    profile.decommissioned_at = now
    profile.touch_updated_at()
    session.add(profile)

    result = await session.execute(
        select(User).where(
            User.client_profile_id == profile.id,
            User.role == UserRole.client,
        ),
    )
    for user in result.scalars().all():
        user.is_active = False
        user.touch_updated_at()
        session.add(user)

    await session.flush()
    return await _build_profile_response(session, profile)


async def update_team(
    session: AsyncSession,
    client_id: UUID,
    body: UpdateClientTeamRequest,
) -> AdminClientProfileResponse:
    profile = await get_profile_or_404(session, client_id)
    await assert_client_active(profile)
    smm = await load_staff_user(session, body.smm_id, expected_kind=EmployeeKind.smm)
    editor = await load_staff_user(session, body.editor_id, expected_kind=EmployeeKind.editor)
    profile.assigned_smm_id = smm.id
    profile.assigned_editor_id = editor.id
    profile.touch_updated_at()
    session.add(profile)
    await session.flush()
    return await _build_profile_response(session, profile)


async def update_brand_guidelines(
    session: AsyncSession,
    client_id: UUID,
    body: UpdateBrandGuidelinesRequest,
) -> AdminClientProfileResponse:
    profile = await get_profile_or_404(session, client_id)
    await assert_client_active(profile)
    summary = body.summary.strip()
    google_doc_url = body.google_doc_url.strip() if body.google_doc_url else None
    profile.brand_guidelines_summary = summary
    profile.brand_guidelines_google_doc_url = google_doc_url or None
    profile.brand_guidelines_source = derive_guidelines_source(summary, google_doc_url)
    profile.brand_guidelines_updated_at = utc_now()
    profile.touch_updated_at()
    session.add(profile)
    await session.flush()
    return await _build_profile_response(session, profile)
