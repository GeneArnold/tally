# Health & Fitness Tracker

Mobile-first PWA for food logging, nutrition tracking, and health goals. Standalone app with its own SQLite database and authentication — no external backend dependencies.

> **Name pending.** Previously "Nexus Health" — will be renamed. Display name appears in ~5 places (login, signup, dashboard, layout title, PWA manifest).

## Status

**Deployed and running** on `nexus.home:8060` (Docker). All production data migrated from Directus. Directus is no longer used by this app.

### What's Built

- **Auth** — Local bcrypt passwords + JWT (15min access / 7-day refresh tokens in HttpOnly cookies)
- **Dashboard** — Calorie progress bar, macro rings (protein/carbs/fat), quick-action tiles
- **Food Diary** — Date-navigated daily diary with Breakfast/Lunch/Dinner/Snacks slots, per-entry editing and deletion
- **My Foods** — Personal food catalog with search, tag filtering (AND logic for multi-tag), soft delete
- **Add Food to Diary** — Multi-select from My Foods with quantity controls, tag filter pills, sticky add button
- **Meals** — Saved meal templates (named food groups), edit name/description/default slot, add/remove foods
- **AI Food Parser** — Text and photo parsing via Anthropic Haiku 4.5, returns structured nutrition data with suggested tags
- **Barcode Scanner** — Camera-based UPC scanning via ZXing
- **Health Journal** — Timestamped journal entries tied to diary dates
- **Profile** — Health goals, macro targets, weight chart, tag management
- **Progress** — Weight trend chart (Recharts)
- **Food Search** — USDA FoodData Central API integration (text search + barcode lookup)
- **v1 API** — Read-focused REST endpoints for external tool integration (diary, food search, barcode, measurements, profile, progress) — these are stubs, not yet wired to the new DB

### Recent Architecture Change: Directus Decoupling

The app was fully decoupled from Directus in the last session. Every API route and server component was converted from Directus REST API `fetch()` calls to local Drizzle ORM queries against SQLite.

**What changed:**
- Removed `@directus/sdk` dependency
- Deleted `src/lib/directus.ts` and `src/types/directus.ts`
- Added `better-sqlite3` + `drizzle-orm` + `bcryptjs` + `jsonwebtoken`
- Created `src/lib/db/schema.ts` (14 tables, 215 lines)
- Rewrote `src/lib/auth.ts` — local auth replaces Directus user/JWT flow
- Converted all 19 API routes + 2 server component pages
- Migrated all production data (86 foods, 54 diary entries, 152 food entries, 13 tags, 4 meals, 2 measurements, 1 journal entry)
- Docker deployment updated with SQLite volume mount and auto-migration on startup

**What was NOT changed:**
- Frontend components — they only talk to `/api/*` routes, so no changes needed
- Middleware — still checks cookie presence, same cookie names
- Auth API routes (`login`, `signup`, `logout`) — same function signatures, just different implementation behind them

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.3 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database | SQLite via better-sqlite3 + Drizzle ORM |
| Auth | bcrypt + JWT (HttpOnly cookies) |
| Charts | Recharts 3 |
| Icons | Lucide React |
| AI | Anthropic Haiku 4.5 (food parsing), Groq (text), Gemini Flash (vision) |
| Barcode | ZXing |
| Deployment | Docker on home server, accessed via Tailscale |

## Database

SQLite database at `/app/data/health.db` (Docker) or `data/health.db` (local dev).

### Tables (14)

| Table | Purpose |
|---|---|
| `users` | Local user accounts (bcrypt password hashes) |
| `health_profiles` | 1:1 per user — goals, targets, metrics |
| `foods` | Food catalog with full nutrition data |
| `food_tags` | User-defined tags (breakfast, protein, etc.) |
| `foods_food_tags` | M2M junction: foods to tags |
| `food_servings` | Serving size options per food |
| `diary_entries` | Daily meal slots (date + meal type + totals) |
| `food_entries` | Individual food items within a diary entry |
| `exercises` | Exercise entries within a diary entry |
| `meals` | Saved meal templates |
| `meal_items` | Foods within a meal template |
| `meals_food_tags` | M2M junction: meals to tags |
| `measurements` | Weight and body measurements |
| `journal_entries` | Health journal entries |

### Schema Management

```bash
npm run db:generate   # Generate migration from schema changes
npm run db:migrate    # Apply migrations
npm run db:studio     # Open Drizzle Studio (visual DB browser)
```

Migrations live in `drizzle/` and run automatically on Docker container startup.

## Project Structure

```
src/
├── app/
│   ├── (auth)/                    # Login, signup (no bottom nav)
│   ├── (app)/                     # Main app (with bottom nav)
│   │   ├── dashboard/             # Today's summary + quick actions
│   │   ├── diary/                 # Daily food diary
│   │   │   ├── [date]/            # Specific day view
│   │   │   └── add-food/          # Search + add foods to meal
│   │   ├── meals/                 # Saved meal templates
│   │   ├── my-foods/              # Food catalog (CRUD)
│   │   ├── profile/               # Settings, goals, tags
│   │   └── progress/              # Weight chart
│   └── api/
│       ├── auth/                  # Login, signup, logout
│       ├── ai/parse-food/         # AI food parsing (text + image)
│       ├── dashboard/             # Dashboard data
│       ├── diary/                 # Diary CRUD (add, delete, update, get by date)
│       ├── food/                  # USDA food search + barcode lookup
│       ├── journal/               # Journal CRUD
│       ├── meals/                 # Meals CRUD + items
│       ├── measurements/          # Weight logging
│       ├── my-foods/              # Food catalog CRUD
│       ├── profile/               # Profile save
│       ├── tags/                  # Tag CRUD
│       └── v1/                    # External API (stubs)
├── components/
│   ├── dashboard/                 # LogWeightButton
│   ├── diary/                     # DiaryFoodEntry, DiaryDateNav, JournalSection
│   ├── food/                      # BarcodeScanner, TagPicker, DeleteFoodButton, BackLink
│   ├── layout/                    # BottomNav (5 tabs)
│   ├── profile/                   # ProfileForm, WeightChart, TagManager, LogoutButton
│   └── ui/                        # ConfirmDialog
├── lib/
│   ├── db/                        # Database layer
│   │   ├── schema.ts              # Drizzle table definitions
│   │   ├── index.ts               # DB connection (lazy init)
│   │   ├── helpers.ts             # Shared helpers (recalcDiaryTotals)
│   │   └── migrate.ts             # Migration runner
│   ├── auth.ts                    # Login, signup, logout, getSession
│   ├── ai-food-parser.ts          # AI text + image food parsing
│   ├── ai-providers.ts            # AI provider configuration
│   ├── usda.ts                    # USDA FoodData Central API client
│   └── constants.ts               # Meal types, nutrient ID map
└── middleware.ts                   # Auth guard (cookie check)
```

## Development

```bash
npm install
npm run db:migrate    # Create/update database
npm run dev           # Start dev server (port 3000)
```

### Environment Variables

Create `.env.local`:

```env
DATABASE_PATH=./data/health.db
JWT_SECRET=<random-32-byte-hex>
COOKIE_SECURE=false

# AI providers
ANTHROPIC_API_KEY=<key>
GROQ_API_KEY=<key>
GEMINI_API_KEY=<key>

# Food search
USDA_API_KEY=<key>
```

## Deployment

### Docker (production)

```bash
# Deploy from dev machine
rsync -avz --delete --exclude node_modules --exclude .next --exclude .git --exclude '.env*' --exclude docs --exclude data \
  ~/Workspace/health-app/ garnold@nexus.home:/opt/docker_deploy/nexus-health/

ssh garnold@nexus.home "cd /opt/docker_deploy/nexus-health && docker compose up -d --build"
```

- **Port:** 8060 (external) -> 3000 (internal)
- **Data:** Persisted in Docker named volume `health-data`
- **Health check:** `GET /api/health` returns `{"status":"ok"}`
- **Auto-migration:** Drizzle migrations run on every container start
- **Seed import:** On first run with empty DB, imports from `data/directus-dump.json` if present

### Docker Compose

```yaml
services:
  nexus-health:
    build: .
    container_name: nexus-health
    restart: unless-stopped
    ports:
      - "8060:3000"
    env_file:
      - .env
    volumes:
      - health-data:/app/data

volumes:
  health-data:
```

## Login

Current credentials: `gene.arnold@gmail.com` / `changeme123`

**Change this password** — it's a placeholder from the Directus data migration.

## Known Issues

- `staleTimes.static: 0` warning in Next.js 16 (requires minimum 30) — cosmetic only
- Tailscale on phone can break API calls — turn off Tailscale when using the app on mobile
- Logo PNG has excess transparent padding — needs cropping
- v1 API routes are stubs (return empty/placeholder data)
- No password change UI yet
- `COOKIE_SECURE=false` since accessed via HTTP through Tailscale

## AI Providers

| Task | Provider | Model | Cost |
|---|---|---|---|
| Text parsing | Groq | Llama 3.3 70B | Free |
| Vision | Gemini | 2.5 Flash | Free |
| Fallback | Anthropic | Haiku 4.5 | $0.25/MTok |

## What's Next

- Test all features end-to-end with the new standalone backend
- Change the placeholder password
- Pick a new app name and update ~5 display locations + manifest
- Prepare for public release (Cloudflare-compatible but not required)
- Wire up v1 API routes to the new database
- Add password change functionality
