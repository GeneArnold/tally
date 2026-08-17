# Tally Session Log

## Session: 2026-08-15 09:00

**Goals**:
- Integrate new Tally logo and brand identity
- Implement PWA capabilities (icons, manifest, service worker)
- Shift brand color from blue to green
- Resolve Cloudflare Access PWA compatibility issue

**Accomplishments**:
- Integrated new Tally logo (ascending bars + green arc mark from Claude Design)
- Added mark + wordmark lockup (Bricolage Grotesque 800, lowercase) to login and signup pages
- Dashboard header uses mark at 40px
- Generated PNG icons (512px, 192px, 180px apple-touch, 32px, 16px favicon) from SVGs using sharp
- Added maskable icon for Android and SVG favicon with PNG fallback
- Updated manifest.json with new icons and theme_color #2EA96B
- Defined custom `brand-*` Tailwind palette in globals.css matching logo's #2EA96B
- Shifted all UI chrome (buttons, links, focus rings, active nav, borders) from blue to brand green across ~30 files
- Preserved protein data-viz colors as blue (separate from brand identity)
- Updated default tag color from blue to brand green
- Calorie progress bar now uses brand green
- Added Bricolage Grotesque 800 via next/font/google
- Implemented minimal service worker (public/sw.js) and ServiceWorkerRegistrar component
- Excluded sw.js from auth middleware matcher
- Removed unused next-pwa dependency (incompatible with Next.js 16)
- Added crossorigin="use-credentials" to manifest link for Cloudflare Access compatibility
- Discovered Cloudflare Access blocks PWA install by intercepting manifest.json and sw.js
- Created separate CF Access application "Tally PWA Assets" with Bypass policy for /manifest.json and /sw.js
- PWA now installable on mobile
- Deployed all changes to Docker on nexus (192.168.40.51)
- Pushed to both remotes (Gitea origin + GitHub)

**Decisions Made**:
- Keep protein data-viz colors as blue to maintain separation between brand identity and data visualization conventions
- Implement lightweight custom service worker instead of next-pwa dependency for Next.js 16 compatibility
- Use Cloudflare Access bypass policies to selectively allow PWA assets while maintaining auth gate for main app
- Store logo design files in public/tally-*.svg with brand documentation in logo/README.md
- Maintain two git remotes (Gitea as origin, GitHub as secondary) to keep repos in sync

**Next Steps**:
- Wire v1 API routes — stubs at src/app/api/v1/ need to query SQLite
- Implement first-run onboarding — empty dashboard gives new users no guidance
- Protect signup endpoint — app currently allows open signup despite CF Access gate
- Complete Tier 2/3 rename — Gitea repo name, article doc, local settings still reference "Nexus Health"
- Monitor PWA performance and user adoption post-deployment

**Files Modified**:
- public/tally-*.svg (new logo assets)
- src/globals.css (brand color palette)
- src/components/LoginForm.tsx
- src/components/SignupForm.tsx
- src/app/dashboard/page.tsx
- src/app/layout.tsx
- src/middleware.ts
- public/manifest.json
- public/sw.js (new service worker)
- src/components/ServiceWorkerRegistrar.tsx (new)
- ~25 additional files with blue-to-green color shifts
- package.json (removed next-pwa)
- Removed: public/nexus-logo.png

**Notes**:
- Brand color: #2EA96B (green arc from logo)
- Wordmark: Bricolage Grotesque 800, lowercase, -3.5% tracking
- Logo ink color: #16211C, paper color: #F6F4EE
- Two git remotes: origin = Gitea (tally), github = GitHub (tally)
- Deploy: cd /opt/docker_deploy/tally && git pull && docker compose up -d --build
- Cloudflare Access: Two apps now — "tally" (main gate) and "Tally PWA Assets" (bypass for manifest + sw)
