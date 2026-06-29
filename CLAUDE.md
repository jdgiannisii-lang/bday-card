# CLAUDE.md

Project memory for any model working in this repo. Read this first. Keep it
current so memory stays synchronous across sessions and models.

## ⭐ Always keep the PR description as the source of truth

Whenever you push to a branch that has an open PR, **update the PR description**
so any other model (or human) can pick up with full context. The PR body must
always answer:

- **What this PR is / the goal** — the intent in one or two sentences.
- **What it adds / changes** — the concrete additions, file by file or area by
  area, in plain language.
- **What is completed and how** — what now works, and the approach taken to get
  there (key decisions, not just "done").
- **What went wrong / gotchas** — anything that broke, was tricky, was worked
  around, or is fragile, plus how it was resolved (or that it is still open).
- **What is left / next steps** — open questions, TODOs, and anything a follow-up
  session should do next.
- **State** — which branch, that pushing more commits updates this same PR, and
  any manual steps the human still has to do.

Treat the PR description as a living handoff document, not a one-time summary.
After every meaningful push, revise it so it reflects the *current* state of the
branch — never leave it stale or contradicting the commits. When in doubt, over-
explain: the goal is that a fresh model can resume with zero extra context.

Do this in addition to (not instead of) clear commit messages. Commit messages
explain individual changes; the PR description explains the whole effort.

## Repo facts

- Repo: `jdgiannisii-lang/bday-card`.
- The product is a single-file animated card (`index.html`, no build step); see
  `HANDOFF.md` for the card's architecture, design/taste rules, and conventions.
- `research/` holds the market research, product recommendations, and the
  research brief for the broader "animated cards app" idea this card sparked.
- Active research branch: `claude/virtual-card-market-research-1ob88c` → **PR #2**.
- Do not open a new PR unless explicitly asked; push to the branch to update its
  existing PR.
- Do not put any model identifier in commits, PRs, code, or other repo artifacts
  (chat replies only).
