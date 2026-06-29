# Codebase Structure

**Analysis Date:** 2026-06-29

## Directory Layout

```
bday-card-claude-birthday-card-animation-wr7nsu/
├── index.html                 # Entire application (CSS + HTML + JS in one file)
├── photo.jpg                  # Couple's portrait; shown in polaroid inside the card
├── README.md                  # User-facing guide: how to view, personalize, share
├── HANDOFF.md                 # Context document for next session; read this before changes
├── .github/
│   └── workflows/
│       └── deploy-pages.yml   # GitHub Pages deploy workflow (run on push to branch)
├── docs/
│   └── obsidian/              # Future multi-file architecture planning (NOT IMPLEMENTED YET)
│       ├── App-Architecture-and-Backend.md
│       ├── Initial-Recommendations.md
│       ├── Market-Research-and-GTM-Assessment.md
│       ├── Roadmap.md
│       └── Stage-0-Concierge-Test.md
├── research/                  # Early research and spec documents (reference only)
│   ├── INITIAL_RECOMMENDATIONS.md
│   ├── MARKET_RESEARCH.md
│   └── RESEARCH_BRIEF.md
└── .planning/
    └── codebase/              # This directory (GSD codebase analysis docs)
        ├── ARCHITECTURE.md    # Architecture & component responsibilities
        └── STRUCTURE.md       # (This file) Directory layout & where to put new code
```

## Directory Purposes

**Project Root:**
- Purpose: Source of truth; contains the entire application, deployment config, and user docs.
- Key files:
  - `index.html`: **THE APPLICATION** — all code lives here. This is not a static template; it is executable.
  - `photo.jpg`: Binary image asset referenced by `index.html`.
  - `README.md`: User guide for personalization and hosting.
  - `HANDOFF.md`: Context document for the next developer session.

**.github/workflows/:**
- Purpose: CI/CD automation.
- Key files:
  - `deploy-pages.yml`: Workflow to deploy the card to GitHub Pages on push.
  - **Status:** Configured, but repo must be **public** and Pages source must be set manually in repo settings (not automated by MCP tools).

**docs/obsidian/:**
- Purpose: **PLANNED FUTURE ARCHITECTURE ONLY** — describes a multi-file refactor (Supabase, Cloudflare, three-layer engine/content/photo split).
- **IGNORE FOR NOW.** The current app is single-file vanilla HTML/CSS/JS. These docs describe what *could* be built next, not what exists.

**research/:**
- Purpose: Historical research and initial spec documents.
- Status: Reference only; not used by the application.

**.planning/codebase/:**
- Purpose: GSD codebase mapping output (this directory).
- Contains: Architecture, structure, conventions, testing, concerns, stack, integrations docs.

## Key File Locations

**Entry Points:**
- `index.html`: The only entry point. Open in browser. No build step. No dependencies.

**Configuration:**
- `index.html` lines 32-46: CSS Custom Properties (`:root` palette, `--radius`).
- `index.html` line 574: `CONFIG` object (particle counts: hearts, petals, confetti, foil, ambientPetals).
- `index.html` line 689: `count = 37` (emoji ball spawn count; tuned by user).
- Personalization search markers (within `index.html`):
  - `<!-- ✏️ HER NAME -->` line 515: Card greeting.
  - `<!-- ✏️ PHOTO -->` line 508: Polaroid image src.
  - `<!-- ✏️ MESSAGE GOES HERE -->` line 518: Handwritten note content.
  - Additional customization spots: cover dedication (line 554), polaroid caption (line 512), signoff (line 533), page title (line 6).

**Core Logic:**
- `index.html` lines 569-915: IIFE (Immediately Invoked Function Expression) containing all JavaScript.
- Key functions:
  - `openCard()` (line 879): Orchestrates card open and celebration sequence.
  - `resetCard()` (line 891): Closes card and clears state.
  - `burst()` (line 633): Spawns particle effects.
  - `dropEmojis()` (line 678): Drops emoji balls.
  - `startDrizzle()` (line 789): Spawns ambient petals.
  - `tick()` (line 806): Main rendering loop (requestAnimationFrame).
  - `updateEmoji()` (line 709): Physics simulation for emoji.
  - `drawEmoji()` (line 772): Canvas rendering for emoji.
  - `buildPetals()` (line 862): Creates ambient petal DOM elements.

**Styling:**
- `index.html` lines 31-495: All CSS inline in `<style>` block.
- Root palette: `:root` (lines 32-46).
- Layout & transforms: `.stage`, `.card`, `.face`, `.inside`, `.cover` (lines 72-151).
- Content styling: `.greeting`, `.note`, `.signoff`, `.polaroid` (lines 246-285).
- Animations: `@keyframes settle`, `eager`, `foil`, `breathe`, `rise`, `drift`, `nudge` (lines 95-202).
- Reduced-motion media query (lines 484-494).

**Canvas & Rendering:**
- `index.html` line 566: `<canvas id="fx">` — the particle/emoji render target.
- Canvas context setup (lines 602-612).
- Particle types (lines 633-666).
- Emoji physics (lines 709-786).
- Drawing functions: `heartPath()` (line 622), `tick()` (line 806).

**Testing:**
- No test files. This is a single-file app.
- Pre-push validation is manual (see HANDOFF.md "Validation" block):
  - Em-dash grep.
  - JS syntax check via `node -e`.
  - Visual check in browser (the user verifies on their phone).

**Assets:**
- `photo.jpg`: Referenced in `index.html` line 511 as `src="photo.jpg"`. Must be in the repo root.
- Google Fonts imports (lines 27-29): Caveat, Cormorant Garamond, Outfit (loaded from `fonts.googleapis.com`).
- SVG glyphs (inline): heart (line 551), bow (not yet), back-of-cover heart (line 560).

## Naming Conventions

**Files:**
- **Single `index.html`:** The entire app. Do not rename or split (unless part of a planned multi-file refactor).
- **`photo.jpg`:** The couple's portrait. Keep the filename or update the src in `index.html` line 511.
- **Markdown docs:** `README.md`, `HANDOFF.md` (user docs); `INITIAL_RECOMMENDATIONS.md`, etc. (research, reference only).
- **Workflow:** `.github/workflows/deploy-pages.yml` (GitHub Actions).

**CSS Classes (inside `index.html`):**
- **Layout/structure:** `.stage`, `.card`, `.face`, `.inside`, `.cover`, `.cover-back`, `.inside-scroll`, `.cover-content`.
- **State toggles:** `.opened` (card is open), `.has-more` (note overflows), `.read` (scrolled to bottom), `.show` (replay button visible).
- **Content:** `.greeting`, `.note`, `.signoff`, `.polaroid`, `.seal`, `.milestone`, `.frame`, `.eyebrow`, `.cover-title`, `.dedication`, `.open-label`, `.scroll-fade`, `.scroll-cue`, `.tape`, `.pic`, `.cap`.
- **Decorative/affordance:** `.petals`, `.petal` (ambient), `.replay` (button).

**JavaScript Variables (inside IIFE):**
- **DOM refs:** `card`, `replay`, `canvas`, `ctx`, `petalLayer`, `inside`, `scroller` (cached for efficiency).
- **Config:** `CONFIG` object (particle counts), `reduceMotion` boolean, `dpr` (device pixel ratio).
- **State:** `isOpen`, `raf` (requestAnimationFrame ID), `drizzle` (setInterval ID), `W`, `H` (canvas width/height), `particles[]`, `emojiBalls[]`.
- **Math:** `rand()`, `pick()` (utility functions).
- **Animation:** `HEART_COLORS`, `CONFETTI_COLORS`, `EMOJIS` (arrays of constants).

**Event Handlers:**
- Click/tap: `card.addEventListener("click", openCard)`.
- Keyboard: `card.addEventListener("keydown", ...)` (Enter/Space).
- Scroll: `scroller.addEventListener("scroll", atBottom)`.
- Replay: `replay.addEventListener("click", resetCard)`.
- Visibility: `document.addEventListener("visibilitychange", ...)`.
- Resize: `window.addEventListener("resize", ...)`.

## Where to Add New Code

### New Visual Effect (e.g., additional particle type)

**Primary location:** `index.html` IIFE (lines 569-915).

**Steps:**
1. Add particle type to `burst()` (line 633 onwards):
   ```javascript
   for (i = 0; i < CONFIG.yourEffect; i++) {
     particles.push({ kind: "yourEffect", x: ox, y: oy, /* properties */ });
   }
   ```
2. Add render case in `tick()` (line 806 onwards), in the particle drawing section:
   ```javascript
   } else if (p.kind === "yourEffect") {
     // ctx.fillStyle, ctx.fillRect(), ctx.fill(), etc.
   }
   ```
3. Add count to `CONFIG` object (line 574).
4. Update `HANDOFF.md` if this is a permanent change.
5. Run validation (em-dash grep, JS syntax check).
6. Test visually (browser, phone).

### New UI Element (e.g., gift box in the note)

**Primary location:** `index.html` (HTML structure + CSS + JavaScript).

**Steps:**
1. **HTML:** Add the element inside `.inside-scroll` or as a sibling to the card.
   ```html
   <div class="gift" role="button" tabindex="0">
     <div class="gift-box">...</div>
     <div class="gift-reveal" style="display: none;"><a href="#">...</a></div>
   </div>
   ```
2. **CSS:** Add styles in the `<style>` block (before line 496). Include:
   - Layout (position, size, flex properties).
   - Animations (keyframes for opening/wobble).
   - Reduced-motion degradation (in the media query, lines 484-494).
3. **JavaScript:** Add event handler and state tracking in the IIFE.
   ```javascript
   var giftTaps = 0;
   giftElement.addEventListener("click", function() {
     giftTaps++;
     if (giftTaps >= 3) { openGift(); }
   });
   function openGift() {
     giftElement.classList.add("opened");
     burst(); // reuse existing effect
   }
   ```
   Add cleanup to `resetCard()`:
   ```javascript
   giftTaps = 0;
   giftElement.classList.remove("opened");
   ```
4. Run validation.
5. Test on mobile (iPhone portrait, iPhone landscape, Android).

### New Personalization Slot

**Primary location:** `index.html` (just add a comment marker and the DOM element).

**Steps:**
1. Add a comment marker (search string) in the HTML:
   ```html
   <!-- ✏️ YOUR LABEL -->
   <div class="your-element">Default placeholder text</div>
   ```
2. Document it in README.md "How to personalize" section and in HANDOFF.md "Personalization spots" section.
3. No JavaScript changes needed unless the slot has interactive behavior.
4. Test by replacing the placeholder with real text.

### Add an External Dependency (NOT RECOMMENDED)

**Before you do this:** The user explicitly chose a single-file, zero-dependency app. If you need a library:
1. Check if vanilla HTML/CSS/JS solves it first. (Most things do.)
2. Talk to the user. The handoff says "Keep it that way unless there is a strong reason."
3. If approved, you MUST:
   - Load the library via `<script>` tag (not npm/bundler).
   - Inline or host it locally (do not rely on CDN alone if offline resilience matters).
   - Document in README.md and HANDOFF.md.
   - Keep the single-file structure if possible (inline the library or load it early).

### Fix a Bug or Refactor Existing Code

**Approach:** Edit `index.html` directly. The entire app is one file.

**Validation steps before push:**
- Em-dash grep: `grep -c "$(printf '\xe2\x80\x94')" index.html` → must print `0`.
- JS syntax: Run the `node -e` validation check from HANDOFF.md.
- Visual test: Open in browser locally (`python3 -m http.server`); verify on mobile (iPhone portrait).

## Special Directories

**docs/obsidian/:**
- Purpose: Future roadmap (multi-file, Supabase, Cloudflare).
- Generated: No (user research + planning).
- Committed: Yes (for future reference).
- **Action:** Read these if planning a major refactor. Otherwise, ignore.

**research/:**
- Purpose: Historical research docs.
- Generated: No (initial spec research).
- Committed: Yes (for context).
- **Action:** Reference only; do not edit.

**.planning/codebase/:**
- Purpose: GSD codebase analysis output.
- Generated: Yes (by `/gsd-map-codebase`).
- Committed: Depends on user preference. These are reference docs, not source code.

**.github/workflows/:**
- Purpose: GitHub Actions CI/CD.
- Generated: No (user-configured).
- Committed: Yes.
- **Action:** Do not edit unless you understand GitHub Actions and the user requests it.

---

*Structure analysis: 2026-06-29*
