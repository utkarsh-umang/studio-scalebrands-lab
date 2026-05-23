"""Shared Pydantic base models."""

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """JSON responses use camelCase for frontend / OpenAPI codegen."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class HealthResponse(BaseModel):
    status: str
    environment: str
    postgres: str
    mongo: str
    redis: str
