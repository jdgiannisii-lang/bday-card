# Requirements: Birthday Card App

**Defined:** 2026-06-29
**Core Value:** A beautiful card that plays instantly in any browser with zero friction, where every recipient can become a sender in the same session.

## v1 Requirements

Initial release = validate the loop (Stage 0), then build the wedge (Stage 1).
Each maps to a roadmap phase. Stage 1 requirements are gated on Stage 0 clearing
its pre-committed threshold.

### Validation (Stage 0 — concierge, ~no new app code)

- [x] **VAL-01**: The existing card fires analytics events (opened, engaged, CTA-clicked) via one cookieless tool, with "engaged" gated on real engagement (note read or meaningful dwell), not a fixed timer
- [x] **VAL-02**: A "Make one for someone you love →" CTA appears after the animation and links to an intake form the founder fulfills by hand
- [ ] **VAL-03**: Each concierge card is deployed at a unique, individually-trackable URL with static OpenGraph meta so shared links unfurl beautifully
- [ ] **VAL-04**: The concierge test runs across both cohorts (couples + college) with a decision rule pre-committed before the first card, read mechanically on a ~30-day window, with go/no-go resting on verified organic propagation

### Card Engine (Stage 1)

- [ ] **ENG-01**: The canvas craft is a reusable, deterministic (seeded PRNG) engine — the same card renders identically on every open
- [ ] **ENG-02**: One engine powers both card playback and the in-session editor (no second codebase)
- [ ] **ENG-03**: `prefers-reduced-motion` users get a composed finished still (full message + photo + signoff), not a suppressed animation
- [ ] **ENG-04**: A card is stored as small content JSON plus a pinned engine version, so already-sent cards play forever

### Create & Share (Stage 1)

- [ ] **SHR-01**: A sender can create and personalize a card (recipient name, photo, message, effect/theme) in a browser editor
- [ ] **SHR-02**: A finished card is shareable via a short link and a QR code
- [ ] **SHR-03**: A shared link renders a beautiful per-card preview when unfurled in iMessage/WhatsApp/SMS
- [ ] **SHR-04**: A recipient opens `/c/:token` instantly — no signup, no install, and no blocking network call before the craft paints

### Library & Identity (Stage 1)

- [ ] **LIB-01**: On open, the card is captured to a device-local shelf with zero identity required
- [ ] **LIB-02**: After the card plays, the recipient can save it to a synced library via one-tap Apple/Google or an email magic-link (never a password form)
- [ ] **LIB-03**: Locally-saved cards migrate into the account on sign-in with none lost (claim-by-card-token; handles the linkIdentity-already-linked redirect)
- [ ] **LIB-04**: A recipient can become a sender from the library ("send one back") in the same browser session

### Trust, Safety & Ops (Stage 1 — required before public traffic)

- [ ] **OPS-01**: Uploaded photos are screened (NSFW + CSAM) before a card can be sent, with a one-tap report link and an instant takedown kill-switch
- [ ] **OPS-02**: Sends are rate-limited and abuse-guarded (open-relay/spam/harassment protection); viewing stays unthrottled
- [ ] **OPS-03**: Magic-link and transactional email are deliverable at scale (SPF/DKIM/DMARC on a dedicated sending domain, paid tier)
- [ ] **OPS-04**: A user can delete and export their data, and data is backed up (GDPR/CCPA; recoverable Postgres)
- [ ] **OPS-05**: Errors and uptime are monitored — client canvas engine (by browser), edge functions, and the `/c/:token` route

## v2 Requirements

Deferred to Stage 2 (monetize & expand). Tracked, not in the current roadmap.

### Monetization

- **MON-01**: A sender can attach a digital gift card to a card (Tremendous), monetized via a transparent service fee
- **MON-02**: Premium effects and an annual power-sender subscription via Stripe (Checkout + Billing)
- **MON-03**: AI effects offered only as a priced upsell or generate-once-reuse asset (never per-card video by default)

### Re-engagement & Expansion

- **EXP-01**: Shared couple shelf — a live back-and-forth thread of sent/received cards
- **EXP-02**: Re-engagement via email/SMS ("your partner sent you a card") plus an optional PWA (add-to-home-screen + web push)
- **EXP-03**: Expand occasions from just-because → birthdays → family holidays

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native mobile app | Install friction leaks the viral loop; only a Stage-2 habit surface for proven repeat senders |
| iMessage extension (GamePigeon model) | Apple-only + iMessage-only breaks the cross-platform "any browser" wedge; store gives no distribution |
| Per-card AI video by default | Margin killer ($0.14–$3.75/clip can exceed the price); only ever a ≥3×-cost upsell or generate-once-reuse |
| Charging $1 per card | Stripe's $0.30 fixed fee kills micro-sales; users trained on free e-cards. Monetize gifting + effects + sub |
| Heavy SPA framework on the recipient view | Would tax the friction-free open; the share route stays lean and edge-served |

## Traceability

Every v1 requirement maps to exactly one phase. See `.planning/ROADMAP.md` for phase detail.

| Requirement | Phase | Status |
|-------------|-------|--------|
| VAL-01 | Phase 1: Validate the Loop | Complete |
| VAL-02 | Phase 1: Validate the Loop | Complete |
| VAL-03 | Phase 1: Validate the Loop | Pending |
| VAL-04 | Phase 1: Validate the Loop | Pending |
| ENG-01 | Phase 2: Deterministic Engine & Frictionless Open | Pending |
| ENG-02 | Phase 2: Deterministic Engine & Frictionless Open | Pending |
| ENG-03 | Phase 2: Deterministic Engine & Frictionless Open | Pending |
| ENG-04 | Phase 2: Deterministic Engine & Frictionless Open | Pending |
| SHR-04 | Phase 2: Deterministic Engine & Frictionless Open | Pending |
| SHR-01 | Phase 3: Editor, Share & Received Library | Pending |
| SHR-02 | Phase 3: Editor, Share & Received Library | Pending |
| SHR-03 | Phase 3: Editor, Share & Received Library | Pending |
| LIB-01 | Phase 3: Editor, Share & Received Library | Pending |
| LIB-02 | Phase 3: Editor, Share & Received Library | Pending |
| LIB-03 | Phase 3: Editor, Share & Received Library | Pending |
| LIB-04 | Phase 3: Editor, Share & Received Library | Pending |
| OPS-01 | Phase 4: Trust, Safety & Ops Floor | Pending |
| OPS-02 | Phase 4: Trust, Safety & Ops Floor | Pending |
| OPS-03 | Phase 4: Trust, Safety & Ops Floor | Pending |
| OPS-04 | Phase 4: Trust, Safety & Ops Floor | Pending |
| OPS-05 | Phase 4: Trust, Safety & Ops Floor | Pending |

**Coverage:**

- v1 requirements: 21 total
- Mapped to phases: 21 ✓
- Unmapped: 0
- v2 (MON-01..03, EXP-01..03): intentionally deferred to Stage 2, not mapped

---
*Requirements defined: 2026-06-29*
*Last updated: 2026-06-29 after roadmap creation (traceability mapped)*
