"""Private S3-compatible object storage primitives."""

import asyncio
from functools import lru_cache
from typing import Any

import boto3
from botocore.client import BaseClient
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from app.core.config import config


class ObjectStorageError(RuntimeError):
    def __init__(self, message: str, *, code: str = "OBJECT_STORAGE_ERROR") -> None:
        super().__init__(message)
        self.message = message
        self.code = code


def _require_bucket() -> str:
    bucket = (config.OBJECT_STORAGE_BUCKET or "").strip()
    if not bucket:
        raise ObjectStorageError(
            "Studio object storage is not configured.",
            code="OBJECT_STORAGE_NOT_CONFIGURED",
        )
    return bucket


@lru_cache
def _client() -> BaseClient:
    kwargs: dict[str, Any] = {
        "service_name": "s3",
        "region_name": config.OBJECT_STORAGE_REGION,
        "config": Config(signature_version="s3v4"),
    }
    if config.OBJECT_STORAGE_ENDPOINT_URL:
        kwargs["endpoint_url"] = config.OBJECT_STORAGE_ENDPOINT_URL
    else:
        # Pin AWS to the bucket's regional endpoint. Some botocore versions
        # otherwise generate virtual-host presigned URLs on s3.amazonaws.com;
        # non-us-east-1 buckets answer those PUTs with a 307 that browsers do
        # not safely replay with the signed headers/body.
        kwargs["endpoint_url"] = f"https://s3.{config.OBJECT_STORAGE_REGION}.amazonaws.com"
    if config.OBJECT_STORAGE_ACCESS_KEY_ID:
        kwargs["aws_access_key_id"] = config.OBJECT_STORAGE_ACCESS_KEY_ID
    if config.OBJECT_STORAGE_SECRET_ACCESS_KEY:
        kwargs["aws_secret_access_key"] = config.OBJECT_STORAGE_SECRET_ACCESS_KEY
    if config.OBJECT_STORAGE_SESSION_TOKEN:
        kwargs["aws_session_token"] = config.OBJECT_STORAGE_SESSION_TOKEN
    return boto3.client(**kwargs)


def _translate_error(exc: Exception) -> ObjectStorageError:
    if isinstance(exc, ClientError):
        provider_code = str(exc.response.get("Error", {}).get("Code", "Unknown"))
        return ObjectStorageError(
            f"Object storage rejected the request ({provider_code}).",
            code="OBJECT_STORAGE_PROVIDER_ERROR",
        )
    return ObjectStorageError(
        "Object storage could not be reached.",
        code="OBJECT_STORAGE_UNAVAILABLE",
    )


async def create_presigned_put(
    object_key: str,
    *,
    content_type: str,
    asset_id: str,
) -> str:
    def generate() -> str:
        try:
            return _client().generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": _require_bucket(),
                    "Key": object_key,
                    "ContentType": content_type,
                    "Metadata": {"studio-asset-id": asset_id},
                },
                ExpiresIn=config.OBJECT_STORAGE_PRESIGN_SECONDS,
                HttpMethod="PUT",
            )
        except (BotoCoreError, ClientError) as exc:
            raise _translate_error(exc) from exc

    return await asyncio.to_thread(generate)


async def head_object(object_key: str) -> dict[str, Any]:
    def fetch() -> dict[str, Any]:
        try:
            return _client().head_object(Bucket=_require_bucket(), Key=object_key)
        except (BotoCoreError, ClientError) as exc:
            raise _translate_error(exc) from exc

    return await asyncio.to_thread(fetch)


async def create_presigned_get(
    object_key: str,
    *,
    filename: str,
    inline: bool = True,
) -> str:
    disposition = "inline" if inline else "attachment"

    def generate() -> str:
        try:
            return _client().generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": _require_bucket(),
                    "Key": object_key,
                    "ResponseContentDisposition": f'{disposition}; filename="{filename}"',
                },
                ExpiresIn=config.OBJECT_STORAGE_PRESIGN_SECONDS,
                HttpMethod="GET",
            )
        except (BotoCoreError, ClientError) as exc:
            raise _translate_error(exc) from exc

    return await asyncio.to_thread(generate)
