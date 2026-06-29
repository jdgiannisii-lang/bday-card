# App Architecture & Backend — Ideation

How we should set up the app: the stack, the backend, the services, and — in
depth — **how to build the received-cards library while keeping the app
seamless and friction-free.** This is a thinking document, not a spec: every
call below has rationale and named alternatives, and the decisions that depend
on data we don't have yet are flagged. Companion to [[Roadmap]],
[[Initial-Recommendations]], and [[Market-Research-and-GTM-Assessment]].

> Grounded in a multi-agent research pass (8 domain studies + 3 adversarial
> critics, June 2026). Where a number matters, the source is in **Sources** at
> the end.

---

## TL;DR

- **One web app, edge-served, web-first.** The card a recipient opens is a fast,
  static-feeling page on a CDN — no auth, no install, no cold start, ever. The
  same app holds the editor, the library, and the loop. No native app, no second
  codebase (the iMessage idea stays dead — see [[Initial-Recommendations]]).
- **Three immutable layers.** (1) A reusable, deterministic **canvas engine**
  (the craft). (2) A tiny per-card **content JSON** (message, photo refs,
  effect + seed). (3) **Photos as separate CDN blobs.** This split is the single
  most important architectural decision — it's what lets old shared cards play
  forever, keeps marginal cost at ~$0, and powers the editor and the player from
  one engine.
- **Recommended stack:** React (the founder's existing stack) on **Cloudflare**
  + **Supabase** (Postgres/Auth/Storage/Realtime) + **Cloudflare R2** for photos
  + **PostHog** for the loop metric. Cloudflare's free tier *allows commercial
  use with unlimited egress*; Vercel's free tier does not. Runner-up framework:
  SvelteKit (leaner, but a new stack for a solo founder).
- **Identity is a ladder, deferred:** anonymous device-local → one-tap
  Apple/Google or email magic-link → full account on first send. **Crucially,
  the recipient is never authenticated just to *view*** — viewing is served from
  inlined HTML with zero round-trips.
- **The received library** is a device-local IndexedDB shelf for instant
  zero-identity capture, backed by a server library the moment any identity is
  linked. The hard part — migrating anonymous cards into an account without
  losing any — is solvable but has a **specific landmine** (`linkIdentity`
  doesn't throw, it redirects) that we have to handle correctly. Detailed below.
- **There is an unglamorous layer we cannot skip:** image moderation (legally
  mandatory — anyone can upload a photo and blast it to any inbox), send-rate
  limiting, email deliverability, backups, legal docs, and monitoring. Several
  are ship-blockers, not Stage-2 polish.

---

## 1. Architectural north star

Everything serves the wedge in [[Initial-Recommendations]]: **zero recipient
friction, the same-session recipient→sender loop, handcrafted craft, and a
received library.** Three principles fall out of that:

1. **The recipient's open is sacred.** `/c/:token` must paint the craft with
   *zero* blocking network calls beyond the one HTML response. That means the
   card's content is **inlined into the server-rendered HTML**, not fetched
   client-side from the database after hydration. (The research's first draft
   had the player fetch card JSON from Supabase on load — a critic correctly
   flagged that as a friction leak and a dependency on Supabase being awake. We
   inline instead.)
2. **The card is data, the craft is code, and both are immutable once shipped.**
   A sent card is a permanent artifact. The engine version it was authored
   against is pinned into the card, so we can evolve the engine freely and not
   one already-sent card changes. (This is a Stage-1 concern, not Stage-0 — see
   [[Roadmap]] — but the data model should be shaped for it from the start.)
3. **Identity is layered on top, never underneath.** No feature may require a
   session to *view*. Auth, sync, push, and the PWA are all progressive
   enhancements that load *after* the card has played.

### The three-layer split (the core idea)

```
┌─────────────────────────────────────────────────────────────┐
│  RENDERER ENGINE  — versioned, immutable bundles             │
│  /r/1.4.0/engine.js  (deterministic canvas particle engine)  │
│  contract: engine.play() · engine.edit() · renderStaticFrame()│
└─────────────────────────────────────────────────────────────┘
            ▲ pinned by                    ▲ same engine powers
            │ card.engineVersion           │ BOTH play and edit
┌───────────────────────────┐    ┌──────────────────────────────┐
│  CARD DOCUMENT  (JSON)     │    │  PHOTOS  (separate CDN blobs) │
│  message, names, effect,   │───▶│  immutable per-id URLs,       │
│  seed, theme, photo refs   │    │  resized on read, never base64 │
└───────────────────────────┘    └──────────────────────────────┘
```

- The **engine** is the current `index.html` craft, refactored into a
  dependency-free module with a stable contract. All randomness routes through a
  **seeded PRNG** (`card.seed`) so a card renders identically on the sender's
  preview, the recipient's open, a re-open from the library, and any
  server-side still. (Today the engine uses `Math.random()` — making it
  deterministic is the *first* engine task, because the share preview depends on
  it.)
- The **card document** is a ~1–3 KB JSON row. No animation logic, no embedded
  photos.
- **Photos** are uploaded, downscaled client-side to ~1600px WebP *before*
  upload, stored as immutable blobs, and delivered/resized by an image CDN.

Why this matters: deterministic canvas effects cost **nothing** per play, so
unlimited free sends (the fuel for virality) stay affordable forever; AI is an
optional garnish baked **once** into a static asset (a premade image or
video/animation overlay *added* to the card), never a per-play call. See §3
"Effect types".

---

## 2. The stack

| Layer | Recommendation | Why | Runner-up |
|---|---|---|---|
| **Framework** | **React** (React Router / Next) — the founder's existing stack | Solo-founder velocity is the scarcest resource; the brief and prior projects are React + Supabase | **SvelteKit** (leanest bundles, but a new stack to learn) |
| **Host** | **Cloudflare** (Pages/Workers) | Free tier *allows commercial use*, unlimited egress, 100k Worker req/day, cheap images; edge SSR for per-card OG | Netlify; **not** Vercel (Hobby is non-commercial-only in 2026) |
| **Backend** | **Supabase** (Postgres + RLS + Auth + Storage + Realtime + Edge Functions) | Already the founder's stack; uniquely matches the exact identity ladder (anonymous → link → account) in one product; real relational model for the library + couple shelf | Firebase (NoSQL fights the relational shelf); Cloudflare D1+KV (you'd build auth yourself) |
| **Photo storage** | **Cloudflare R2** ($0.015/GB, **zero egress**) + Cloudflare Images for transforms | Photo storage — not MAU — is the real variable cost; R2's zero egress is decisive for a viral, image-heavy product | Supabase Storage (fine early; metered egress hurts at scale) |
| **Loop analytics** | **PostHog** (free: 1M events/mo, funnels, 1yr retention) | `identify()` merges the anonymous viewer into the signed-in person → lets us attribute a *new send* back to the *received card* that spawned it (the K-factor) | Plausible (no person-merge → can't compute K-factor) |
| **Email (magic links)** | **Resend** or **SES**, with SPF + DKIM + DMARC | Supabase's built-in SMTP caps at ~2/hr — production-unusable. **Resend free is 100/day** — budget paid before any viral traffic | SES (~$0.10/1k, no daily cap) |
| **Push (later)** | **Roll your own** VAPID via `web-push` in a Supabase Edge Function | ~$0 marginal; keeps subscriber identity in the same Postgres as auth (no second identity store to reconcile with the merge) | OneSignal (free to 10k subs/send; adds an SDK + a second identity store) |
| **Payments (Stage 2)** | **Stripe** Checkout + Billing | Best DX, magic-link-friendly, one-time + recurring | — |
| **Gifting (Stage 2)** | **Tremendous** | Self-serve, no platform fee/minimum under $200k/yr, face value via ACH, free sandbox, 200+ countries (fits cross-border couples) | Tango (wholesale margin but sales-gated); not Blackhawk (enterprise-only) |
| **Moderation** | **OpenAI Moderation** (free, images) for NSFW + **PhotoDNA/Thorn/Hive** for CSAM | Legally mandatory for user-uploaded photos (see §7). AWS Rekognition explicitly does *not* detect CSAM | Hive (~$3/1k, higher precision) |
| **Error/uptime** | **Sentry** (client canvas errors *by browser* + Edge functions) + an uptime check on `/c/:token` | A canvas crash on the recipient's device is invisible otherwise — and it's the top of the funnel | — |

**The one stack decision to lock early:** host = Cloudflare, backend = Supabase.
The **framework** is genuinely deferrable — at Stage 0 the existing static
`index.html` on any host is enough. Default the framework to React for velocity;
only reach for SvelteKit if the founder wants to.

---

## 3. The card model & renderer

**Card JSON (v1)** — stored as a `jsonb` row, *inlined* into the player HTML:

```jsonc
{
  "schema": 1,
  "token": "k7Qm2xR9pLfa",        // 12-char nanoid → the /c/:token id
  "engineVersion": "1.4.0",        // HARD PIN → loads /r/1.4.0/engine.js, immutable
  "effect": "loveLetter",          // an effect-library id: a canvas module OR a premade overlay (image/video) — see "Effect types"
  "seed": 1734829112,              // drives ALL rng → reproducible + unique per card
  "theme": { "palette": "duskRose", "cardstock": "cream", "foil": "gold" },
  "occasion": "justBecause",
  "content": {
    "coverTitle": "Thinking of you",
    "recipientName": "Rachel",
    "message": ["I love you more than you know…", "…"],
    "signoff": "Always, JD"
  },
  "media": { "photos": [{ "id": "ph_a91", "src": "https://img.app/cdn/ph_a91", "focal": [0.5,0.4] }], "music": null },
  "reducedMotionFrame": "auto"
}
```

**Engine contract (stable across versions):**

- `engine.play(cardDoc, mountEl, { onFinished, reducedMotion })` — plays, then
  fires `onFinished` (the "Keep this forever?" hook).
- `engine.edit(cardDoc, mountEl, { onChange })` — *same engine* drives the
  in-session editor, so a recipient becomes a sender with no new code path. This
  is what keeps the viral loop seamless.
- `engine.renderStaticFrame(cardDoc, mountEl)` — composes a finished still for
  `prefers-reduced-motion` **and** the share preview. **Required per effect** —
  reduced-motion users must get the full emotional payload (photo + note +
  signoff settled), not a disabled animation. (Today's code just suppresses the
  burst — that's a craft regression to fix in the port.)

**Effect types (what an `effect` can be).** The `effect` field names one entry in
a shared effect library. Three kinds — and only the third costs anything per send:

1. **Hand-coded canvas effects** (today's hearts/glitter/confetti). Written once,
   run live, seeded-deterministic. $0 to make, ~$0/card, and they recolor to the
   card's palette. The default.
2. **Premade overlay assets — image OR video/animation — made once, reused.**
   *This is the "AI video effect" sense:* e.g. a looping confetti video, a
   foil-shimmer/sparkle loop, a snow overlay. Generated once (AI like Higgsfield,
   or hand-made/sourced), stored as a small mp4/webm/Lottie/sprite, and *layered
   onto* any card. One-time cost (~$0.01–$1); **~$0 per send** (a static asset on
   free CDN egress). It's just a new library entry referenced by `effect` id —
   not a personalized, per-recipient generation.
3. **Per-card AI generation** — a fresh AI render on *every* send. The one true
   margin risk ($0.14–$3.75/clip); a gated, priced upsell only (§8), never default.

**Caveat for video/animation overlays (craft + perf, NOT cost):** they're heavier
than coded effects, and the recipient's open must paint instantly. So keep them
small, **lazy-load** them, and layer them *over* the canvas so the cover's first
frame shows immediately and the overlay streams in behind it — never let a
multi-MB confetti loop block the open. They also don't recolor to the card's
palette the way a parametric canvas effect does; choose per effect whether that
matters.

**Versioning = "plays forever."** `/r/<semver>/engine.js` files are write-once,
never deleted, served `Cache-Control: immutable`. New effects ship as new
versions; the editor always authors against `latest` and stamps that version
into the card. *(Stage 1 — don't build the version machinery at Stage 0; just
keep the data model token-keyed so it's cheap to add.)*

**Image pipeline:** client `createImageBitmap` → downscale to ≤1600px →
`canvas.toBlob('image/webp', 0.7)` *before* upload (kills 70%+ of bytes) →
store in R2 → deliver/resize via Cloudflare Images. Photo URLs are immutable per
id so a card doc never breaks.

---

## 4. Auth & the tiered identity ladder

The decided model from [[Initial-Recommendations]], with the implementation
corrected for two verified landmines:

```
view (no identity, ever) ─▶ "Keep this forever?" (one-tap Apple/Google
                            or email magic-link) ─▶ full account on first send
```

- **Supabase anonymous sign-in** gives a real user UUID. Upgrading via
  `linkIdentity()` (OAuth) or `updateUser({email})` **preserves the same UUID**,
  so on the common path *every card already attached migrates for free.* Manual
  linking must be explicitly enabled in project config.
- **Defer the anonymous session to save-intent, not first view.** Two research
  domains wanted `signInAnonymously()` on every open; a critic flagged the
  conflict. Resolution: viewing uses **no auth at all** (inlined HTML + a public
  token lookup + a cookieless PostHog event for the count). Mint the anon user
  only when the recipient taps "Keep this forever?" — this bounds billable MAUs,
  the abuse surface, the 30/hr rate limit, and the privacy optics, and it means
  a rate-limited sign-in can *never* block an open.
- **Sign in with Apple on the web is the fiddly one:** needs a *Services ID*
  (not the App ID) as `client_id`, the exact Supabase callback URL registered, a
  `.p8`-signed ES256 client secret **that expires every 6 months** (cron a
  rotation reminder), and handling of Apple's `form_post` + `SameSite=Lax`
  cookie quirk. "Hide My Email" returns a relay address, so email is not a
  reliable cross-provider merge key.
- **Prefer 6-digit OTP over click-through magic links** for the in-session
  upgrade — links opened in a different browser/in-app webview lose the
  originating session. Reserve link-click for deliberate cross-device sign-in.

---

## 5. The received library — how to make it seamless (the priority section)

This is the retention mechanic and the second viral surface, and it must never
break zero-friction. The design is a **two-layer shelf with the server as
source of truth.**

### 5.1 Two layers

1. **Device-local shelf (IndexedDB, via Dexie), written the instant a card
   opens, with zero identity.** Keyed by `card_token`, holds enough to replay
   offline (token, names, effect, seed, message, theme, a tiny WebP thumb). The
   "shelf" = cards this browser has seen. Instant, no prompt.
2. **Synced server library,** reached via a *soft* "Keep this forever?" prompt
   fired **only after the animation completes** — one tap to save, dismissible
   with nothing lost.

### 5.2 The eviction problem (why local-only fails)

**Safari/WebKit evicts all script-writable storage — IndexedDB included — after
7 days of no interaction** (ITP). That's exactly the iOS bounce recipient who is
the top of the funnel. Two exemptions: `navigator.storage.persist()` (Safari
17+, call it silently on open) and home-screen PWA install. **Conclusion: the
local shelf is best-effort; durability comes from linking an identity.** So on
iOS, the honest copy for an unauthenticated save is *"Saved to this device,"*
and the true *"Keep forever"* promise fires at/after identity link. Don't
promise forever to a storage that evicts in 7 days.

### 5.3 The merge — done right (this is the landmine)

The goal: when a recipient with locally-saved cards signs in, **every card
follows them and none is lost.**

- **Common path (first upgrade, same device):** `linkIdentity()` /
  `updateUser()` preserves the UUID → cards already keyed to that UUID need no
  movement. Free.
- **Hard path (returning sender / second device):** the Apple/Google identity is
  already attached to an existing account. **Verified landmine:**
  `linkIdentity()` does **not throw** in this case — it **redirects to a deep
  link with the error in the URL.** A `try/catch` will never fire; the promise
  looks like it succeeded; the user lands in their existing account; and the
  device's anonymous cards are **silently orphaned.** This is a real
  data-loss bug if coded the naive way.

  **Correct handling:**
  1. *Before* calling `linkIdentity`, persist the **claim queue** (every
     `card_token` this device has touched) and a recovery handle to durable
     storage (a server-issued one-time nonce — not just in-memory, because the
     redirect tears down the SPA).
  2. Handle the auth **redirect/callback** and parse the URL for the
     `identity_already_exists` error.
  3. On that signal: `signInWithOAuth` into the existing account, then call an
     **idempotent claim Edge Function keyed by `card_token`** (not by UID) that
     reassigns the orphaned rows, `ON CONFLICT` keep-saved semantics, then
     soft-deletes the anon shadow user.
  4. **Acceptance test:** open cards as anon A → link a Google identity already
     owned by user R → assert every token from A now belongs to R and zero are
     orphaned. *"No card may ever silently disappear on sign-in"* is the merge
     acceptance criterion.

  Keying device-local saves by the immutable `card_token` from day one (a
  localStorage array) is the cheap insurance that makes this Stage-1 claim
  straightforward rather than a painful retrofit.

### 5.4 Shared couple shelf

A `pairs` row links two members; pair-tagged `shelf_items` are mutually visible
via an RLS membership check (never the whole library). The UI is a
*"You & {partner}"* thread — the chronological back-and-forth of sent + received
cards, each replayable. Supabase **Realtime** drives live sync. *(Defer to late
Stage 1 / Stage 2 — it's a second-order feature requiring both partners to
already be senders.)*

### 5.5 Offline & the shelf UX

- Shelf grid renders entirely from IndexedDB; re-open **replays the real engine**
  from the stored seed (deterministic → pixel-identical), not a video. Works
  offline after first paint.
- Writes (save, opened) queue in an outbox and flush idempotently on reconnect.
- UX: masonry grid of still-frame thumbs (sender + relative date), `received` /
  `sent` filter chips, tap → full-screen re-open animation. Every open card has a
  persistent **"Send one back"** (pre-fills recipient = original sender) — this
  is the library as the second viral surface.

### 5.6 Why view-and-bounce is fine

Most recipients will view and leave — they're top-of-funnel either way. The
library is a retention mechanic for the subset who care, captured at the
highest-intent moment (right after the card lands). Nothing about it gates the
view.

---

## 6. Data model (one canonical sketch)

Three research domains proposed overlapping-but-divergent schemas. Reconcile to
**one** canonical Supabase migration set (CLI-managed, version-controlled,
expand/contract, RLS in the same files). Rough shape:

- `profiles` (1:1 with `auth.users`; `is_anonymous`, `display_name`)
- `cards` (`token` unique, `author_id`, `doc jsonb`, `engine_version`, timestamps) — **no public SELECT**; viewing goes through a controlled function
- `card_assets` (photo metadata; blobs live in R2/Storage)
- `sends` (the **viral-coefficient ledger**: `share_token`, `sender_id`, `opened_at`, `open_count`, `created_from_send_id` ← the loop edge, `recipient_became_sender`)
- `saves` / `shelf_items` (library entries, `role` ∈ received/authored/draft)
- `pairs` + `couple_members` (shared shelf)
- `push_subscriptions` (Stage 1-late)
- `card_events` (opened/completed/saved/send_back — telemetry; or push to PostHog instead)

**RLS:** enable on every table, default deny. Public viewing is the one
sensitive surface — handle it through a `SECURITY DEFINER` function (or
service-role Edge Function) that resolves `share_token` → joined card + signed
asset URLs, so the tables stay locked and a leaky policy can't expose private
photos. Everything else scopes to `auth.uid()`.

---

## 7. The unglamorous layer (mostly not optional)

The happy-path architecture assumes a benign world. A viral, UGC-photo,
anonymous-send product is legally and practically forced to have these — several
are **ship-blockers**, not Stage-2 polish.

- **Image moderation + CSAM (legally mandatory).** Anyone can upload a photo and
  send it to any inbox. Under **18 USC 2258A / the REPORT Act (2024)** a US
  provider *must* report apparent CSAM to NCMEC and preserve data 1 year (fines
  to $300k). Plan: cheap NSFW classifier (OpenAI Moderation, free) on upload +
  **PhotoDNA/Thorn/Hive** for CSAM (Rekognition does *not* detect it) + a
  one-tap **"Report this card"** on the public view + an instant **takedown
  kill-switch** that unpublishes a token.
- **Abuse / rate-limiting on the SEND action.** Sign-in throttling isn't enough
  — a free, accountless "send a message + photo to any email/phone" endpoint is
  an open-relay/harassment vector that will torch our sender reputation.
  Rate-limit sends per device/IP, gate behind Turnstile, enforce the
  identity-on-first-send server-side. Keep *viewing* unthrottled.
- **Email deliverability.** Resend free = 100/day; budget paid before viral
  traffic. SPF + DKIM + DMARC (alignment) on a dedicated sending subdomain +
  Google/Yahoo bulk-sender compliance, or magic links silently stop arriving.
- **Backups / DR.** Supabase **Free has no backups**; cheapest PITR is ~$100/mo.
  The whole "keep forever" thesis needs recoverable data → scheduled `pg_dump`
  to R2 from day one, move to Pro before real users, test-restore once.
- **Legal:** ToS + Privacy Policy + Acceptable Use Policy + sub-processor list.
  Required by Apple/Google OAuth, Stripe, Tremendous, and GDPR/CCPA — and the
  AUP is the legal hook for banning abusers / removing CSAM.
- **GDPR/CCPA + COPPA.** EU couples are in scope day one → build account+data
  **deletion** and **export** (wire through the same token/UID keys as the
  merge) and a removal path for *non-user recipients* depicted in cards. Add a
  neutral **age screen** at create/send (the COPPA amended-rule deadline of
  2026-04-22 has already passed).
- **Monitoring:** Sentry on the client canvas engine *by browser/device* (the
  recipient's first impression) + Edge functions; uptime check on `/c/:token`.
- **Migrations, secrets, accessibility:** one canonical migration set; secrets
  only in Cloudflare/Supabase secret stores with the Apple `.p8` 6-month
  rotation on a cron; a screen-reader text layer alongside the canvas + keyboard
  controls + WCAG-AA contrast (cheap now, painful to retrofit into a canvas-first
  renderer).

### The permanence ↔ deletion carve-out

"Viewing is permanent" must carve out a **documented exception** for legal
deletion (GDPR erasure) and CSAM/abuse takedown. And we must *never prune a card
that a recipient has opened* (anon-cleanup for cost is fine; deleting a
delivered card silently breaks a "permanent" link — a wedge violation).

---

## 8. Cost model (honest)

Card *views* are static edge assets (free bandwidth on Cloudflare), so cost
scales with DB/auth/storage, **not** with virality. Photos are the real variable.
The paid floor turns on at a **"go public" gate**, not at build time.

| Stage | Infra/month | Notes |
|---|---|---|
| **Build + controlled-cohort test** | **~$0** | All free tiers: Cloudflare/Pages, Supabase free, R2/Storage free, PostHog free, Tally free. Domain optional ~$12/yr. Free tier is fine — no public data to protect yet, and sends stay inside a known cohort. |
| **"Go public" gate** | **~$30–80** | Turns on ONLY when *strangers* can upload + send: Supabase Pro ($25, backups + no 7-day pause), paid email (Resend/SES), public-scale moderation (NSFW + CSAM). The legal/operational floor for public traffic — see §7. |
| ~1k MAU (public) | **~$25–30** | Supabase Pro is the line that matters; Pages free, R2 near-free |
| ~10k MAU (public) | **~$50–120** | Supabase Pro + storage/compute; ~200GB of photos on R2 ≈ $3/mo (zero egress). Keep photos on R2, not Supabase Storage |

*(Correction: an earlier draft listed "~$50–80 real" as the **startup** cost. That's wrong — that figure is the go-public floor. Building the app and running a controlled-cohort test is ~$0.)*

**Per-card margin:** a handcrafted/canvas card ≈ $0.0005–0.002 → ~100% margin at
any price; free sends are sustainable forever.

**Effects + the AI distinction (where the only real cost risk lives):**
- **Premade reusable effects — ~$0/card, core craft.** A library of effects
  (confetti, hearts, foil, snow): some hand-coded canvas (free to make), some
  **premade overlay assets made once** — an image *or* a **video/animation loop**
  (a Higgsfield image ~$0.01; a short looping clip a few cents to ~$1, one-time).
  This is the "AI video effect" sense: a premade confetti/foil/snow loop *added*
  to a card. Any card just references one; per-send cost is ~$0 (a static asset
  on free CDN egress). Ship these from Stage 1 — craft, not a margin risk. See §3
  "Effect types" for the perf caveat (keep video overlays light + lazy-loaded).
- **Per-card AI *generation* — the one margin killer.** Generating something
  fresh on every send is $0.14–$3.75/clip and scales WITH virality (the worst
  curve). Never bundle it; only ever a ≥3×-cost priced upsell ($2.99+).

Stripe's fixed $0.30/charge also kills $1 micro-sales → monetize via gifting +
premium effects + an annual sub, not per-card (see [[Roadmap]] Stage 2).

---

## 9. Key risks & the wedge-integrity fixes

| Risk | Fix |
|---|---|
| Player gates first paint on a Supabase fetch | **Inline the card JSON in the SSR/edge HTML**; photos stream as separate `<img>` |
| `linkIdentity` silently loses cards (redirects, doesn't throw) | Parse the redirect error → sign-in-then-claim by `card_token`; persist claim queue before redirect; e2e test |
| OG preview diverges from the real card | Ship **seeded determinism first**; use a composed branded **SVG still** (Satori can't rasterize canvas), immutable per-token URL, <300KB for WhatsApp |
| "Keep forever" lies on non-PWA iOS (7-day eviction) | Gate the "forever" promise on identity link; `persist()` on open; softer copy for device-only saves |
| Google Fonts render-block the craft | **Self-host** subset WOFF2 from the same edge, `font-display:swap`, metric-matched fallback |
| Anon-on-every-view inflates MAU + abuse + privacy optics | Defer anon session to **save-intent**; count views with cookieless PostHog |
| `ref_card_id` dropped across webview/magic-link hops → undercounts K | Persist the parent edge **server-side** on `/create?ref=`, stamp `ref` into the magic-link redirect, compute K on distinct persons |

---

## 10. Open questions

- Is the founder fluent enough in Svelte to take the leaner bundle, or is React
  the right velocity call? (Leaning React.)
- Do anonymous MAUs bill identically to authenticated ones on Supabase? (Confirm
  before firing anon sessions liberally — affects §4.)
- OG still: literal first-frame vs. composed branded still? (A/B share→open;
  default to composed still for compression-safety.)
- Couple-shelf pairing: explicit "link with partner" action vs. inferred after N
  reciprocal sends?
- What share of the couples beachhead is both-iPhone? (Gates whether iOS web
  push is worth building vs. leaning on email/SMS re-engagement.)
- Gifting attach **rate** and tolerable **service fee** — both unvalidated;
  concierge-test before building Stripe + Tremendous.

---

## Sources

Platform facts that drive the calls above (verified June 2026):

- Vercel Hobby non-commercial — https://vercel.com/docs/limits/fair-use-guidelines
- Cloudflare Workers/Pages free (commercial OK, unlimited egress) — https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare R2 (zero egress) — https://developers.cloudflare.com/r2/pricing/ ; Images — https://developers.cloudflare.com/images/pricing/
- Supabase pricing & MAU — https://supabase.com/pricing ; backups/PITR — https://supabase.com/docs/guides/platform/backups
- Supabase anonymous auth & identity linking (UUID preserved; manual linking; 30/hr; no auto-cleanup) — https://supabase.com/docs/guides/auth/auth-anonymous , https://supabase.com/docs/guides/auth/auth-identity-linking
- `linkIdentity` redirects (does not throw) on already-linked — https://github.com/orgs/supabase/discussions/27061
- Sign in with Apple on web (Services ID, .p8 secret expiry, form_post) — https://supabase.com/docs/guides/auth/social-login/auth-apple
- Supabase SMTP limits / Resend quotas — https://supabase.com/docs/guides/auth/rate-limits , https://resend.com/docs/knowledge-base/account-quotas-and-limits
- WebKit 7-day storage eviction & exemptions — https://webkit.org/blog/14403/updates-to-storage-policy/
- iOS web push requires home-screen PWA (16.4+) — https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers
- OG crawlers don't run JS / sizing — https://developers.facebook.com/documentation/business-messaging/whatsapp/link-previews/
- PostHog free tier & identify() merge — https://posthog.com/pricing , https://posthog.com/docs/product-analytics/identify
- Tremendous pricing/sandbox — https://www.tremendous.com/pricing/ ; Stripe — https://stripe.com/pricing
- AI video rates — https://fluxnote.io/guides/ai-video-model-pricing-comparison-2026 ; Higgsfield — https://higgsfield.ai/pricing
- CSAM legal obligation & Rekognition gap — https://www.law.cornell.edu/uscode/text/18/2258A , https://aws.amazon.com/rekognition/faqs/
- COPPA amended rule — https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa
