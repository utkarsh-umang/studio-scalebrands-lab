"""Reset the prototype pipeline data to a clean demo state.

Truncates batches and everything hanging off them (tickets, QA comments,
activity, credit adjustments), resets the demo client's credits, then re-runs
the seed so the standard demo batch exists. Users and client profiles are kept.

Run: poetry run python -m app.scripts.reset_demo
"""

import asyncio

from sqlalchemy import text

from app.db.session import get_session_factory
from app.scripts.seed import run_seed

_PIPELINE_TABLES = (
    "batches",
    "video_tickets",
    "batch_activity",
    "qa_comments",
    "credit_adjustments",
)


async def reset_demo() -> None:
    factory = get_session_factory()
    async with factory() as session:
        await session.execute(
            text(f"TRUNCATE TABLE {', '.join(_PIPELINE_TABLES)} RESTART IDENTITY CASCADE")
        )
        # Give the demo client a clean credit balance.
        await session.execute(
            text(
                "UPDATE client_profiles SET credits_balance = 42 "
                "WHERE display_name = 'TechWithTim'"
            )
        )
        await session.commit()
    print("Pipeline data truncated; demo credits reset.")
    await run_seed()
    print("Reset complete.")


def main() -> None:
    asyncio.run(reset_demo())


if __name__ == "__main__":
    main()
