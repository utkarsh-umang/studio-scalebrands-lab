"""API controllers (thin, delegate to services)."""

from fastapi import APIRouter

# Aggregate versioned routers here. Empty for now — feature routers will be
# registered as they land.
api_v1_router = APIRouter()
