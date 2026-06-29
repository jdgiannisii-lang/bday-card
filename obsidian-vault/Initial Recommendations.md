# Initial Recommendations

Product and architecture decisions from an early advisory discussion for the
build-your-own animated greeting card app. This document covers **identity, the
"received cards" library, the signup/save flow, and distribution surfaces** (web
vs. native app vs. iMessage). The full market research report is maintained
separately and is not reproduced here.

These are recommendations and rationale, not final commitments. Where a decision
depends on data we don't have yet, that's flagged under "Open questions."

---

## 0. The wedge we are protecting

Every decision below is in service of one positioning, and any feature that
breaks it should be treated with suspicion:

- **Tasteful, non-templated craft** (real handmade-feeling cards, not cheesy
  AI/template slop).
- **Zero recipient friction** — the recipient opens the card in any browser, on
  any device, with no signup and no app install.
- **A library of cards you've received** as a retention + second viral surface.
- **Beachhead:** long-distance couples and "just-because / thinking-of-you"
  sends (year-round, emotionally motivated, not occasion-seasonal).

The viral loop that everything rides on: **every recipient can become a sender
in the same browser session.** Protecting that loop is the tiebreaker in most of
the calls below.

---

## 1. The "received library" vs. "no signup" — how they coexist

These two goals look contradictory but aren't. The resolution:

> **"Zero friction" is a promise about the moment of RECEIPT, not a promise that
> no one ever makes an account.** Viewing and keeping are separable.

- **Viewing** is always frictionless and permanent: open the link → the card
  plays → no wall, ever. This is the wedge and it never gets gated.
- **Keeping / creating** is where lightweight identity enters — but only *after*
  the emotional payload has landed, and only from people motivated enough to act.

The incumbents' actual mistake is gating *viewing and creating* behind signup and
paywalls. As long as we never make a recipient sign in to *see* a card, the
differentiator is intact, and everything downstream can layer identity
progressively.

### Tiered identity model (increasing friction, increasing durability)

1. **Device-local (anonymous, automatic).** On open, drop a record in the
   browser's local storage / IndexedDB. The "shelf" is "cards this browser has
   seen." Zero identity, instant. Fragile — dies on cache clear, doesn't follow
   the user across devices. Treat as best-effort, not the real archive.

2. **Email magic-link or one-tap OAuth (opt-in, deferred).** After the card
   finishes playing: a soft "Keep this forever?" prompt. One email field (mail
   them a link back to their shelf) or one-tap Sign in with Apple/Google. **This
   is the sweet spot** — a single motivated action at the exact moment they want
   to hold onto the card. Categorically different from a wall hit *before* the
   experience.

3. **Full account (automatic, on first send).** The moment a recipient taps
   "send one back" — the core loop — they become a sender, and senders need an
   account to build cards. The loop converts recipients into account-holders
   without ever forcing it.

### Why this is easy for our beachhead specifically

In a long-distance couple, **both people send.** The whole point of the couples
beachhead is reciprocal, back-and-forth, just-because cards. So both partners
naturally become senders → both naturally have accounts → the received library
becomes a near-automatic byproduct, possibly a *shared* shelf between the two.
The hard case (one sender, fifty one-time recipients) is the directional
occasion-card use case — which is exactly why couples come first.

### Caveats to design for now, not later

- **The merge problem.** If someone saves cards device-locally and *then* makes
  an account, their anonymous local cards must migrate up into the synced
  library. Solvable by tying local records to each card's unique token and
  claiming them on sign-in — **build this early; retrofitting it is painful.**
- **Most recipients will just view and bounce, and that's fine.** They're
  top-of-funnel either way. The library is a retention mechanic for the subset
  who care, not something every recipient must adopt.

---

## 2. Signup-to-save, and the native-app question

The question "signup to save, then lead them to an app?" has two halves with two
different answers.

### Signup-to-save: YES — but only if "signup" means one tap

The principle is **value before friction.** Asking someone to identify
themselves is fine *after* they've gotten what they came for and are motivated to
keep it. The save moment is the highest-intent moment we'll ever get from a
recipient. The best web-to-app funnels (Photoroom, Blinkist) deliver the "aha"
on the web for free before asking for anything.

**Hard constraint:** "signup" must mean Apple/Google one-tap or an email magic
link — *never* a create-a-password form. Account-creation gates are repeatedly
named in funnel research as one of the single biggest conversion killers.

### Leading the save into a native app download: NO — at this stage

This reintroduces the exact friction the wedge exists to eliminate.

- **Funnel math.** Install-to-purchase conversion across apps typically runs
  ~1–2% (UXCam, 2026) — and that's measured *after* the install, which itself
  sheds most people at the "go to App Store → download → reopen → re-find the
  card" cliff. App drop-off concentrates specifically around permission prompts,
  account-creation gates, and first-session pacing. An app download manufactures
  all three.
- **Strategic cost.** **Every app install is a leak in the viral loop.** The
  loop's magic is that a recipient becomes a sender in the *same browser
  session*. An app severs that — they'd have to leave, install, re-auth, and
  rediscover the create flow. Most won't.

### Steelman for the app (why it isn't wrong *forever*)

The beachhead is couples, and couples-connection products are almost entirely
native apps (Paired, Between, Cupla) because the **habit / daily-ritual layer**
genuinely benefits from push notifications and home-screen presence. So the app
is a legitimate **Stage 2 surface** — for *proven repeat senders* (the partner
sending weekly), where install friction finally pays for itself in retention.
We install-gate the *habit*, never the *receipt*.

### What to do instead of an app: a PWA

Make the library a **Progressive Web App** ("add to home screen"). This gives
most of what people actually want an app *for* — a home-screen icon and **push
notifications** ("your partner sent you a card," a real re-engagement weapon for
couples) — without the app-store download cliff. iOS has supported web push for
home-screen PWAs since 16.4; Android has for years. The library lives on the web
and syncs the moment someone does the one-tap sign-in. "Add to home screen"
becomes an *optional* nudge for fans, not a wall for everyone else.

### The sequence

```
view  (no account, ever, permanent)
  → save  (one tap, stays in the browser)
    → add to home screen  (optional, for fans / repeat users)
      → native app  (Stage 2 only, for proven weekly senders)
```

The error in "signup then lead to an app" isn't the signup — it's putting the
app on the path *before* the data proves the person is the kind of user an app is
for. Let the web carry us until retention data shows a specific cohort is begging
for a phone icon, then build the app for *them*, as an addition, not a
replacement.

---

## 3. iMessage app idea (GamePigeon model) — evaluated, deprioritized

Considered seriously and set aside for now. The instinct behind it is good; the
surface is wrong.

### The genuinely smart part (keep this insight)

- **Host-provided identity:** inside iMessage the user is implicitly their Apple/
  iCloud identity — no account creation. This is the cleanest possible answer to
  the signup problem.
- **In-thread viral pull:** send a thing → recipient is yanked into it → they get
  the app to respond. That is GamePigeon's growth engine and it maps onto our
  loop.

### The GamePigeon misread

GamePigeon encodes each game's state **into the message bubble itself** — state
travels inside that one message, in that one thread, and is discarded when the
game ends. It proves **accountless PER-MESSAGE state**, not **a persistent
cross-thread library.** A real "received library" inside an iMessage app is *not*
handed to us by the framework — it would require either device-local storage
(same fragility as browser local storage) or iCloud/CloudKit sync via a parent
app (real infrastructure, Apple-only, and running *in parallel* with the web
library rather than replacing it).

### The constraint that rules it out as a foundation

**iMessage is not just iOS-only — it's iMessage-only** (blue-bubble-to-blue-
bubble). It degrades to nothing on SMS fallback or Android. This is the *opposite*
of "opens in any browser on any device," and it's specifically lethal for the
couples beachhead: if one partner is on Android, the product simply doesn't exist
for them. Building here means betting every target couple is both-iPhone.

### No distribution either

The iMessage App Store has been a documented graveyard for years — poor
discovery, most users don't know how to access it, and even when they find an app
they use it once. Apple has shipped nothing to revive it. So it is not a free
growth channel; at best it's a nicer *send* surface for people who already found
us elsewhere.

### Cost and platform direction

- **Second codebase.** Card *visuals* are reusable inside an extension via a web
  view, but the send/receive/state-encoding glue is all native Swift (Messages
  framework). Heavy for a solo founder pre-validation.
- **Winds blowing the other way.** Apple is adding RCS to Messages (announced
  March 2025). RCS does **not** carry iMessage apps — so this is investment in a
  proprietary island precisely as the industry standardizes on cross-platform.

### Verdict

Not a foundation, and not a solution to the library problem. **Capture the good
part — Apple identity, no signup — with Sign in with Apple on the web PWA**
(one biometric tap, syncs the library, works cross-platform, no second codebase).
Revisit an iMessage extension only as a **Stage 2 send-surface** *if* validation
data shows a heavily both-iPhone US couple base. It is never the thing we build
first and never a substitute for the browser card or the web library.

---

## Summary of decisions

| Question | Decision |
|---|---|
| Can we have a received library with "no signup"? | Yes. Frictionless **viewing** is permanent; identity is layered only at **save/create**, after value lands. |
| Tiered identity | device-local (anon) → one-tap / email magic-link (opt-in) → full account (auto, on first send). |
| Build the merge (claim anon cards on sign-in)? | Yes, early. Painful to retrofit. |
| Require signup to save? | Yes, but only **one-tap** (Apple/Google) or email magic-link. Never a password form. |
| Route the save into a native app? | No — at this stage. Reintroduces the friction the wedge kills; leaks the viral loop. |
| Native app, ever? | Stage 2 habit surface for proven repeat senders only. Install-gate the habit, never the receipt. |
| App alternative now | PWA + "add to home screen" → home-screen presence + web push, no app-store cliff. |
| iMessage app (GamePigeon model)? | Deprioritized. Apple-only + iMessage-only breaks the cross-platform wedge; store gives no distribution; second codebase. |
| Keep from the iMessage idea | The host-identity insight → use **Sign in with Apple** on the web instead. |

---

## Open questions to validate next

These gate the decisions above and should be answered with cheap experiments
before committing engineering time.

- **Does the craft actually convert recipients into senders?** (Concierge test:
  hand-build cards for strangers, measure how many ask to make their own.) This
  is the single most important unknown — it's the viral coefficient.
- **Will couples pay, and for what?** Premium effects vs. gifting attach vs.
  annual sub — test with a small cohort.
- **Is there a daily-ritual hook** that makes this a habit (like Paired/Lovebox),
  or is card-sending inherently episodic?
- **What share of the target couple base is both-iPhone?** This number alone
  gates whether the iMessage send-surface is ever worth revisiting in Stage 2.
