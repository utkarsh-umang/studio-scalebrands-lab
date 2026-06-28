"""Live Drive manifest fetch for a batch."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.db.session import get_db_session
from app.models.batch import Batch
from app.models.enums import UserRole
from app.schemas.drive import BatchDriveManifestResponse
from app.services import drive_manifest_service
from app.services.drive_manifest_service import DriveManifestError

router = APIRouter(prefix="/drive", tags=["drive"])


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
        )
    except DriveManifestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error_code": exc.code, "message": exc.message},
        ) from exc

    return BatchDriveManifestResponse.model_validate(manifest)
