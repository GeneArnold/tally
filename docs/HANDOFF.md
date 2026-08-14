# Session Handoff — Health & Fitness Tracker

**Date:** 2026-08-13
**Commit:** `a9898c6` — "feat: Decouple from Directus — standalone app with SQLite + own auth"
**Repo:** https://gitea.home/garnold/nexus-health.git
**Running at:** http://nexus.home:8060 (Docker, healthy)

## What Was Done This Session

Fully decoupled the app from Directus. It's now a standalone Next.js app with its own SQLite database and auth system. Deployed and running on nexus with all production data migrated.

### Key Changes

1. **Database** — Added SQLite via `better-sqlite3` + `drizzle-orm`. Schema at `src/lib/db/schema.ts` (14 tables). Connection is lazy-initialized to avoid build-time lock issues.

2. **Auth** — Replaced Directus JWT flow with local bcrypt + JWT at `src/lib/auth.ts`. Same cookie names (`health_access_token`, `health_refresh_token`), same function signatures (`login`, `signup`, `logout`, `getSession`). 15-minute access tokens, 7-day refresh tokens.

3. **API Routes** — All 19 routes converted from `fetch(DIRECTUS_URL + ...)` to Drizzle ORM queries. The frontend didn't change at all.

4. **Data Migration** — All data pulled from Directus production via MCP tools and imported. Scripts at `scripts/import-data.ts` (JSON dump importer) and `scripts/migrate-from-directus.ts` (direct API migration).

5. **Docker** — Updated Dockerfile to compile `better-sqlite3` native module (needs `python3 make g++` on Alpine). Named volume `health-data` for SQLite persistence. Auto-migration + seed import on first run via `scripts/docker-start.sh`.

## Current Login

- **Email:** gene.arnold@gmail.com
- **Password:** changeme123 (placeholder from migration — change this)

## What Needs Testing

All features should be tested end-to-end since every API route was rewritten:

- [ ] Login / logout
- [ ] Dashboard loads with correct calorie/macro totals
- [ ] Diary — navigate dates, view food entries
- [ ] Add food to diary — search, select, adjust quantity, add
- [ ] Edit/delete food entries in diary
- [ ] My Foods — list, search, tag filter, view detail
- [ ] Create new food (manual entry)
- [ ] Edit existing food + tags
- [ ] Delete food (soft delete)
- [ ] Meals — list, view, create, add foods, remove foods
- [ ] Edit meal name/description/tags
- [ ] Profile — view, edit goals, save
- [ ] Weight chart displays
- [ ] Log weight from dashboard
- [ ] Tag manager — create, edit, delete tags
- [ ] Journal — create, edit, delete entries
- [ ] AI food parser (text input)
- [ ] AI food parser (photo)
- [ ] Barcode scanner
- [ ] Signup (new user)

## What's Next (User's Goals)

1. **Test everything** above
2. **Change password** — no UI for this yet, needs a route or the user signs up fresh
3. **Pick a new name** — "Nexus Health" is placeholder. Only 5 display locations to update:
   - `src/app/layout.tsx` — page title
   - `src/app/(auth)/login/page.tsx` — logo alt + heading
   - `src/app/(auth)/signup/page.tsx` — heading
   - `src/app/(app)/dashboard/page.tsx` — logo alt
   - `public/manifest.json` — PWA name/short_name
4. **Public release** — Cloudflare-compatible but not required (runs on Docker + Tailscale)
5. **Wire v1 API routes** — currently stubs returning empty data, need to query the new DB
6. **Crop logo PNG** — has excess transparent padding

## Architecture Notes for Next Session

- **Frontend is untouched** — all components talk to `/api/*` routes. The decoupling was purely server-side.
- **DB connection is lazy** — `src/lib/db/index.ts` uses a Proxy to defer SQLite connection until first query. This prevents "database is locked" errors during Next.js multi-worker builds.
- **Diary totals are denormalized** — `diary_entries` stores totals (`total_calories`, etc.) that get recalculated by `recalcDiaryTotals()` in `src/lib/db/helpers.ts` after every food entry add/update/delete.
- **Soft delete** — foods, meals, tags, journal entries use `deleted_at` timestamp (not hard delete).
- **M2M tags** — foods and meals both have M2M junction tables to `food_tags`. Frontend expects a nested `{ nx_food_tags_id: { id, name, color } }` shape for meal tags (legacy Directus format preserved for compatibility).
- **Drizzle schema uses camelCase** — but API responses are snake_case to match what the frontend expects. Each route does the mapping explicitly.
- **Docker gotcha** — Alpine needs `python3 make g++` for `better-sqlite3` native compilation. The Dockerfile installs these in the deps stage only.

## Files to Know

| File | What |
|---|---|
| `src/lib/db/schema.ts` | All 14 table definitions |
| `src/lib/db/index.ts` | Lazy DB connection |
| `src/lib/db/helpers.ts` | `recalcDiaryTotals()` shared by diary routes |
| `src/lib/auth.ts` | Login, signup, logout, getSession, JWT signing |
| `src/middleware.ts` | Auth guard — checks cookie, redirects to login |
| `drizzle.config.ts` | Drizzle Kit config |
| `scripts/docker-start.sh` | Container entrypoint: migrate + seed + start |
| `scripts/import-data.ts` | Import from `data/directus-dump.json` |
| `data/health.db` | SQLite database (gitignored) |
| `CLAUDE.md` | Project instructions for Claude Code |

## Environment

| Var | Purpose |
|---|---|
| `DATABASE_PATH` | SQLite path (default: `./data/health.db`, Docker: `/app/data/health.db`) |
| `JWT_SECRET` | Signing key for access/refresh tokens |
| `COOKIE_SECURE` | `true` for HTTPS, `false` for HTTP/Tailscale |
| `ANTHROPIC_API_KEY` | AI food parsing (Haiku 4.5) |
| `GROQ_API_KEY` | Free text parsing |
| `GEMINI_API_KEY` | Free vision |
| `USDA_API_KEY` | Food search |
