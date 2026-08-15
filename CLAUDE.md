@AGENTS.md

# Tally — Health & Nutrition Tracker

## Key Design Decisions

- **Foods are the atomic unit** — everything is a food (broccoli, Applebee's Hamburger Dinner)
- **Meals are shortcuts** — named groups of foods for quick logging, no nutrition on the meal itself
- **My Foods is source of truth** — diary logs from local foods only, not USDA directly
- **Tags are M2M relational** — foods ↔ foods_food_tags ↔ food_tags, CASCADE both sides
- **AI providers: cheapest first** — Groq (free text) → Gemini Flash (free vision) → Anthropic Haiku (fallback)
- **Soft delete** on foods, meals, food_tags, journal_entries via `deleted_at` timestamp
- **Diary totals are denormalized** — `diary_entries` stores totals recalculated by `recalcDiaryTotals()` after every food entry change
- **DB connection is lazy** — `src/lib/db/index.ts` uses a Proxy to defer SQLite connection until first query (prevents build-time lock issues)

## Known Gotchas

- Docker healthcheck must use `127.0.0.1` not `localhost` — Alpine resolves localhost to IPv6 `[::1]` but Next.js listens on IPv4 only
- Always use `window.location.href` not `router.push` after mutations (production caching)
- Open Food Facts uses HTTP not HTTPS from Docker (Alpine SSL issue)
- Next.js 16 restricts `cookies().set()` to Server Actions and Route Handlers — `getSession()` token refresh fails in server component contexts
- `staleTimes.static: 0` warning (requires minimum 30) — cosmetic only
- Next.js 16 deprecated `middleware` in favor of `proxy` — not yet migrated

## API Response Format

- Drizzle schema uses camelCase but API responses are snake_case to match frontend expectations
- Each route does the mapping explicitly
- M2M tags return nested `{ nx_food_tags_id: { id, name, color } }` shape for meal tags (legacy format preserved for compatibility)

## Files to Know

| File | What |
|---|---|
| `src/lib/db/schema.ts` | All 14 table definitions |
| `src/lib/db/index.ts` | Lazy DB connection |
| `src/lib/db/helpers.ts` | `recalcDiaryTotals()` shared by diary routes |
| `src/lib/auth.ts` | Login, signup, logout, getSession, JWT signing |
| `src/lib/rate-limit.ts` | In-memory rate limiter (login + AI endpoints) |
| `src/middleware.ts` | Auth guard — checks cookie, redirects to login |
| `drizzle.config.ts` | Drizzle Kit config |
| `scripts/docker-start.sh` | Container entrypoint: migrate + seed + start |
