---
phase: 01-validate-the-loop
plan: 01
subsystem: infra
tags: [supabase, nanoid, github-pages, canvas, vanilla-js, esm-cdn, rls, opengraph]

# Dependency graph
requires:
  - phase: (none - first plan of phase 1)
    provides: existing index.html canvas engine, reused verbatim
provides:
  - "Supabase cards schema + token-as-capability RLS migration (0001_cards.sql)"
  - "shared/supabase.js: lazy createClient singleton, saveCard(), getCardByToken()"
  - "shared/engine-bridge.js: applyCardToEngine(row) DOM-fill bridge"
  - "maker.html: Surface A create form + Surface B share state"
  - "card.html + 404.html: recipient view with static OG and /c/<token>/ SPA fallback"
affects: [01-02-analytics, 01-03-share-polish, 02-deterministic-engine, phase-1-verification]

# Tech tracking
tech-stack:
  added:
    - "@supabase/supabase-js@2 (ESM from esm.sh, lazy dynamic import)"
    - "nanoid@5 (ESM from esm.sh, lazy dynamic import)"
  patterns:
    - "Token-as-capability public read (RLS SELECT/INSERT only, no UPDATE/DELETE)"
    - "Lazy CDN ESM imports so modules import cleanly under plain Node for structural checks"
    - "Engine reuse via a copied-and-hosted engine + a pure DOM-fill bridge (index.html untouched)"
    - "404.html SPA fallback for clean dynamic paths on GitHub Pages"
    - "Sacred open: paint cover synchronously, fetch card row after (never blocks first frame)"
    - "All user text rendered via textContent/createElement, never innerHTML (XSS control)"

key-files:
  created:
    - supabase/migrations/0001_cards.sql
    - shared/supabase.js
    - shared/engine-bridge.js
    - shared/config.example.js
    - maker.html
    - card.html
    - 404.html
    - .gitignore
  modified: []

key-decisions:
  - "Config via shared/config.js (gitignored) + committed shared/config.example.js with REPLACE_ME placeholders, so the code ships without live Supabase keys and never blocks on them."
  - "CDN imports made lazy (dynamic import inside functions) so shared/supabase.js imports cleanly under Node for the structural export check; browser behavior is unchanged."
  - "Effect chips (hearts/confetti/petals) map to existing engine variants by re-biasing the existing CONFIG particle counts; no new effect code was added (D-04)."
  - "nanoid default 21-char alphabet kept (~126 bits); no custom alphabet/length."
  - "Recipient CTA (Surface C) built into card.html now since it lives in the recipient view; analytics wiring for cta_clicked is deferred to Plan 02 per scope."

patterns-established:
  - "Token-as-capability RLS: anon SELECT/INSERT USING/WITH CHECK (true), no UPDATE/DELETE; founder deletes a row to unpublish."
  - "card.html and 404.html MUST stay byte-identical until Phase 2 replaces the duplication with real routing."

requirements-completed: [VAL-03]

coverage:
  - id: D1
    description: "Supabase cards schema + RLS migration (anon SELECT/INSERT only, no UPDATE/DELETE)"
    requirement: "VAL-03"
    verification:
      - kind: automated
        ref: "grep 'create table public.cards' + 'row level security' in 0001_cards.sql"
        status: pass
    human_judgment: true
    rationale: "Migration correctness is only fully proven once the user runs it in the Supabase SQL editor and a real insert/select round-trips (the Task 4 human-verify checkpoint)."
  - id: D2
    description: "shared/supabase.js exports supabase, saveCard, getCardByToken and imports cleanly"
    verification:
      - kind: automated
        ref: "node --input-type=module import check (all three exports present)"
        status: pass
    human_judgment: true
    rationale: "Exports verified offline, but saveCard/getCardByToken can only be proven end to end against a live Supabase project (Task 4 checkpoint)."
  - id: D3
    description: "shared/engine-bridge.js applyCardToEngine fills engine slots, swaps occasion, hides/shows medallion, maps effect"
    verification:
      - kind: automated
        ref: "node --input-type=module import check (applyCardToEngine present)"
        status: pass
    human_judgment: true
    rationale: "DOM-fill correctness (greeting/medallion/effect per occasion) needs the rendered card visually confirmed (Task 4 + the project Playwright UI rule)."
  - id: D4
    description: "maker.html create form calls saveCard and shows the /c/<token>/ link"
    requirement: "VAL-03"
    verification:
      - kind: automated
        ref: "grep saveCard + 'Get my link' in maker.html"
        status: pass
    human_judgment: true
    rationale: "Form-to-link flow and the share state require a live submit against Supabase plus a visual pass (Task 4 + Playwright UI rule)."
  - id: D5
    description: "card.html reads token, fetches row, feeds engine, carries static OG; 404.html identical for /c/<token>/"
    requirement: "VAL-03"
    verification:
      - kind: automated
        ref: "grep og:image/getCardByToken/applyCardToEngine; card.html === 404.html byte-identical check"
        status: pass
    human_judgment: true
    rationale: "Cover-paints-first, the read path, and the OG unfurl can only be confirmed on a served page and (for OG) after deploy (Task 4 checkpoint)."
  - id: D6
    description: "ZERO em-dash across every new file (absolute project rule)"
    verification:
      - kind: automated
        ref: "node em-dash scan over all 8 new files -> ALL_CLEAN"
        status: pass
    human_judgment: false

# Metrics
duration: 7min
completed: 2026-06-30
status: paused-checkpoint
---

# Phase 1 Plan 01: Walking Skeleton Summary

**The thin end-to-end loop: a Supabase-backed card store (token-as-capability RLS), a vanilla create form that mints a /c/<token>/ link, and a recipient view that reuses the existing canvas engine, with a 404.html SPA fallback and static OG.**

## Performance

- **Duration:** 7 min (AUTO tasks 1-3; stopped at the Task 4 human-verify checkpoint)
- **Started:** 2026-06-30T01:52:23Z
- **Completed (AUTO tasks):** 2026-06-30T01:59:18Z
- **Tasks:** 3 of 4 (Task 4 is a blocking human-verify checkpoint, pending the user)
- **Files modified:** 8 created, 0 modified (index.html deliberately untouched)

## Accomplishments
- Supabase data layer: `0001_cards.sql` creates `public.cards` with RLS that grants anon SELECT/INSERT only (no UPDATE/DELETE), making cards immutable and non-deletable by the public; the nanoid token is the unguessable capability (D-01).
- `shared/supabase.js` exports `supabase`, `saveCard()` (mint token, upload photo to the unguessable `photos/<token>.jpg` path, insert the row, return `{token, url}`), and `getCardByToken()` (graceful null on error). CDN imports are lazy so it imports cleanly under Node.
- `shared/engine-bridge.js` exports `applyCardToEngine(row)` that fills the engine's existing DOM slots with `textContent`/`createElement` (no innerHTML), swaps greeting + cover title per occasion, shows the gold medallion only for birthday (D-04), and maps the chosen effect onto existing engine variants.
- `maker.html` is the mobile-first create form (Surface A) plus the in-place share state (Surface B), reusing index.html tokens/fonts and the UI-SPEC copy verbatim; it calls `saveCard()` and reveals the `/c/<token>/` link with a copy button.
- `card.html` hosts a copy of the (untouched) engine, paints the closed cover synchronously, then fetches the row without blocking the first frame, feeds the engine, carries static OpenGraph meta in the head, threads `?ref&g` onto the recipient CTA, and degrades to a soft retry if the fetch fails. `404.html` is a byte-for-byte copy so clean `/c/<token>/` paths resolve on GitHub Pages.

## Task Commits

Each AUTO task was committed atomically (with hooks, no --no-verify):

1. **Task 1: Supabase schema migration and client helpers** - `93e8d27` (feat)
2. **Task 2: Engine bridge plus the create form and Supabase write** - `07116c8` (feat)
3. **Task 3: Recipient view, the /c/<token>/ route, and the SPA fallback** - `95b1c32` (feat)

**Plan metadata:** committed separately after this SUMMARY (docs).

_Task 4 is a blocking checkpoint:human-verify; no code commit (the user does the Supabase dashboard setup + live verification)._

## Files Created/Modified
- `supabase/migrations/0001_cards.sql` - cards table + token-as-capability RLS (anon SELECT/INSERT only).
- `shared/supabase.js` - lazy createClient singleton, saveCard(), getCardByToken().
- `shared/engine-bridge.js` - applyCardToEngine(row) DOM-fill bridge (no innerHTML, no new effect code).
- `shared/config.example.js` - REPLACE_ME placeholders documenting where the public keys go.
- `.gitignore` - ignores shared/config.js (the real public keys live there, kept out of git).
- `maker.html` - Surface A create form + Surface B share state.
- `card.html` - recipient view: static OG, token read, cover-first paint, engine bridge, soft retry, recipient CTA.
- `404.html` - byte-for-byte copy of card.html for the GitHub Pages SPA fallback.

## Decisions Made
- **Client config strategy:** keys are read from `shared/config.js` (gitignored) with a committed `shared/config.example.js` carrying REPLACE_ME placeholders. A placeholder `shared/config.js` ships locally so the modules import cleanly before Supabase exists. This satisfies "do not block on a live Supabase connection."
- **Lazy CDN imports (deviation, see below):** the esm.sh imports are dynamic and deferred so the plan's `node --input-type=module` export checks pass offline; browser behavior is identical.
- **Effect mapping:** the three effect chips re-bias the existing `CONFIG` particle counts via `window.CARD_EFFECT` + a tiny `window.__applyEffectConfig` setter the loader calls after the fetch. No new effect code was written (D-04 honored).
- **Recipient CTA placement:** Surface C's "Make one for someone you love" CTA is in `card.html` now (it belongs to the recipient view) and threads `?ref&g`; firing the `cta_clicked` analytics event is Plan 02 scope and was not added.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Made the esm.sh CDN imports lazy so the module imports under Node**
- **Found during:** Task 1 (shared/supabase.js)
- **Issue:** The plan's verify command imports `./shared/supabase.js` with `node --input-type=module`. Node throws `ERR_UNSUPPORTED_ESM_URL_SCHEME` on top-level `https://` imports, so a module that statically imports supabase-js/nanoid from esm.sh at the top level would fail the structural export check.
- **Fix:** Moved the `createClient` and `nanoid` imports into lazy `import()` calls inside `getClient()`/`mintToken()`, built the client as a lazy singleton, and exposed `supabase` as `{ client: getClient }`. The browser resolves the dynamic imports on first use exactly as before; only the offline export shape is now checkable.
- **Files modified:** shared/supabase.js
- **Verification:** `node --input-type=module` export check prints EXPORTS_OK (all three exports present); no network access at import time.
- **Committed in:** `93e8d27` (Task 1 commit)

**2. [Rule 2 - Missing Critical] Shipped a local placeholder shared/config.js so modules import without live keys**
- **Found during:** Task 1 (import-time resolution of `./config.js`)
- **Issue:** `shared/supabase.js` imports `{ SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js"`. Without that file present, the import (and thus every verify) would fail before Supabase is even set up. The file is intentionally gitignored, so it must exist locally with safe placeholders.
- **Fix:** Created `shared/config.js` (gitignored) with REPLACE_ME placeholder exports alongside the committed `shared/config.example.js`. The user fills in real values at the Task 4 checkpoint.
- **Files modified:** shared/config.js (gitignored, not committed), shared/config.example.js (committed), .gitignore
- **Verification:** import check resolves config.js; `git status` confirms config.js is not tracked.
- **Committed in:** `93e8d27` (example + .gitignore committed; the real/placeholder config.js stays gitignored by design)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing-critical infra)
**Impact on plan:** Both were necessary to make the planned verify steps runnable and to satisfy "do not block on a live Supabase connection." No scope creep; no behavior change in the browser.

## Issues Encountered
- A one-off Bash probe that would have fetched+run remote esm.sh code was correctly blocked by the sandbox. This had no impact: the lazy-import design was confirmed by the offline export check instead, which is the relevant signal.

## Known Stubs
- `card.html` / `404.html` OG meta use `https://REPLACE_ME_PAGES_DOMAIN/...` for `og:image` and `og:url`. These are intentional placeholders the user replaces with the live GitHub Pages (or Cloudflare Pages) domain before sharing links. Documented here so the verifier expects them; the OG unfurl is part of the Task 4 verification (step 7, post-deploy).
- `shared/config.js` ships with REPLACE_ME placeholder keys (gitignored); the user pastes real public keys at the checkpoint. This is the documented setup path, not an unresolved stub.

## User Setup Required

**External service configuration is required and is exactly the Task 4 human-verify checkpoint.** The user must:
1. Create a free Supabase project.
2. Create a PUBLIC Storage bucket named `card-photos` (directory listing OFF).
3. Run `supabase/migrations/0001_cards.sql` in the Supabase SQL Editor.
4. Copy `shared/config.example.js` to `shared/config.js` and paste the real `SUPABASE_URL` and `SUPABASE_ANON_KEY` (anon public key, never service_role).
5. Replace the `REPLACE_ME_PAGES_DOMAIN` OG placeholders in `card.html` and `404.html` before sharing (post-deploy).

Then verify the create-to-open loop end to end (see the checkpoint steps surfaced by the orchestrator).

## card.html / 404.html duplication note
`card.html` and `404.html` are byte-identical by design (the GitHub Pages SPA fallback). Any future change to one MUST be mirrored to the other until Phase 2 replaces this duplication with real routing. A byte-identical check is in the Task 3 verification.

## HEIC / upload edge cases (input for Plan 03)
- The maker uploads the raw selected blob as-is (no downscale yet) and the file input restricts to `image/jpeg,image/png,image/webp`. HEIC-from-iPhone decode (Safari-only) and client-side downscale/crop toward 3:4 are deferred to Plan 03 per the plan. No HEIC failures were observable here (no live upload was run; that happens at the checkpoint).

## Next Phase Readiness
- The write/route/read/render backbone is in place for Plans 02 (analytics) and 03 (share polish, downscale, HEIC, QR, validation/error states).
- **Blocking:** the Task 4 human-verify checkpoint (Supabase project + bucket + migration + keys, then the live create-to-open loop). The plan is not "done" until that returns approved.

## Self-Check: PASSED

All 8 created files exist on disk; all 3 task commits (`93e8d27`, `07116c8`, `95b1c32`) are present in git history.

---
*Phase: 01-validate-the-loop*
*Completed (AUTO tasks): 2026-06-30; checkpoint pending*
