# Stage 0 Decision Ledger (pre-committed)

This is the pre-committed decision instrument for the Stage 0 concierge test
(CONTEXT D-03 / VAL-04). It carries the go/no-go rule, the reading window, the
verified-organic-propagation definition, the generation-tree column schema for the
Google Sheet, and the two-cohort plan.

The whole point of this document is that the decision is read **mechanically**, not
rationalized after the fact. The rule is only valid if it is committed in writing
and timestamped **before card #1 ships**. Fill in the header block below first.

ZERO em-dashes anywhere in this file (project rule). Use periods, commas,
parentheses, or hyphens.

---

## 0. Pre-commit header (fill this in BEFORE card #1)

Copy these exact thresholds into the Google Sheet header and timestamp them. The
timestamp is the commitment. If the thresholds are edited after the first card
ships, the test is no longer honest and the result is a KILL/pivot by default.

| Field | Value |
|-------|-------|
| Thresholds pasted into the sheet header | [ ] yes |
| Reading window | ~30-day rolling, minimum 10 engaged gen-0 recipients |
| KILL bound | upper 95% bound of gen-0 finish-to-send below ~15% OR zero verified propagation |
| ITERATE bound | tripwire alive but <= 1 verified propagation (one round only) |
| CONTINUE bound | >= 2 independent verified organic-propagation events (2 distinct chains) |
| Committed by | __________________ |
| Committed at (UTC timestamp, before card #1) | __________________ |
| Card #1 shipped at (UTC) | __________________ |

The commit timestamp MUST be earlier than the card #1 timestamp. Record both.

---

## 1. The decision rule (verbatim, pre-committed)

> Read on day ~30 (rolling), minimum 10 engaged gen-0 recipients.
>
> - **KILL** if the upper 95% bound of gen-0 finish-to-send is below ~15% OR
>   zero verified organic propagation across the cohort.
> - **ITERATE** (one round only, change copy / CTA timing / recipient mix) if the
>   tripwire is alive but there is <= 1 verified propagation event.
> - **CONTINUE / start Stage 1** only if there are >= 2 independent, verified
>   generational-propagation events (2 distinct chains, 2 distinct non-recruited
>   people who each received AND requested their own card).
>
> Secondary metrics are descriptive only. No re-defining "success" after seeing
> data. Max one ITERATE round, then a non-continue is a kill/pivot.

The decision is computed mechanically from exactly two inputs:

1. **The propagation gate** (count of verified, independent organic-propagation
   events; binary/qualitative, never annualized or compounded).
2. **The CI-aware kill check** (the upper 95% bound of the gen-0 finish-to-send
   rate).

No third input may rescue a KILL. Secondary metrics (engagement rate, CTA rate,
dwell, "how did you make this?" messages) are watched daily for color and as
iterate-don't-kill texture, but they do not move the go/no-go.

---

## 2. The reading window and the denominator

- **Window:** a ~30-day rolling window, read on or about day 30. Not day 14. gen-1
  sends lag gen-0 receipt, so an early freeze biases toward a false KILL.
- **Minimum sample:** at least 10 engaged gen-0 recipients before the rule is read
  at all. Below that, the result is "keep recruiting," not a decision.
- **The denominator is engaged, not a timer.** A recipient counts as engaged when
  `card_engaged` fires: they reached the bottom of the note (the engine `.read`
  hook) OR they accumulated >= 8 seconds of visible dwell, deduped per card_id /
  session. Reduced-motion sessions are tagged and EXCLUDED from the denominator
  (they never see the animation the test is about). This replaces the old blind
  ~1500ms timer (D-02).
- **CI-aware language:** at n around 10 to 15 you cannot distinguish 15% from 30%,
  so KILL only on the upper 95% bound being below ~15%. Do not declare CONTINUE on
  a gen-0 rate at all. CONTINUE rests solely on verified propagation.

---

## 3. Verified organic propagation (the definition that gates CONTINUE)

A gen-1 event counts toward the gate only when ALL of the following hold:

1. The new requester arrived via a tracked CTA whose `ref` traces back to a
   gen >= 1 card (the analytics `ref_card_id` / `generation` edge, corroborated by
   the ledger `request_card_id`).
2. The new requester names or pastes the card that was sent to them, and it
   resolves to a real prior card.
3. The new requester is a person we did NOT recruit (non-recruited / organic).

Additional rules:

- **Self-report is soft evidence only.** A "yes I made one because of the card I
  got" with no traceable ref and no named parent card is logged as soft evidence,
  never counted toward the gate.
- **A real send is verified, not assumed.** Delivering a link to a requester is not
  a send. Count a real send only when corroborated by a `card_opened` from a new
  device/geo on that card_id, or by recipient-side confirmation (the
  `recipient_opened` column).
- **CONTINUE needs 2 distinct chains.** The >= 2 events must come from 2 distinct
  senders / 2 independent chains, not 2 forwards inside one chain.
- **Ambiguous edges are conservative.** Any unverifiable or ambiguous edge defaults
  to `recruited_by_founder = Y` (it does NOT count as organic propagation).

---

## 4. The generation-tree ledger column schema (Google Sheet, source of truth)

The Google Sheet is the source of truth for the decision. PostHog corroborates
only; analytics can be blocked on some iOS / ad-blockers. The PostHog event names
that corroborate these columns are `card_opened`, `card_engaged`, `cta_clicked`,
`maker_opened`, and `card_created` (recorded in 01-02-SUMMARY.md).

Create one row per card. Column order to build in the sheet:

| # | Column | Meaning |
|---|--------|---------|
| 1 | `card_id` | the card token (the /c/<token>/ slug) |
| 2 | `gen` | generation. 0 = founder-recruited; 1+ = requested by someone who received a prior card |
| 3 | `channel` | warm / dm / cold (how this sender was reached) |
| 4 | `arm` | primed / unprimed / friction (the control arm for demand characteristics) |
| 5 | `tie_strength` | strong / weak (report Tier 1 split by this) |
| 6 | `sender` | who made this card |
| 7 | `recipient` | who it was sent to |
| 8 | `relationship` | partner / parent / family / friend / other |
| 9 | `cohort` | couples / college (the two cohorts, VAL-04) |
| 10 | `occasion` | justBecause / thinkingOfYou / birthday |
| 11 | `sent_at` | when the sender sent the link onward |
| 12 | `engaged` | Y / N (card_engaged fired for the recipient) |
| 13 | `cta_clicked` | Y / N (recipient tapped Make one for someone you love) |
| 14 | `requested_own` | Y / N (recipient made their own card) |
| 15 | `request_card_id` | the parent card_id this request came from (the ref edge; follow it back to reconstruct the tree) |
| 16 | `recipient_opened` | Y / corroborated-how (new device/geo card_opened, or recipient confirmation) |
| 17 | `verified_propagation` | Y / N (passes ALL of section 3; this is what CONTINUE counts) |
| 18 | `who_sent_you` | self-reported "who sent you the card you saw" (soft evidence; from the maker field) |
| 19 | `gift_interest` | Y / N (the scripted gifting probe, section 5.4 of the spec) |
| 20 | `library_interest` | Y / N (the scripted library probe) |
| 21 | `notes` | free text (verbatim "how did you make this?" messages, takedowns, anything) |

To reconstruct a chain: start at a `verified_propagation = Y` row and follow
`request_card_id` back up the `card_id` column until you reach a gen-0 card. Two
such independent walks from two distinct senders are the 2 distinct chains
CONTINUE requires.

---

## 5. The two cohorts (VAL-04)

Run both in parallel. Recruit the SENDER, never the recipient. Cap the warm
network at about 50% of senders and force several cold-origin senders as the bias
control.

### Cohort A: long-distance couples

Warm friends-of-friends first, then genuine 1:1 replies to people who
self-identify in LDR communities (ask mods first, never cold-post), plus an
organic TikTok as the cold, least-biased funnel. Tag `cohort = couples`.

### Cohort B: college students

Campus subreddits (mod permission), Greek life / club GroupMe and Discord, RAs and
dorm events, campus TikTok/IG, and flyers with a QR code (scan to instant card).
Students send to parents, grandparents, partners, and siblings, which gives more
send-occasions per person and de-seasonalizes the occasion problem. Measure the
recipient-to-sender conversion split by recipient relationship (parent vs partner);
an older recipient converting to a sender in-browser is the riskiest link. Tag
`cohort = college`.

### Consent (required)

Every sender confirms the consent checkbox in the maker:
"I have permission to use this photo, and I understand this is an early
experiment." Honor any takedown immediately and log it in `notes`.

---

## 6. What this proves and does not prove

- **Proves:** whether the craft, delivered with zero friction to real people,
  produces verified organic propagation, i.e. whether a loop can exist at all.
- **Does NOT prove:** the magnitude of K in a self-serve product, willingness to
  pay, or retention. Those are later probes and Stage 1/2 questions.
- **Biggest residual risk:** propagation may not mature inside the window, and
  forwards happen on channels we cannot see. That is exactly why the read is on a
  ~30-day rolling window, why verification is required, and why even one clean
  verified propagation is treated as a strong keep-going signal (though CONTINUE
  still requires two).
