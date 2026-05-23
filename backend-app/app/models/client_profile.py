"""Business client profile (credits, team, guidelines)."""

import uuid
from datetime import datetime

from sqlalchemy import Column, Text
from sqlmodel import Field

from app.db.base import Base
from app.models._columns import pg_enum
from app.models.enums import BrandGuidelinesSource, ClientAccountStatus


class ClientProfile(Base, table=True):
    __tablename__ = "client_profiles"

    display_name: str = Field(max_length=255)
    credits_balance: int = Field(default=0)
    account_status: ClientAccountStatus = Field(
        sa_column=pg_enum(ClientAccountStatus, "client_account_status"),
        default=ClientAccountStatus.active,
    )
    decommission_reason: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    decommissioned_at: datetime | None = Field(default=None)
    assigned_smm_id: uuid.UUID | None = Field(default=None, foreign_key="users.id")
    assigned_editor_id: uuid.UUID | None = Field(default=None, foreign_key="users.id")
    brand_guidelines_source: BrandGuidelinesSource = Field(
        sa_column=pg_enum(BrandGuidelinesSource, "brand_guidelines_source"),
        default=BrandGuidelinesSource.internal,
    )
    brand_guidelines_summary: str = Field(default="", sa_column=Column(Text, nullable=False))
    brand_guidelines_google_doc_url: str | None = Field(default=None, max_length=2048)
    brand_guidelines_updated_at: datetime | None = Field(default=None)
