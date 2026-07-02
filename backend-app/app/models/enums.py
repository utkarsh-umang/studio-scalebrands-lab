"""Postgres enum types for Path B (wave 1 — B0)."""

from enum import Enum


class UserRole(str, Enum):
    client = "client"
    admin = "admin"
    employee = "employee"


class EmployeeKind(str, Enum):
    editor = "editor"
    smm = "smm"


class ClientAccountStatus(str, Enum):
    active = "active"
    decommissioned = "decommissioned"


class BatchStatus(str, Enum):
    active = "active"
    completed = "completed"


class BatchIntakePath(str, Enum):
    source_media = "source_media"
    clips_ready = "clips_ready"
    idea_first = "idea_first"


class BatchClipReviewPhase(str, Enum):
    smm_identifying = "smm_identifying"
    awaiting_client = "awaiting_client"
    with_smm = "with_smm"
    approved = "approved"


class PipelineStage(str, Enum):
    intake_pending = "intake_pending"
    # Path A (idea-first)
    idea_research = "idea_research"
    idea_review = "idea_review"
    idea_footage_pending = "idea_footage_pending"
    # Path B (raw-footage / clips-ready)
    clips_identifying = "clips_identifying"
    clip_client_review = "clip_client_review"
    clips_ready_intake = "clips_ready_intake"
    pre_split_production = "pre_split_production"
    production = "production"
    smm_qa = "smm_qa"
    editor_fix = "editor_fix"
    client_qa = "client_qa"
    revision_via_smm = "revision_via_smm"
    scheduling = "scheduling"
    completed = "completed"


class VideoPipelineOwner(str, Enum):
    client = "client"
    smm = "smm"
    editor = "editor"
    scheduling = "scheduling"
    done = "done"


class EditorWorkflowPhase(str, Enum):
    videos = "videos"
    thumbnails = "thumbnails"
    titles = "titles"
    handed_off = "handed_off"


class BrandGuidelinesSource(str, Enum):
    internal = "internal"
    google_doc = "google_doc"


class QaMediaSlot(str, Enum):
    clip = "clip"
    video = "video"
    thumbnail = "thumbnail"


class QaCommentKind(str, Enum):
    timestamp = "timestamp"
    general = "general"
    clip_note = "clip_note"
