"""Focused tests for Drive clip-folder discovery."""

import pytest

from app.services import drive_manifest_service
from app.services.drive_manifest_service import (
    DriveManifestError,
    _map_clip_videos,
    validate_clips_folder_for_intake,
)


def test_every_video_file_becomes_one_sequential_clip() -> None:
    files = [
        {"id": "z", "name": "Final thought.mov", "mimeType": "video/quicktime"},
        {"id": "two", "name": "2 - Demo.mp4", "mimeType": "video/mp4"},
        {"id": "dup", "name": "2 duplicate.webm", "mimeType": "video/webm"},
        {"id": "notes", "name": "notes.pdf", "mimeType": "application/pdf"},
        {
            "id": "folder",
            "name": "Archive",
            "mimeType": "application/vnd.google-apps.folder",
        },
    ]

    clips, ignored = _map_clip_videos(files)

    assert [clip["index"] for clip in clips] == [1, 2, 3]
    assert {clip["driveFileId"] for clip in clips} == {"z", "two", "dup"}
    assert ignored == [{"name": "notes.pdf", "reason": "Ignored non-video file"}]


@pytest.mark.anyio
async def test_intake_validation_rejects_folder_not_shared_with_service_account(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def inaccessible_manifest(*_args: object, **_kwargs: object) -> dict[str, object]:
        return {
            "clips": [],
            "diagnostics": {"clips": {"accessible": False}},
        }

    monkeypatch.setattr(
        drive_manifest_service,
        "fetch_manifest_for_batch",
        inaccessible_manifest,
    )

    with pytest.raises(DriveManifestError) as raised:
        await validate_clips_folder_for_intake(
            "https://drive.google.com/drive/folders/unshared-folder"
        )

    assert raised.value.code == "DRIVE_FOLDER_NOT_SHARED"


@pytest.mark.anyio
async def test_intake_validation_rejects_accessible_folder_without_videos(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def empty_manifest(*_args: object, **_kwargs: object) -> dict[str, object]:
        return {
            "clips": [],
            "diagnostics": {"clips": {"accessible": True}},
        }

    monkeypatch.setattr(
        drive_manifest_service,
        "fetch_manifest_for_batch",
        empty_manifest,
    )

    with pytest.raises(DriveManifestError) as raised:
        await validate_clips_folder_for_intake(
            "https://drive.google.com/drive/folders/empty-folder"
        )

    assert raised.value.code == "DRIVE_FOLDER_NO_VIDEOS"
