"""Stable local UI-review fixtures, one batch per canonical workflow stage.

These rows are deliberately separate from the normal minimal demo seed. Enable
them only with ``SEED_VISUAL_REVIEW_SCENARIOS=true`` in a local environment.
Re-running the seed resets these named fixtures to their canonical state without
touching the mutable "July Deep Dive" golden batch.
"""

from datetime import datetime
from typing import Any
from uuid import NAMESPACE_URL, UUID, uuid5

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import config
from app.models.batch import Batch
from app.models.client_profile import ClientProfile
from app.models.enums import (
    BatchClipReviewPhase,
    BatchIntakePath,
    BatchStatus,
    EditorWorkflowPhase,
    PipelineStage,
    QaCommentKind,
    QaMediaSlot,
)
from app.models.qa_comment import QaComment
from app.models.user import User
from app.models.video_ticket import VideoTicket
from app.services.path_b_transitions import video_state_for_stage

SOURCE_URL = "https://www.youtube.com/watch?v=example-techwithtim-ui-review"
CLIPS_FOLDER_URL = (
    "https://drive.google.com/drive/folders/13Dw03A1s7tLQOBm8jj5XmwzxR94AK1ut"
)
DELIVERABLES_FOLDER_URL = (
    "https://drive.google.com/drive/folders/1lnwiGh3b-UQ5PYwPvWmvpRxOcRpSjFkV"
)

VIDEO_FILE = {
    "index": 1,
    "driveFileId": "1urDEwYEbcfZhM6VP2_E-WFxwmmaTLIxU",
    "name": "1",
    "mimeType": "video/quicktime",
    "modifiedTime": "2026-04-30T18:42:39.148Z",
}
THUMBNAIL_FILE = {
    "index": 1,
    "driveFileId": "1WwD32P5iSG1q2S5lZRH9YpP6VAIzmBMy",
    "name": "1",
    "mimeType": "image/jpeg",
    "modifiedTime": "2026-04-30T21:06:36.820Z",
}


def _stable_id(kind: str, slug: str) -> UUID:
    return uuid5(NAMESPACE_URL, f"studio-ui-review:{kind}:{slug}")


SCENARIOS: tuple[dict[str, Any], ...] = (
    {
        "slug": "clip-finding",
        "batch_number": 20,
        "title": "May Podcast — Finding clips",
        "stage": PipelineStage.clips_identifying,
        "intake_path": BatchIntakePath.source_media,
        "clip_phase": BatchClipReviewPhase.smm_identifying,
        "ticket_title": "Team is identifying your clips",
        "deliverable_index": None,
    },
    {
        "slug": "clip-approval",
        "batch_number": 21,
        "title": "June Podcast — Clip approval",
        "stage": PipelineStage.clip_client_review,
        "intake_path": BatchIntakePath.source_media,
        "clip_phase": BatchClipReviewPhase.awaiting_client,
        "ticket_title": "Clip approval",
        "deliverable_index": None,
    },
    {
        "slug": "waiting-editor",
        "batch_number": 22,
        "title": "August Clips Pack — With editor",
        "stage": PipelineStage.clips_ready_intake,
        "intake_path": BatchIntakePath.clips_ready,
        "clip_phase": BatchClipReviewPhase.approved,
        "ticket_title": "Production in progress",
        "deliverable_index": None,
        "placeholder_count": 20,
    },
    {
        "slug": "editor-production",
        "batch_number": 23,
        "title": "Creator Workflow — In production",
        "stage": PipelineStage.production,
        "intake_path": BatchIntakePath.source_media,
        "clip_phase": BatchClipReviewPhase.approved,
        "ticket_title": "The workflow mistake slowing creators down",
        "deliverable_index": 1,
    },
    {
        "slug": "smm-qa",
        "batch_number": 24,
        "title": "AI Tutorial Series — SMM review",
        "stage": PipelineStage.smm_qa,
        "intake_path": BatchIntakePath.source_media,
        "clip_phase": BatchClipReviewPhase.approved,
        "ticket_title": "Three AI workflows worth automating",
        "deliverable_index": 1,
        "comment": {
            "author": "smm",
            "body": "Check the pacing through the middle section before client release.",
            "at_seconds": 38,
        },
    },
    {
        "slug": "editor-fix",
        "batch_number": 25,
        "title": "Launch Teaser — Editor revisions",
        "stage": PipelineStage.editor_fix,
        "intake_path": BatchIntakePath.source_media,
        "clip_phase": BatchClipReviewPhase.approved,
        "ticket_title": "The launch feature nobody expects",
        "deliverable_index": 1,
        "comment": {
            "author": "smm",
            "body": "Tighten the opening and bring the product shot forward.",
            "at_seconds": 7,
        },
    },
    {
        "slug": "client-qa",
        "batch_number": 26,
        "title": "Q3 Product Breakdown — Your review",
        "stage": PipelineStage.client_qa,
        "intake_path": BatchIntakePath.source_media,
        "clip_phase": BatchClipReviewPhase.approved,
        "ticket_title": "Why this release changes the workflow",
        "deliverable_index": 1,
    },
    {
        "slug": "client-revisions",
        "batch_number": 27,
        "title": "Founder Stories — Revision triage",
        "stage": PipelineStage.revision_via_smm,
        "intake_path": BatchIntakePath.source_media,
        "clip_phase": BatchClipReviewPhase.approved,
        "ticket_title": "The decision that nearly ended the company",
        "deliverable_index": 1,
        "comment": {
            "author": "client",
            "body": "The story is strong, but the thumbnail needs a warmer expression.",
            "at_seconds": None,
        },
    },
    {
        "slug": "scheduling",
        "batch_number": 28,
        "title": "Feature Release — Scheduling",
        "stage": PipelineStage.scheduling,
        "intake_path": BatchIntakePath.source_media,
        "clip_phase": BatchClipReviewPhase.approved,
        "ticket_title": "One feature that saves an hour every day",
        "deliverable_index": 1,
    },
    {
        "slug": "completed",
        "batch_number": 18,
        "title": "March Compilation — Published",
        "stage": PipelineStage.completed,
        "intake_path": BatchIntakePath.source_media,
        "clip_phase": BatchClipReviewPhase.approved,
        "ticket_title": "Build in public: what we learned",
        "deliverable_index": 1,
        "completed": True,
    },
)


def _full_slots() -> dict[str, Any]:
    return {
        "video": dict(VIDEO_FILE),
        "thumbnail": dict(THUMBNAIL_FILE),
    }


def _batch_values(
    profile: ClientProfile,
    scenario: dict[str, Any],
    order: int,
) -> dict[str, Any]:
    stage: PipelineStage = scenario["stage"]
    completed = bool(scenario.get("completed"))
    post_split = scenario["deliverable_index"] is not None
    created_at = datetime(2026, 7, min(order + 1, 28), 9, 0)
    return {
        "client_id": profile.id,
        "batch_number": scenario["batch_number"],
        "title": scenario["title"],
        "status": BatchStatus.completed if completed else BatchStatus.active,
        "pipeline_stage": stage,
        "video_count": int(scenario.get("placeholder_count") or (1 if post_split else 0)),
        "intake_path": scenario["intake_path"],
        "clip_review_phase": scenario["clip_phase"],
        "source_media_url": (
            None
            if scenario["intake_path"] == BatchIntakePath.clips_ready
            else SOURCE_URL
        ),
        "clips_folder_url": (
            None if stage == PipelineStage.clips_identifying else CLIPS_FOLDER_URL
        ),
        "editor_deliverables_drive_url": (
            DELIVERABLES_FOLDER_URL if post_split else None
        ),
        "client_thumbnails_folder_url": None,
        "credit_cost": 3,
        "credits_debited": completed,
        "clip_owner_kind": "smm",
        "thumbnail_owner_kind": "smm",
        "title_owner_kind": "smm",
        "idea_list": None,
        "batch_schedule": (
            {
                "platform": "YouTube Shorts",
                "goLiveAt": "2026-07-18T17:00:00",
                "completedAt": "2026-07-18",
            }
            if completed
            else None
        ),
        "completed_at": datetime(2026, 7, 18, 12, 0) if completed else None,
        "created_at": created_at,
        "updated_at": created_at,
    }


def _ticket_values(
    profile: ClientProfile,
    batch: Batch,
    scenario: dict[str, Any],
    order: int,
) -> dict[str, Any]:
    stage: PipelineStage = scenario["stage"]
    state = video_state_for_stage(
        stage,
        released_to_client_final_review=stage == PipelineStage.client_qa,
    )
    post_split = scenario["deliverable_index"] is not None
    has_ready_assets = stage in {
        PipelineStage.smm_qa,
        PipelineStage.editor_fix,
        PipelineStage.client_qa,
        PipelineStage.revision_via_smm,
        PipelineStage.scheduling,
        PipelineStage.completed,
    }
    completed = bool(scenario.get("completed"))
    created_at = datetime(2026, 7, min(order + 1, 28), 10, 0)
    deadline_at = (
        datetime(2026, 8, min(order + 2, 28), 17, 0)
        if state.deadline_role
        else None
    )
    return {
        "batch_id": batch.id,
        "client_id": profile.id,
        "title": scenario["ticket_title"],
        "deliverable_index": scenario["deliverable_index"],
        "pipeline_stage": state.pipeline_stage,
        "pipeline_owner": state.pipeline_owner,
        "stage_label": state.stage_label,
        "deadline_at": deadline_at,
        "deadline_role": state.deadline_role,
        "editor_workflow_phase": (
            EditorWorkflowPhase.handed_off
            if stage in {PipelineStage.scheduling, PipelineStage.completed}
            else state.editor_workflow_phase
        ),
        "editor_publish_title": (
            scenario["ticket_title"] if post_split and stage != PipelineStage.production else None
        ),
        "released_to_client_final_review": state.released_to_client_final_review,
        "last_revision_requested_by": (
            "smm"
            if stage == PipelineStage.editor_fix
            else "client"
            if stage == PipelineStage.revision_via_smm
            else None
        ),
        "asset_versions": (
            {"video": 2, "thumbnail": 1}
            if stage == PipelineStage.editor_fix
            else {"video": 1, "thumbnail": 1}
            if has_ready_assets
            else None
        ),
        "deliverable_drive_slots": _full_slots() if has_ready_assets else None,
        "drive_slots_synced_at": created_at if has_ready_assets else None,
        "video_schedule": (
            {
                "platform": "YouTube Shorts",
                "goLiveAt": "2026-07-18T17:00:00",
                "scheduledAt": "2026-07-16T10:00:00",
            }
            if completed
            else None
        ),
        "qa_flags": (
            [{"atSeconds": 7, "note": "Tighten the opening."}]
            if stage == PipelineStage.editor_fix
            else None
        ),
        "qa_general_note": (
            "Tighten the opening and bring the product shot forward."
            if stage == PipelineStage.editor_fix
            else None
        ),
        "created_at": created_at,
        "updated_at": created_at,
    }


async def _upsert_model(
    session: AsyncSession,
    model_type: type[Batch] | type[VideoTicket] | type[QaComment],
    model_id: UUID,
    values: dict[str, Any],
) -> Batch | VideoTicket | QaComment:
    row = await session.get(model_type, model_id)
    if row is None:
        row = model_type(id=model_id, **values)
    else:
        for key, value in values.items():
            setattr(row, key, value)
    session.add(row)
    await session.flush()
    return row


async def seed_visual_review_scenarios(
    session: AsyncSession,
    users: dict[str, User],
) -> None:
    if config.ENVIRONMENT != "local":
        raise RuntimeError("Visual-review scenarios may only be seeded locally")

    client_user = users.get("client@scalebrandslab.demo")
    smm = users.get("smm@scalebrandslab.demo")
    if client_user is None or client_user.client_profile_id is None or smm is None:
        raise RuntimeError("Demo client and SMM must be seeded before visual scenarios")

    profile = await session.get(ClientProfile, client_user.client_profile_id)
    if profile is None:
        raise RuntimeError("Demo client profile is missing")

    for order, scenario in enumerate(SCENARIOS, start=1):
        slug: str = scenario["slug"]
        batch = await _upsert_model(
            session,
            Batch,
            _stable_id("batch", slug),
            _batch_values(profile, scenario, order),
        )
        assert isinstance(batch, Batch)

        placeholder_count = int(scenario.get("placeholder_count") or 0)
        if placeholder_count > 0:
            ticket = None
            for index in range(1, placeholder_count + 1):
                placeholder_scenario = {
                    **scenario,
                    "stage": PipelineStage.production,
                    "ticket_title": f"Video {index}",
                    "deliverable_index": index,
                }
                ticket = await _upsert_model(
                    session,
                    VideoTicket,
                    (
                        _stable_id("ticket", slug)
                        if index == 1
                        else _stable_id("ticket", f"{slug}:{index}")
                    ),
                    _ticket_values(profile, batch, placeholder_scenario, order),
                )
            assert isinstance(ticket, VideoTicket)
        else:
            ticket = await _upsert_model(
                session,
                VideoTicket,
                _stable_id("ticket", slug),
                _ticket_values(profile, batch, scenario, order),
            )
            assert isinstance(ticket, VideoTicket)

        comment_spec = scenario.get("comment")
        if comment_spec:
            author = (
                client_user if comment_spec["author"] == "client" else smm
            )
            await _upsert_model(
                session,
                QaComment,
                _stable_id("comment", slug),
                {
                    "video_ticket_id": ticket.id,
                    "slot": QaMediaSlot.video,
                    "asset_version": 1,
                    "kind": (
                        QaCommentKind.timestamp
                        if comment_spec["at_seconds"] is not None
                        else QaCommentKind.general
                    ),
                    "author_role": comment_spec["author"],
                    "author_user_id": author.id,
                    "at_seconds": comment_spec["at_seconds"],
                    "body": comment_spec["body"],
                    "deprecated": False,
                    "created_at": datetime(2026, 7, min(order + 1, 28), 11, 0),
                    "updated_at": datetime(2026, 7, min(order + 1, 28), 11, 0),
                },
            )

    print(f"Visual review: upserted {len(SCENARIOS)} canonical stage scenarios")
