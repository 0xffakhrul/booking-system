# ADR-0010: One production image, built and scanned in CI

- **Status:** Accepted
- **Date:** 2026-11-09

## Context

The app has to run on a small server (2 GB, 20 Mbps). Building on the server (`git pull && npm install && npm run build`) needs build tools there, can fail halfway on a live machine, makes rollback a rebuild, and nothing checks the packages for known vulnerabilities. [ADR-0008](0008-react-spa-for-the-frontend.md) assumed Caddy would serve the React build as static files, which means two things to version and deploy.

## Decision

**One image holds everything**: the compiled API, its production dependencies, and the built React app. The API serves the React app on the same origin (`api/src/web.ts`): `/api/*` goes to the API, hashed `/assets/*` are cached for a year, and any other page load gets `index.html` so deep links survive a refresh. Caddy (Phase 6) only adds HTTPS in front.

**GitHub Actions builds it, not the server** (`.github/workflows/image.yml`):

1. Build the `prod` stage of the `Dockerfile` for `linux/amd64`, on every PR and every merge.
2. Scan that exact image with **Trivy**. HIGH or CRITICAL vulnerabilities with a fix available fail the run.
3. On `main` only, push to `ghcr.io/0xffakhrul/booking-system:<commit SHA>`, and move `:main` to it.

The server only ever pulls a tag that was built and scanned. Rolling back means running the previous SHA.

**The pipeline itself is pinned.** In March 2026, attackers moved 76 of 77 tags of `aquasecurity/trivy-action` to a credential stealer and published a malicious Trivy v0.69.4. So:

- Every action is pinned to a full commit SHA, not a tag. Dependabot proposes updates.
- Trivy is a pinned release whose SHA-256 is checked before it runs, not the action.

**The image is small and has little in it:** `node:24-slim`, OS security updates applied at build time, no npm/npx/corepack, and it runs as the non-root `node` user.

## Alternatives considered

| Option | Why not |
| --- | --- |
| Build on the server | Build tools on prod, half-finished deploys, slow rollbacks, no scanning |
| Two images (API + a static web server) | Two things to version, scan and deploy for no benefit at this size |
| Caddy serves `web/dist` from a volume | The web build and the API could drift apart; one SHA should mean one version of everything |
| `aquasecurity/trivy-action` | Its tags were hijacked in March 2026; a checksummed binary does the same job |
| Docker Hub | GHCR sits next to the repo, needs no extra account, and Actions can push with `GITHUB_TOKEN` |

## Consequences

- **Good:** build once, run anywhere. What CI scanned is exactly what runs, and every running version maps to a commit.
- **Good:** a vulnerable dependency blocks the merge. The first finding was Zod 3's GHSA-mrhx-c7xc-m3w5, fixed only in Zod 4.
- **Bad:** a fixable HIGH in a base-image package can block a deploy until the base image or the fix lands. Rebuilding usually picks it up; a `.trivyignore` entry with a reason and an expiry date is the escape hatch.
- **Risk:** pinned SHAs go stale. Mitigated by Dependabot for `github-actions` and `docker`.
