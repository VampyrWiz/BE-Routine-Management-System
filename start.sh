#!/bin/bash
# BE Routine Management System — start script
# Builds and starts all containers, waits for MongoDB, then seeds the
# database. The seed is idempotent (upserts by code/email), so running it
# repeatedly is safe: routine entries and UI-created teachers survive.
set -e

echo "Starting BE Routine Management System..."
echo ""

echo "Building and starting containers..."
docker-compose up -d --build

echo ""
echo "Waiting for MongoDB to be ready..."
for i in $(seq 1 30); do
  if docker-compose exec -T mongo mongosh --quiet --eval "db.runCommand({ ping: 1 }).ok" | grep -q 1; then
    echo "MongoDB is ready."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "MongoDB did not become ready in time." >&2
    exit 1
  fi
  sleep 2
done

echo ""
echo "Seeding database (idempotent — safe to re-run anytime)..."
docker-compose run --rm seed

echo ""
echo "Done!"
echo "  Frontend: http://localhost"
echo "  Backend API: http://localhost:5000"
echo "  (Re-run ./start.sh anytime to rebuild and reseed without losing data.)"

docker compose up