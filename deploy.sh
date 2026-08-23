#!/usr/bin/env bash
# Deploy Studio: backend → Cloud Run, frontend → Firebase Hosting.
#
# Prereqs (one-time): `gcloud auth login`, `firebase login`, and the Neon/
# Secret Manager setup already done for this project (enlead-ai).
#
# Usage: ./deploy.sh [backend|frontend|all]   (default: all)

set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

TARGET="${1:-all}"
PROJECT="enlead-ai"
REGION="us-central1"
SERVICE="studio-backend"
REPO="studio"

deploy_backend() {
  echo "── Backend: migrating Neon ──"
  # Neon connection details live in Secret Manager, not this script — pull the
  # password at deploy time so it's never written to disk here.
  local pg_password
  pg_password="$(gcloud secrets versions access latest --secret=studio-postgres-password --project="$PROJECT")"
  (
    cd backend-app
    # PYENV_VERSION works around a broken bare-`python` pyenv shim on this
    # machine (only `python3` resolves under the "system" pyenv version) —
    # without it, `poetry run` fails before it ever touches alembic.
    PYENV_VERSION=3.11.0 \
    POSTGRES_HOST="ep-blue-grass-atod1aru.c-9.us-east-1.aws.neon.tech" \
    POSTGRES_PORT=5432 \
    POSTGRES_USER="neondb_owner" \
    POSTGRES_PASSWORD="$pg_password" \
    POSTGRES_DB="neondb" \
    POSTGRES_SSL=true \
      poetry run alembic upgrade head
  )

  echo "── Backend: build + push (linux/amd64) ──"
  local sha image
  sha="$(git rev-parse --short HEAD)$(git diff --quiet || echo -dirty)"
  image="${REGION}-docker.pkg.dev/${PROJECT}/${REPO}/backend:${sha}"
  docker buildx build --platform linux/amd64 -f backend-app/Dockerfile.prod -t "$image" --push backend-app/

  echo "── Backend: deploy to Cloud Run ──"
  gcloud run deploy "$SERVICE" \
    --image="$image" \
    --project="$PROJECT" \
    --region="$REGION" \
    --platform=managed \
    --allow-unauthenticated \
    --min-instances=0 \
    --max-instances=4 \
    --memory=512Mi \
    --cpu=1 \
    --set-env-vars="^##^ENVIRONMENT=prod##SEED_DEMO_USERS=false##SEED_VISUAL_REVIEW_SCENARIOS=false##POSTGRES_HOST=ep-blue-grass-atod1aru.c-9.us-east-1.aws.neon.tech##POSTGRES_PORT=5432##POSTGRES_USER=neondb_owner##POSTGRES_DB=neondb##POSTGRES_SSL=true##CORS_ORIGINS=[\"https://studio.scalebrandslab.com\",\"https://enlead-ai.web.app\"]##OBJECT_STORAGE_REGION=ap-south-1" \
    --set-secrets="SECRET_KEY=studio-secret-key:latest,POSTGRES_PASSWORD=studio-postgres-password:latest,OBJECT_STORAGE_BUCKET=studio-object-storage-bucket:latest,OBJECT_STORAGE_ACCESS_KEY_ID=studio-s3-access-key-id:latest,OBJECT_STORAGE_SECRET_ACCESS_KEY=studio-s3-secret-access-key:latest"

  echo "── Backend deployed: $image ──"
}

deploy_frontend() {
  echo "── Frontend: production build (same-origin API via Hosting rewrite) ──"
  (
    cd frontend
    VITE_API_BASE_URL="" npm run build
  )

  echo "── Frontend: deploy to Firebase Hosting ──"
  firebase deploy --only hosting --project="$PROJECT"
}

case "$TARGET" in
  backend) deploy_backend ;;
  frontend) deploy_frontend ;;
  all) deploy_backend; deploy_frontend ;;
  *) echo "Usage: $0 [backend|frontend|all]"; exit 1 ;;
esac

echo "── Done ──"
