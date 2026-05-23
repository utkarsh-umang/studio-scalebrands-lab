"""Admin staff provisioning and listing."""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import EmployeeKind, UserRole
from app.models.user import User
from app.schemas.admin import (
    CredentialsResponse,
    ProvisionStaffRequest,
    ProvisionStaffResponse,
    StaffListResponse,
    StaffMemberResponse,
)
from app.services.auth_service import get_user_by_email, normalize_email
from app.utils.security import hash_password


async def list_staff(session: AsyncSession) -> StaffListResponse:
    result = await session.execute(
        select(User)
        .where(
            User.role == UserRole.employee,
            User.is_active.is_(True),
        )
        .order_by(User.display_name),
    )
    smm: list[StaffMemberResponse] = []
    editors: list[StaffMemberResponse] = []
    for user in result.scalars().all():
        if user.employee_kind == EmployeeKind.smm:
            smm.append(
                StaffMemberResponse(id=user.id, name=user.display_name, role="smm"),
            )
        elif user.employee_kind == EmployeeKind.editor:
            editors.append(
                StaffMemberResponse(id=user.id, name=user.display_name, role="editor"),
            )
    return StaffListResponse(smm=smm, editors=editors)


async def provision_staff(
    session: AsyncSession,
    body: ProvisionStaffRequest,
) -> ProvisionStaffResponse:
    if body.employee_kind not in (EmployeeKind.editor, EmployeeKind.smm):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "VALIDATION_ERROR",
                "message": "employeeKind must be editor or smm",
            },
        )

    email = normalize_email(str(body.email))
    if await get_user_by_email(session, email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error_code": "CONFLICT",
                "message": "A user with this email already exists",
            },
        )

    user = User(
        email=email,
        password_hash=hash_password(body.password),
        display_name=body.display_name.strip(),
        role=UserRole.employee,
        employee_kind=body.employee_kind,
        is_active=True,
    )
    session.add(user)
    await session.flush()

    role_label = body.employee_kind.value
    return ProvisionStaffResponse(
        staff=StaffMemberResponse(id=user.id, name=user.display_name, role=role_label),
        credentials=CredentialsResponse(email=email, password=body.password),
    )
