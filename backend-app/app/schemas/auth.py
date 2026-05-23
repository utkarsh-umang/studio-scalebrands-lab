"""Auth request/response schemas."""

from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import EmployeeKind, UserRole
from app.schemas.common import CamelModel


class LoginRequest(BaseModel):
    """Accepts standard JSON keys (email, password)."""

    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str = Field(min_length=1)


class MeResponse(CamelModel):
    id: UUID
    email: str
    name: str
    role: UserRole
    employee_kind: EmployeeKind | None = None
    client_profile_id: UUID | None = None


class LoginResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: MeResponse
