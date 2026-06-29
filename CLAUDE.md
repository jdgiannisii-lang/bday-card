# CLAUDE.md

Project memory for any model working in this repo. **Read this first, and update
the Project Log at the bottom before you finish.** This file is the durable
source of truth that keeps memory synchronous across sessions and models.

## ⭐ The synchronization rule

This repo's PRs tend to **merge almost immediately** (PR #2 merged ~1 minute
after it was created), and the **base branch is what actually accumulates work**.
So a PR description is too short-lived to rely on as the shared memory. Instead:

**On every meaningful push, update the Project Log at the bottom of this file**
so the next model (or human) can resume with full context. Each entry must cover:

- **What this change is / the goal** — the intent in a sentence or two.
- **What it adds / changes** — the concrete additions, by file or area, in plain
  language.
- **What is completed and how** — what now works, and the approach/key decisions
  taken to get there (not just "done").
- **What went wrong / gotchas** — anything that broke, was tricky, was worked
  around, or is still fragile, and how it was resolved (or that it's still open).
- **What's left / next steps** — open questions and TODOs for a follow-up session.
- **State** — branch, whether it merged, and any manual step the human still owes.

Keep the log append-only and in reverse-chronological order (newest first). Over-
explain when in doubt: the goal is that a fresh model resumes with zero extra
context. This is in addition to clear commit messages — commits explain a single
change; the Project Log explains the whole effort and its current state.

**Secondary:** if a PR happens to stay open long enough to matter, keep its
description aligned with the latest Project Log entry too. But the log here is
canonical; the PR body is a convenience.

## Repo facts

- Repo: `jdgiannisii-lang/bday-card`.
- The product is a single-file animated card (`index.html`, no build step); see
  `HANDOFF.md` for the card's architecture, design/taste rules, and conventions.
- `research/` holds the market research, product recommendations, and the
  research brief for the broader "animated cards app" idea this card sparked.
- Work branch for the research effort: `claude/virtual-card-market-research-1ob88c`.
  It auto-merges into the base/default branch `claude/birthday-card-animation-wr7nsu`,
  so pushes land in base without necessarily going through an open PR.
- Do not open a new PR unless explicitly asked.
- Do not put any model identifier in commits, PRs, code, or other repo artifacts
  (chat replies only).

---

## Project Log (newest first)

### 2026-06-29 — Synchronization rule + research artifacts landed
- **Goal:** keep cross-model memory synchronous; persist the deep-research outputs.
- **Added/changed:** this `CLAUDE.md` (the synchronization rule + Project Log);
  `research/MARKET_RESEARCH.md` (full deep-research report); 
  `research/INITIAL_RECOMMENDATIONS.md` (early product/architecture decisions);
  `research/RESEARCH_BRIEF.md` (the prompt that scoped the research, moved here
  from the repo root).
- **Completed & how:** wrote the research docs from the deep-research session
  outputs; centered the memory rule on this durable log instead of a PR body
  after discovering PRs here merge near-instantly.
- **Went wrong / gotchas:** PR #2 merged ~1 min after creation and only contained
  the brief + a framing fix, so later pushes did NOT update it. Verified the
  research reports already reached base via auto-merge; only this CLAUDE.md commit
  was still propagating at write time. Also: an Obsidian vault was added then
  removed at the user's request (they'll build it via the Obsidian MCP instead).
- **What's left:** none required. The user manages merges via the Claude Code UI /
  auto-merge; confirm CLAUDE.md reaches base.
- **State:** branch `claude/virtual-card-market-research-1ob88c`, auto-merging to
  base `claude/birthday-card-animation-wr7nsu`.
