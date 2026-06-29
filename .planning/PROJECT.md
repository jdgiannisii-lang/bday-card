# Birthday Card App

## What This Is

A build-your-own animated greeting-card web app. A sender hand-crafts a tasteful,
non-templated animated card (a `<canvas>` particle/effect engine — not cheesy
template/AI slop) and shares it as a link/QR. The recipient opens it in any
browser with **zero friction** (no signup, no install, ever), and can become a
sender in the same session. Beachhead: long-distance couples **and** college
students sending to family. Today it exists as a single polished `index.html`;
this project turns it into the real product.

## Core Value

The recipient's open is sacred: a beautiful card that plays instantly in any
browser with zero friction, where every recipient can become a sender in the
same session (the viral loop). If everything else fails, that must work.

## Business Context

- **Customer**: People who are apart — long-distance couples; college students sending to parents/family (the parent who receives has the wallet).
- **Revenue model**: The card is free (the wedge + the loop); revenue is gifting attach (digital gift cards) + premium effects + an annual power-sender sub. Not per-card.
- **Success metric**: Recipient→sender conversion (the viral coefficient / K-factor) — gated first by verified organic propagation in the Stage 0 concierge test.
- **Strategy notes**: Full strategy in `docs/obsidian/` — `Roadmap.md`, `App-Architecture-and-Backend.md`, `Stage-0-Concierge-Test.md`, `Market-Research-and-GTM-Assessment.md`, `Initial-Recommendations.md`. Codebase map in `.planning/codebase/`.

## Requirements

### Validated

<!-- Shipped and confirmed working (existing index.html). -->

- ✓ Single-file animated birthday card: closed card with beating heart that flips open on tap into a hearts/glitter/confetti `<canvas>` celebration — existing (`index.html`)
- ✓ Three personalization slots (recipient name, photo, message) editable in-file — existing (`index.html`)
- ✓ `prefers-reduced-motion` support and responsive phone/desktop layout — existing (`index.html`)
- ✓ Deployed publicly via GitHub Pages (`.github/workflows/deploy-pages.yml`) — existing

### Active

<!-- Current scope. Hypotheses until shipped and validated. Coarse = staged. -->

**Stage 0 — Validate the loop (concierge, ~no new code):**
- [ ] Instrument the existing `index.html` with one analytics tool (PostHog) and an engagement-gated "finished" event (not the blind ~1500ms timer)
- [ ] Add a post-animation "Make one for someone you love →" CTA linking to a Tally intake form
- [ ] Deploy per-recipient cards at unique trackable URLs (`/c/<id>/`); static OG meta for link unfurls
- [ ] Run the concierge test across both cohorts (couples + campus) with a pre-committed, mechanically-read decision rule; honest go/no-go = verified organic propagation

**Stage 1 — Build the wedge (only if Stage 0 clears):**
- [ ] Port the craft into a deterministic (seeded PRNG) versioned canvas engine that powers both play and the in-session editor
- [ ] Frictionless `/c/:token` open (card JSON inlined into edge HTML; self-hosted fonts; zero blocking round-trips)
- [ ] Editor + send (short token, link + QR, dynamic per-card OG)
- [ ] The received-cards library (device-local IndexedDB shelf → "Keep this forever?" → synced library) with the anon→account merge done correctly (claim by card token; handle linkIdentity redirect)
- [ ] Trust-and-safety/ops floor before public traffic: image moderation + CSAM reporting, send rate-limiting, email deliverability, backups, ToS/Privacy/AUP, GDPR delete/export, age screen, error + uptime monitoring

**Stage 2 — Monetize & expand (only if Stage 1 retains):**
- [ ] Gifting attach (Tremendous) + Stripe (premium effects + annual sub)
- [ ] AI as a priced upsell / generate-once-reuse only
- [ ] Shared couple shelf; email/SMS + PWA re-engagement; expand occasions

### Out of Scope

- Native mobile app — deferred to a Stage-2 habit surface for proven repeat senders only; install friction leaks the viral loop
- iMessage extension (GamePigeon model) — Apple-only + iMessage-only breaks the cross-platform "any browser" wedge; store gives no distribution
- Per-card AI video baked into every card — margin killer ($0.14–$3.75/clip can exceed the price); only ever a ≥3×-cost upsell or generate-once-reuse
- Charging $1/card — Stripe's $0.30 fixed fee kills micro-sales and users are trained on free e-cards; monetize gifting + effects + sub instead
- A heavy SPA framework on the recipient view — would tax the friction-free open; the share route stays lean/edge-served

## Context

- **Existing code**: One ~33KB self-contained `index.html` (vanilla HTML/CSS/JS, no build, no deps, no tests). Canvas engine in an IIFE with `openCard()`, `tick()`, seeded-particle functions. See `.planning/codebase/`.
- **Stack decided for the real app**: React on Cloudflare + Supabase + Cloudflare R2 + PostHog (Cloudflare free tier allows commercial use w/ unlimited egress; Vercel Hobby does not). React chosen for solo-founder velocity; SvelteKit is the runner-up.
- **Prior research**: Extensive — a multi-agent market/architecture research pass + adversarial critique, all captured in `docs/obsidian/`. Do not re-derive; read those.
- **Known issues to address (from `.planning/codebase/CONCERNS.md`)**: animation "finish" is a blind 1500ms timer (not real engagement); engine uses `Math.random()` (not seeded/deterministic — blocks reproducible OG previews + library re-open); render-blocking Google Fonts; reduced-motion suppresses the celebration rather than composing a finished still.
- **Stage**: Pre-build, Stage 0 validation. The #1 unknown is whether the craft converts recipients into senders.

## Constraints

- **Team**: Solo founder — velocity is the scarcest resource; prefer the known stack (React + Supabase) and managed/free tiers.
- **Tech stack**: Web-first, one codebase, edge-served; recipient view must paint with zero blocking network calls and require no auth.
- **Budget**: Marginal cost per card ≈ $0 (deterministic canvas + premade reusable effects; free sends fuel the loop). Build + controlled-cohort test run on free tiers at ~$0/mo; the ~$30–80/mo paid floor (Supabase Pro backups + paid email + public-scale moderation) turns on only at a "go public" gate, not at startup.
- **Content rule**: ZERO em-dashes in card content (HANDOFF.md — the #1 AI tell; validated by grep). Hold the taste line: handcrafted, never cheesy.
- **Legal**: User-uploaded photos + anonymous sends → image moderation + CSAM reporting (18 USC 2258A) are mandatory before public traffic, not optional.
- **Sequencing**: Each stage is a gate, not a date. Don't build Stage 1 until Stage 0's K-factor clears a pre-committed threshold.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Validate-first (Stage 0 concierge before building) | The loop is the one unknown that gates everything; cheap to test manually | — Pending |
| College students as a co-primary beachhead | De-seasonalizes occasion demand (parent birthdays land on all 365 days); dense, fast campus recruiting | — Pending |
| React on Cloudflare + Supabase + R2 + PostHog | Commercial-OK free tier, unlimited egress, founder's stack, zero-egress photo storage | — Pending |
| Three-layer engine/content/photo split + per-card engine version pin | Old shared cards play forever; ~0 marginal cost; one engine powers play + editor | — Pending |
| Identity as a deferred ladder; viewing never gated | Protects zero-friction wedge; anon session deferred to save-intent | — Pending |
| Gifting (not the card) is the revenue | Users trained on free e-cards; gifting/attach is where money is | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Business Context check — customer, revenue model, success metric still accurate?
4. Audit Out of Scope — reasons still valid?
5. Update Context with current state

---
*Last updated: 2026-06-29 after initialization*
