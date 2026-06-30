---
phase: 01-validate-the-loop
plan: 02
subsystem: analytics
tags: [posthog, cookieless, funnel, engagement, generation-attribution, vanilla-js, esm-cdn]

# Dependency graph
requires:
  - phase: 01-01
    provides: "card.html / 404.html recipient view, maker.html ref-capture, shared/supabase.js, shared/config.js pattern"
provides:
  - "shared/analytics.js: cookieless PostHog init, track(), and the D-02 engaged-gating (note-bottom OR >=8s visible dwell, deduped, reduced-motion excluded)"
  - "card.html / 404.html: card_opened on open, card_engaged off the engine .read/dwell hooks, cta_clicked on the Surface C CTA"
  - "maker.html: maker_opened + card_created events threading ref/generation for the loop-close node"
  - "POSTHOG_KEY / POSTHOG_HOST added to the config.js/config.example.js pattern (graceful no-analytics on a placeholder key)"
affects: [01-03-share-polish, phase-1-verification, the-google-sheet-ledger]

# Tech tracking
tech-stack:
  added:
    - "posthog-js@1 (ESM from esm.sh, lazy dynamic import, cookieless_mode always)"
  patterns:
    - "Cookieless analytics: cookieless_mode 'always', autocapture/pageview/session-recording off"
    - "Lazy CDN ESM import so shared/analytics.js imports cleanly under plain Node for the structural export check"
    - "Module-level engaged dedupe (fires at most once) + reduced-motion exclusion in one place"
    - "Visible-dwell clock that pauses on tab background (>=8s of VISIBLE time, not wall time)"
    - "Engaged signal taken from the engine's existing .read class (MutationObserver) and visibilitychange, never the 1500ms reveal timer (D-02)"
    - "Fire-and-forget analytics guarded by if (window.posthog) so a blocked/absent PostHog never blocks the open"

key-files:
  created:
    - shared/analytics.js
  modified:
    - card.html
    - 404.html
    - maker.html
    - shared/config.example.js
    - shared/config.js

key-decisions:
  - "Dwell threshold kept at the D-02 default of 8000 ms as a single named constant (DWELL_THRESHOLD_MS) so the dry run can retune it from one place; dwell_ms is recorded on every card_engaged so real reading time is visible."
  - "card_engaged is wired off the engine's existing .read class via a MutationObserver (the engine toggles .read in atBottom()), rather than re-implementing the scroll math in the card view. The module dedupes, so jitter is harmless."
  - "card_opened fires once on page load (opening the page IS the recipient open; the cover is already painted and the tap-to-flip is the same session). Analytics init is fire-and-forget so it never precedes first paint."
  - "Added two maker-side events (maker_opened with a referred flag, card_created with token/generation/ref) so the loop-close node is measurable in PostHog and corroborates the Google Sheet ledger."
  - "PostHog keys read from the same shared/config.js (gitignored) pattern wave 1 used; a REPLACE_ME or empty POSTHOG_KEY degrades to NO analytics (initAnalytics returns early, window.posthog stays undefined, track() is a no-op)."
  - "Exported pauseDwell/resumeDwell in addition to the four planned exports, as the 'small helpers the card view calls on visibilitychange' the plan action text requires."

patterns-established:
  - "All D-02 engagement logic (dedupe, reduced-motion exclusion, dwell math) lives in shared/analytics.js; card.html only forwards the two real engine hooks into it."
  - "card.html and 404.html remain byte-identical (the wave-1 SPA-fallback contract); every card.html change was mirrored to 404.html."

requirements-completed: [VAL-01, VAL-02]

# PostHog event + property contract (the ledger and the funnel depend on these EXACT names)
events:
  - name: card_opened
    fired_from: card.html / 404.html (on load, once)
    super_properties: { card_id, generation, "reduced_motion (only when true)" }
  - name: card_engaged
    fired_from: card.html / 404.html (once per session, deduped, NEVER for reduced-motion)
    properties: { via: "note_bottom | dwell", dwell_ms }
    gating: "note-bottom (.read) OR >=8s VISIBLE dwell, whichever first; reduced-motion sessions excluded (D-02)"
  - name: cta_clicked
    fired_from: card.html / 404.html (Surface C CTA tap, before navigating to the maker)
  - name: maker_opened
    fired_from: maker.html (on load)
    properties: { referred }
    super_properties: { card_id: "the ref (spawning card) or 'direct'", generation }
  - name: card_created
    fired_from: maker.html (after a successful saveCard)
    properties: { token, generation, ref_card_id, referred, occasion, effect, has_photo }

dwell_threshold_ms: 8000

coverage:
  - id: A1
    description: "shared/analytics.js exports initAnalytics, track, markEngagedOnBottom, startDwellTimer (plus pauseDwell/resumeDwell) and imports cleanly under Node"
    requirement: "VAL-01"
    verification:
      - kind: automated
        ref: "node --input-type=module import check (all four planned exports present) -> EXPORTS_OK"
        status: pass
    human_judgment: false
  - id: A2
    description: "card_engaged fires at most once per session and never for reduced-motion sessions; init is cookieless"
    requirement: "VAL-01"
    verification:
      - kind: automated
        ref: "node smoke test: normal session engaged count == 1 (via note_bottom); reduced-motion engaged count == 0; grep cookieless_mode + card_engaged"
        status: pass
    human_judgment: true
    rationale: "Offline behavior proven; the LIVE funnel (one card_opened per open, deduped card_engaged, the >=8s dwell pause on background, the reduced_motion exclusion in a real funnel) can only be confirmed against a live PostHog project in a browser (the Task 3 human-verify checkpoint)."
  - id: A3
    description: "card.html fires card_opened/card_engaged/cta_clicked off the real engine hooks (not the 1500ms timer); the CTA navigates to the maker with ref+generation"
    requirement: "VAL-02"
    verification:
      - kind: automated
        ref: "grep card_opened + cta_clicked + markEngagedOnBottom in card.html -> CARD_WIRED; CTA href threads ?ref&g (wave-1, preserved)"
        status: pass
    human_judgment: true
    rationale: "The reveal-after-settle, the tap, the hop to the maker carrying ?ref=<card_id>&g=1, and the new row recording ref_card_id+generation need the rendered flow exercised in a browser (Task 3 + the project Playwright UI rule)."
  - id: A4
    description: "card.html and 404.html stay byte-identical; no forbidden long-dash in any modified file"
    requirement: "VAL-01"
    verification:
      - kind: automated
        ref: "card.html === 404.html byte check -> FALLBACK_IDENTICAL; em-dash scan over all 6 touched files -> ALL_CLEAN"
        status: pass
    human_judgment: false

# Metrics
duration: 4min
completed: 2026-06-30
status: paused-checkpoint
---

# Phase 1 Plan 02: Cookieless Analytics and the Measurable Loop Close Summary

**Cookieless PostHog wired into the engine's existing hooks so the funnel fires honestly: card_opened on open, card_engaged gated on real engagement (note-bottom OR >=8s visible dwell, deduped, reduced-motion excluded per D-02), and cta_clicked on the Surface C CTA, with the maker recording the loop-close node (maker_opened + card_created carrying ref/generation).**

## Performance

- **Duration:** ~4 min (AUTO tasks 1-2; stopped at the Task 3 human-verify checkpoint)
- **Started:** 2026-06-30T04:34:17Z
- **Completed (AUTO tasks):** 2026-06-30T04:37:53Z
- **Tasks:** 2 of 3 (Task 3 is a blocking human-verify checkpoint, pending the user)
- **Files modified:** 1 created, 5 modified (card.html, 404.html, maker.html, shared/config.example.js, shared/config.js)

## Accomplishments
- `shared/analytics.js` is the single home for the D-02 engagement logic. It exports `initAnalytics`, `track`, `markEngagedOnBottom`, `startDwellTimer`, plus the `pauseDwell`/`resumeDwell` helpers. PostHog is cookieless (`cookieless_mode: 'always'`, autocapture/pageview/session-recording off), lazily imported from esm.sh so the module also imports cleanly under plain Node for the structural check.
- `card_engaged` fires at most once per session (a module-level `engagedFired` boolean) and NEVER for a reduced-motion session (those are excluded from the craft-conversion denominator, D-02 / research Pitfall 5). It is gated on the first of {note-bottom reached, >=8s cumulative VISIBLE dwell}, and records `via` (`note_bottom` | `dwell`) and `dwell_ms`.
- The dwell clock counts VISIBLE time only: `pauseDwell`/`resumeDwell` bank and resume against `visibilitychange`, so backgrounding the tab pauses the clock and the >=8s is genuinely 8s of visible time.
- `card.html` (mirrored byte-for-byte to `404.html`) inits analytics, fires `card_opened` on load, forwards the engine's `.read` class (via a `MutationObserver` on `.face.inside`, which the engine's `atBottom()` toggles) into `markEngagedOnBottom()`, arms `startDwellTimer()` on the real open gesture, and forwards `visibilitychange` to the pause/resume helpers. The old 1500ms timer still only reveals the CTA; it is no longer an engagement signal.
- The Surface C CTA (built in wave 1, copy verbatim from the UI-SPEC, Caveat / `--rose-deep` / single underline) now fires `cta_clicked` on tap, then its existing `?ref=<card_id>&g=<generation+1>` link carries the recipient into the maker.
- `maker.html` fires `maker_opened` (with a `referred` flag) on load and `card_created` after a successful `saveCard`, carrying `token`, `generation`, `ref_card_id`, `occasion`, `effect`, and `has_photo`. This makes the loop-close node measurable and corroborates the Google Sheet ledger. The wave-1 ref-capture into `saveCard` (`ref_card_id` + `generation`) was already present and is preserved.
- PostHog keys come from the same gitignored `shared/config.js` pattern wave 1 used; `POSTHOG_KEY`/`POSTHOG_HOST` were added to both `config.js` (placeholder) and the committed `config.example.js`. A REPLACE_ME or empty `POSTHOG_KEY` degrades to NO analytics (init returns early, `window.posthog` stays undefined, every `track()` is a no-op), never a broken card.

## Task Commits

Each AUTO task was committed atomically on the main working tree (hooks on, no --no-verify):

1. **Task 1: Cookieless analytics module with engaged-gating, dedupe, reduced-motion exclusion** - `6ae6010` (feat)
2. **Task 2: Wire the funnel and the Surface C CTA into the card view, plus the maker create event** - `bbe0b93` (feat)

**Plan metadata:** committed separately after this SUMMARY (docs).

_Task 3 is a blocking checkpoint:human-verify; no code commit (the user creates the PostHog project and confirms the live funnel)._

## Files Created/Modified
- `shared/analytics.js` (created) - cookieless PostHog init, `track()`, and the D-02 engaged-gating (dedupe + reduced-motion exclusion + 8s visible-dwell fallback).
- `card.html` (modified) - imports analytics; fires `card_opened`, `card_engaged` (off `.read`/dwell), `cta_clicked`; forwards `visibilitychange` to the dwell clock.
- `404.html` (modified) - byte-for-byte mirror of `card.html` (SPA fallback contract).
- `maker.html` (modified) - `maker_opened` + `card_created` events; the wave-1 ref/generation capture into `saveCard` is preserved.
- `shared/config.example.js` (modified) - added `POSTHOG_KEY`/`POSTHOG_HOST` placeholders + the "optional, degrades to no analytics" note (Supabase keys untouched).
- `shared/config.js` (modified, gitignored) - added the same two PostHog placeholders locally so the modules import before PostHog exists.

## Decisions Made
- **Dwell threshold:** kept at the D-02 default `DWELL_THRESHOLD_MS = 8000` as a single named constant; `dwell_ms` is recorded on every `card_engaged` so the dry run can confirm 8s against real note lengths (research Open Question 3).
- **Engaged hook via the engine's own class:** rather than re-deriving the scroll math, `card.html` observes the `.read` class the engine already toggles in `atBottom()`. The module dedupes, so scroll jitter cannot double-count.
- **card_opened on load:** opening the page IS the recipient open (the cover paints synchronously in the engine IIFE; the tap-to-flip is the same session). Init is fire-and-forget and runs after first paint, so analytics never blocks the open.
- **Two maker-side events:** added so the loop close is measurable end to end (a `card_created` arriving from a tracked `ref` to a gen>=1 card is a candidate propagation event; the ledger verifies it).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Lazy esm.sh import of posthog-js so shared/analytics.js imports under Node**
- **Found during:** Task 1 (the plan's verify command does `import('./shared/analytics.js')` with `node --input-type=module`).
- **Issue:** Node throws `ERR_UNSUPPORTED_ESM_URL_SCHEME` on a top-level `https://` import, so a module that statically imported posthog-js from esm.sh would fail the structural export check (the exact pattern wave 1 hit with supabase-js).
- **Fix:** Moved the posthog-js import into a lazy `import()` inside `initAnalytics`. The browser resolves it on first use; only the offline export shape is now checkable. Mirrors the established `shared/supabase.js` lazy-import pattern.
- **Files modified:** shared/analytics.js
- **Verification:** `node --input-type=module` export check prints EXPORTS_OK; no network access at import time.
- **Committed in:** `6ae6010` (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added POSTHOG_KEY/POSTHOG_HOST to the config pattern with graceful no-analytics degradation**
- **Found during:** Task 1 (the analytics module must read keys from the same gitignored config pattern wave 1 used, per the critical constraints).
- **Issue:** Without the two PostHog keys in `config.js`/`config.example.js`, `shared/analytics.js` could not resolve its config import, and there was no defined "PostHog not set up yet" path.
- **Fix:** Added `POSTHOG_KEY` (REPLACE_ME placeholder) and `POSTHOG_HOST` to both files alongside the existing Supabase keys (which were left untouched), and made `initAnalytics` return early on a placeholder/empty key so a missing PostHog project degrades to NO analytics.
- **Files modified:** shared/config.example.js (committed), shared/config.js (gitignored, not committed)
- **Verification:** import check resolves config; the reduced-motion + no-key paths were smoke-tested offline.
- **Committed in:** `6ae6010` (example committed; the real/placeholder config.js stays gitignored by design)

**3. [Rule 2 - Missing Critical] Exported pauseDwell/resumeDwell beyond the four planned exports**
- **Found during:** Task 1 (the plan action text requires "small helpers the card view calls on visibilitychange to pause/resume the dwell clock").
- **Issue:** The four named exports alone cannot make the dwell clock pause on tab background; the >=8s must be VISIBLE time per D-02.
- **Fix:** Added `pauseDwell`/`resumeDwell`, called from the `visibilitychange` handler in `card.html`. The four planned exports are all still present.
- **Files modified:** shared/analytics.js, card.html
- **Verification:** the four planned exports still pass EXPORTS_OK; the background-pause behavior is part of the Task 3 live verification (step 5).
- **Committed in:** `6ae6010` + `bbe0b93`

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 missing-critical). No scope creep; all three were necessary to make the planned verify steps runnable and to satisfy the critical constraints (config pattern + graceful no-analytics + the dwell-pause helpers).

## Issues Encountered
- None blocking. The live PostHog connection is intentionally not exercised here (PostHog is not set up yet); the offline structural + behavioral checks stand in until the Task 3 checkpoint.

## Known Stubs
- `POSTHOG_KEY` ships as the `REPLACE_ME_POSTHOG_KEY` placeholder in `shared/config.js` (gitignored). This is the documented setup path, not an unresolved stub: a placeholder key intentionally disables analytics so the card still works before the user creates the PostHog project. The user pastes the real `phc_` key at the Task 3 checkpoint.

## User Setup Required (the Task 3 human-verify checkpoint)
The user must create a free PostHog Cloud project, paste the real `phc_` key + API host into `shared/config.js`, build the `card_opened -> card_engaged -> cta_clicked` funnel (filtered to exclude `reduced_motion = true` from the engaged step), and then verify the live funnel fires honestly (see the checkpoint steps surfaced by the orchestrator). PostHog is NOT set up yet by design; this plan does not block on a live connection.

## card.html / 404.html duplication note
`card.html` and `404.html` are byte-identical by design (the GitHub Pages SPA fallback). Every analytics change to `card.html` was mirrored to `404.html`; the byte-identical check passes.

## Next Phase Readiness
- The measurable loop is closed: the funnel fires off the real engine hooks and the maker records the generation edge. Plan 03 (share polish, photo downscale, HEIC, QR, validation/error states) can proceed.
- **Blocking:** the Task 3 human-verify checkpoint (create the PostHog project, paste the key, build the funnel, confirm the live events with dedupe + reduced-motion exclusion). The plan is not "done" until that returns approved.

## Self-Check: PASSED

`shared/analytics.js` exists on disk; both task commits (`6ae6010`, `bbe0b93`) are present in git history; `card.html` and `404.html` are byte-identical; the em-dash scan over all six touched files is ALL_CLEAN.

---
*Phase: 01-validate-the-loop*
*Completed (AUTO tasks): 2026-06-30; checkpoint pending*
