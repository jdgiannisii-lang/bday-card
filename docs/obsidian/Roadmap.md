# Roadmap

A staged plan for the animated greeting-card app. Deliberately *not* very
specific yet — it's a sequence and a set of bets, with one hard gate up front.
Companion to [[App-Architecture-and-Backend]], [[Initial-Recommendations]], and
[[Market-Research-and-GTM-Assessment]].

> Grounded in a multi-agent research + critique pass (June 2026). The single
> most important conclusion from the critique: **most of the architecture is the
> right Stage-1 plan and the wrong Stage-0 move.** Validate the one unknown
> first.

---

## North star

> **The tasteful, zero-friction card layer for people who are apart** — launched
> to long-distance couples **and college students away from family**, grown on a
> recipient→sender loop, monetized through gifting, not the card.

**Two beachhead cohorts (parallel, not either/or):** long-distance couples
(high-cadence, symmetric, digital-native — the cleanest loop) and college
students (denser/faster to recruit, more send-occasions per person, and a
**de-seasonalizing** angle — across millions of students, parent/family
birthdays land on all 365 days, smoothing the seasonality that kills occasion
cards). Couples are largely a *subset* (many college relationships are
long-distance), so we don't choose. Note the riskiest link in the student
cohort: an older recipient (parent/grandparent) converting to a *sender*
in-browser — measure that explicitly.

## The one question that gates everything

**Does the craft actually convert recipients into senders?** (The viral
coefficient / K-factor.) Everything in Stage 1+ is worth building *if and only
if* this clears a threshold we commit to **before** looking at the data. If it
doesn't clear, the product as conceived doesn't have a loop, and no amount of
backend solves that.

So the roadmap is: **prove the loop cheaply → build the wedge → monetize.**

---

## Stage 0 — Validate (now; ~2–3 weeks; ~no new code)

The goal is one honest number. Do **not** build the app to get it.
**Full runnable spec: [[Stage-0-Concierge-Test]]** — the steps below are the
summary.

1. **Use the existing `index.html` as-is.** Hand-build ~10 personalized cards
   for *real* recipients across both cohorts — long-distance couples (r/LongDistance,
   LDR Discords, TikTok) **and college students** (campus subreddits, Greek life,
   RA/dorm events, flyers with a QR code). Each card = a static file at a unique
   URL. Recruit the *sender*, not the recipient (less bias).
2. **Add exactly two things:** one analytics snippet (PostHog, cookieless) and a
   single **"Make one for someone you love →"** button that appears *after* the
   animation finishes, pointing at a form the founder fulfills by hand.
3. **Also post the existing card as a TikTok/Reel** ("I built my girlfriend a
   card instead of buying one") — the artifact is the ad. Measure views, saves,
   and "how do I make this" comments.
4. **Measure one funnel:** of recipients who *finish* a card, how many click the
   CTA and actually request their own?
5. **Pre-commit a kill/continue threshold** (e.g. ≥X% finish→request, or a TikTok
   clip clearing ~50k views / waitlist >20%) *before* reading results, so the
   number stays honest.

**Everything is faked/concierge here:** card creation (founder hand-builds), the
"library" (a spreadsheet + "we'll email you your cards"), even gifting (manual
Tremendous dashboard send). All of it can be tested by hand before any code.

**Cost:** effectively $0. **Exit:** the loop number clears the pre-committed bar.

---

## Stage 1 — Build the wedge (only if Stage 0 clears)

Now the architecture in [[App-Architecture-and-Backend]] earns its keep. Build
the *thinnest* real product that delivers the wedge:

- **The real app:** React on **Cloudflare** + **Supabase** + **R2**. Migrate the
  card off GitHub Pages onto an edge host so per-card link previews unfurl
  beautifully (the preview is the ad). *Migrate on a subdomain, regression-test
  the craft against the current `index.html`, 301 old links, then cut DNS.*
- **Port the craft into the engine contract:** refactor `index.html` into a
  versioned, **deterministic** (seeded PRNG) canvas engine that powers *both*
  play and the in-session editor. Determinism ships **first** (the share preview
  depends on it). Make `renderStaticFrame` a real finished still for
  reduced-motion.
- **The frictionless open:** `/c/:token` paints with zero blocking network calls
  (card JSON inlined into the HTML; photos stream separately). Self-host fonts.
- **The editor + send:** create a card, short token, link + QR share, dynamic
  per-card OG preview.
- **The received library:** device-local IndexedDB shelf → "Keep this forever?"
  → synced server library. **Build the merge correctly** (claim by `card_token`,
  handle the `linkIdentity`-redirect case — see
  [[App-Architecture-and-Backend]] §5.3) and key local saves by token from day
  one so it's not a painful retrofit.
- **Loop instrumentation that survives the hops:** attribute every new send back
  to the card that spawned it, server-side (not just client storage).
- **The unglamorous-but-required layer** (see [[App-Architecture-and-Backend]]
  §7): image moderation + CSAM reporting, send rate-limiting, real email
  deliverability, backups, ToS/Privacy/AUP, GDPR delete/export, an age screen,
  Sentry + uptime. Several of these are ship-blockers before public traffic.

**Pricing in Stage 1:** unlimited free sends with a light watermark/effect cap.
Don't sell $1 cards (Stripe's $0.30 fixed fee kills micro-sales). Defer money.

**Exit:** retention shows a cohort (esp. couples) coming back and re-sending.

---

## Stage 2 — Monetize & expand (only if Stage 1 retains)

- **Gifting attach (the real revenue):** digital gift cards via **Tremendous**
  (self-serve, face value via ACH). No wholesale margin on self-serve rails →
  monetize via a transparent ~5–12% **service/handling fee**, not a hidden
  spread. Concierge-test the attach *rate* before building the integration.
- **Premium effects + annual power-sender sub** (~$24–36/yr) via **Stripe**
  Checkout + Billing.
- **AI as a priced upsell only:** generate-once-reuse backgrounds (Higgsfield
  Soul images ~$0.01, amortized to ~$0/card); per-card AI video *only* as an
  explicit ≥3×-cost upsell, never bundled (it's the one true margin killer).
- **The shared couple shelf** (live back-and-forth thread) — retention, not loop.
- **Re-engagement:** lead with **email/SMS** ("your partner sent you a card"),
  which is cross-platform; add a **PWA** (add-to-home-screen + offline library)
  and web push for the iOS cohort that installs.
- **Native app:** Stage-2-late, *only* for proven weekly senders, as a habit
  surface. Install-gate the habit, never the receipt.
- **Expand occasions:** couples → birthdays (>50% of everyday cards) → family
  Christmas (seasonal volume, library payoff).

---

## What NOT to build yet (explicit)

Inert until the loop is proven — defer all of these out of Stage 0, and most
out of early Stage 1:

- Anonymous Supabase auth on every view (use cookieless analytics + a
  localStorage token list instead at Stage 0)
- The merge / cross-device claim Edge Function (nothing to merge until accounts
  exist — just key local saves by `card_token` now)
- Renderer version-pinning machinery (keep the cheap data-model idea, drop the
  immutable-bundle hosting + contract-freeze CI until there's a v2 engine)
- Dynamic OG SSR (one static `og:image` in `index.html` unfurls fine for
  concierge sends)
- The couple shelf, Dexie offline sync, web push
- Stripe + Tremendous + any AI pipeline

---

## Cross-cutting gates (must be true before *public* traffic, whenever that is)

These aren't a stage — they're a checklist that blocks going public:
moderation/CSAM, send rate-limiting, email deliverability (SPF/DKIM/DMARC),
backups, ToS/Privacy/AUP, GDPR delete/export, age screen, error + uptime
monitoring. See [[App-Architecture-and-Backend]] §7.

---

## Key bets (the decision log)

- **Web-first, one codebase.** No native app or iMessage extension until Stage 2
  habit data justifies it.
- **Cloudflare + Supabase + R2 + React.** Commercial-OK free tier, the founder's
  existing stack, zero-egress photo storage.
- **Craft is deterministic and free; AI is a garnish.** Marginal cost per card
  ≈ $0 so free sends fuel the loop forever.
- **Gifting, not the card, is the revenue.** The card is the wedge and the loop.
- **Identity is a deferred ladder; viewing is never gated.**

---

## Honest cost floor by stage

| Stage | Monthly | Reality check |
|---|---|---|
| 0 (validate) | ~$0 | Static host + free analytics |
| 1 (wedge, pre-public) | ~$50–80 | Supabase Pro (backups) + Resend Pro + moderation are the real floor, not $0 |
| 1→2 (~1k–10k users) | ~$25–120 | Scales with DB/storage, not virality |

---

## Open questions / kill-switches

- **K-factor threshold** — define it *before* Stage 0 instrumentation.
- **TikTok pull** — if <10k views / low save rate, the craft may not differentiate
  as assumed; reconsider.
- **Will couples pay, and for what?** — premium effects vs. gifting vs. sub;
  concierge-test in Stage 2.
- **Daily-ritual hook?** — is there a habit (à la Paired/Lovebox), or is
  card-sending inherently episodic?
- **Both-iPhone share of the beachhead** — gates iOS web push vs. email/SMS.
- **Gifting attach rate + tolerable fee** — both unmodeled; test before building.

---

## Caveats

- This roadmap assumes Stage 0 produces a real, positive loop number. If it
  doesn't, the right move is to change the audience or the loop, not to build
  Stage 1 anyway.
- Stage boundaries are gates, not dates. Each stage's exit criterion must be met
  before the next is built.
- The architecture doc describes the *destination*; this roadmap describes the
  *order*. Don't read the destination as a Stage-0 to-do list.
