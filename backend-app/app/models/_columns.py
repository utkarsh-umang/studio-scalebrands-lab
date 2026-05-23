"""Shared SQLAlchemy column helpers."""

from enum import Enum
from typing import TypeVar

from sqlalchemy import Column
from sqlalchemy import Enum as SAEnum

E = TypeVar("E", bound=Enum)


def pg_enum(enum_cls: type[E], name: str) -> Column:
    """Postgres enum column for SQLModel tables."""
    return Column(
        SAEnum(enum_cls, name=name, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )


def pg_enum_nullable(enum_cls: type[E], name: str) -> Column:
    return Column(
        SAEnum(enum_cls, name=name, values_callable=lambda x: [e.value for e in x]),
        nullable=True,
    )
