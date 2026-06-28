"""Live Google Drive manifest fetch via service account.

Mirrors scripts/sync-drive-manifest.ts but runs on demand per batch: given a
batch's clips / deliverables folder URLs, list the numbered media through the
service account and return a manifest. This is what makes a pasted Drive link
actually load files (previously only an offline script populated a static
mockData manifest keyed to one demo batch).
"""

from __future__ import annotations

import os
import re
from datetime import UTC, datetime
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.core.config import config

FOLDER_MIME = "application/vnd.google-apps.folder"
DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
_FOLDER_ID_RE = re.compile(r"/folders/([a-zA-Z0-9_-]+)")
_LEADING_INDEX_RE = re.compile(r"^(\d+)\b")
_ANY_INDEX_RE = re.compile(r"(?:^|\D)(\d+)(?:\D|$)")


class DriveManifestError(Exception):
    """Raised when a Drive folder cannot be fetched (config, auth, or access)."""

    def __init__(self, message: str, *, code: str = "DRIVE_FETCH_FAILED") -> None:
        super().__init__(message)
        self.message = message
        self.code = code


def parse_drive_folder_id(url: str | None) -> str | None:
    """Extract the folder id from a Drive folder share URL."""
    if not url:
        return None
    match = _FOLDER_ID_RE.search(url)
    return match.group(1) if match else None


def parse_file_index(name: str) -> int | None:
    """Extract a 1-based index from names like `1.mov`, `Video 1.mov`."""
    base = re.sub(r"\.[^.]+$", "", name).strip()
    leading = _LEADING_INDEX_RE.match(base)
    if leading:
        return int(leading.group(1))
    anywhere = _ANY_INDEX_RE.search(base)
    return int(anywhere.group(1)) if anywhere else None


def _candidate_key_paths() -> list[Path]:
    """Resolve the service-account JSON across host / container layouts.

    The .env value is repo-root relative (e.g. backend-app/secrets/key.json) but
    inside the container the backend runs from /app (== backend-app). Try the raw
    value, the value with a leading backend-app/ stripped, and a lone .json in a
    secrets dir.
    """
    candidates: list[Path] = []
    raw = (config.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON or "").strip()
    cwd = Path.cwd()
    if raw:
        p = Path(raw)
        candidates.append(p if p.is_absolute() else cwd / p)
        candidates.append(cwd.parent / raw)
        if raw.startswith("backend-app/"):
            candidates.append(cwd / raw[len("backend-app/") :])
    for secrets_dir in (cwd / "secrets", cwd / "backend-app" / "secrets"):
        if secrets_dir.is_dir():
            jsons = sorted(secrets_dir.glob("*.json"))
            if len(jsons) == 1:
                candidates.append(jsons[0])
    return candidates


def _resolve_key_path() -> Path:
    for candidate in _candidate_key_paths():
        if candidate.is_file():
            return candidate
    raise DriveManifestError(
        "Google Drive service-account key not found. Set "
        "GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON to the key path.",
        code="DRIVE_NOT_CONFIGURED",
    )


@lru_cache(maxsize=1)
def _build_drive() -> Any:
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
    except ImportError as exc:  # pragma: no cover - dependency guard
        raise DriveManifestError(
            "Google Drive client libraries are not installed.",
            code="DRIVE_NOT_CONFIGURED",
        ) from exc

    key_path = _resolve_key_path()
    credentials = service_account.Credentials.from_service_account_file(
        str(key_path), scopes=DRIVE_SCOPES
    )
    # cache_discovery=False avoids noisy warnings on modern oauth2 stacks.
    return build("drive", "v3", credentials=credentials, cache_discovery=False)


def _is_folder(mime_type: str | None) -> bool:
    return mime_type == FOLDER_MIME


def _list_children(drive: Any, folder_id: str) -> list[dict[str, Any]]:
    files: list[dict[str, Any]] = []
    page_token: str | None = None
    while True:
        response = (
            drive.files()
            .list(
                q=f"'{folder_id}' in parents and trashed=false",
                fields="nextPageToken, files(id, name, mimeType, modifiedTime)",
                pageSize=200,
                pageToken=page_token,
                supportsAllDrives=True,
                includeItemsFromAllDrives=True,
            )
            .execute()
        )
        files.extend(response.get("files", []))
        page_token = response.get("nextPageToken")
        if not page_token:
            break
    return files


def _map_indexed_files(
    files: list[dict[str, Any]], slot_label: str
) -> tuple[list[dict[str, Any]], list[dict[str, str]]]:
    by_index: dict[int, dict[str, Any]] = {}
    unmapped: list[dict[str, str]] = []
    for f in files:
        file_id = f.get("id")
        name = f.get("name")
        if not file_id or not name or _is_folder(f.get("mimeType")):
            continue
        index = parse_file_index(name)
        if index is None or index < 1:
            unmapped.append({"name": name, "reason": f"Could not parse index ({slot_label})"})
            continue
        entry = {
            "index": index,
            "driveFileId": file_id,
            "name": name,
            "mimeType": f.get("mimeType") or "application/octet-stream",
            "modifiedTime": f.get("modifiedTime") or _now_iso(),
        }
        prev = by_index.get(index)
        if prev is None or entry["modifiedTime"] > prev["modifiedTime"]:
            by_index[index] = entry
    entries = sorted(by_index.values(), key=lambda e: e["index"])
    return entries, unmapped


def _find_subfolder_id(drive: Any, parent_id: str, names: list[str]) -> str | None:
    wanted = {n.lower() for n in names}
    for child in _list_children(drive, parent_id):
        child_name = child.get("name")
        if child_name and _is_folder(child.get("mimeType")) and child_name.lower() in wanted:
            return child.get("id")
    return None


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _fetch_manifest_blocking(
    batch_id: str,
    clips_folder_url: str | None,
    deliverables_folder_url: str | None,
) -> dict[str, Any]:
    """Blocking Drive fetch — run via a threadpool from async callers."""
    if not clips_folder_url and not deliverables_folder_url:
        raise DriveManifestError(
            "This batch has no Drive folder linked yet.",
            code="DRIVE_NO_FOLDER",
        )

    drive = _build_drive()
    unmapped: list[dict[str, str]] = []
    clips: list[dict[str, Any]] = []
    videos: list[dict[str, Any]] = []
    thumbnails: list[dict[str, Any]] = []

    clips_id = parse_drive_folder_id(clips_folder_url)
    if clips_folder_url and not clips_id:
        unmapped.append({"name": "(clips)", "reason": "Could not parse folder id from URL"})
    if clips_id:
        clips, clip_unmapped = _map_indexed_files(_list_children(drive, clips_id), "clips")
        unmapped.extend(clip_unmapped)

    deliverables_id = parse_drive_folder_id(deliverables_folder_url)
    if deliverables_folder_url and not deliverables_id:
        unmapped.append({"name": "(deliverables)", "reason": "Could not parse folder id from URL"})
    if deliverables_id:
        video_folder_id = _find_subfolder_id(drive, deliverables_id, ["video", "videos"])
        thumb_folder_id = _find_subfolder_id(drive, deliverables_id, ["thumbnail", "thumbnails"])
        if video_folder_id:
            videos, v_unmapped = _map_indexed_files(
                _list_children(drive, video_folder_id), "videos"
            )
            unmapped.extend(v_unmapped)
        else:
            unmapped.append({"name": "(folder)", "reason": "No Video subfolder in deliverables drive"})
        if thumb_folder_id:
            thumbnails, t_unmapped = _map_indexed_files(
                _list_children(drive, thumb_folder_id), "thumbnails"
            )
            unmapped.extend(t_unmapped)
        else:
            unmapped.append(
                {"name": "(folder)", "reason": "No Thumbnail subfolder in deliverables drive"}
            )

    return {
        "batchId": batch_id,
        "syncedAt": _now_iso(),
        "clips": clips,
        "videos": videos,
        "thumbnails": thumbnails,
        "unmapped": unmapped,
    }


async def fetch_manifest_for_batch(
    batch_id: str,
    clips_folder_url: str | None,
    deliverables_folder_url: str | None,
) -> dict[str, Any]:
    """Async wrapper — Drive's client is blocking, so offload to a thread."""
    from fastapi.concurrency import run_in_threadpool

    try:
        return await run_in_threadpool(
            _fetch_manifest_blocking,
            batch_id,
            clips_folder_url,
            deliverables_folder_url,
        )
    except DriveManifestError:
        raise
    except Exception as exc:  # google api errors, network, auth
        raise DriveManifestError(f"Drive fetch failed: {exc}") from exc


def is_drive_configured() -> bool:
    try:
        _resolve_key_path()
        return True
    except DriveManifestError:
        return bool(os.environ.get("GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON"))
