# ADR-0011: The server pulls new releases itself

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

Every merge to `main` produces a scanned image on GHCR ([ADR-0010](0010-one-image-built-and-scanned-in-ci.md)), and it should go live with no manual step. The usual way is for CI to SSH into the server and run the deploy. But the server's SSH port is open only to the admin's IP (`infra/terraform`), and GitHub's runners use thousands of changing addresses.

## Decision

**The server deploys itself.** A systemd timer runs `deploy/deploy.sh` a minute after each check finishes. The script:

1. Pulls `ghcr.io/0xffakhrul/booking-system:main` and compares its digest with the one that's live. Same digest: stop.
2. Runs the migrations with the new image, as the admin database user. If they fail, nothing else changes.
3. Tags the live image `booking-app:previous`, tags the new one `booking-app:current`, and runs `docker compose up --wait`, which waits for the app's health check (`/api/health`, which also queries the database).
4. If the new container isn't healthy within 2 minutes, puts `previous` back. It records the failed digest so it doesn't retry it every minute; the next push is tried as normal.

Inbound access stays the same: SSH from one IP, 80/443 for everyone. GitHub holds no credentials for the server.

## Alternatives considered

| Option | Why not |
| --- | --- |
| CI connects over SSH | Means opening port 22 to all of GitHub's runner ranges, and storing a key that can log in to production in GitHub |
| A VPN in CI (Tailscale) to reach the server | Works, but adds an account, an agent on the server and an auth key in GitHub, for the same result |
| Watchtower | Restarts containers on a new image, but can't run migrations first or roll back on a failed health check |
| `git pull` and build on the server | Ruled out by ADR-0010 |

## Consequences

- **Good:** no new way into the server, and nothing in GitHub can touch production.
- **Good:** a release goes live within about a minute of the image being pushed, and a broken one rolls itself back.
- **Bad:** GitHub doesn't show whether a deploy worked. The answer is in `journalctl -u booking-deploy` (and later, in an alert).
- **Bad:** a deploy restarts the one app container, so requests fail for a few seconds. Fine at this size; Phase 8's rolling updates remove it.
- **Risk:** a rollback doesn't undo migrations. Every migration must work with the previous release's code too: add a column in one release, stop using the old one in a later one.
