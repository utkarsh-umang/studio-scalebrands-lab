"""QA comment thread rows (B4+)."""

import uuid

from sqlmodel import Field

from app.db.base import Base
from app.models._columns import pg_enum
from app.models.enums import QaCommentKind, QaMediaSlot


class QaComment(Base, table=True):
    __tablename__ = "qa_comments"

    video_ticket_id: uuid.UUID = Field(foreign_key="video_tickets.id", index=True)
    slot: QaMediaSlot = Field(sa_column=pg_enum(QaMediaSlot, "qa_media_slot"))
    asset_version: int = Field(default=1)
    kind: QaCommentKind = Field(sa_column=pg_enum(QaCommentKind, "qa_comment_kind"))
    author_role: str = Field(max_length=32)
    author_user_id: uuid.UUID | None = Field(default=None, foreign_key="users.id")
    at_seconds: int | None = Field(default=None)
    body: str = Field()
    deprecated: bool = Field(default=False)
