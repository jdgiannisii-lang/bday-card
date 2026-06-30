# Phase 1: Validate the Loop - Research

**Researched:** 2026-06-29
**Domain:** Free-tier card persistence (Supabase), static maker + recipient hosting, cookieless product analytics (PostHog), wrapped around an existing vanilla `index.html` canvas engine
**Confidence:** HIGH (stack + hosting + analytics verified against current docs/registry); MEDIUM on a few tuning knobs (dwell threshold, exact RLS shape) left to Claude's discretion

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01 (Card storage & sharing):** Persist created cards in **Supabase (free tier)** — a `cards` row keyed by a short token (nanoid), with the photo in a **Supabase Storage** free bucket at an unguessable path. The recipient view is `/c/<token>/`. The read path for `/c/<token>/` must stay simple and must not depend on anything paid. Sends stay inside the controlled cohort, so **no moderation build yet**. (Pure URL-encoding and per-card static deploys were both rejected.)

**D-02 ("Engaged" metric definition / the denominator):** Fire `card_engaged` when the recipient **reaches the bottom of the message**; fallback = **>=8s visible/open dwell** for cards whose note is too short to scroll. Dedupe per `card_id`/session. **Reduced-motion sessions are tagged and EXCLUDED** from the craft-conversion denominator. This **replaces the existing blind ~1500ms `setTimeout` "finish"**.

**D-03 (Go/no-go thresholds):** Read on a **~30-day rolling window, minimum 10 engaged recipients.** KILL = zero verified organic propagation OR finish->send upper 95% bound below ~15%. ITERATE (one round) = tripwire alive but <=1 verified propagation. CONTINUE = **>=2 independent verified organic-propagation events** (2 distinct chains). Decision computed mechanically; thresholds written into the ledger header and timestamped **before** card #1.

**D-04 (Maker v1 scope):** Occasions = 3 presets (*just-because*, *thinking-of-you*, *birthday*); same template, cover title swaps, birthday medallion hidden for non-birthday. No distinct per-occasion art. Customizable = recipient name, 1 photo, message, signoff, occasion, effect choice. Effects = **existing hand-coded canvas effects only** (hearts/glitter + 1-2 variants); no premade video/animation overlays in v1. 1-2 theme presets, not a full palette picker.

### Claude's Discretion

Exact token length/alphabet (nanoid); the precise Supabase `cards` schema + RLS policy for the public read; photo upload/resize handling; tuning the dwell threshold (8s is a starting point); the create-form UI/layout; the exact PostHog event names/properties; whether `/c/<token>/` inlines the card JSON server-side or fetches it client-side from Supabase (prefer whichever keeps first paint instant; the spec leans toward inlining).

### Deferred Ideas (OUT OF SCOPE)

Premade video/animation effect overlays; distinct per-occasion cover art; accounts, the synced library, the device-local shelf, the anonymous->account merge (Phase 3); deterministic seeded engine, version pinning, inlined-JSON frictionless open, self-hosted fonts (Phase 2 — Stage 0 tolerates `Math.random()` and current font loading); moderation/CSAM, send rate-limiting, paid email, backups, GDPR delete/export, age screen, monitoring (Phase 4, the "go public" gate); gifting (Tremendous), Stripe, premium effects, the shared couple shelf, native app (Stage 2); server-side `ref` attribution hardening (client `?ref=` + the "who sent you this?" form field suffice for the controlled cohort).
</user_constraints>

<phase_requirements>
## Phase Requirements

> Note: VAL-02 and VAL-03 in REQUIREMENTS.md were written against the *original* hand-fulfilled, per-card-static-deploy model. CONTEXT.md D-01 (the 2026-06-29 re-scope) supersedes that with a thin self-serve Supabase-backed maker. The mapping below reflects the **current locked decisions**, not the superseded wording. The planner should treat D-01..D-04 as authoritative where they conflict with the older requirement phrasing.

| ID | Description (current intent) | Research Support |
|----|------------------------------|------------------|
| VAL-01 | Existing card fires `card_opened` / `card_engaged` / `cta_clicked` via one cookieless tool, with `card_engaged` gated on real engagement (note-bottom via `atBottom()`/`.read`, or >=8s dwell via `visibilitychange`), not a fixed timer. Reduced-motion sessions tagged + excluded. | PostHog `cookieless_mode:'always'` config (Standard Stack, Pattern 3); exact engine hooks identified at `index.html` lines 589-600 (`atBottom`), 879-890 (`openCard`), 910-912 (`visibilitychange`). Dedupe + reduced-motion exclusion patterns in Code Examples. |
| VAL-02 | A "Make one for someone you love ->" CTA appears after the animation and drops the recipient into the **same self-serve maker** (D-01 supersedes "form the founder fulfills by hand"), carrying `?ref=<card_id>&g=<gen>` for generation attribution. | CTA reveal reuses existing `replay.classList.add("show")` timer at line 888; `cta_clicked` event + URL threading in Pattern 3; maker landing = Surface C in UI-SPEC. |
| VAL-03 | Each card lives at a unique, individually-trackable URL (`/c/<token>/`) with static OpenGraph meta so shared links unfurl. (D-01 supersedes "per-card static deploy" with a token-keyed Supabase row + a routing strategy.) | nanoid token generation; **the GitHub Pages dynamic-route gotcha is the key finding** (Pitfall 1 + Architecture Patterns) — resolved by either a 404.html SPA fallback or moving the recipient view to Cloudflare Pages; static single OG image (Pitfall 4). |
| VAL-04 | The test runs across both cohorts with a pre-committed decision rule, read mechanically on a ~30-day window, go/no-go resting on verified organic propagation. | Operational, not a build task — the ledger (Google Sheet) is the source of truth; PostHog corroborates. Schema in Stage-0 spec §5.3. Research supports the *instrumentation* that feeds the ledger; the decision rule itself is authored content (D-03), not code. |
</user_constraints>

## Summary

This phase wraps the existing single-file `index.html` canvas engine with three thin additions, all on $0 free tiers: (1) a **create form** (Supabase Storage photo upload + a `cards` row keyed by a nanoid token), (2) a **recipient view** at `/c/<token>/` that reads that row with the public anon key and feeds the engine, and (3) **cookieless PostHog instrumentation** wired into the engine's existing scroll/visibility hooks. No accounts, no auth, no moderation, no determinism refactor. The hard architectural choices are all about *routing and read-path simplicity*, not about the engine itself, which is reused verbatim.

The single most important finding is a **hosting gotcha that the older requirement wording hides**: the original Stage-0 plan assumed per-card *static subfolders* committed to git (`/c/mia-7f3/index.html`). D-01 replaces that with *dynamic*, Supabase-backed cards whose data is not in any committed file. **GitHub Pages has no server and returns a hard 404 for any `/c/<token>/` path that is not a real committed folder.** So a Supabase-backed `/c/<token>/` cannot work as a clean path on GitHub Pages without a workaround. There are exactly three viable resolutions, detailed below; the recommended one for Stage 0 is the **404.html SPA-fallback trick on GitHub Pages** (zero new infra, keeps the existing repo/host) or, if the founder wants the cleanest path and unlisted privacy, **move the recipient view to Cloudflare Pages**. Either way the card JSON is fetched client-side from Supabase by token (inlining server-side is impossible on a static host — that is a Phase 2 concern when an edge SSR layer exists).

The standard stack is small and current: `@supabase/supabase-js` 2.x (ESM from a CDN, no build step), `nanoid` 5.x for tokens, `qrcode` 1.5.x for the client-side QR, and `posthog-js` (or its tiny snippet) configured cookieless. Photos are downscaled client-side to a JPEG/WebP under ~1600px via `canvas.toBlob` before upload. The public read is secured by RLS: a `cards` table with a single `SELECT USING (true)` policy is acceptable for a controlled cohort because the token is the unguessable capability (nanoid 21-char default ~= 126 bits), but the row must never be listable in a way that leaks other tokens, and the Storage bucket path must be unguessable.

**Primary recommendation:** Build a static `maker.html` (create form) and `card.html` (recipient view) alongside `index.html`, all using `@supabase/supabase-js` via ESM CDN import; resolve the `/c/<token>/` route with a `404.html` copy-of-`card.html` SPA fallback on GitHub Pages (or move the recipient view to Cloudflare Pages for clean paths + unlisted privacy); secure the public read with a token-as-capability RLS `SELECT USING(true)` policy plus an unguessable Storage path; instrument with cookieless PostHog wired into the engine's existing `atBottom()` and `visibilitychange` hooks; keep the recipient open sacred (paint the cover first, fetch card JSON without blocking the first frame).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Token generation (nanoid) | Browser / Client (maker) | — | No backend logic exists; the maker JS mints the token, then writes the row. Collision risk at this scale is negligible (126-bit default). |
| Card persistence (`cards` row) | Database / Storage (Supabase Postgres) | Browser (insert via anon key) | The maker inserts directly with the anon key under an INSERT RLS policy; no server tier exists. |
| Photo storage | Database / Storage (Supabase Storage bucket) | Browser (downscale + upload) | Photo is too big for a URL/row; client downscales then uploads the blob to an unguessable path. |
| Recipient read (`/c/<token>/`) | Browser / Client (card view) | Database (anon SELECT by token) | Static host has no server; the card view fetches the row client-side by token. Inlining (server-side) is impossible without an edge tier (deferred to Phase 2). |
| Route resolution for `/c/<token>/` | CDN / Static (GitHub Pages 404.html OR Cloudflare Pages) | Browser (read token from path) | Dynamic paths do not map to committed files; the host's 404/SPA-fallback behavior is what makes the clean path work. |
| OpenGraph unfurl | CDN / Static (static `<head>` meta) | — | Crawlers do not run JS; the OG image/title must be static in the served HTML, not injected client-side. |
| Analytics (opened/engaged/cta) | Browser / Client (PostHog) | PostHog Cloud (ingest) | Cookieless, in-memory; events fire from the engine hooks. Ledger (Google Sheet) is the source of truth; PostHog corroborates. |
| QR code | Browser / Client (`qrcode` lib) | — | Generated in the share state from the resulting `/c/<token>/` URL; no server render needed. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | 2.108.2 (2.x) | Insert `cards` rows, upload photos to Storage, read by token with the anon key | The official Supabase JS client; ships an ESM build usable directly from a CDN with no build step (`import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'`). [VERIFIED: npm registry] |
| `nanoid` | 5.1.16 (5.x) | Generate the unguessable short card token | The de-facto standard tiny URL-safe ID generator; default 21-char alphabet ~= 126 bits of entropy (effectively unguessable as a capability). ESM-only in 5.x, CDN-importable. [VERIFIED: npm registry] |
| `qrcode` | 1.5.4 | Render the share-state QR for `/c/<token>/` | Mature, dependency-light QR generator; `QRCode.toCanvas`/`toDataURL` run fully client-side. UI-SPEC asks for "a tiny client lib." [VERIFIED: npm registry] |
| `posthog-js` | latest (1.x) or the inline snippet | Cookieless `card_opened` / `card_engaged` / `cta_clicked` | The one analytics tool chosen in the Stage-0 spec (free 1M events/mo, funnels, person-merge for later K-factor). [VERIFIED: npm registry] [CITED: posthog.com/docs/libraries/js] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (browser-native) `canvas.toBlob` / `createImageBitmap` | n/a | Client-side photo downscale to ~1600px JPEG/WebP before upload | Always, before any photo upload — kills 70%+ of bytes, keeps Storage free-tier usage low. No library needed. [CITED: dev.to/upsidelab HEIC-on-web] |
| (browser-native) `crypto.getRandomValues` | n/a | Entropy source `nanoid` already uses | Implicit; nanoid uses it internally. No action needed. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| GitHub Pages + 404.html fallback | **Cloudflare Pages** for the recipient view | Cloudflare Pages supports SPA fallback natively (cleaner `/c/<token>/`), allows unlisted links, commercial-use OK, unlimited egress. Costs one new host setup but is the App-Architecture-recommended long-term host anyway. Recommended if the founder wants clean paths + privacy now. [CITED: developers.cloudflare.com/workers/platform/pricing] |
| Clean `/c/<token>/` path | `?c=<token>` query param on a single static `card.html` | Zero routing tricks, works on any static host with no 404.html. Uglier link, but unfurls fine and is bulletproof. A pragmatic fallback if the 404.html trick misbehaves. [ASSUMED] |
| Supabase Storage for photos | Cloudflare R2 free tier | R2 has zero egress (better at scale) but adds a second service + signed-URL plumbing. For Stage 0 volumes, Supabase Storage's 1 GB free + 5 GB bandwidth is simpler and sufficient. [CITED: supabase.com/pricing] |
| `posthog-js` npm package | The inline PostHog snippet (script tag) | The snippet keeps the single-file lightness ethos and matches the Stage-0 spec's `posthog.init(...)` example. Prefer the snippet for the recipient view; the package is only worth it if a bundler appears (it will not in this phase). [CITED: posthog.com/docs/libraries/js] |
| Anon SELECT `USING(true)` | A `SECURITY DEFINER` RPC that resolves token -> row | The RPC is the App-Architecture §6 long-term hardening (tables stay locked, no listing). For Stage 0's controlled cohort with token-as-capability, a scoped public SELECT is acceptable and simpler; note the RPC as the Phase 4 upgrade. [CITED: supabase.com/docs/guides/database/postgres/row-level-security] |

**Installation (no build step — import from CDN in the browser):**
```html
<!-- In maker.html / card.html, as ES modules: -->
<script type="module">
  import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
  import { nanoid } from 'https://esm.sh/nanoid@5';
  import QRCode from 'https://esm.sh/qrcode@1';
  // ...
</script>
<!-- PostHog via its inline snippet (recommended for the recipient view), or: -->
<script type="module">import posthog from 'https://esm.sh/posthog-js@1';</script>
```
> No `npm install` is required for this phase — the project has no build step and intentionally zero local dependencies (STACK.md). All four libraries are imported as ESM from a CDN (`esm.sh` or `jsdelivr`). If the founder later adds a bundler, the same packages install cleanly. Pin major versions in the import URL; consider pinning exact versions before card #1 to avoid a CDN-side surprise (Phase 2 does proper version pinning).

## Package Legitimacy Audit

> Ran `gsd-tools query package-legitimacy check --ecosystem npm` + `npm view` against the npm registry on 2026-06-29.

| Package | Registry | Age (latest publish) | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|----------------------|-----------|-------------|---------|-------------|
| `nanoid` | npm | latest 5.1.16 published 2026-06-24 | ~220M/wk | github.com/ai/nanoid | SUS ("too-new") | **Approved** — verdict is purely "latest release is days old"; 220M weekly downloads + canonical repo (ai/nanoid) make this unambiguously legitimate. Pin to `nanoid@5`. |
| `@supabase/supabase-js` | npm | latest 2.108.2 published 2026-06-15 | ~20.6M/wk | github.com/supabase/supabase-js | SUS ("too-new") | **Approved** — same false-positive; the official Supabase client. Pin to `@2`. |
| `qrcode` | npm | 1.5.4 published 2024-08-05 | ~15.6M/wk | github.com/soldair/node-qrcode | OK | Approved |
| `posthog-js` | npm | latest published 2026-06-29 | ~8.0M/wk | github.com/PostHog/posthog-js | SUS ("too-new") | **Approved** — same false-positive; the official PostHog SDK. Prefer the inline snippet on the recipient view; pin to `@1` if importing the package. |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** `nanoid`, `@supabase/supabase-js`, `posthog-js` — all three are SUS **only** because their newest point release is a few days old (the seam's "too-new" heuristic). All three have eight-figure weekly download counts and canonical first-party repos, so they are not slopsquats. The planner does **not** need a human-verify checkpoint for these; the recommended mitigation is to **pin the major version** in the CDN import URL (`@5`, `@2`, `@1`) rather than tracking `latest`, which both removes the moving-target risk and matches Phase 2's version-pinning intent.

## Architecture Patterns

### System Architecture Diagram

```
                                 SENDER FLOW
   ┌──────────────┐   fill form   ┌─────────────────────────────────────────┐
   │  maker.html  │──────────────▶│ 1. nanoid() -> token                     │
   │ (create form)│               │ 2. downscale photo (canvas.toBlob, jpeg) │
   └──────────────┘               │ 3. Storage.upload(unguessable/path.jpg)  │
          ▲                       │ 4. cards.insert({token, content, ...})   │
          │  ?ref=<card_id>&g=    └───────────────┬──────────────────────────┘
          │  (from a received card)               │ returns public photo URL
          │                                       ▼
          │                       ┌───────────────────────────────┐
          │                       │  Supabase (free tier)         │
          │                       │  - cards (token PK, jsonb)     │
          │                       │  - Storage bucket (photos)     │
          │                       │  RLS: SELECT USING(true)       │
          │                       └───────────────┬───────────────┘
          │                                       │ share-state shows
          │                  ┌────────────────────┴─────────┐
          │                  │ /c/<token>/ link + QR (qrcode)│
          │                  └────────────────────┬─────────┘
          │                                       │ sender texts the link
          │                              RECIPIENT FLOW
          │                                       ▼
          │     ┌──────────────────────────────────────────────────────────┐
          │     │  card.html  (served for /c/<token>/ via 404.html fallback  │
          │     │             OR Cloudflare Pages SPA route)                 │
          │     │  a) static OG <meta> already in <head> (crawler-visible)   │
          │     │  b) paint cover FIRST (engine), no blocking fetch          │
          │     │  c) read token from path -> cards.select().eq(token)       │
          │     │  d) feed row into existing index.html engine slots         │
          │     │  e) PostHog cookieless: card_opened (openCard)             │
          │     │        card_engaged (atBottom OR >=8s dwell, deduped,      │
          │     │                      reduced-motion EXCLUDED)              │
          │     │        cta_clicked (CTA tap) -> maker?ref=token&g=gen+1    │
          │     └──────────────────────────────────────────────────────────┘
          └──────────────────────── the loop closes ◀───────────────────────
```

### Recommended Project Structure
```
/                       (repo root, served by GitHub Pages / Cloudflare Pages)
├── index.html          # the engine — DO NOT rewrite; refactor its slots to be data-driven
├── maker.html          # Surface A + B: create form, photo upload, share state + QR
├── card.html           # Surface C host: recipient view; reads token, feeds engine, fires events
├── 404.html            # copy of card.html (GitHub Pages SPA fallback for /c/<token>/)
├── shared/
│   ├── supabase.js     # createClient(URL, ANON_KEY) — anon key only, public by design
│   ├── analytics.js    # PostHog init + track() + the engaged-gating + dedupe logic
│   └── engine-bridge.js# maps a cards row -> the engine's personalization slots
└── photo.jpg           # the original demo photo (kept)
```
> Keep `index.html` itself as the canonical engine. The cleanest non-invasive approach: extract the engine's slot-filling into a small function the maker/card views call with row data, rather than forking the whole file three ways. Exact factoring is the planner's call; the constraint is "do not rewrite the engine, wire around it."

### Pattern 1: Token-as-capability public read (RLS)
**What:** The `cards` table has RLS enabled with a public `SELECT USING (true)` policy and a public `INSERT WITH CHECK (true)` policy. Security comes from the token being an unguessable nanoid, not from row-level auth. No UPDATE/DELETE policy exists, so cards are immutable to the public.
**When to use:** A controlled-cohort Stage 0 where there is no auth and the token is the share secret. Upgrade to a `SECURITY DEFINER` RPC (token -> row, tables locked) at the Phase 4 go-public gate.
**Example:**
```sql
-- Source: supabase.com/docs/guides/database/postgres/row-level-security
create table public.cards (
  token       text primary key,            -- the nanoid; the capability
  content     jsonb not null,              -- recipientName, message[], signoff, coverTitle
  photo_path  text,                        -- unguessable Storage path, e.g. photos/<nanoid>.jpg
  occasion    text not null default 'justBecause',
  effect      text not null default 'hearts',
  ref_card_id text,                        -- the card that spawned this one (generation edge)
  generation  int  not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.cards enable row level security;

-- public read: the token in the WHERE clause is the gate; never expose a listing UI
create policy "public read cards" on public.cards
  for select to anon using (true);

-- public create: anyone in the cohort can make a card (no auth at Stage 0)
create policy "public create cards" on public.cards
  for insert to anon with check (true);
-- (no update/delete policy => immutable + non-deletable by the public)
```
> Caveat the planner must honor: `SELECT USING(true)` means a client *could* `select *` and page the whole table. For a controlled cohort this is accepted (no PII beyond what the cohort already shared, no public listing surface in the UI). To harden without going full-RPC, you may instead expose reads through a `SECURITY DEFINER` function `get_card(p_token text)` and grant `execute` to `anon` while revoking direct table SELECT — note this as the recommended hardening if any recipient is uneasy.

### Pattern 2: Storage public read by unguessable path
**What:** A **public** Storage bucket (so the photo URL needs no signed-URL round-trip and the recipient open stays instant), with the object stored at an unguessable path keyed by the same nanoid. Public-bucket objects are world-readable by URL but not listable without the right path.
**When to use:** Stage 0, where the photo URL must resolve with zero auth for an instant open.
**Example:**
```js
// Source: supabase.com/docs/guides/storage (public bucket + getPublicUrl)
const path = `photos/${token}.jpg`;               // unguessable: token is a nanoid
await supabase.storage.from('card-photos').upload(path, jpegBlob, {
  contentType: 'image/jpeg', upsert: false
});
const { data } = supabase.storage.from('card-photos').getPublicUrl(path);
// data.publicUrl -> store as cards.photo_path's resolvable URL
```
> Create the bucket as **public** in the dashboard. Do NOT enable directory listing. The path is the secret, exactly like the card token. (App-Architecture §6 flags signed-URL/RPC as the eventual hardening; not needed for the controlled cohort.)

### Pattern 3: Cookieless PostHog wired into the existing engine hooks
**What:** Initialize PostHog with no cookies/localStorage; register `card_id` + `generation`; fire four events off the engine's *existing* hooks; gate `card_engaged` on real engagement; dedupe per card; tag + exclude reduced-motion sessions.
**When to use:** The recipient view (`card.html` / `/c/<token>/`).
**Example:** (see Code Examples below for the full engaged-gating logic)
```js
// Source: posthog.com/docs/libraries/js (cookieless) + Stage-0 spec §1
posthog.init('phc_YOUR_KEY', {
  api_host: 'https://us.i.posthog.com',
  cookieless_mode: 'always',          // 2026 cookieless API: no cookies, no local/session storage
  autocapture: false, capture_pageview: false, disable_session_recording: true
});
var CARD_ID = (location.pathname.match(/\/c\/([^\/]+)\/?/) || [])[1]
           || new URLSearchParams(location.search).get('c') || 'unknown';
var GENERATION = new URLSearchParams(location.search).get('g') || '0';
posthog.register({ card_id: CARD_ID, generation: GENERATION });
```
> The Stage-0 spec wrote `persistence:'memory', disable_persistence:true` (the older cookieless idiom). The current PostHog API is `cookieless_mode:'always'`, which is the cleaner, supported way to guarantee no cookies/storage. Either achieves the goal; prefer `cookieless_mode:'always'`. [CITED: posthog.com/docs/libraries/js/config]

### Anti-Patterns to Avoid
- **Fetching card JSON before the cover paints.** The recipient open is sacred (App-Architecture §1). Paint the engine's closed cover immediately, then fetch the row; fill the inside slots when the data arrives (it lands well before the user taps to open). Never `await` the Supabase fetch in front of first paint.
- **Relying on the 1500ms timer as the engagement signal.** D-02 explicitly replaces this. The timer at line 888 stays only for *revealing* the CTA, not for `card_engaged`.
- **Letting analytics block anything.** PostHog can be ad-blocked (per the spec). It must be fire-and-forget; the Google Sheet ledger is the source of truth. Guard every call with `if (window.posthog)`.
- **Injecting OG meta with JavaScript.** Crawlers do not run JS. The `og:image`/`og:title` must be static in the served HTML `<head>`. (Personalized-per-card OG is a Phase 2+ edge-SSR feature; Stage 0 uses one fixed branded OG image.)
- **Em-dashes anywhere in maker-emitted copy or card content.** Absolute project rule (CONVENTIONS.md). The maker must sanitize/validate user message input and all UI copy; run `grep -c "$(printf '\xe2\x80\x94')"` over templates and a sample generated card.
- **Storing the photo as base64 in the row.** Photos are separate blobs (App-Architecture §1). Upload to Storage; store only the URL/path in the row.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Short unguessable IDs | A custom `Math.random().toString(36)` token | `nanoid` 5.x | Hand-rolled tokens are biased/short/collision-prone; nanoid uses `crypto.getRandomValues` and a uniform alphabet (~126 bits at 21 chars). |
| QR generation | A hand-built QR matrix encoder | `qrcode` 1.5.x | QR encoding (Reed-Solomon, masking, version selection) is genuinely complex; the lib is tiny and client-side. |
| DB + photo hosting + public read | A custom Node/Express backend or a per-card git commit pipeline | Supabase (Postgres + Storage) free tier | D-01 locked this; rolling your own is more work, more cost, and not the Stage-1 stack. |
| Analytics funnels + dedupe ingest | A custom events endpoint + spreadsheet sync | PostHog free | Funnels, retention, person-merge (for later K-factor) are non-trivial; PostHog is the chosen single tool. |
| Image resize/compression | A WASM image pipeline or server-side resize | Native `createImageBitmap` + `canvas.toBlob('image/jpeg', 0.8)` | The browser already decodes and re-encodes; no dependency needed for the common JPEG/PNG path. |

**Key insight:** Almost everything this phase needs is a thin glue layer over managed free services and browser-native APIs. The only genuinely custom work is *wiring* (the engine bridge + the engaged-gating logic), which is exactly where the planner should spend the tasks.

## Common Pitfalls

### Pitfall 1: GitHub Pages returns a hard 404 for dynamic `/c/<token>/` paths
**What goes wrong:** D-01's cards live in Supabase, not in committed `/c/<token>/index.html` folders. GitHub Pages is a pure static host with no server, so it 404s any path that is not a real file/folder. The clean `/c/<token>/` link simply will not load.
**Why it happens:** The original Stage-0 spec assumed per-card *static* subfolders (which the re-scope removed). The requirement wording (VAL-03 "deployed at a unique URL") predates the dynamic model.
**How to avoid:** Pick one of three resolutions, in order of preference:
1. **404.html SPA fallback (recommended, zero new infra):** add `404.html` that is a copy of `card.html`. GitHub Pages serves `404.html` for any unknown path; the script reads the token from `location.pathname` and fetches the row. Clean `/c/<token>/` links work. (Trade-off: the HTTP status is 404 even on success; fine for link-sharing, irrelevant to recipients, and OG still works because the static meta is in `404.html`'s `<head>`.)
2. **Move the recipient view to Cloudflare Pages** with an SPA fallback route. Cleanest paths, real 200 status, unlisted-link privacy, and it is the long-term recommended host anyway (App-Architecture §2). Trade-off: a new host to set up.
3. **`?c=<token>` query param on a single static `card.html`** (`card.html?c=abc123`). Bulletproof on any host, no 404 trick. Trade-off: a slightly uglier link (still unfurls fine).
**Warning signs:** Testing `/c/<token>/` returns the GitHub 404 page; OG preview shows the 404 page's metadata.

### Pitfall 2: Supabase free project pauses after 7 days of inactivity -> the read path dies
**What goes wrong:** A free Supabase project is **paused after ~1 week of no API activity**. While paused, no reads/writes succeed — so `/c/<token>/` cannot fetch its card and the recipient sees a broken card. During a ~30-day test with sporadic traffic, a quiet week pauses the project.
**Why it happens:** Free-tier inactivity policy (measured by incoming API requests). Data is preserved on disk, but the project is unreachable until manually restored.
**How to avoid:** (a) Keep the project warm with a tiny scheduled ping (a GitHub Actions cron that hits a lightweight Supabase endpoint every few days — a well-documented pattern) so a quiet week never pauses it during the test window. (b) Make the recipient view *degrade gracefully*: if the fetch fails, still paint the cover and show a soft retry message rather than a blank/broken card. (c) Inline-fallback is not available on a static host, so the warm-ping is the real fix.
**Warning signs:** Cards open blank after a quiet stretch; the Supabase dashboard shows "Project paused." [VERIFIED: supabase.com/pricing — free projects paused after 1 week inactivity]

### Pitfall 3: iPhone HEIC photos do not decode in Chrome/Firefox canvas
**What goes wrong:** The cohort uploads photos straight from an iPhone, which may be HEIC. `createImageBitmap`/`canvas` decode HEIC natively **only in Safari** (it delegates to the OS codec); in Chrome/Firefox the downscale step fails or produces a blank image.
**Why it happens:** HEIC is not a baseline web image format; only Safari has native decode.
**How to avoid:** (a) In the `<input type="file">`, prefer `accept="image/jpeg,image/png,image/webp"` and note most iPhones share JPEG when sending to a web form anyway. (b) Wrap the downscale in a try/catch; on decode failure, show the UI-SPEC error copy ("That photo's a little big / didn't go through") and ask for a JPEG. (c) For Stage 0's controlled cohort this graceful fallback is enough; a libheif-js WASM decoder is overkill and deferred. [CITED: dev.to/upsidelab rendering-heic-on-the-web]
**Warning signs:** Blank polaroid preview on Android Chrome from an iPhone-sourced HEIC; works on the founder's Safari but not a tester's Chrome.

### Pitfall 4: OG unfurl shows nothing because meta was injected by JS
**What goes wrong:** The hand-sent link does not unfurl (no image/title) in iMessage/WhatsApp.
**Why it happens:** Link-preview crawlers fetch the raw HTML and do not execute JavaScript, so any client-injected `og:*` tags are invisible to them.
**How to avoid:** Put a single, static, absolute-HTTPS `og:image` + `og:title` + `og:description` in the served HTML `<head>` of `card.html` (and `404.html`, since that is what serves the path under the fallback). One fixed branded image for all cards is correct for Stage 0; per-card OG is a Phase 2 edge feature.
**Warning signs:** Pasting the link in iMessage shows a bare URL with no card; the WhatsApp/Facebook sharing debugger shows missing OG tags.

### Pitfall 5: `card_engaged` double-counts or counts the wrong sessions
**What goes wrong:** Without dedupe, scroll jitter fires `card_engaged` repeatedly, inflating the denominator; without reduced-motion exclusion, sessions that never saw the animation pollute the craft-conversion metric.
**Why it happens:** `atBottom()` runs on every scroll event; the `visibilitychange`/dwell path can also fire.
**How to avoid:** Fire `card_engaged` **once** per page session (a module-level boolean `engagedFired`), only from the first of {note-bottom reached, >=8s cumulative visible dwell}. If `reduceMotion` is true, set a `reduced_motion: true` super-property and **either** do not fire `card_engaged` **or** fire it with the flag so PostHog funnels can exclude it (the spec says "tagged and EXCLUDED" — tagging + a filtered funnel is the robust choice so the raw count is still visible). [CITED: Stage-0 spec §1c]
**Warning signs:** Engagement rate > 100% of opens; reduced-motion sessions appearing in the finish->send funnel.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-card static `/c/<id>/index.html` committed to git | Token-keyed Supabase row + dynamic read | D-01 re-scope, 2026-06-29 | No per-card labor; but forces the routing workaround (Pitfall 1). |
| PostHog `persistence:'memory', disable_persistence:true` | `cookieless_mode:'always'` | PostHog cookieless API (current) | Cleaner, supported guarantee of no cookies/storage. Both work; prefer the new one. [CITED: posthog.com/docs/libraries/js/config] |
| Blind 1500ms `setTimeout` "finish" | `card_engaged` on note-bottom OR >=8s dwell, deduped, reduced-motion excluded | D-02 | The denominator now measures real craft experience, not "tapped and didn't bounce." |

**Deprecated/outdated:**
- The VAL-02/VAL-03 "founder fulfills by hand / per-card static deploy" wording: superseded by the D-01 self-serve Supabase maker. Plan against D-01..D-04.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A `?c=<token>` query-param fallback unfurls fine and is acceptable if the 404.html trick misbehaves | Alternatives Considered | Low — uglier link only; OG still works since meta is static. |
| A2 | nanoid default 21-char (~126-bit) token is "unguessable enough" as the sole capability for a controlled cohort | Standard Stack / Pattern 1 | Low at this scale; enumeration is infeasible. If a recipient is uneasy, add the RPC hardening (already noted). |
| A3 | Supabase Storage 1 GB free + 5 GB bandwidth is sufficient for ~10-20 downscaled photos in the test window | Alternatives Considered | Very low — downscaled JPEGs are ~100-300 KB each; nowhere near the cap. |
| A4 | The cohort will mostly upload JPEG (not HEIC) when sharing to a web form, so graceful-fallback (not a HEIC decoder) suffices | Pitfall 3 | Medium — if many testers hit HEIC-on-Android, more uploads fail; mitigation is the clear error copy + JPEG ask. Revisit if upload-failure rate is high in the dry run. |
| A5 | `cookieless_mode:'always'` is the current correct PostHog cookieless option (vs the spec's older idiom) | Pattern 3 | Low — verified against PostHog docs; the older idiom also works if the API differs in a point release. Confirm in the dry run. |

## Open Questions

1. **Which routing resolution does the founder want for `/c/<token>/`?**
   - What we know: GitHub Pages 404.html fallback (zero infra), Cloudflare Pages (clean paths + privacy), or `?c=<token>` (bulletproof) are all viable.
   - What's unclear: founder preference between "stay on GitHub Pages" vs "move recipient view to Cloudflare Pages for unlisted privacy" (the Stage-0 spec §0 and §8 flag the privacy concern for uneasy recipients).
   - Recommendation: default to **GitHub Pages + 404.html** to ship fastest; offer **Cloudflare Pages** as the one-step upgrade if any recipient wants unlisted links. Decide in discuss/plan.

2. **Public SELECT `USING(true)` vs a `SECURITY DEFINER` RPC for the read.**
   - What we know: token-as-capability SELECT is simpler and acceptable for a controlled cohort; the RPC is the App-Architecture §6 hardening.
   - What's unclear: whether the founder wants the slightly-more-work RPC now for cleaner privacy optics.
   - Recommendation: ship the scoped public SELECT for Stage 0; note the RPC as the Phase 4 go-public upgrade.

3. **Exact dwell threshold (8s starting point).**
   - What we know: D-02 fixes 8s as a start; it is explicitly tunable.
   - What's unclear: the real reading time for the cohort's note lengths.
   - Recommendation: instrument dwell as a property on `card_engaged` and confirm 8s vs the note-bottom signal in the dry run (Stage-0 spec §8 open question).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase free project (DB + Storage) | D-01 card persistence + photo | Must be provisioned (founder action) | free tier | None — blocking; the maker cannot persist without it. Provision a project + a public `card-photos` bucket + the `cards` table/RLS as a setup task. |
| PostHog Cloud free project + `phc_` key | VAL-01 analytics | Must be provisioned (founder action) | free | Graceful: events are fire-and-forget; the ledger is the source of truth, so a missing key degrades to "no corroboration," not a broken card. |
| GitHub Pages (current host) | recipient + maker hosting | ✓ live | n/a | Cloudflare Pages (recommended upgrade for clean `/c/<token>/`). |
| CDN for ESM imports (esm.sh / jsdelivr) | loading supabase-js, nanoid, qrcode | ✓ (public CDN) | n/a | Vendor a local copy of the libs into the repo if CDN reliability is a concern (keeps zero-build but removes a runtime dependency). |
| GitHub Actions (for the keep-warm cron) | Pitfall 2 mitigation | ✓ (repo has Actions) | n/a | A manual periodic ping if Actions is undesirable. |

**Missing dependencies with no fallback:**
- A provisioned Supabase project (DB + public Storage bucket + `cards` table + RLS policies). This is a **setup task** the plan must include before any maker task.

**Missing dependencies with fallback:**
- PostHog key (degrades to no analytics, ledger still works).
- Clean-path hosting (falls back to `?c=<token>` query param).

## Security Domain

> `security_enforcement: true`, ASVS Level 1, block-on: high. This phase has **no auth** (by design) and a deliberately public read, so the relevant controls are input validation, the public-read blast radius, and the deferred-but-acknowledged UGC-photo risk.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth at Stage 0 (deferred to Phase 3). The token is a capability, not a credential. |
| V3 Session Management | no | No sessions; cookieless analytics only. |
| V4 Access Control | yes | RLS on `cards` (SELECT/INSERT only, no UPDATE/DELETE for anon); unguessable nanoid token + unguessable Storage path as the access capability; no listing UI. Hardening path = `SECURITY DEFINER` RPC. |
| V5 Input Validation | yes | Validate/sanitize all maker form fields before insert: cap recipient name (~40 chars), message length, **strip/reject em-dashes** (project rule), validate photo MIME (`image/jpeg|png|webp`) + size (<10MB per UI-SPEC) client-side, re-check size before upload. Treat the stored `content` as untrusted on render: insert card text via `textContent`/safe templating, never `innerHTML`, to prevent stored XSS in the recipient view. |
| V6 Cryptography | yes (light) | Token entropy via `nanoid` (`crypto.getRandomValues`) — do not hand-roll. No secrets in client code beyond the Supabase **anon** key and PostHog `phc_` key, both designed to be public. |

### Known Threat Patterns for static-page + Supabase-anon-key + UGC-photo

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stored XSS via card message/name rendered into the recipient DOM | Tampering | Render all user content with `textContent`/safe DOM APIs, never `innerHTML`; the engine slots must set text, not parse HTML. |
| Table enumeration via `select *` on the public-read `cards` table | Information Disclosure | Accept token-as-capability for the controlled cohort; harden with a `SECURITY DEFINER get_card(token)` RPC (revoke direct SELECT) if privacy optics demand. No public listing UI ever. |
| Photo URL guessing | Information Disclosure | Unguessable nanoid path in a public bucket; no directory listing. (Signed URLs = Phase 4 hardening.) |
| Malicious / illegal photo upload (CSAM, abuse) | Spoofing/Repudiation | **Out of scope by decision** — controlled cohort + consent checkbox + immediate manual takedown. Full moderation/CSAM is the Phase 4 go-public gate (legally mandatory before strangers can upload). The plan must NOT build it, but should keep an easy manual "unpublish a token" path (delete the row) available to the founder. |
| Anon INSERT abused as an open write endpoint | Denial of Service | Accepted at Stage 0 (controlled cohort, low volume). Note Turnstile/rate-limiting as the Phase 4 control; do not build now. |
| Anon key / PostHog key exposure in client | Information Disclosure | Non-issue: both are public by design. Real protection is RLS, not key secrecy. Never put the Supabase **service_role** key in client code. |

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view`) — verified versions: `nanoid@5.1.16`, `qrcode@1.5.4`, `@supabase/supabase-js@2.108.2`, `posthog-js` latest 1.x (2026-06-29)
- `index.html` (read directly) — exact engine hooks: `atBottom()`/`.read` (lines 589-600), `openCard()` + the 1500ms CTA-reveal timer (lines 879-890), `visibilitychange` (lines 910-912), `reduceMotion` flag (lines 576-577)
- supabase.com/pricing — free tier: 500 MB DB, 1 GB Storage, 5 GB bandwidth, **paused after 1 week inactivity**
- supabase.com/docs/guides/database/postgres/row-level-security — `SELECT USING (true)` public-read pattern
- posthog.com/docs/libraries/js + /config — `cookieless_mode:'always'`, autocapture/pageview/session-recording off

### Secondary (MEDIUM confidence)
- developers.cloudflare.com/workers/platform/pricing — Cloudflare Pages free, commercial-use OK, unlimited egress (App-Architecture §2 corroboration)
- github.com community discussions #36908 / #64096 — GitHub Pages does not support SPA routing; 404.html fallback is the standard workaround
- dev.to/upsidelab + upsidelab.io — HEIC decodes natively only in Safari; WebP/JPEG client downscale via canvas

### Tertiary (LOW confidence)
- `?c=<token>` query-param fallback acceptability (A1) — reasoned, not from a single authoritative page
- 8s dwell threshold appropriateness (A4) — to be confirmed in the dry run

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all four packages verified on npm with canonical repos + eight-figure downloads; ESM-from-CDN usage confirmed.
- Architecture: HIGH on the routing gotcha + read-path (verified against GitHub Pages behavior + Supabase free-tier docs); MEDIUM on the exact RLS shape (two valid options, planner/founder choice).
- Pitfalls: HIGH — Supabase pause, GitHub Pages 404, OG-needs-static, HEIC-only-Safari all verified against current sources.

**Research date:** 2026-06-29
**Valid until:** 2026-07-29 (30 days — stack is stable; re-verify the Supabase free-tier pause window and PostHog cookieless option if older than that, as both are platform policies that can shift)
