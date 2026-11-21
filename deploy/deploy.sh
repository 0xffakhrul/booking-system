#!/usr/bin/env bash
# Deploys the newest image from GHCR if it isn't live yet. CI only pushes :main after the
# Trivy scan passes, so everything that gets here has been scanned.
#
# Run every minute by booking-deploy.timer, and safe to run by hand: ./deploy.sh
#
#   1. pull :main; stop if its digest is already live, or already failed once
#   2. run the migrations with the new image
#   3. swap it in, and wait for its health check
#   4. if it isn't healthy, put the previous image back
set -euo pipefail
cd "$(dirname "$0")"

# one deploy at a time: a run by hand and the timer could otherwise overlap
exec 9>.deploy.lock
flock -n 9 || exit 0

IMAGE=ghcr.io/0xffakhrul/booking-system:main

docker pull --quiet "$IMAGE" >/dev/null
new=$(docker image inspect --format '{{index .RepoDigests 0}}' "$IMAGE")
live=$(cat .deployed 2>/dev/null || true)
failed=$(cat .failed 2>/dev/null || true)

[[ "$new" == "$live" ]] && exit 0
# a broken image stays broken: wait for a new push instead of retrying it every minute
[[ "$new" == "$failed" ]] && exit 0

echo "deploying $new (live: ${live:-nothing yet})"
docker tag "$IMAGE" booking-app:candidate

# Migrations go first, and a rollback below doesn't undo them, so every migration has to
# work with the previous release's code too: add things now, remove them a release later.
if ! docker compose --profile deploy run --rm migrate; then
  echo "migrations failed, nothing changed" >&2
  echo "$new" > .failed
  exit 1
fi

if docker image inspect booking-app:current >/dev/null 2>&1; then
  docker tag booking-app:current booking-app:previous
fi
docker tag booking-app:candidate booking-app:current

if docker compose up --detach --wait --wait-timeout 120; then
  echo "$new" > .deployed
  rm -f .failed
  docker image prune --force >/dev/null # old images nothing is tagged with any more
  echo "deployed $new"
  exit 0
fi

echo "the new image isn't healthy" >&2
docker compose logs --tail 50 app >&2 || true
echo "$new" > .failed

if docker image inspect booking-app:previous >/dev/null 2>&1; then
  docker tag booking-app:previous booking-app:current
  docker compose up --detach --wait --wait-timeout 120
  echo "rolled back to ${live}" >&2
fi
exit 1
