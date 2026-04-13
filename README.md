# Nexus Health

Mobile-first PWA for health and nutrition tracking. Part of the Nexus ecosystem.

## Quick Commands

```bash
# Start
docker compose up -d

# Stop
docker compose down

# Rebuild after code changes
docker compose up -d --build

# View logs
docker logs nexus-health --tail 50
docker logs -f nexus-health

# Restart
docker compose restart
```

## Configuration

Environment variables in `.env`:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_DIRECTUS_URL` | Directus URL (production: `http://192.168.40.51:8057`) |
| `DIRECTUS_URL` | Server-side Directus URL |
| `USDA_API_KEY` | USDA FoodData Central API key |
| `GROQ_API_KEY` | Groq API key (free, text parsing) |
| `GEMINI_API_KEY` | Google Gemini API key (free tier, vision) |
| `ANTHROPIC_API_KEY` | Anthropic API key (optional fallback) |
| `COOKIE_SECURE` | Set to `true` when behind HTTPS proxy |

## Port

- **External:** 8060
- **Internal:** 3000

## Health Check

```bash
curl http://192.168.40.51:8060/login
```

## Deployment from Dev Machine

```bash
# From novalab (192.168.40.30)
rsync -avz --exclude node_modules --exclude .next --exclude .git --exclude .env.local \
  /home/genearnold/Workspace/health-app/ \
  garnold@192.168.40.51:/opt/docker_deploy/nexus-health/

# Then on nexus
ssh garnold@192.168.40.51 "cd /opt/docker_deploy/nexus-health && docker compose up -d --build"
```
