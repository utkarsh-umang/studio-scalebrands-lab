"""Credit balance audit ledger (top-ups and batch debits)."""

import uuid

from sqlalchemy import Column, Text
from sqlmodel import Field

from app.db.base import Base


class CreditAdjustment(Base, table=True):
    __tablename__ = "credit_adjustments"

    client_id: uuid.UUID = Field(foreign_key="client_profiles.id", index=True)
    batch_id: uuid.UUID | None = Field(default=None, foreign_key="batches.id")
    amount: int
    kind: str = Field(max_length=32)
    note: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    created_by_user_id: uuid.UUID | None = Field(default=None, foreign_key="users.id")
