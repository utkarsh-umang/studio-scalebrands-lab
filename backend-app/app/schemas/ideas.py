"""Path A (idea-first) API schemas."""

from app.schemas.clips import BatchVideosResponse
from app.schemas.common import CamelModel


class SubmitIdeasRequest(CamelModel):
    ideas: list[str]


class RejectIdeasRequest(CamelModel):
    note: str | None = None


class SubmitIdeaFootageRequest(CamelModel):
    url: str


IdeasResponse = BatchVideosResponse
