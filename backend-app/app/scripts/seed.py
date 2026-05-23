"""Bootstrap admin, optional demo users, and minimal Path B demo data."""

import asyncio
from datetime import datetime

from sqlalchemy import select

from app.core.config import config
from app.db.session import get_session_factory
from app.models.batch import Batch
from app.models.client_profile import ClientProfile
from app.models.enums import (
    BatchIntakePath,
    BatchStatus,
    BrandGuidelinesSource,
    ClientAccountStatus,
    EmployeeKind,
    PipelineStage,
    UserRole,
    VideoPipelineOwner,
)
from app.models.user import User
from app.models.video_ticket import VideoTicket
from app.services.auth_service import normalize_email, upsert_user

DEMO_PASSWORD = "demo1234"

DEMO_USERS = [
    {
        "email": "client@scalebrandslab.demo",
        "display_name": "TechWithTim",
        "role": UserRole.client,
        "employee_kind": None,
    },
    {
        "email": "editor@scalebrandslab.demo",
        "display_name": "Arnav",
        "role": UserRole.employee,
        "employee_kind": EmployeeKind.editor,
    },
    {
        "email": "smm@scalebrandslab.demo",
        "display_name": "Priya",
        "role": UserRole.employee,
        "employee_kind": EmployeeKind.smm,
    },
    {
        "email": "admin@scalebrandslab.demo",
        "display_name": "Scale Brands Lab",
        "role": UserRole.admin,
        "employee_kind": None,
    },
]


async def _admin_exists(session) -> bool:
    result = await session.execute(select(User.id).where(User.role == UserRole.admin).limit(1))
    return result.scalar_one_or_none() is not None


async def seed_bootstrap_admin(session) -> None:
    if await _admin_exists(session):
        print("Bootstrap admin: skipped (admin already exists)")
        return
    password = config.BOOTSTRAP_ADMIN_PASSWORD.strip()
    if not password:
        raise RuntimeError(
            "BOOTSTRAP_ADMIN_PASSWORD is required when no admin user exists",
        )
    await upsert_user(
        session,
        email=config.BOOTSTRAP_ADMIN_EMAIL,
        password=password,
        display_name=config.BOOTSTRAP_ADMIN_DISPLAY_NAME,
        role=UserRole.admin,
    )
    print(f"Bootstrap admin: created {normalize_email(config.BOOTSTRAP_ADMIN_EMAIL)}")


async def seed_demo_users(session) -> dict[str, User]:
    by_email: dict[str, User] = {}
    for spec in DEMO_USERS:
        user = await upsert_user(
            session,
            email=spec["email"],
            password=DEMO_PASSWORD,
            display_name=spec["display_name"],
            role=spec["role"],
            employee_kind=spec["employee_kind"],
        )
        by_email[normalize_email(spec["email"])] = user
    print("Demo users: upserted quartet (client, editor, smm, admin)")
    return by_email


async def seed_demo_client_data(session, users: dict[str, User]) -> None:
    smm = users.get("smm@scalebrandslab.demo")
    editor = users.get("editor@scalebrandslab.demo")
    client_user = users.get("client@scalebrandslab.demo")
    if not smm or not editor or not client_user:
        return

    result = await session.execute(
        select(ClientProfile).where(ClientProfile.display_name == "TechWithTim"),
    )
    profile = result.scalar_one_or_none()
    guidelines_updated = datetime(2026, 4, 10)
    if profile is None:
        profile = ClientProfile(
            display_name="TechWithTim",
            credits_balance=42,
            account_status=ClientAccountStatus.active,
            assigned_smm_id=smm.id,
            assigned_editor_id=editor.id,
            brand_guidelines_source=BrandGuidelinesSource.google_doc,
            brand_guidelines_summary=(
                "Tone: energetic, educator-first. Avoid competitor mentions. "
                "Lower-thirds use brand blue (#1F57F5)."
            ),
            brand_guidelines_google_doc_url=(
                "https://docs.google.com/document/d/example-techwithtim"
            ),
            brand_guidelines_updated_at=guidelines_updated,
        )
        session.add(profile)
        await session.flush()
        print("Demo client profile: created TechWithTim")
    else:
        profile.assigned_smm_id = smm.id
        profile.assigned_editor_id = editor.id
        session.add(profile)

    client_user.client_profile_id = profile.id
    session.add(client_user)

    batch_result = await session.execute(
        select(Batch)
        .where(Batch.client_id == profile.id)
        .where(Batch.title == "July Deep Dive"),
    )
    if batch_result.scalar_one_or_none() is None:
        batch = Batch(
            client_id=profile.id,
            batch_number=19,
            title="July Deep Dive",
            status=BatchStatus.active,
            pipeline_stage=PipelineStage.intake_pending,
            video_count=0,
            intake_path=BatchIntakePath.source_media,
            credit_cost=5,
            credits_debited=False,
        )
        session.add(batch)
        await session.flush()
        gate = VideoTicket(
            batch_id=batch.id,
            client_id=profile.id,
            title="Clip review",
            pipeline_stage=PipelineStage.intake_pending,
            pipeline_owner=VideoPipelineOwner.client,
            stage_label="Awaiting intake",
        )
        session.add(gate)
        print("Demo batch: created July Deep Dive (intake_pending)")


async def run_seed() -> None:
    factory = get_session_factory()
    async with factory() as session:
        try:
            await seed_bootstrap_admin(session)
            users: dict[str, User] = {}
            if config.SEED_DEMO_USERS:
                users = await seed_demo_users(session)
                await seed_demo_client_data(session, users)
            await session.commit()
            print("Seed completed")
        except Exception:
            await session.rollback()
            raise


def main() -> None:
    asyncio.run(run_seed())


if __name__ == "__main__":
    main()
