"""SMM internal QA API schemas (B7)."""

from typing import Literal
from uuid import UUID

from pydantic import Field

from app.schemas.admin import AdminVideoTicketResponse, QaCommentDto
from app.schemas.common import CamelModel


class TimestampFlagInput(CamelModel):
    at_seconds: int = Field(alias="atSeconds", ge=0)
    note: str = Field(min_length=1)


class SubmitSmmQaRequest(CamelModel):
    action: Literal["approve", "send_back"]
    comment_body: str | None = Field(default=None, alias="commentBody")
    timestamp_flags: list[TimestampFlagInput] | None = Field(
        default=None,
        alias="timestampFlags",
    )
    general_note: str | None = Field(default=None, alias="generalNote")


class AppendQaCommentRequest(CamelModel):
    body: str = Field(min_length=1)


class ResubmitToSmmQaRequest(CamelModel):
    bump_video_version: bool = Field(default=True, alias="bumpVideoVersion")


class QaTicketResponse(CamelModel):
    ticket: AdminVideoTicketResponse


class AppendQaCommentResponse(CamelModel):
    ticket: AdminVideoTicketResponse
    comment: QaCommentDto
