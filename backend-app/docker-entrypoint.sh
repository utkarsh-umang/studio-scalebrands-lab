#!/bin/sh
set -e
cd /app
poetry run alembic upgrade head
poetry run python -m app.scripts.seed
exec poetry run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
