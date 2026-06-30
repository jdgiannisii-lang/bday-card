# Roadmap: Birthday Card App

## Overview

This roadmap follows the founder's staged bet: **prove the loop cheaply, then build the
wedge.** It opens with a Stage 0 concierge validation that instruments the existing
`index.html` and reads a pre-committed go/no-go on verified organic recipient-to-sender
propagation. Only if that gate clears do the Stage 1 wedge phases run: a deterministic
engine that powers the sacred zero-friction open, the create/share/library loop that lets a
recipient become a sender in the same session, and a Trust/Safety/Ops floor that must close
before any public traffic. Stage 2 monetization (gifting, Stripe, expansion) is intentionally
deferred and tracked as v2 (MON/EXP), not in this roadmap.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Validate the Loop** - Stage 0 concierge test on the existing card; a mechanically-read go/no-go GATE on verified organic propagation (completed 2026-06-30)
- [ ] **Phase 2: Deterministic Engine & Frictionless Open** - Port the craft into a seeded, versioned canvas engine that paints `/c/:token` instantly with zero blocking calls
- [ ] **Phase 3: Editor, Share & Received Library** - Create/personalize, share by link + QR, capture to a device shelf, save to a synced library, and send one back in-session
- [ ] **Phase 4: Trust, Safety & Ops Floor** - The non-optional pre-public-traffic GATE: moderation/CSAM, rate-limiting, email deliverability, backups, legal, monitoring

## Phase Details

### Phase 1: Validate the Loop

**Goal**: Produce one honest go/no-go number on whether the craft converts recipients into senders, by building a thin self-serve card maker on the existing engine and handing its link to a controlled cohort — on 100% free tiers, with the paid floor deferred to a later "go public" gate (Stage 0).
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: VAL-01, VAL-02, VAL-03, VAL-04
**Success Criteria** (what must be TRUE):

  1. A recruited recipient opening a concierge card fires `card_opened`, `card_engaged` (gated on note-bottom OR meaningful dwell, deduped, reduced-motion sessions excluded), and `cta_clicked` events to one cookieless analytics tool
  2. After the animation settles, a "Make one for someone you love" CTA appears in the card's own voice and drops the recipient into the same self-serve maker (carrying `?ref=<card_id>` for attribution) — no per-card hand-fulfillment
  3. Each card the maker emits is live at its own obscure-slug URL (`/c/<token>/`) and unfurls a beautiful static OpenGraph preview when shared in iMessage/WhatsApp/SMS; sends stay within the controlled cohort (no public exposure → no moderation build yet)
  4. The concierge test has run across both cohorts (couples + college) with a decision rule pre-committed in writing before card #1, read mechanically on a ~30-day rolling window over a minimum of 10 engaged recipients
  5. The pre-committed rule yields a mechanical KILL / ITERATE / CONTINUE decision, where CONTINUE requires at least two independent verified organic-propagation events (two distinct non-recruited people who each received and requested their own)

**Plans**: 3/3 plans complete
Plans:

- [x] 01-01-PLAN.md (Wave 1) Walking Skeleton: Supabase + create form + /c/<token>/ open playing the engine (VAL-01, VAL-03; D-01, D-04)
- [x] 01-02-PLAN.md (Wave 2) Cookieless analytics, D-02 engaged-gating, and the CTA loop-close with ref attribution (VAL-01, VAL-02; D-02, D-03)
- [x] 01-03-PLAN.md (Wave 3) Maker hardening (validation, photo downscale, QR, copy) + the pre-committed decision ledger (VAL-03, VAL-04; D-03)

**UI hint**: yes

> GATE: This phase carries a pre-committed kill/continue decision. Phases 2-4 are conditional
> on a CONTINUE (Stage 0 clears its threshold). A KILL means change the audience or the loop,
> not build Stage 1.

### Phase 2: Deterministic Engine & Frictionless Open

**Goal**: Refactor the `index.html` craft into a reusable, deterministic, version-pinned canvas engine and serve the recipient's open with zero blocking network calls, so the same card renders identically everywhere and the sacred open stays friction-free.
**Mode:** mvp
**Depends on**: Phase 1 (Stage 0 CONTINUE)
**Requirements**: ENG-01, ENG-02, ENG-03, ENG-04, SHR-04
**Success Criteria** (what must be TRUE):

  1. The same card replays pixel-identically on every open (same device or different) because all randomness routes through a seeded PRNG keyed by `card.seed`, replacing every `Math.random()` call
  2. One engine module drives both card playback (`engine.play`) and the in-session editor (`engine.edit`), with no second rendering codebase
  3. A `prefers-reduced-motion` recipient sees a composed finished still (photo + full message + signoff settled) via `engine.renderStaticFrame`, not a suppressed animation
  4. A card is stored as small content JSON plus a pinned `engineVersion`, so an already-sent card keeps playing against its original engine forever
  5. Opening `/c/:token` paints the craft with no signup, no install, and no blocking round-trip: card JSON is inlined into the edge HTML and fonts are self-hosted (no render-blocking Google Fonts)

**Plans**: TBD
**UI hint**: yes

### Phase 3: Editor, Share & Received Library

**Goal**: Deliver the full recipient-to-sender loop in one session: a sender personalizes and shares a card; a recipient opens it, it lands on their shelf, they save it to a synced library without a password, and they send one back.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: SHR-01, SHR-02, SHR-03, LIB-01, LIB-02, LIB-03, LIB-04
**Success Criteria** (what must be TRUE):

  1. A sender can create and personalize a card (recipient name, photo, message, effect/theme) in a browser editor and finish with a short shareable link and a scannable QR code
  2. A shared link renders a beautiful per-card preview when unfurled in iMessage/WhatsApp/SMS
  3. On open, the card is captured to a device-local shelf keyed by `card_token` with zero identity required, and re-opens replay the real engine offline
  4. After the card plays, a recipient can save it to a synced library via one-tap Apple/Google or an email magic-link (never a password form)
  5. Locally-saved cards migrate into the account on sign-in with none lost (claim-by-card-token, correctly handling the `linkIdentity`-already-linked redirect), and a recipient can become a sender ("send one back") in the same session

**Plans**: TBD
**UI hint**: yes

### Phase 4: Trust, Safety & Ops Floor

**Goal**: Close every non-optional ship-blocker so the app can take public traffic safely and legally: image moderation and CSAM reporting, send abuse-guarding, deliverable email, recoverable data with delete/export, and error/uptime monitoring.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: OPS-01, OPS-02, OPS-03, OPS-04, OPS-05
**Success Criteria** (what must be TRUE):

  1. An uploaded photo is screened for NSFW and CSAM before a card can be sent, and the public view carries a one-tap report link plus an instant takedown kill-switch that unpublishes a token
  2. Sends are rate-limited and abuse-guarded (open-relay/spam/harassment protection) while viewing stays unthrottled, with identity-on-first-send enforced server-side
  3. Magic-link and transactional email deliver at scale from a dedicated sending domain with SPF, DKIM, and DMARC aligned on a paid tier
  4. A user can delete and export their own data, and Postgres is backed up and test-restored (GDPR/CCPA-compliant), with an age screen at create/send
  5. Errors and uptime are monitored across the client canvas engine (by browser), edge functions, and the `/c/:token` route

**Plans**: TBD

> GATE: This phase is a pre-public-traffic checklist. Several criteria are legal ship-blockers
> (CSAM reporting under 18 USC 2258A, moderation, backups, ToS/Privacy/AUP). Public launch is
> blocked until all five criteria are TRUE.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Validate the Loop | 3/3 | Complete   | 2026-06-30 |
| 2. Deterministic Engine & Frictionless Open | 0/TBD | Not started | - |
| 3. Editor, Share & Received Library | 0/TBD | Not started | - |
| 4. Trust, Safety & Ops Floor | 0/TBD | Not started | - |

---

## Coverage

✓ All 21 v1 requirements mapped to exactly one phase (no orphans, no duplicates)
✓ v2 requirements (MON-01..03, EXP-01..03) intentionally deferred to Stage 2 — not in this roadmap

| Phase | Requirements | Count |
|-------|--------------|-------|
| 1. Validate the Loop | VAL-01, VAL-02, VAL-03, VAL-04 | 4 |
| 2. Deterministic Engine & Frictionless Open | ENG-01, ENG-02, ENG-03, ENG-04, SHR-04 | 5 |
| 3. Editor, Share & Received Library | SHR-01, SHR-02, SHR-03, LIB-01, LIB-02, LIB-03, LIB-04 | 7 |
| 4. Trust, Safety & Ops Floor | OPS-01, OPS-02, OPS-03, OPS-04, OPS-05 | 5 |
| **Total** | | **21** |
