"""Login identity for all roles."""

import uuid

from sqlmodel import Field

from app.db.base import Base, utc_now
from app.models._columns import pg_enum, pg_enum_nullable
from app.models.enums import EmployeeKind, UserRole


class User(Base, table=True):
    __tablename__ = "users"

    email: str = Field(max_length=320, unique=True, index=True)
    password_hash: str = Field(max_length=255)
    display_name: str = Field(max_length=255)
    role: UserRole = Field(sa_column=pg_enum(UserRole, "user_role"))
    employee_kind: EmployeeKind | None = Field(
        default=None,
        sa_column=pg_enum_nullable(EmployeeKind, "employee_kind"),
    )
    client_profile_id: uuid.UUID | None = Field(
        default=None,
        foreign_key="client_profiles.id",
        index=True,
    )
    is_active: bool = Field(default=True)

    def touch_updated_at(self) -> None:
        self.updated_at = utc_now()
