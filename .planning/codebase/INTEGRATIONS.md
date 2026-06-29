# External Integrations

**Analysis Date:** 2026-06-29

## Current State

**This is a fully client-side single-file app with minimal external integrations.** All logic is self-contained in `index.html`. No backend APIs, databases, or third-party services are currently integrated.

## APIs & External Services

**Google Fonts (Read-Only):**
- Service: Google Fonts CDN
- What it's used for: Font loading (Caveat, Cormorant Garamond, Outfit)
- SDK/Client: Browser `<link rel="preconnect">` to `https://fonts.googleapis.com` and `https://fonts.gstatic.com`
- Auth: None (public)
- Failure mode: If CDN is unreachable, system fonts fallback to serif/sans-serif stack

## Data Storage

**Databases:**
- None

**File Storage:**
- **Local filesystem only**
  - `photo.jpg` — couple's photo served alongside `index.html`
  - Can be replaced with external image URL (user can point to any image host)

**Caching:**
- Browser HTTP cache (default, no explicit configuration)

## Authentication & Identity

**Auth Provider:**
- None required (public, single-user app)

## Monitoring & Observability

**Error Tracking:**
- None

**Logs:**
- Browser console only (dev use)

## CI/CD & Deployment

**Hosting:**
- **GitHub Pages** (default, enabled via `https://jdgiannisii-lang.github.io/bday-card/`)
  - Requires: repo set to **public** (see HANDOFF.md for manual steps)
  - Source: Deploy from branch `claude/birthday-card-animation-wr7nsu` (root)
  - Alternatively: Deploy from GitHub Actions (workflow defined in `.github/workflows/deploy-pages.yml`)

**Backup Hosting Options:**
- Netlify (drag-and-drop)
- Vercel (drag-and-drop or git integration)
- Any static file host

**CI Pipeline:**
- GitHub Actions (`.github/workflows/deploy-pages.yml`)
  - Trigger: Push to `claude/birthday-card-animation-wr7nsu`
  - Steps: Checkout → Configure Pages → Upload artifact → Deploy
  - Concurrency: Only one deployment at a time, cancels in-progress
  - Permissions: `contents: read`, `pages: write`, `id-token: write`
  - No linting, testing, or build steps (static file only)

## Environment Configuration

**Required env vars:**
- None

**Secrets location:**
- None (no secrets in this app)
- `.env` file: Not present, not needed

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Planned Integrations (In Roadmap, Not Yet Built)

**These are documented in `docs/obsidian/` but NOT YET IMPLEMENTED:**

- **Supabase** (backend database)
- **Cloudflare** (analytics, edge caching)
- **PostHog** (product analytics)
- **Tally** (form submission)
- **Google Drive** (pending feature: gift-reveal link for photo wallpaper — see HANDOFF.md)
- **Higgsfield** (planned: video generation for gift-opening animation via MCP)

**Do not confuse docs/obsidian/ strategy documents with implemented code.** The codebase is currently a fully static, zero-dependency HTML/CSS/JS file. All future integration work is listed only in planning documents.

---

*Integration audit: 2026-06-29*
