# Stage 0 — The Concierge Test (concrete spec)

A runnable, ~no-engineering, ~$0 experiment to answer the one question that
gates everything: **does the craft actually convert recipients into senders?**
Expansion of the Stage 0 section in [[Roadmap]]; uses the existing `index.html`.

> Synthesized from a multi-agent design pass (metric, instrumentation,
> recruiting, fulfillment) **plus** a validity critic and a pragmatism critic.
> The critics materially changed the design — this doc is the *hardened*
> version, with the most important corrections called out in **§4**. Where a
> raw idea was wrong, only the fixed version appears here.

---

## TL;DR

- **Run it manually.** Hand-build personalized cards on the existing
  `index.html`, deploy each to its own URL, and fulfill every "make one too"
  request by hand. No app, no backend, no accounts.
- **Two cohorts in parallel:** long-distance couples *and* college students
  (campus recruiting is faster and tests the de-seasonalized family-send angle —
  see [[App-Architecture-and-Backend]] context and the audience note below).
- **One analytics tool: PostHog free.** Not three. The Google Sheet **ledger is
  the source of truth**, analytics is corroboration.
- **The honest metric is NOT "did they click."** Clicks are vanity here
  (recipients are recruited, sends are hand-fulfilled). The real go/no-go is
  **verified organic propagation**: a person you did *not* recruit receives a
  card and requests their own.
- **Pre-commit the decision rule in writing before card #1**, read it
  mechanically on a ~30-day window, cap iteration. This is what keeps the number
  honest.
- **Cut the scope:** ~10 gen-0 cards over 2–3 weeks, not 15–20 in a week. One
  founder cannot recruit + build + fulfill at the higher rate while holding a
  24h turnaround.

---

## 0. Day-0 setup (half a day, all free)

1. **Hosting — already cleared.** The repo (`jdgiannisii-lang/bday-card`) is
   **public** and GitHub Pages is **live** at
   `https://jdgiannisii-lang.github.io/bday-card/`, serving from the branch
   root — so `/c/<card_id>/` subfolders will serve automatically. *(An earlier
   note worried the repo was private; it isn't. One real caveat: cards carry a
   real photo + intimate message on a public, guessable-ish path. Use obscure
   slugs (`c/mia-7f3/`) and accept it for a concierge test, or host on Netlify
   Drop / Cloudflare Pages for unlisted links if a recipient is uneasy.)*
2. **Analytics — PostHog Cloud free** (1M events/mo, cookieless, free forever,
   supports the multi-step funnel). Create a project, grab the `phc_…` key.
   *Drop GoatCounter (no funnels on free) and Plausible (30-day trial then
   paid) — pick one tool.*
3. **Request form — Tally (free).** Tally free **does** include file uploads
   (≤10MB) in 2026, so use a real photo-upload field. Fields in **§5.2**. Turn
   on email-on-submit. Tally's native submission count is the backstop truth for
   requests (analytics gets blocked on some iOS/ad-blockers).
4. **The ledger — one Google Sheet** ("Card Ledger"). This is the **source of
   truth** for the decision. Schema in **§5.3**. **Paste the pre-committed
   decision rule (§6) into the header and timestamp it before you send card #1.**
5. **A `_template/` card folder, built once** with the PostHog snippet + CTA
   baked in and the edit slots marked, so each card is a 12–15 min copy-edit.

---

## 1. The instrumented card (concrete edits to `index.html`)

Make these edits **once** in `_template/index.html`; every per-card copy
inherits them.

**(a) PostHog snippet** — paste before `</head>`, cookieless config:

```js
posthog.init('phc_YOUR_KEY', {
  api_host: 'https://us.i.posthog.com',   // or eu
  persistence: 'memory', disable_persistence: true,   // cookieless
  autocapture: false, capture_pageview: false, disable_session_recording: true,
  person_profiles: 'always'
});
```

**(b) Read the card id from the folder path** (near top of the IIFE):

```js
var CARD_ID = (location.pathname.match(/\/c\/([^\/]+)\/?/) || [])[1] || 'unknown';
var GENERATION = new URLSearchParams(location.search).get('g') || '0';
if (window.posthog) posthog.register({ card_id: CARD_ID, generation: GENERATION });
var track = function (n, p) { if (window.posthog) posthog.capture(n, p || {}); };
```

**(c) Four events — but note the corrected "finish" (this is the key fix):**

| Event | Fires when | Role |
|---|---|---|
| `card_opened` | card tapped open (in `openCard()`) | leading indicator |
| `animation_done` | the existing ~1500ms replay-reveal timer | leading indicator only — **NOT the denominator** |
| `card_engaged` | **reached the bottom of the note** (`atBottom()`/`.read`, already computed ~lines 589–600) **OR** ≥8s visible dwell (reuse the `visibilitychange` handler ~line 910), fired **once** | **the honest denominator** |
| `cta_clicked` | "Make one…" tapped | intent |

Why: the raw design fired "finished" on a blind 1.5s timer on first tap — that
counts "tapped and didn't close the tab," not "experienced the craft." We gate
the denominator on actually reading the note or a real dwell, dedupe per
`card_id`, and **tag/`exclude` reduced-motion sessions** (they never see the
animation the test is about).

**(d) The CTA** — revealed after the animation settles (the 1500ms timer is fine
for *showing* it), styled in the card's own voice (Caveat font, rose, single
underline — not a growth-hack button):

```
Make one for someone you love →
   I'll hand-make it. Free.
```

It links to the Tally form and appends `?ref=<card_id>&g=<generation>` on click
so a downstream request is attributable to the card that spawned it.

**(e) Static OpenGraph meta** in `<head>` (one fixed `og:image`, absolute https)
so the hand-sent link unfurls nicely in iMessage/WhatsApp — crawlers don't run
JS, so this must be static.

**(f) Per-card deploy:** copy `_template/` → `/c/<card_id>/`, drop in
`photo.jpg`, hand-edit the slots, commit/push → live at
`…github.io/bday-card/c/<card_id>/`.

**Pre-send checklist (in the ledger header):** ① name in `<title>` + greeting
② photo dropped + cropped ~3:4 ③ **message has ZERO em-dashes** (project rule,
HANDOFF.md — `grep -c $'\xe2\x80\x94' index.html` must print 0) ④ `card_id` set
⑤ CTA → Tally form ⑥ open the live URL on a phone, confirm it renders + the CTA
appears after the animation.

---

## 2. The metric model (hardened)

### Two tiers, deliberately separated

- **Tier 1 — gen-0 finish→send (a TRIPWIRE, not the go/no-go).** Of recruited
  recipients who *engage* (denominator = `card_engaged`, deduped, from the
  ledger), how many actually got a card sent onward? This is **saturated by
  bias** (we recruited them, we hand-built it, we asked them to share), so a high
  number proves little — but a near-zero number is a kill signal.
- **Tier 2 — verified organic propagation (THE go/no-go).** A person we did
  **not** recruit receives a card and requests their own. This is the only thing
  that evidences a loop exists.

### The corrections that make it honest (from the validity critic)

1. **Denominator = engaged, not a timer** (see §1c).
2. **Demote Tier 1 to a tripwire.** Always report it **split by channel**
   (warm / community-DM / cold-TikTok-or-campus); only the **cold-channel** rate
   estimates craft-driven intent. The CONTINUE decision rests on Tier 2, never on
   a gen-0 rate.
3. **Add cheap control arms** (no engineering):
   - **Priming control:** for ~⅓ of senders, deliver it purely as a gift —
     drop the word "experiment" and never ask "who'd you send it to?" A big gap
     vs. the primed group = demand characteristics are inflating the number.
   - **Friction probe (concierge confound):** for a subset, when they request,
     reply *"here's how you'd make one"* (point at the template) instead of
     hand-building. The drop from "I'll make it free" to "you make it" estimates
     how much the concierge is overstating.
   - **Tie-strength:** mandatory — include weak-tie couples/recipients, tag tie
     strength, report Tier 1 by it.
4. **Verify propagation, don't take self-report.** A gen-1 event counts toward
   the gate only if the new requester (a) arrived via a tracked CTA whose `ref`
   traces to a gen≥1 card **and** (b) names/pastes the card that was sent to
   them, and it resolves. Self-reports are logged as *soft* evidence only. The
   2 events must be **2 distinct chains** from 2 distinct senders.
5. **Verify a "send" reached a real person.** Delivering a link to the requester
   ≠ a send. Count a real send only when corroborated by a `card_opened` from a
   **new device/geo** on that `card_id`, or recipient-side confirmation. (New
   ledger column: `recipient_opened`.)
6. **Sample + time honesty.** At n≈10–15 you cannot distinguish 15% from 30% —
   so use CI-aware language: **KILL only if the upper 95% bound is below ~15%**;
   **do not declare CONTINUE on a gen-0 rate at all.** Propagation stays
   **binary/qualitative**. And read on a **~30-day rolling window**, not Day 14 —
   gen-1 sends lag gen-0 receipt, so an early freeze biases toward a false KILL.
7. **Anti-p-hacking.** Decision computed mechanically from exactly two inputs
   (the propagation gate + the CI-aware kill check). Secondary metrics are
   descriptive only and may not rescue a KILL. **Cap at one ITERATE round** and a
   total recruited-N ceiling.

### Leading indicators (watch daily; never go/no-go alone)

Engagement rate (`card_engaged`/`card_opened`, healthy >60%), CTA rate, dwell,
unsolicited "how did you make this?" messages (log verbatim — 3+ is itself an
iterate-don't-kill signal), TikTok view→save on any organic post.

---

## 3. The decision rule (pre-commit this, verbatim, in the ledger header)

> **Read on day ~30 (rolling), minimum 10 engaged gen-0 recipients.**
>
> - **KILL** if the upper 95% bound of gen-0 finish→send is below ~15% **OR**
>   zero verified organic propagation across the cohort.
> - **ITERATE** (one round only — change copy / CTA timing / recipient mix) if
>   the tripwire is alive but there is ≤1 verified propagation event.
> - **CONTINUE / start Stage 1** only if there are **≥2 independent, verified
>   generational-propagation events** (2 distinct chains, 2 distinct
>   non-recruited people who each received *and* requested).
>
> Secondary metrics are descriptive only. No re-defining "success" after seeing
> data. Max one ITERATE round, then a non-continue is a kill/pivot.

The concierge K-proxy = (verified non-recruited gen-1 requesters) ÷ (engaged
gen-0 finishers) is reported **for color only** and is explicitly upper-biased
(we remove all send friction) — never annualized or compounded.

---

## 4. Recruiting (two cohorts, sender-first, bias-controlled)

**Recruit the SENDER, never the recipient.** The conversion we care about
happens to a person we never touched — that's the less-biased unit. Cap warm
network at ~50%; force several cold-origin senders as the bias control.

### Cohort A — long-distance couples
- **Channels:** warm friends-of-friends first; then *genuine 1:1 replies* to
  people who self-identify in LDR communities (r/LongDistance ~2.4M and its
  ~5.5k Discord, r/LDR ~89k, Loving-From-A-Distance, LDR Facebook groups) — **ask
  mods first, never cold-post** (Reddit's 90/10 rule); plus an **organic TikTok**
  (#longdistancerelationship ~20B views) as the cold, least-biased funnel.

### Cohort B — college students (parallel; campus = faster, denser)
- **Why:** ~5M away-from-home students, 50%+ homesick, ~13 contacts/week with
  family. They send to parents/grandparents/partners/siblings → **more
  send-occasions per person** and a reciprocal angle (the parent who receives has
  the wallet). And **"a student's parent has a birthday every single day"** —
  across the base that's ~26k–68k birthdays/day, which **de-seasonalizes** the
  occasion problem that kills these businesses. Measure recipient→sender
  conversion **split by recipient age/relationship** (parent vs. partner) — an
  older recipient converting to a *sender* in-browser is the riskiest link.
- **Channels:** campus subreddits (mod-permission), Greek life / club GroupMe &
  Discord, RAs / dorm events (peak-homesickness first-years), campus TikTok/IG,
  **flyers with a QR code** (the rare flyer that converts, because the wedge is
  "scan → instant card"), 1–3 student ambassadors.

### Outreach templates (gift-first, transparent, no upsell)
- **Warm DM:** *"Random one — I make little hand-animated cards (birthday /
  just-because) and I'm giving a few away free this week. Want one for [partner /
  your mom]? Send me their name, a line from you, and a photo and I'll send you a
  link to text them."*
- **Campus flyer (QR):** *"Miss home? 🏡 Send your family a free handcrafted
  animated card — they just tap a link. Made by a student, for students. Scan →
  first 50 this week are on me."*
- **1:1 reply (someone self-identifies):** *"This might be a nice surprise —
  I hand-make little animated cards and I'm giving some away free as an
  experiment. Send me their name + a sentence and I'll make one you can send.
  Totally fine to ignore!"*

**Consent line on the form (required checkbox):** *"I confirm I have permission
to use any photo I upload on a private, unlisted card page, and I understand
this is an early experiment."* Honor any takedown immediately.

---

## 5. Fulfillment ops (the manual loop)

### 5.1 The loop, per request
Email arrives → assign next `card_id` → copy `_template/` → `/c/<id>/` → save
photo (crop ~3:4, <1MB) → edit slots (name, message, signoff, cover title;
hide the milestone medallion for non-birthday occasions) → **em-dash check** →
commit/push → phone-QA the live URL → **send the link back to the REQUESTER to
forward themselves** (this *is* the recipient→sender behavior) → log the row.

**SLA: 24h** (a late "thinking of you" isn't one). ~12–18 min/card with the
template + checklist. **Cap concurrent open requests (~10)** so the SLA holds.

### 5.2 Intake form fields (Tally)
Your name · your email/phone · recipient's first name · your relationship
(partner/family/friend/…) · occasion (birthday/just-because/thinking-of-you/…) ·
the message · how it's signed · **photo upload** · **"who sent you this card?
paste the link"** (the generation key + propagation verification) · consent
checkbox · hidden `ref` field.

### 5.3 Ledger schema (Google Sheet — the source of truth)
`card_id · gen · channel(warm/dm/cold) · arm(primed/unprimed/friction) ·
tie_strength · sender · recipient · relationship · occasion · sent_at ·
engaged?(Y/N) · requested_own?(Y/N) · request_card_id(parent) · recipient_opened
(Y/corroborated-how) · gift_interest · library_interest · notes`

- `gen 0` = founder-recruited; `gen 1+` = requested by someone who *received* a
  prior card. Follow `request_card_id` back to reconstruct the tree.
- Unverifiable/ambiguous edges default to `recruited_by_founder = Y`
  (conservative).

### 5.4 Probe gifting + library intent (free, by hand)
In the send-back message, ask the two scripted questions and log them:
*"(1) want me to save all your cards in one place? (2) would you ever add a
little gift — a song, a $5 e-gift — to a card like this?"* ≥30% "yes" to either
is a signal worth carrying into Stage 2.

---

## 6. What this does and doesn't prove

- **Proves:** whether the craft, delivered with zero friction to real people,
  produces *verified organic* propagation — i.e. whether a loop can exist at all.
- **Does NOT prove:** the *magnitude* of K in a self-serve product (we remove all
  friction), willingness-to-pay, or retention. Those are later concierge probes
  and Stage 1/2 questions.
- **Biggest residual risk:** propagation may not mature inside the window, and
  forwards happen on channels we can't see — hence the ~30-day read, the
  verification requirements, and treating even *one* clean propagation as a
  strong keep-going signal.

---

## 7. Effort & timeline

- **Day 0:** ~half a day (PostHog + Tally + template edits + OG image + ledger +
  one dry-run card end-to-end).
- **Weeks 1–3:** recruit ~10 gen-0 senders across both cohorts (cap warm ≤50%,
  ≥4 cold); fulfill within 24h; ~30–60 min/day building + reading PostHog +
  updating the tree.
- **Day ~30:** freeze, compute the two decision inputs, write the kill / iterate /
  continue call against the pre-committed rule.

---

## 8. Open questions

- Final go/no-go threshold wording — confirm the CI-aware kill bound and the
  "2 independent chains" definition before card #1.
- Photo privacy on public Pages paths — obscure slugs vs. moving to
  Netlify/Cloudflare unlisted hosting for uneasy recipients.
- Does the QR-flyer campus channel actually convert (no benchmark — first flyer
  run is calibration)?
- Which occasion covers need to look visually distinct vs. reusing the birthday
  template (cheapest test: reuse, watch engagement by occasion).
- Reconcile the exact `card_engaged` definition (note-bottom vs. dwell) with what
  the current `index.html` already tracks — pick one in the dry run.
