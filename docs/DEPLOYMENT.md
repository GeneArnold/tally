# Tally — Deployment & Configuration Guide

Everything you need to get Tally running, from local development to production Docker deployment.

---

## Table of Contents

1. [Quick Start (Docker)](#quick-start-docker)
2. [Quick Start (Local Development)](#quick-start-local-development)
3. [Environment Variables](#environment-variables)
4. [Database](#database)
5. [AI Provider Setup](#ai-provider-setup)
6. [Docker Details](#docker-details)
7. [HTTPS & Public Access](#https--public-access)
8. [Backups](#backups)
9. [Updating](#updating)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start (Docker)

The fastest way to run Tally. Requires Docker and Docker Compose.

```bash
# Clone the repo
git clone https://github.com/genearnold/tally.git
cd tally

# Create your environment file
cp .env.example .env

# Generate a JWT secret and add it to .env
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env

# Build and start
docker compose up -d --build

# Verify it's running
curl http://localhost:8060/api/health
# Should return: {"status":"ok"}
```

Open `http://localhost:8060` in your browser and create an account.

### Stopping and starting

```bash
docker compose down       # Stop
docker compose up -d      # Start (no rebuild needed)
docker compose up -d --build  # Rebuild after code changes
```

---

## Quick Start (Local Development)

Requires Node.js 20+ and npm.

```bash
# Clone and install
git clone https://github.com/genearnold/tally.git
cd tally
npm install

# Create your environment file
cp .env.example .env.local

# Generate a JWT secret
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env.local

# Set up the database
npm run db:migrate

# Start the dev server
npm run dev
```

Dev server runs at `http://localhost:3000` with hot reloading via Turbopack.

---

## Environment Variables

Copy `.env.example` to `.env` (Docker) or `.env.local` (local dev) and configure:

### Required

| Variable | Description | Example |
|---|---|---|
| `JWT_SECRET` | Secret key for signing auth tokens. Must be random and kept secret. | `openssl rand -hex 32` |

### Optional

| Variable | Default | Description |
|---|---|---|
| `DATABASE_PATH` | `./data/health.db` | Path to the SQLite database file |
| `COOKIE_SECURE` | `false` | Set to `true` when serving over HTTPS |
| `GROQ_API_KEY` | — | Enables free AI text parsing (Groq Cloud) |
| `GEMINI_API_KEY` | — | Enables free AI photo/vision parsing (Google) |
| `ANTHROPIC_API_KEY` | — | Fallback AI provider (paid, ~$0.25/MTok) |
| `USDA_API_KEY` | — | Enables USDA food database search |

### Notes

- The app works without any AI keys — AI food parsing will just be unavailable
- The app works without a USDA key — food search will be limited to your personal food catalog
- `COOKIE_SECURE=true` is required when serving over HTTPS (browsers reject secure cookies over HTTP)

---

## Database

Tally uses SQLite via Drizzle ORM. The database is a single file — easy to back up, move, or inspect.

### Location

- **Docker:** `/app/data/health.db` (inside the container), persisted in a named Docker volume `health-data`
- **Local dev:** `./data/health.db` (in the project root)

### Schema Management

```bash
# Generate a new migration after changing src/lib/db/schema.ts
npm run db:generate

# Apply pending migrations
npm run db:migrate

# Open Drizzle Studio (visual database browser)
npm run db:studio
```

### Auto-Migration

When running in Docker, migrations are applied automatically on every container start via `scripts/docker-start.sh`. You don't need to run them manually.

### Tables (14)

| Table | Purpose |
|---|---|
| `users` | User accounts (bcrypt password hashes) |
| `health_profiles` | 1:1 per user — goals, targets, body metrics |
| `foods` | Food catalog with full nutrition data |
| `food_tags` | User-defined tags (breakfast, protein, etc.) |
| `foods_food_tags` | M2M junction: foods ↔ tags |
| `food_servings` | Serving size options per food |
| `diary_entries` | Daily meal slots (date + meal type + nutrition totals) |
| `food_entries` | Individual food items within a diary entry |
| `exercises` | Exercise entries within a diary entry |
| `meals` | Saved meal templates |
| `meal_items` | Foods within a meal template |
| `meals_food_tags` | M2M junction: meals ↔ tags |
| `measurements` | Weight and body measurements |
| `journal_entries` | Health journal entries |

---

## AI Provider Setup

Tally uses AI to parse food descriptions and photos into structured nutrition data. It tries providers in order from cheapest to most expensive.

### Provider Priority

1. **Groq** (text only) — free, fast, used for text descriptions
2. **Google Gemini** (vision) — free, used for food photos and nutrition labels
3. **Anthropic Haiku** (fallback) — paid (~$0.25/MTok), used if others are unavailable

### Getting API Keys

**Groq (recommended — free):**
1. Go to https://console.groq.com/
2. Create an account
3. Generate an API key
4. Add to your `.env`: `GROQ_API_KEY=gsk_...`

**Google Gemini (recommended for photos — free):**
1. Go to https://aistudio.google.com/apikey
2. Create an API key
3. Add to your `.env`: `GEMINI_API_KEY=AIza...`

**Anthropic (optional — paid):**
1. Go to https://console.anthropic.com/
2. Create an account and add billing
3. Generate an API key
4. Add to your `.env`: `ANTHROPIC_API_KEY=sk-ant-...`

**USDA FoodData Central (recommended — free):**
1. Go to https://fdc.nal.usda.gov/api-key-signup
2. Register for a free API key
3. Add to your `.env`: `USDA_API_KEY=...`

---

## Docker Details

### Dockerfile

Multi-stage build:
1. **deps** — installs npm packages (including native `better-sqlite3` compilation with python3/make/g++)
2. **builder** — copies source and runs `next build`
3. **runner** — minimal production image with standalone Next.js output

### Docker Compose

```yaml
services:
  tally:
    build: .
    container_name: tally
    restart: unless-stopped
    ports:
      - "8060:3000"      # Change 8060 to any free port
    env_file:
      - .env
    volumes:
      - health-data:/app/data  # Persistent database storage

volumes:
  health-data:
```

### Container Startup

On every start, the container:
1. Runs Drizzle migrations (safe to re-run — only applies new ones)
2. Checks if the database has any users
3. If empty and `data/directus-dump.json` exists, imports seed data
4. Starts the Next.js server

### Health Check

```bash
curl http://localhost:8060/api/health
# {"status":"ok"}
```

The Docker health check runs every 30 seconds automatically.

### Changing the Port

Edit `docker-compose.yml`:

```yaml
ports:
  - "YOUR_PORT:3000"
```

---

## HTTPS & Public Access

Tally runs on HTTP by default. For public access or PWA install on phones, you need HTTPS.

### Option 1: Cloudflare Tunnel (recommended for home servers)

Cloudflare Tunnel creates an outbound-only connection from your server to Cloudflare's edge. No ports opened on your router, automatic HTTPS, DDoS protection. Free tier.

1. Install `cloudflared` on your server
2. Authenticate: `cloudflared tunnel login`
3. Create a tunnel: `cloudflared tunnel create homelab`
4. Configure ingress to point your subdomain to `http://localhost:8060`
5. Create DNS record: `cloudflared tunnel route dns homelab tally.yourdomain.com`
6. Install as systemd service for auto-start

Add **Cloudflare Access** for email-based access control (free for up to 50 users).

### Option 2: Reverse Proxy (nginx / Caddy)

Use a reverse proxy with Let's Encrypt for automatic HTTPS certificates.

**Caddy** (simplest):
```
tally.yourdomain.com {
    reverse_proxy localhost:8060
}
```

**nginx** with certbot:
```nginx
server {
    listen 443 ssl;
    server_name tally.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/tally.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tally.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8060;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Important: Set COOKIE_SECURE

When serving over HTTPS, update your `.env`:

```
COOKIE_SECURE=true
```

Without this, authentication cookies won't work over HTTPS.

---

## Backups

The entire database is one file. Back it up by copying it.

### Manual Backup

```bash
# Docker
docker cp tally:/app/data/health.db ./backup-$(date +%Y%m%d).db

# Local
cp data/health.db backup-$(date +%Y%m%d).db
```

### Automated Backup (cron)

```bash
# Add to crontab: crontab -e
0 3 * * * docker cp tally:/app/data/health.db /path/to/backups/health-$(date +\%Y\%m\%d).db
```

### Restore

```bash
# Docker — stop container, replace file, restart
docker compose down
docker cp backup.db tally:/app/data/health.db
docker compose up -d

# Local
cp backup.db data/health.db
```

---

## Updating

### From Docker

```bash
cd tally
git pull
docker compose up -d --build
```

Migrations run automatically on startup. Your data is preserved in the Docker volume.

### From Source

```bash
cd tally
git pull
npm install
npm run db:migrate
npm run build
# Restart your process manager
```

---

## Troubleshooting

### "Database is locked"

SQLite only allows one writer at a time. This usually happens during development with multiple hot-reload workers. The app uses WAL mode and lazy connections to minimize this. If it persists, restart the dev server.

### Container won't start

Check logs:
```bash
docker logs tally
```

Common issues:
- Missing `.env` file — copy from `.env.example`
- Missing `JWT_SECRET` — generate one with `openssl rand -hex 32`
- Port conflict — change the port in `docker-compose.yml`

### Auth cookies not working over HTTPS

Set `COOKIE_SECURE=true` in your `.env` file and restart.

### AI parsing not working

Check that at least one AI provider key is set. The app will log which provider it's trying to use. Check your API key is valid and has quota remaining.

### PWA won't install on phone

PWA install requires HTTPS. Set up a reverse proxy or Cloudflare Tunnel.

### `staleTimes.static` warning

Cosmetic warning from Next.js 16 — it requires a minimum value of 30. Does not affect functionality.
