"""Live Drive manifest fetch + service-account media streaming for a batch."""

from typing import Annotated
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.db.session import get_db_session
from app.models.batch import Batch
from app.models.enums import UserRole
from app.schemas.drive import BatchDriveManifestResponse
from app.services import drive_manifest_service
from app.services.drive_manifest_service import DriveManifestError
from app.utils.security import user_id_from_token

router = APIRouter(prefix="/drive", tags=["drive"])

_DRIVE_MEDIA_URL = "https://www.googleapis.com/drive/v3/files/{file_id}"
_PASSTHROUGH_HEADERS = ("content-type", "content-length", "content-range", "accept-ranges")


@router.get(
    "/batches/{batch_id}/manifest",
    response_model=BatchDriveManifestResponse,
)
async def get_batch_drive_manifest(
    batch_id: UUID,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> BatchDriveManifestResponse:
    """Fetch the live Drive manifest (clips / videos / thumbnails) for a batch."""
    batch = (
        await session.execute(select(Batch).where(Batch.id == batch_id))
    ).scalar_one_or_none()
    if batch is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "NOT_FOUND", "message": "Batch not found"},
        )

    # Clients may only read their own batches; staff/admin may read any.
    if current_user.role == UserRole.client:
        if current_user.client_profile_id != batch.client_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"error_code": "FORBIDDEN", "message": "Insufficient permissions"},
            )

    try:
        manifest = await drive_manifest_service.fetch_manifest_for_batch(
            str(batch.id),
            batch.clips_folder_url,
            batch.editor_deliverables_drive_url,
            batch.client_thumbnails_folder_url,
        )
    except DriveManifestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error_code": exc.code, "message": exc.message},
        ) from exc

    return BatchDriveManifestResponse.model_validate(manifest)


def _require_media_auth(
    request: Request,
    access_token: Annotated[str | None, Query()] = None,
) -> None:
    """Authenticate a media request.

    Native <video>/<img> elements cannot set an Authorization header, so the
    token is also accepted as an `access_token` query param. This authenticates
    the *user* to Studio; the service account (a different identity) is what
    actually authorizes Studio to read the file from Drive.
    """
    token = access_token
    header = request.headers.get("authorization")
    if not token and header and header.lower().startswith("bearer "):
        token = header[7:]
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error_code": "UNAUTHORIZED", "message": "Not authenticated"},
        )
    try:
        user_id_from_token(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error_code": "UNAUTHORIZED", "message": "Not authenticated"},
        ) from None


@router.get("/files/{file_id}/content")
async def stream_drive_file(
    file_id: str,
    request: Request,
    _auth: Annotated[None, Depends(_require_media_auth)],
) -> StreamingResponse:
    """Stream a Drive file's bytes via the service account.

    The browser talks only to Studio (which it is already logged into), so the
    viewer never needs to be signed into Google. Forwards Range so <video> seek
    works.
    """
    try:
        sa_token = await drive_manifest_service.get_access_token()
    except DriveManifestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error_code": exc.code, "message": exc.message},
        ) from exc

    fwd_headers = {"Authorization": f"Bearer {sa_token}"}
    range_header = request.headers.get("range")
    if range_header:
        fwd_headers["Range"] = range_header

    client = httpx.AsyncClient(timeout=httpx.Timeout(30.0, read=None))
    upstream_req = client.build_request(
        "GET",
        _DRIVE_MEDIA_URL.format(file_id=file_id),
        params={"alt": "media", "supportsAllDrives": "true"},
        headers=fwd_headers,
    )
    upstream = await client.send(upstream_req, stream=True)

    if upstream.status_code >= 400:
        await upstream.aread()
        await upstream.aclose()
        await client.aclose()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "error_code": "DRIVE_STREAM_FAILED",
                "message": "Could not fetch this file from Drive.",
            },
        )

    headers = {
        k: upstream.headers[k] for k in _PASSTHROUGH_HEADERS if k in upstream.headers
    }
    headers.setdefault("accept-ranges", "bytes")
    headers["cache-control"] = "private, max-age=300"

    async def body_iter():
        try:
            async for chunk in upstream.aiter_bytes(chunk_size=65536):
                yield chunk
        finally:
            await upstream.aclose()
            await client.aclose()

    return StreamingResponse(
        body_iter(),
        status_code=upstream.status_code,
        headers=headers,
        media_type=upstream.headers.get("content-type"),
    )
