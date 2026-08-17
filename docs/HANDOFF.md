# Session Handoff — Tally

**Date:** 2026-08-15
**Commit:** `430d500` — "fix: Add password visibility toggle to confirm password field"
**Repo (GitHub):** https://github.com/GeneArnold/tally
**Repo (Gitea):** https://gitea.home/garnold/tally.git
**Running at:** https://tally.genearnold.ai (Cloudflare Tunnel) and http://192.168.40.51:8060 (direct)
**Docker container:** `tally` on nexus (192.168.40.51)

## What Was Done This Session

### Rename
- Renamed app from "Nexus Health" to **Tally** — *your food, your goals, your data*
- Updated login, signup, dashboard, layout title, PWA manifest (Tier 1 — user-facing)
- Docker service renamed to `tally` in docker-compose.yml
- README, CLAUDE.md rewritten for public consumption
- Stale Directus-era docs archived to `docs/archive/` (gitignored)

### Cloudflare Tunnel & Access
- Installed `cloudflared` on nexus, created tunnel `homelab` (ID: `3b4d707e-b330-4e3d-882f-75d3cb155744`)
- App publicly accessible at `https://tally.genearnold.ai` with automatic HTTPS
- Cloudflare Access configured — email whitelist gate (gene.arnold@gmail.com via Google auth)
- Tunnel runs as systemd service (survives reboots)
- Full setup documented in `docs/cloudflare-tunnel-setup.md` (gitignored — contains IPs/tunnel IDs)
- Adding future apps: edit `/etc/cloudflared/config.yml`, add DNS record, restart service

### Security Hardening
- **Rate limiting** — login: 5 attempts/15min per IP, AI parse-food: 50 requests/day per user
- **Password change** — API route + profile page UI with show/hide toggles
- **Placeholder password changed** — user updated from `changeme123`
- In-memory rate limiter at `src/lib/rate-limit.ts` (resets on container restart — acceptable)

### Public Repo Prep
- Codebase audited for secrets — clean
- Git history audited — no leaked keys or passwords
- Created `.env.example` with all vars documented
- Added MIT license
- Migration scripts cleaned of hardcoded IPs
- `docs/archive/` and `docs/cloudflare-tunnel-setup.md` gitignored

### Documentation
- **README.md** — complete public-facing README with quick start, stack, features
- **docs/DEPLOYMENT.md** — detailed deployment guide (Docker, local dev, env vars, HTTPS, backups)
- **docs/USER-GUIDE.md** — feature-by-feature user guide

### GitHub
- Public repo created: https://github.com/GeneArnold/tally
- GitHub added as `github` remote (Gitea remains as `origin`)
- Both remotes in sync at commit `430d500`

## What's Next

1. **New logo** — still using `nexus-logo.png` with old Nexus branding. File referenced in:
   - `src/app/(auth)/login/page.tsx`
   - `src/app/(app)/dashboard/page.tsx`
   - `public/nexus-logo.png` (the file itself)

2. **Wire v1 API routes** — currently stubs returning empty data. Routes at `src/app/api/v1/`. Need to query the SQLite DB like the main API routes do.

3. **First-run onboarding** — new users land on an empty dashboard with no guidance on what to do first (set up profile, create tags, add foods).

4. **Protect signup endpoint** — Cloudflare Access gates the app, but the app itself allows open signup at `/api/auth/signup`. Consider adding invite codes or disabling public signup.

5. **Tier 2/3 rename leftovers:** All resolved — Gitea repo renamed, docs updated, deploy paths fixed.

## Architecture Notes

- **Two git remotes:** `origin` = Gitea (`tally`), `github` = GitHub (`tally`). Push to both.
- **Cloudflare Tunnel config:** `/etc/cloudflared/config.yml` on nexus. Restart with `sudo systemctl restart cloudflared`.
- **Deploy:** `cd /opt/docker_deploy/tally && git pull && docker compose up -d --build`
- **Container name:** `tally`
- **Docker volume:** `health-data` persists the SQLite database across rebuilds. The volume name didn't change.

## Files Added/Changed This Session

| File | What |
|---|---|
| `src/lib/rate-limit.ts` | In-memory rate limiter utility |
| `src/app/api/auth/change-password/route.ts` | Password change API |
| `src/components/profile/ChangePassword.tsx` | Password change UI component |
| `src/app/api/auth/login/route.ts` | Added rate limiting |
| `src/app/api/ai/parse-food/route.ts` | Added rate limiting |
| `.env.example` | Documented environment variables |
| `LICENSE` | MIT license |
| `docs/DEPLOYMENT.md` | Deployment guide |
| `docs/USER-GUIDE.md` | User guide |
| `docs/cloudflare-tunnel-setup.md` | Tunnel setup (gitignored) |
