"""SQLModel tables — import all models so Alembic discovers them."""

from app.models.batch import Batch
from app.models.batch_activity import BatchActivity
from app.models.client_profile import ClientProfile
from app.models.credit_adjustment import CreditAdjustment
from app.models.enums import (
    BatchClipReviewPhase,
    BatchIntakePath,
    BatchStatus,
    BrandGuidelinesSource,
    ClientAccountStatus,
    EditorWorkflowPhase,
    EmployeeKind,
    MediaAssetKind,
    MediaAssetStatus,
    PipelineStage,
    QaCommentKind,
    QaMediaSlot,
    UserRole,
    VideoPipelineOwner,
)
from app.models.media_asset import MediaAsset
from app.models.qa_comment import QaComment
from app.models.user import User
from app.models.video_ticket import VideoTicket

__all__ = [
    "Batch",
    "BatchActivity",
    "BatchClipReviewPhase",
    "BatchIntakePath",
    "BatchStatus",
    "BrandGuidelinesSource",
    "ClientAccountStatus",
    "ClientProfile",
    "CreditAdjustment",
    "EditorWorkflowPhase",
    "EmployeeKind",
    "MediaAsset",
    "MediaAssetKind",
    "MediaAssetStatus",
    "PipelineStage",
    "QaComment",
    "QaCommentKind",
    "QaMediaSlot",
    "User",
    "UserRole",
    "VideoPipelineOwner",
    "VideoTicket",
]
