# Walking Skeleton: Birthday Card App (Stage 0)

**Phase:** 1
**Generated:** 2026-06-29

## Capability Proven End-to-End

> One sentence: the smallest user-visible capability that exercises the full stack.

A sender fills the maker form (name, photo, message, signoff, occasion, effect), gets a real `/c/<token>/` link backed by a Supabase row plus an uploaded photo, and a recipient opens that link in a fresh browser and watches the existing `index.html` canvas card play with the sender's content.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| App shape | Static multi-page: `index.html` (engine, kept verbatim) + `maker.html` + `card.html` + `404.html`, plus a `shared/` ESM module folder | Preserves the single-file vanilla ethos; no build step; the recipient open stays sacred (no SPA framework). Per D-01 and UI-SPEC. |
| Data layer | Supabase free tier (Postgres `cards` table, token PK, jsonb content) plus a public Storage bucket `card-photos` | D-01 locked. Photos cannot ride in a URL; Supabase free gives clean short links plus real photo hosting at $0 and is the real Stage-1 stack. |
| Client libraries | `@supabase/supabase-js@2`, `nanoid@5`, `qrcode@1`, `posthog-js@1` (all ESM from `esm.sh`, major-pinned in the import URL) | No bundler; CDN ESM matches zero-build. Major-pin removes the moving-target risk the researcher flagged (the three SUS verdicts are false "too-new" positives). |
| Read-path security | RLS on `cards`: anon `SELECT USING (true)` + anon `INSERT WITH CHECK (true)`, no UPDATE/DELETE policy. Public Storage bucket, unguessable nanoid path | Token-as-capability for a controlled cohort. The nanoid (126-bit at 21 chars) is the share secret. `SECURITY DEFINER` RPC is noted as the Phase 4 hardening, not built now. |
| Routing for `/c/<token>/` | GitHub Pages `404.html` SPA fallback (a copy of `card.html`); the script reads the token from `location.pathname` | Zero new infra, stays on the current host. Clean `/c/<token>/` links work because Pages serves `404.html` for unknown paths. Cloudflare Pages noted as the Phase-2 clean-path upgrade, NOT switched now. |
| First paint | Paint the engine's closed cover immediately, then fetch the card JSON by token (never await the fetch before first frame). Server-side inlining is impossible on a static host | The recipient open is sacred. Inlined-JSON SSR is explicitly a Phase 2 concern. |
| Analytics | Cookieless PostHog (`cookieless_mode:'always'`), fire-and-forget, guarded by `if (window.posthog)` | One cookieless tool per VAL-01. The Google Sheet ledger is the source of truth; PostHog corroborates and can be ad-blocked. |
| Directory layout | Repo root served as-is; `shared/supabase.js`, `shared/analytics.js`, `shared/engine-bridge.js`, `shared/photo.js` | Keeps `index.html` canonical and un-forked; the maker and card views call shared ESM helpers. |

## Stack Touched in Phase 1

- [x] Project scaffold: new static pages alongside `index.html`; ESM `shared/` modules; no build/lint/test runner added (zero-build is a project constraint, validation is grep + `node -e` parse per HANDOFF.md)
- [x] Routing: a real `/c/<token>/` route via the `404.html` fallback
- [x] Database: one real write (`cards.insert` + Storage upload from the maker) AND one real read (`cards.select().eq('token', ...)` from the card view)
- [x] UI: the maker create form wired to the Supabase write; the card view wired to the Supabase read feeding the existing engine
- [x] Deployment: runs on GitHub Pages (the live host); a documented local full-stack run (`python3 -m http.server`) plus a real Supabase project exercises the whole loop

## Out of Scope (Deferred to Later Slices)

> Explicit so later phases do not re-litigate Phase 1's minimalism.

- Accounts, auth, the synced library, the device-local shelf, the anonymous-to-account merge (Phase 3).
- Deterministic seeded engine, `Math.random()` removal, version pinning, server-side inlined-JSON open, self-hosted fonts (Phase 2). Stage 0 tolerates `Math.random()` and the current Google Fonts loading.
- Moderation, NSFW/CSAM screening, send rate-limiting, paid email, backups, GDPR delete/export, age screen, uptime monitoring (Phase 4, the go-public gate). A manual "delete the row to unpublish a token" path is kept available to the founder, but no moderation UI is built.
- Per-card OpenGraph images (one fixed branded OG image for all cards in Stage 0); per-card OG is a Phase 2 edge feature.
- Premade video/animation effect overlays and distinct per-occasion cover art (effects are the existing hand-coded canvas effects only; one template with a swapping cover title).
- Server-side `ref` attribution hardening; client `?ref=` plus the "who sent you this?" form field suffice for the controlled cohort.
- Gifting (Tremendous), Stripe, premium effects, the shared couple shelf, native app (Stage 2 / v2).
- A `SECURITY DEFINER` token-resolving RPC and signed Storage URLs (Phase 4 hardening).

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: Port the `index.html` craft into a seeded, deterministic, version-pinned canvas engine that paints `/c/:token` with zero blocking calls (and revisits the host for clean paths if desired).
- Phase 3: The full create/personalize/share/library loop in one session, with a synced account via one-tap or magic-link and "send one back."
- Phase 4: The Trust/Safety/Ops floor (moderation, CSAM reporting, rate-limiting, deliverable email, backups, monitoring) before any public traffic.
