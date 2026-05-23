"""API controllers (thin, delegate to services)."""

from fastapi import APIRouter

from app.controllers.admin import router as admin_router
from app.controllers.auth import router as auth_router

api_v1_router = APIRouter()
api_v1_router.include_router(auth_router)
api_v1_router.include_router(admin_router)
