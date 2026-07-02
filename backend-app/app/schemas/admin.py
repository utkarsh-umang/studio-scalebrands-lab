"""Admin API request/response schemas (B1)."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import (
    BatchClipReviewPhase,
    BatchIntakePath,
    BatchStatus,
    BrandGuidelinesSource,
    ClientAccountStatus,
    EditorWorkflowPhase,
    EmployeeKind,
    PipelineStage,
    VideoPipelineOwner,
)
from app.schemas.common import CamelModel


class StaffMemberResponse(CamelModel):
    id: UUID
    name: str
    role: str


class StaffListResponse(CamelModel):
    smm: list[StaffMemberResponse]
    editors: list[StaffMemberResponse]


class AssignedStaffResponse(CamelModel):
    id: UUID
    name: str


class BrandGuidelinesResponse(CamelModel):
    source: BrandGuidelinesSource
    summary: str
    google_doc_url: str | None = None
    last_updated_at: str


class AdminClientListItemResponse(CamelModel):
    id: UUID
    display_name: str
    login_email: str
    credits: int
    account_status: ClientAccountStatus
    active_batch_number: int | None = None
    reserved_credits: int
    assigned_smm: AssignedStaffResponse
    assigned_editor: AssignedStaffResponse
    created_at: str


class AdminClientListResponse(CamelModel):
    clients: list[AdminClientListItemResponse]


class AdminClientProfileResponse(CamelModel):
    id: UUID
    login_email: str
    display_name: str
    credits: int
    account_status: ClientAccountStatus
    decommission_reason: str | None = None
    decommissioned_at: str | None = None
    created_at: str
    assigned_smm_id: UUID
    assigned_smm_name: str
    assigned_editor_id: UUID
    assigned_editor_name: str
    brand_guidelines: BrandGuidelinesResponse
    reserved_credits: int
    credits_debited_total: int
    active_batch_number: int | None = None


class CredentialsResponse(CamelModel):
    email: str
    password: str


class ProvisionClientRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    login_id: str = Field(alias="loginId", min_length=3, max_length=320)
    display_name: str = Field(alias="displayName", min_length=1, max_length=255)
    password: str = Field(min_length=8)
    initial_credits: int = Field(alias="initialCredits", ge=0)


class ProvisionClientResponse(CamelModel):
    client: AdminClientProfileResponse
    credentials: CredentialsResponse


class ProvisionStaffRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    email: EmailStr
    display_name: str = Field(alias="displayName", min_length=1, max_length=255)
    password: str = Field(min_length=8)
    employee_kind: EmployeeKind = Field(alias="employeeKind")


class ProvisionStaffResponse(CamelModel):
    staff: StaffMemberResponse
    credentials: CredentialsResponse


class TopUpCreditsRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    amount: int = Field(gt=0)


class DecommissionClientRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reason: str = Field(min_length=1)


class UpdateClientTeamRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    smm_id: UUID = Field(alias="smmId")
    editor_id: UUID = Field(alias="editorId")


class UpdateBrandGuidelinesRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    summary: str = ""
    google_doc_url: str | None = Field(default=None, alias="googleDocUrl", max_length=2048)


class CreateBatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    title: str = Field(min_length=1, max_length=512)
    credit_cost: int = Field(alias="creditCost", gt=0)
    footage_url: str | None = Field(default=None, alias="footageUrl", max_length=2048)


class AdminBatchFolderResponse(CamelModel):
    id: UUID
    client_id: UUID
    batch_number: int
    title: str
    status: BatchStatus
    video_count: int
    created_at: str
    updated_at: str
    completed_at: str | None = None
    footage_url: str | None = None
    source_media_url: str | None = None
    intake_path: BatchIntakePath | None = None
    clip_review_phase: BatchClipReviewPhase | None = None
    clips_folder_url: str | None = None
    editor_deliverables_drive_url: str | None = None
    credit_cost: int
    credits_debited: bool
    pipeline_stage: PipelineStage
    demo_stage: PipelineStage | None = None
    batch_schedule: dict[str, Any] | None = None
    clip_owner_kind: str | None = None
    thumbnail_owner_kind: str | None = None
    title_owner_kind: str | None = None


class SetBatchAssignmentsRequest(CamelModel):
    clip_owner_kind: str | None = None
    thumbnail_owner_kind: str | None = None
    title_owner_kind: str | None = None


class CreditAdjustmentDto(CamelModel):
    id: UUID
    amount: int
    kind: str
    note: str | None = None
    batch_id: UUID | None = None
    at: datetime


class CreditHistoryResponse(CamelModel):
    items: list[CreditAdjustmentDto] = []


class QaCommentDto(CamelModel):
    id: str
    slot: str
    asset_version: int
    kind: str
    author_role: str
    at_seconds: int | None = None
    body: str
    created_at: str
    deprecated: bool = False


class AdminVideoTicketResponse(CamelModel):
    id: UUID
    batch_id: UUID
    client_id: UUID
    title: str
    owner: VideoPipelineOwner
    stage_label: str
    deadline_role: str | None = None
    deadline_at: str | None = None
    deliverable_index: int | None = None
    editor_workflow_phase: EditorWorkflowPhase | None = None
    editor_publish_title: str | None = None
    released_to_client_final_review: bool = False
    last_revision_requested_by: str | None = None
    asset_versions: dict[str, Any] | None = None
    deliverable_drive_slots: dict[str, Any] | None = None
    drive_slots_synced_at: str | None = None
    qa_flags: list[dict[str, Any]] | None = None
    qa_general_note: str | None = None
    qa_comment_history: list[QaCommentDto] = Field(default_factory=list)
    video_schedule: dict[str, Any] | None = None
    demo_stage: PipelineStage | None = None


class AdminPipelineSummaryResponse(CamelModel):
    with_client: int
    with_smm: int
    with_editor: int


class AdminPipelineItemResponse(CamelModel):
    id: UUID
    client_id: UUID
    batch_title: str
    client_label: str
    owner: str
    stage_label: str
    updated_at: str


class AdminPipelineResponse(CamelModel):
    summary: AdminPipelineSummaryResponse
    items: list[AdminPipelineItemResponse]


class AdminDeadlineTaskResponse(CamelModel):
    id: UUID
    batch_id: UUID
    batch_title: str
    client_label: str
    assignee_role: str
    assignee_name: str
    task_label: str
    due_at: str | None = None
    updated_at: str


class AdminDeadlinesResponse(CamelModel):
    tasks: list[AdminDeadlineTaskResponse]


class SetVideoDeadlineRequest(CamelModel):
    deadline_at: str | None = Field(default=None, alias="deadlineAt")


class SetVideoDeadlineResponse(CamelModel):
    ticket: AdminVideoTicketResponse
