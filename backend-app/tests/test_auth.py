"""Auth endpoint tests."""

import pytest
from httpx import AsyncClient

from app.core.config import config
from app.services.auth_service import normalize_email


@pytest.fixture
def demo_admin_credentials() -> dict[str, str]:
    """Requires `task backend:seed` with SEED_DEMO_USERS=true."""
    return {
        "email": "admin@scalebrandslab.demo",
        "password": "demo1234",
    }


@pytest.mark.anyio
async def test_login_invalid_credentials(client: AsyncClient) -> None:
    response = await client.post(
        f"{config.API_V1_STR}/auth/login",
        json={"email": "nobody@example.com", "password": "wrong"},
    )
    assert response.status_code == 401
    body = response.json()
    assert body["message"] == "Invalid email or password. Please try again."


@pytest.mark.anyio
async def test_me_without_token(client: AsyncClient) -> None:
    response = await client.get(f"{config.API_V1_STR}/auth/me")
    assert response.status_code == 401


@pytest.mark.anyio
async def test_login_and_me(
    demo_admin_credentials: dict[str, str],
    client: AsyncClient,
) -> None:
    login = await client.post(
        f"{config.API_V1_STR}/auth/login",
        json=demo_admin_credentials,
    )
    assert login.status_code == 200, login.text
    data = login.json()
    assert data["tokenType"] == "bearer"
    assert data["accessToken"]
    assert data["user"]["role"] == "admin"
    assert data["user"]["email"] == normalize_email(demo_admin_credentials["email"])

    me = await client.get(
        f"{config.API_V1_STR}/auth/me",
        headers={"Authorization": f"Bearer {data['accessToken']}"},
    )
    assert me.status_code == 200
    assert me.json()["id"] == data["user"]["id"]


def test_current_user_roles_include_employee_kind() -> None:
    from uuid import uuid4

    from app.core.auth import CurrentUser
    from app.models.enums import EmployeeKind, UserRole

    editor = CurrentUser(
        id=uuid4(),
        email="editor@example.com",
        name="Editor",
        role=UserRole.employee,
        employee_kind=EmployeeKind.editor,
    )
    assert "employee" in editor.roles
    assert "editor" in editor.roles

    admin = CurrentUser(
        id=uuid4(),
        email="admin@example.com",
        name="Admin",
        role=UserRole.admin,
    )
    assert admin.roles == ["admin"]
