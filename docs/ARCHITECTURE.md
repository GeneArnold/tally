# Health & Fitness PWA — Architecture Plan

## Context

Food logging via AI/MCP is too painful — the model guesses portions, over-explains, and gets it wrong. Food entry is deterministic CRUD: pick food, pick serving, enter quantity, done. We're building a purpose-built mobile-first PWA to replace the LibreChat interaction layer while keeping Directus as the backend.

Expanding from single-user to multi-user SaaS so Gene's family can use it too.

**Nexus Project ID:** `74fd6fd0-f35f-462e-8279-540ec2029a09`

---

## Stack

**Next.js 15 + TypeScript + Tailwind CSS + Directus SDK** (PWA)

- **Why Next.js:** Gene's Speaker Coach app uses this exact stack successfully. Server Actions handle auth securely. App Router provides clean mobile navigation. Can be PWA with `next-pwa`.
- **Why NOT Vite:** Multi-user auth is better handled server-side. Next.js patterns are proven in Gene's workflow.
- **No Prisma/own DB:** Directus IS the database. All CRUD via `@directus/sdk`. No data duplication.
- **Food search built-in:** Absorb food-search-proxy logic into the app (Next.js API routes). Retire the standalone Flask service.
- **Charts:** `recharts` for progress/trends
- **Icons:** `lucide-react` (same as Speaker Coach)

**Repo:** `~/Workspace/health-app`
**Deploy:** Docker on nexus (192.168.40.51), port 8060

**CRITICAL RULE: ALL Directus work happens in DEVELOPMENT (`mcp__nexus_development__*`). Never touch production. Test, validate, then promote via schema snapshot.**

---

## Auth Strategy

**Directus native users + JWT in HttpOnly cookies**

1. User signs up/logs in -> Next.js server action calls Directus `/auth/login`
2. Directus returns JWT + refresh token -> stored in HttpOnly Secure cookies
3. Next.js middleware checks cookie on every request, redirects to login if missing
4. All Directus API calls include JWT in Authorization header
5. Directus roles/permissions enforce data scoping (user sees only their own data)

No separate user table needed. Directus handles user management, password hashing, token refresh.

**Roles:**
- `athlete` — read/write own data, read shared food database
- `admin` — full access (Gene)

---

## Multi-User Schema Changes (ALL in Directus DEVELOPMENT — never production)

### Add `user` field (M2O -> directus_users) to:
| Collection | Nullable | On Delete | Notes |
|---|---|---|---|
| `nx_health_profile` | NOT NULL | CASCADE | Also remove singleton designation |
| `nx_diary_entries` | NOT NULL | CASCADE | Core scoping field |
| `nx_measurements` | NOT NULL | CASCADE | |
| `nx_meals` | NULLABLE | CASCADE | Null = shared/system meals |

### No changes needed:
- `nx_food_entries` — scoped via diary_entry relationship
- `nx_exercises` — scoped via diary_entry relationship
- `nx_foods` — shared database (USDA foods visible to all, `user_created` tracks custom foods)
- `nx_food_servings` — inherited from foods
- `nx_meal_items` — inherited from meals

### Directus permissions:
- `athlete` role: filter `user = $CURRENT_USER` on all user-scoped collections
- `nx_foods`: readable by all, custom food creation allowed
- `nx_food_servings`: read-only for athletes

---

## App Structure

```
health-app/src/
├── app/
│   ├── (auth)/                    # No bottom nav
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/                     # Bottom nav layout
│   │   ├── layout.tsx             # BottomNav wrapper
│   │   ├── dashboard/page.tsx     # Today's summary + quick-add
│   │   ├── diary/
│   │   │   ├── page.tsx           # Today's meals
│   │   │   ├── [date]/page.tsx    # Specific day
│   │   │   └── add-food/page.tsx  # Search -> serve -> add (text, barcode, photo)
│   │   ├── meals/                 # Saved meal templates
│   │   ├── exercises/page.tsx     # Log workouts
│   │   ├── measurements/page.tsx  # Weight, body measurements
│   │   ├── progress/page.tsx      # Charts, trends
│   │   └── profile/page.tsx       # Settings, goals
│   └── api/
│       ├── auth/                  # Login, signup, logout, refresh
│       ├── v1/                    # Public API (for MCP/LibreChat)
│       │   ├── diary/
│       │   │   ├── today/route.ts
│       │   │   ├── [date]/route.ts
│       │   │   └── summary/[period]/route.ts
│       │   ├── food/
│       │   │   ├── search/route.ts
│       │   │   └── barcode/[upc]/route.ts
│       │   ├── measurements/latest/route.ts
│       │   ├── profile/route.ts
│       │   └── progress/weight/route.ts
│       ├── food/
│       │   ├── search/route.ts    # Text search: Directus + USDA API (ported from food-search-proxy)
│       │   └── barcode/[upc]/route.ts  # UPC lookup: USDA -> barcodelookup.com scraper fallback
│       └── vision/
│           └── identify/route.ts  # Photo -> vision model -> food identification
├── components/
│   ├── layout/BottomNav.tsx       # 5-tab mobile nav
│   ├── diary/                     # MealSection, FoodEntryRow, DailyNutritionSummary
│   ├── food/
│   │   ├── FoodSearchBar.tsx      # Text search input
│   │   ├── BarcodeScanner.tsx     # Camera barcode scanning (browser API)
│   │   ├── PhotoCapture.tsx       # Take photo for vision identification
│   │   ├── ServingSizeSelector.tsx
│   │   └── NutritionLabel.tsx
│   ├── exercises/                 # ExerciseForm
│   ├── measurements/              # MeasurementForm, PhotoUpload
│   ├── progress/                  # WeightChart, MacroChart
│   └── ui/                        # Button, Card, Input, Modal, Toast
├── hooks/                         # useAuth, useDirectus, useFoodSearch, useDiaryEntries
├── lib/
│   ├── directus.ts                # SDK client init
│   ├── auth.ts                    # Session helpers
│   ├── nutrition.ts               # Macro calculations
│   ├── usda.ts                    # USDA API client + response stripping (from food-search-proxy)
│   ├── scraper.ts                 # Barcode fallback scraper (from food-search-proxy, ported to Node)
│   ├── vision.ts                  # Vision model client for food photo identification
│   └── constants.ts               # Meal types, units, USDA nutrient ID map
├── mcp/                           # MCP server (wraps /api/v1/ endpoints as MCP tools)
│   └── server.ts
├── types/directus.ts              # Collection type definitions
└── middleware.ts                  # Auth guard
```

---

## Food Search Architecture (absorbed from food-search-proxy)

The standalone Flask proxy at `~/Workspace/food-search-proxy` gets absorbed into this app's API routes. After this app is deployed, the Flask service can be retired.

**Ported logic:**
- `usda.ts` — USDA API client, nutrient ID mapping (7 key nutrients), response stripping (~150 bytes/result)
- `scraper.ts` — Barcode fallback via barcodelookup.com (Playwright stealth -> cheerio for parsing)
- Three-tier barcode lookup: USDA exact UPC match -> USDA best match -> scraper -> 404

**New capabilities (not in proxy):**
- **Barcode scanner component** — uses browser `navigator.mediaDevices` + barcode detection API (or `zxing-js`) to scan UPC from phone camera
- **Photo food identification** — cheap vision model (e.g., Haiku, Gemini Flash) identifies food items in photo, returns structured list of food names + estimated portions, then auto-searches USDA for each item

---

## API & MCP Support (baked in from Phase 1)

The app exposes its own REST API endpoints from day one. These are read-focused endpoints that let external tools (LibreChat, other LLMs, MCP clients) query health data without doing data entry.

**Why from the start:** Adding API/MCP later means retrofitting. Building the API layer alongside the UI means every feature automatically gets an API surface. The app UI handles writes; the API handles reads and queries.

**Initial API endpoints:**
```
GET  /api/v1/diary/today              -> Today's meals, macros, totals
GET  /api/v1/diary/:date              -> Specific day's diary
GET  /api/v1/diary/summary/:period    -> Weekly/monthly averages (period: 7d, 30d, 90d)
GET  /api/v1/food/search?q=           -> Search food database
GET  /api/v1/food/barcode/:upc        -> UPC lookup
GET  /api/v1/measurements/latest      -> Latest weight, body measurements
GET  /api/v1/profile                  -> Current goals, macro targets
GET  /api/v1/progress/weight          -> Weight trend data
```

**MCP server:** Expose these same endpoints as MCP tools so LibreChat (or any MCP client) can query:
- "How does my day look so far?" -> calls diary/today
- "What did I eat yesterday?" -> calls diary/:date
- "How's my week going?" -> calls diary/summary/7d
- "Am I hitting my protein goal?" -> calls diary/today + profile

**MCP implementation:** Use `@modelcontextprotocol/sdk` to wrap the API endpoints as MCP tools. Can run as a separate MCP server process or integrated into the Next.js app.

**Authentication for API:** Same JWT tokens — LibreChat/MCP clients authenticate as a Directus user and see only their data.

---

## Multi-Model AI Strategy

AI is NOT used for data entry — that's deterministic CRUD. AI is used for:
1. **Vision identification** — cheap vision model identifies food in photos, returns food names
2. **Nutrition insights** — "how am I doing this week?" type queries against historical data
3. **Food matching** — when vision returns "grilled chicken breast ~6oz", map to best USDA match

**Model selection:**
- Vision identification: cheap/fast model (Haiku, Gemini Flash) — run server-side via API route
- Insights/summaries: can use any model via separate interface (not in MVP)

---

## Core Screens (MVP)

### 1. Dashboard (`/dashboard`)
- Today's calorie/macro progress bars
- Quick-add buttons: meal, exercise, water, steps
- Collapsed meal sections with totals

### 2. Food Diary (`/diary/[date]`)
- Day picker (left/right Today arrows)
- Sections: Breakfast, Lunch, Dinner, Snacks
- Each food entry: name, qty, cals, protein
- "+" button per meal section -> food search

### 3. Add Food (`/diary/add-food`) — Three Input Methods
- **Text search:** Search bar with debounce, queries Directus (local foods) + USDA API simultaneously
- **Barcode scanner:** Camera-based barcode scanning via browser API -> USDA UPC lookup -> fallback to barcodelookup.com scraper
- **Photo identification:** Take photo of food -> cheap vision model identifies items -> returns food names/estimates -> search USDA to match
- Tap result -> serving size dropdown + quantity input -> macros update live
- "Add to [Breakfast]" button -> done

### 4. Saved Meals (`/meals`)
- List of templates, one-tap to log today
- Create/edit with food builder

### 5. Exercise, Water, Steps, Measurements
- Simple forms, no AI needed

### 6. Progress (`/progress`)
- Weight line chart (30 days)
- Macro pie chart, calorie trend

### 7. Profile (`/profile`)
- Health goals, macro targets, account settings

---

## Mobile UX

- **Bottom nav:** Dashboard, Diary, Meals, Progress, Profile
- **Quick-add FAB:** Floating button for common actions
- **Touch targets:** 44px minimum
- **Full-screen modals** instead of drawers
- **Pull-to-refresh** on dashboard and diary
- **PWA install:** manifest.json + service worker via `next-pwa`
- **Design for 375px** (iPhone SE) up

---

## Build Phases

| Phase | What | Key Deliverable |
|---|---|---|
| 1 | Project setup + auth + API skeleton | Login/signup + initial `/api/v1/` endpoints + MCP server stub |
| 2 | App shell + navigation | BottomNav, dashboard stub, routing |
| 3 | Food search (port from proxy) | USDA search + response stripping built into app |
| 4 | Food logging + diary | Core flow: search -> select serving -> add -> diary updates |
| 5 | Barcode scanner | Camera-based UPC scanning -> USDA lookup -> scraper fallback |
| 6 | Photo food identification | Camera -> vision model -> food name -> USDA search |
| 7 | Saved meals | Create templates, one-tap log |
| 8 | Exercise + measurements | Secondary logging forms |
| 9 | Profile + goals | Health profile, macro targets |
| 10 | Progress + analytics | Charts and trends |
| 11 | PWA + polish + deploy | Installable, Docker, promote schema to production |

**All Directus schema work happens in development. Promote to production only after full testing.**

---

## Verification

1. **Auth:** Sign up new user, log in, verify cookie set, access protected route
2. **Data isolation:** Log food as User A, verify User B sees empty diary
3. **Food logging:** Search "chicken breast" -> select serving -> add to Breakfast -> verify diary totals update
4. **Saved meals:** Create meal, log it, verify all food entries created
5. **Mobile:** Install PWA on phone, log a full day of meals
6. **API/MCP:** Query `/api/v1/diary/today` from LibreChat, verify correct data returned
7. **Directus:** Verify permissions enforce user scoping at DB level
