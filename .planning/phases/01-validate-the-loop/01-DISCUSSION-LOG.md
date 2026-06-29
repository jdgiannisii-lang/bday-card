# Phase 1: Validate the Loop - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-29
**Phase:** 1-Validate the Loop
**Areas discussed:** Card storage & sharing, What counts as "engaged", Go/no-go thresholds, Maker v1 scope

> The user selected all four gray areas, then delegated the specific calls ("or whatever
> u think is better"). Claude proposed a decision for each; the user locked all four.

---

## Card storage & sharing

| Option | Description | Selected |
|--------|-------------|----------|
| URL-encoded static card | Encode the whole card in the URL — fully static, $0, but photos need separate hosting and long URLs unfurl badly | |
| Supabase free row + token | A `cards` row keyed by a short token + photo in Supabase Storage (free); clean `/c/<token>/` links | ✓ |

**User's choice:** Supabase free row + token (Claude's recommendation, user-delegated).
**Notes:** Chosen because the card has a photo (URL-encoding hits a wall) and it's the real Stage-1 stack on its free tier — $0, no throwaway. Read path must not depend on anything paid; sends stay inside the controlled cohort so no moderation build.

---

## What counts as "engaged"

| Option | Description | Selected |
|--------|-------------|----------|
| Note-bottom only | Fire when the recipient scrolls to the end of the message | |
| Dwell only (~8s) | Fire after N seconds of visible/open time | |
| Both (note-bottom OR dwell fallback) | Bottom-of-note primary; dwell fallback for short notes; dedupe; exclude reduced-motion | ✓ |

**User's choice:** Both, OR'd (Claude's recommendation, user-delegated).
**Notes:** Replaces the blind 1500ms timer (CONCERNS.md). Reduced-motion sessions excluded from the craft-conversion denominator.

---

## Go/no-go thresholds

| Option | Description | Selected |
|--------|-------------|----------|
| Lock the spec's thresholds | ~30-day window, min 10 engaged; KILL on zero propagation or <~15% upper-bound; CONTINUE on ≥2 verified organic propagations | ✓ |
| Different numbers | User-specified alternative thresholds | |

**User's choice:** Lock the spec's thresholds (user-delegated).
**Notes:** Mechanical decision from two inputs; secondary metrics descriptive only; thresholds written into the ledger header, timestamped, before card #1.

---

## Maker v1 scope

| Option | Description | Selected |
|--------|-------------|----------|
| Tiny v1 | 3 occasion presets (just-because/thinking-of-you/birthday), name+photo+message+signoff+effect, hand-coded canvas effects only, 1–2 themes | ✓ |
| Broader v1 | Distinct per-occasion art, full theme picker, premade video overlays | |

**User's choice:** Tiny v1 (Claude's recommendation, user-delegated).
**Notes:** No premade video overlays and no per-occasion art in v1 — kept minimal to ship fast.

## Claude's Discretion

Token format, Supabase schema/RLS for the public read, photo upload/resize, dwell-threshold tuning, create-form UI, PostHog event names, and inline-vs-fetch for the `/c/<token>/` read path — all left to research/planning, grounded in the Stage-0 spec.

## Deferred Ideas

Premade video/animation overlays (Stage 1+); per-occasion art; accounts/library/merge (Phase 3); seeded engine/version-pinning/frictionless-open/self-hosted fonts (Phase 2); moderation/email/backups/GDPR/monitoring (Phase 4 go-public gate); gifting/Stripe/couple shelf/native app (Stage 2); server-side ref attribution hardening (post-controlled-cohort).
