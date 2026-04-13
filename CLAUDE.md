@AGENTS.md

# Nexus Health (PWA)

**Nexus Project ID:** `74fd6fd0-f35f-462e-8279-540ec2029a09`
**App URL:** https://nexus-health.home
**Repo:** https://gitea.home/garnold/nexus-health.git
**Docker:** `nexus-health` on nexus (192.168.40.51:8060)
**Directus Production:** http://192.168.40.51:8057
**Directus Development:** http://192.168.40.51:8058

## Session Start

Use `/health-session` skill to get project status and task list from Nexus.

## Deployment

```bash
# Deploy code changes
rsync -avz --exclude node_modules --exclude .next --exclude .git --exclude '.env*' --exclude docs \
  ~/Workspace/health-app/ garnold@192.168.40.51:/opt/docker_deploy/nexus-health/
ssh garnold@192.168.40.51 "cd /opt/docker_deploy/nexus-health && docker compose up -d --build"
```

## Schema Changes

ALL Directus schema work happens in DEVELOPMENT (mcp__nexus_development__*). Never touch production directly.

Use `/promote` skill to promote schema from dev to production. This enforces:
1. Pre-promotion backup (mandatory)
2. Schema snapshot + apply
3. Post-promotion backup
4. Permissions must be created separately via API (not in snapshots)

Use `/backup-prod` skill before any production work.

## Key Design Decisions

- **Foods are the atomic unit** — everything is a food (broccoli, Applebee's Hamburger Dinner)
- **Meals are shortcuts** — named groups of foods for quick logging, no nutrition on the meal itself
- **My Foods is source of truth** — diary logs from nx_foods only, not USDA directly
- **Tags are M2M relational** — nx_foods ↔ nx_foods_nx_food_tags ↔ nx_food_tags, CASCADE both sides
- **AI providers: cheapest first** — Groq (free text) → Gemini Flash (free vision) → Anthropic Haiku (fallback)
- **Soft delete** on nx_foods, nx_meals, nx_health_metrics, nx_food_tags

## Known Gotchas

- Tailscale on phone breaks API calls — turn off Tailscale when using the app
- Production builds required for remote testing (dev server HMR fails through Tailscale)
- Open Food Facts uses HTTP not HTTPS from Docker (Alpine SSL issue)
- Directus admin "No Items" on archived collections — toggle archive filter in right sidebar
- Always use `window.location.href` not `router.push` after mutations (production caching)
- Logo PNG has excess transparent padding — needs cropping

## AI Providers

| Task | Provider | Model | Cost |
|---|---|---|---|
| Text parsing | Groq | Llama 3.3 70B | Free |
| Vision | Gemini | 2.5 Flash | Free |
| Fallback | Anthropic | Haiku 4.5 | $0.25/MTok |

Keys in `.env` on Docker host and `.env.local` locally.

## Athlete Role (Production)

- Role ID: `849db7e5-a4de-459d-b0e9-f15716db9543`
- Policy ID: `9edbe2df-9e62-4034-9e6d-400754995a3b`
