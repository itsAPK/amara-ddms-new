#!/usr/bin/env bash
# Run this on the server, from the project folder, any time you want to
# pull and deploy the newest image that GitHub Actions just built and
# pushed to GHCR. Usage: ./deploy.sh
set -euo pipefail

cd "$(dirname "$0")"

echo "Pulling latest images..."
docker compose -f docker-compose.prod.yml pull

echo "Restarting app with the new image..."
docker compose -f docker-compose.prod.yml up -d

echo "Applying any new database tables (safe to run every time)..."
docker compose -f docker-compose.prod.yml exec -T app npm run db:push

echo "Done. Current containers:"
docker compose -f docker-compose.prod.yml ps