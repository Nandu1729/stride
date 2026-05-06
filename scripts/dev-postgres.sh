#!/usr/bin/env bash
# Spin up a local Postgres for development. Requires Docker.
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install it from https://docs.docker.com/get-docker/."
  exit 1
fi

docker compose up -d postgres

echo
echo "Postgres is running on localhost:5432"
echo "  user: stride"
echo "  pass: stride"
echo "  db:   stride"
echo
echo "Set this in backend/.env:"
echo "  DATABASE_URL=\"postgresql://stride:stride@localhost:5432/stride?schema=public\""
