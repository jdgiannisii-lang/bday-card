# Phase 1: Validate the Loop - Context

**Gathered:** 2026-06-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a **thin self-serve card maker** on top of the existing `index.html` canvas
engine — a create form (recipient name / photo / message / occasion / effect) that
persists a card and emits a shareable `/c/<token>/` link, with cookieless analytics
and the "Make one for someone you love →" CTA baked into every card. Hand the maker
link to a **controlled cohort** (long-distance couples + college students) and read a
mechanical go/no-go on whether the craft converts recipients into senders (verified
organic propagation).

Runs on **100% free tiers**. Everything paid (backups, paid email, public-scale
moderation/CSAM) and everything in the loop machinery (accounts, the synced library,
the anonymous→account merge, device-local shelf) is **explicitly out of this phase**
— deferred to later phases / a "go public" gate.

</domain>

<decisions>
## Implementation Decisions

### Card storage & sharing
- **D-01:** Persist created cards in **Supabase (free tier)** — a `cards` row keyed
  by a short token (nanoid), with the photo in a **Supabase Storage** free bucket at
  an unguessable path. The recipient view is `/c/<token>/`. Rationale: the card has a
  photo, so pure URL-encoding hits a wall immediately (photos can't ride in a URL, and
  long URLs unfurl badly); Supabase free gives clean short links + real photo hosting
  at **$0**, and it is the *actual Stage-1 stack on its free tier* (no throwaway work).
  The read path for `/c/<token>/` must stay simple and must not depend on anything
  paid. Sends stay inside the controlled cohort, so **no moderation build yet**.
  (Pure URL-encoding and per-card static deploys were both rejected.)

### "Engaged" metric definition (the denominator)
- **D-02:** Fire `card_engaged` when the recipient **reaches the bottom of the
  message**; fallback = **≥8s visible/open dwell** for cards whose note is too short to
  scroll. Dedupe per `card_id`/session. **Reduced-motion sessions are tagged and
  EXCLUDED** from the craft-conversion denominator (they never see the animation the
  test is about). This **replaces the existing blind ~1500ms `setTimeout` "finish"**
  (see `.planning/codebase/CONCERNS.md` issue 1) — that timer measured "tapped and
  didn't bounce," not "experienced the craft."

### Go/no-go thresholds (pre-committed, in writing, before card #1)
- **D-03:** Read on a **~30-day rolling window, minimum 10 engaged recipients.**
  - **KILL** — zero verified organic propagation across the cohort, **or** the
    finish→send rate's upper 95% bound is below ~15%.
  - **ITERATE** (one round only) — tripwire alive but ≤1 verified propagation.
  - **CONTINUE / build Stage 1** — **≥2 independent verified organic-propagation
    events** (2 distinct chains: 2 distinct *non-recruited* people who each received
    AND made their own card).
  - Decision computed **mechanically** from those two inputs; secondary metrics are
    descriptive only. Thresholds + the exact metric definitions are written into the
    ledger header and timestamped **before** the first card ships.

### Maker v1 scope (kept deliberately tiny)
- **D-04:** **Occasions** = 3 presets — *just-because*, *thinking-of-you*, *birthday*
  (covers both beachheads). Same template; cover title swaps; the birthday milestone
  medallion is hidden for the non-birthday occasions. **No distinct per-occasion art
  yet.** **Customizable** = recipient name · 1 photo · message · signoff · occasion ·
  effect choice. **Effects** = the **existing hand-coded canvas effects only**
  (hearts/glitter + 1–2 variants) — **no premade video/animation overlays in v1**.
  **1–2 theme presets**, not a full palette picker.

### Claude's Discretion
Left to research/planning, grounded in the Stage-0 spec: exact token length/alphabet
(nanoid), the precise Supabase `cards` schema + RLS policy for the public read, photo
upload/resize handling, tuning the dwell threshold (8s is a starting point), the
create-form UI/layout, and the exact PostHog event names/properties. Also: whether the
`/c/<token>/` page inlines the card JSON server-side or fetches it client-side from
Supabase — prefer whichever keeps first paint instant (the spec leans toward inlining).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The Stage 0 plan (primary)
- `docs/obsidian/Stage-0-Concierge-Test.md` — the full, hardened spec: the metric
  model (§2), the pre-committed decision rule (§3), the maker + analytics + CTA, the
  generation-tree ledger, and the verified-propagation requirements. **This is the
  spec for this phase.**
- `docs/obsidian/Roadmap.md` — the staged plan and the "go public" gate framing.

### Architecture & cost (for the maker's data model + effects)
- `docs/obsidian/App-Architecture-and-Backend.md` §3 — the card model + the "Effect
  types" taxonomy (hand-coded canvas vs. premade overlay vs. per-card generation).
- `docs/obsidian/App-Architecture-and-Backend.md` §8 — cost model ($0 at this stage;
  paid floor deferred to go-public).

### Audience / cohorts (for recruiting + the occasion presets)
- `docs/obsidian/Market-Research-and-GTM-Assessment.md` — beachhead segments (LD
  couples + college students), the de-seasonalization thesis.

### The existing code to wrap
- `index.html` — the canvas engine being wrapped by the maker (do not rewrite it; wire
  the maker + analytics + CTA around it).
- `.planning/codebase/CONCERNS.md` — known issues, esp. the blind 1500ms "finish"
  timer (D-02 fixes this) and `Math.random()` non-determinism (a Phase 2 concern, not
  required for Stage 0).
- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md` — engine
  structure, entry points, where the personalization slots live.
- `.planning/codebase/CONVENTIONS.md` — project rules, esp. the **ZERO em-dash rule**
  on card content (enforced by a grep in `HANDOFF.md`).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `index.html` canvas engine: `openCard()`, the `tick()` animation loop, the
  burst/emoji/petal particle functions, and the existing personalization slots
  (recipient name, photo, message, signoff, cover title, milestone medallion). The
  maker drives these from form input rather than hand-edits.
- The existing **replay-reveal `setTimeout` (~line 888)** is where the CTA is revealed
  (timer is fine for *showing* the CTA), and the existing **`atBottom()` / `.read`
  tracking (~lines 589–600)** + the **`visibilitychange` handler (~line 910)** are the
  hooks for the D-02 `card_engaged` event.

### Established Patterns
- Single self-contained file, vanilla HTML/CSS/JS, no build, CSS custom properties for
  theme. The maker should preserve this lightness on the recipient view (no heavy SPA).
- **ZERO em-dashes** in any card content (validated by grep — `CONVENTIONS.md`).
- `prefers-reduced-motion` is handled in-engine (today it *suppresses* the celebration;
  composing a finished still is a Phase 2 fix, not required for Stage 0).

### Integration Points
- The maker writes a `cards` row + uploads the photo to Supabase (free); `/c/<token>/`
  reads it and feeds the engine. PostHog events (`card_opened`, `card_engaged`,
  `cta_clicked`) wire into `openCard()` / the engaged hooks / the CTA. The CTA carries
  `?ref=<card_id>` into the maker for generation attribution.

</code_context>

<specifics>
## Specific Ideas

- CTA in the card's own voice (Caveat font, rose, single underline): "Make one for
  someone you love →", and it drops the recipient straight into the same maker.
- The **Google Sheet ledger is the source of truth** for the generation tree; PostHog
  is corroboration (analytics can be blocked on some iOS/ad-blockers).
- Propagation is only counted when **verified**: a gen-1 requester arrived via a
  tracked `ref` to a gen≥1 card AND names/pastes the card sent to them (self-report is
  "soft" evidence only); the ≥2 events must be 2 distinct chains.

</specifics>

<deferred>
## Deferred Ideas

- **Premade video/animation effect overlays** (the "AI video effect" sense) — a
  Stage-1+ craft addition (App-Architecture §3 "Effect types"); not in maker v1.
- **Distinct per-occasion cover art** — reuse one template now; revisit if engagement
  differs by occasion.
- **Accounts, the synced library, the device-local shelf, the anonymous→account
  merge** — Phase 3 (Editor, Share & Received Library).
- **Deterministic seeded engine, version pinning, inlined-JSON frictionless open,
  self-hosted fonts** — Phase 2 (Deterministic Engine & Frictionless Open). Stage 0
  tolerates `Math.random()` and the current font loading.
- **Moderation/CSAM, send rate-limiting, paid email, backups, GDPR delete/export, age
  screen, monitoring** — Phase 4 (the "go public" gate). Not needed while the cohort
  is controlled.
- **Gifting (Tremendous), Stripe, premium effects, the shared couple shelf, native
  app** — Stage 2.
- **Server-side `ref` attribution hardening** (client `ref` can drop across
  webview/magic-link hops) — relevant once public sharing scales; for the Stage-0
  controlled cohort, client `?ref=` + the "who sent you this?" form field suffice.

None of these are in Phase 1 scope — discussion stayed within the validate-the-loop
boundary.

</deferred>

---

*Phase: 1-Validate the Loop*
*Context gathered: 2026-06-29*
