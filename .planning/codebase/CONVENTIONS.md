# Coding Conventions

**Analysis Date:** 2026-06-29

## Overview

This is a **single-file, vanilla HTML/CSS/JS application** (`index.html`, ~920 lines). There is no build step, no runtime dependencies (canvas-confetti was removed), and no test framework. The project deliberately avoids AI-generated aesthetics, enforcing strict taste and tone rules.

## Critical Project Rules

### Em-Dash Ban (Absolute Rule)

**ZERO em-dashes (U+2014 `…`) anywhere in the card copy or code comments.**

- **Why**: Em-dash is the #1 tell of AI-generated text (all LLMs default to em-dashes). This card must feel handmade.
- **Where**: the note message, dedication, signoff, page title, comments, all text content in `index.html`
- **Validation**: Before every commit/push, run:
  ```bash
  grep -c "$(printf '\xe2\x80\x94')" index.html
  # Must print: 0
  ```
- **Use instead**: periods, commas, parentheses, or hyphens (U+002D)

### Personalization Markers

Every customizable spot is marked with a unique **pencil emoji prefix** so search is unambiguous:

- `✏️ HER NAME` — greeting recipient name
- `✏️ PHOTO` — polaroid `<img src>` path
- `✏️ MESSAGE GOES HERE` — handwritten note body

These are intentionally wrapped in HTML comments for discovery; **never put HTML comment markers inside these blocks** (they would close the comment early).

## Naming Patterns

### Files & Directories

- **index.html**: single entry point, inline CSS + JS
- **photo.jpg**: recipient's photo for polaroid (~353K, portrait orientation)
- **README.md**: user-facing setup/deployment guide
- **.github/workflows/deploy-pages.yml**: GitHub Pages deploy (one-time setup required for visibility + branch config)

### CSS Classes & Custom Properties

**CSS Custom Properties (`:root` block):**
```css
--paper, --paper-warm, --paper-edge     /* cardstock tones */
--ink, --ink-soft                       /* pen ink colors */
--rose, --rose-deep, --blush, --coral   /* accent palette */
--gold-hi, --gold-mid, --gold-lo        /* foil tones */
--radius: 14px                          /* one corner-radius system everywhere */
```

All colors are **low-saturation, warm tones** — no neon, no bright accents. Named for their visual purpose (paper, ink, rose, gold), not arbitrary hex values.

**CSS Classes (kebab-case):**
- `.stage` — perspective viewport
- `.card` — 3D card container (preserve-3d)
- `.face` — individual 3D panel (inside, cover, cover-back)
- `.inside` — note side (hidden until opened)
- `.inside-scroll` — scrollable note area
- `.cover` — front flap (swings open on rotateY)
- `.cover-back` — back of cover (glimpsed during swing)
- `.polaroid` — taped photo
- `.greeting` — "Happy Birthday, Rachel!" heading
- `.note` — handwritten message (Caveat font, ragged-left)
- `.signoff` — "With immeasurable love, JD" + emoji
- `.seal` — wax seal button on cover (animated breathe)
- `.replay` — "read it again" button (hidden until card opens)
- `.scroll-fade` — bottom gradient fade (opacity 0 by default)
- `.scroll-cue` — "keep reading" affordance text + arrow
- Modifiers: `.opened`, `.has-more`, `.read`, `.show` (added/removed by JS)

**Animation Classes:**
- `.seal` has `.animation: breathe` idle; pauses on `.card:hover`
- `.cover` transitions on `rotateY` open
- `.inside-*` elements fade in via `.rise` keyframe with staggered delays

### JavaScript

**IIFE Scope Isolation:**
All code wrapped in `(function() { "use strict"; ... })()` for encapsulation.

**Naming (camelCase):**
- `reduceMotion` — boolean flag from `prefers-reduced-motion` media query
- `CONFIG` — object of particle counts: `{ hearts, petals, confetti, foil, ambientPetals }`
- `particles` — array of active burst/confetti objects
- `emojiBalls` — array of physics-simulated emoji glyphs
- `EMOJIS` — constant array of emoji chars: `["🥰", "🫰", "❤️", "🫶", "🖖", "💌"]`
- `isOpen` — card state
- `openCard()`, `resetCard()`, `startLoop()`, `tick()` — main event handlers + animation loop

**Physics Configuration (in code, not external):**
- `var CONFIG = { hearts: 34, petals: 22, confetti: 78, foil: 26, ambientPetals: 9 }` (line ~574)
- `var count = 37` for emoji pile spawn (line ~689) — tuned by user for visual balance
- Emoji collision radius: `cR = vR * 1.18` (hitbox slightly larger than glyph visual radius, so they rest with a gap)
- Ball sleep threshold: `b.still > 12` (velocity drops below 0.25 for 12+ frames → immovable)

**Event Handlers:**
- `card.addEventListener("click", openCard)` — main interaction
- `card.addEventListener("keydown", ...)` — keyboard a11y (Enter/Space)
- `replay.addEventListener("click", resetCard)` — close + reset state
- `scroller.addEventListener("scroll", atBottom)` — scroll affordance tracking

## Code Style

### Formatting

**Indentation:** 2 spaces (in CSS and JavaScript).

**Inline CSS vs. External:** All styles in `<style>` block inside `<head>`. No external stylesheets.

**Inline JavaScript:** All code in `<script>` block at end of `<body>`. No external scripts.

**Line length:** Generally under 100 chars, but long CSS gradient/filter strings may exceed (acceptable for readability).

### Linting

**No linter is active.** Code must be:
- Valid HTML5 (DOCTYPE, charset meta, viewport meta)
- Valid CSS (property names, gradient syntax)
- Valid JavaScript (ES5 compatible, no bleeding globals)

**Validation before push (see Testing):**
1. Em-dash grep
2. JS parsing via `node -e` + `new Function()` check

### HTML Structure

**Semantic markup:**
- `role="button"`, `tabindex="0"` on clickable divs (card, future gift)
- `aria-label` on card: "Open your birthday card"
- `aria-hidden="true"` on decorative elements (seal SVG, petals, canvas, cover-back)
- HTML comments used for section markers: `<!-- INSIDE: the handwritten note -->`, etc.
- Search labels in comments: `<!-- ✏️ HER NAME: greeting. -->` (with pencil emoji for uniqueness)

**Self-contained file:**
- No external script tags (fonts loaded via `<link>` from Google Fonts CDN)
- No image dependencies except `photo.jpg` (the couple's photo)
- No CSS frameworks or utility libraries
- No icon fonts — all graphics are CSS (gradients, SVG paths inline)

## Animations & Transitions

### Entrance (Closed Card Idle)

```css
@keyframes settle {
  from { opacity: 0; transform: rotateX(16deg) translateY(34px) scale(.94); }
  to   { opacity: 1; transform: rotateX(6deg) translateY(0) scale(1); }
}
@keyframes eager {
  0%, 64%, 100%  { transform: rotateX(6deg) rotateZ(-.6deg) translate(0, 0); }
  32%, 70%-86%   { subtle translate/rotate for shimmy effect }
}
```

**Applied to `.card`:** `animation: settle 1.1s cubic-bezier(.2,.8,.2,1) both, eager 5s ease-in-out 1.1s infinite` — enters with settle, then breathes + shimmies forever.

### Open Transition

**Cover swings open:**
```css
.card.opened .cover {
  transform: rotateY(-164deg) translateZ(1px);  /* 164 deg, not 180, so it rests slightly open */
  transition: transform 1.15s cubic-bezier(.62,.04,.12,1);  /* overshoot ease */
}
```

**Inside revealed:**
```css
.inside { visibility: hidden; transform: translateZ(-1px); }
.card.opened .inside { visibility: visible; }
```
(visibility/transform used because `display: none` cannot be animated)

### Content Fade-In (After Open)

```css
@keyframes rise {
  from { opacity: 0; transform: translateY(14px) rotate(var(--r, 0deg)); }
  to   { opacity: 1; transform: translateY(0) rotate(var(--r, 0deg)); }
}
```

Staggered delays on polaroid (.5s), greeting (.66s), note (.84s), signoff (1.04s).

### Reduced Motion

**All motion removed under `@media (prefers-reduced-motion: reduce)`:**
- Animations set to `none !important`
- Transitions shortened or removed
- Content shows immediately with `opacity: 1` and `transform: none`
- Petal layer hidden (`display: none`)
- Emoji pile and particle effects skip entirely (`if (reduceMotion) return`)

**This is enforced in code:**
```javascript
var reduceMotion = window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// ... then in burst(), dropEmojis(), startDrizzle(): if (reduceMotion) return;
```

## Error Handling

**No explicit error handling.** The app assumes:
- Photo `photo.jpg` exists and loads (no fallback)
- Google Fonts load (no fallback to system fonts)
- Canvas API is available (no graceful degradation)
- JavaScript execution succeeds

**What happens if things fail:**
- Missing photo: broken image icon shown in polaroid
- Failed font load: system sans-serif used (visual regression, but functional)
- Canvas not supported: emoji pile doesn't render, but card still opens (rare on modern browsers)

## Logging

**No logging framework.** Debugging via:
- Browser console (errors, if any, logged by browser)
- Visual inspection (animations, physics, pile stability)

**Comments in code:**
- Section headers: `/* ---------- Stage ---------- */`
- Long algorithms (emoji physics): inline comments explain collision logic
- Config values: `var count = 37;` comment: `/* lots of emojis; the loose pile climbs up close to the bottom of the card (a little overlap is fine on phones) */`

## Comments

**When to comment:**
- Algorithm explanations (physics relaxation passes, collision detection)
- Non-obvious CSS (why visibility + transform is used instead of display, why translateZ creates new stacking context)
- Config rationale (why `count = 37`, why collision radius is `1.18x`)
- HTML search labels for personalization (✏️ markers)

**When NOT to comment:**
- Self-evident CSS class names or properties
- Simple event listeners
- Variable declarations with clear names

**JSDoc/TSDoc:** Not used (too lightweight a codebase).

## Function Design

### Size

**Mostly small:** 5–20 lines.

**Exceptions:**
- `updateEmoji()` (~65 lines) — physics simulation with nested collision loops
- `tick()` (~65 lines) — animation frame callback, updates all particles + emoji, draws

### Parameters

**Functions are passed only what they need:**
- `burst()` — no params, uses closure vars (W, H, ox, oy, CONFIG)
- `openCard()` — no params, manipulates DOM directly
- `atBottom()` — no params, checks `.inside-scroll` position

**Timeouts use closures for index:**
```javascript
for (var i = 0; i < count; i++) {
  (function (idx) {
    setTimeout(function () { ... }, idx * 55);
  })(i);
}
```
(IIFE to capture `idx` before `i` changes)

### Return Values

**Mostly void.** Some utility functions return booleans:
- `atBottom()` — implicit (side effect: adds/removes `.read` class)
- `updateEmoji()` — returns `awake` (bool, whether any emoji still moving)
- `rand(a, b)`, `pick(a)` — return number/element (utilities)

## Module Design

**Single monolithic module (IIFE):**
- No named exports or imports
- All state (card, particles, emojiBalls, etc.) in module scope
- Event listeners wired up in initialization block (`buildPetals()`, then listeners at bottom)

**Encapsulation:**
- `reduceMotion` flag initialized once
- DOM references cached: `var card = document.getElementById("card")`
- Particle/emoji arrays cleared on reset
- Animation loop (RAF) started on demand, stopped when idle

## Color Palette Constraints

**Enforced via CSS `:root`:**
```css
--paper:      #f8f1e3;   /* warm cream cardstock */
--rose:       #c25470;   /* single rich accent (HSL sat < 60%) */
--rose-deep:  #9e3a55;   /* wax seal / deepest accent */
--blush:      #e6b3bf;   /* soft secondary */
--gold-hi:    #f3dca0;   /* foil */
```

**Palette rules (taste-skill framework):**
- One warm cream background
- One restrained rose accent (low saturation, ~55% HSL)
- Soft blush secondary (desaturated pink)
- Warm gold foil tones
- No neon, no bright saturated colors
- All text in warm sepia ink, not black

**Particles use this palette:**
```javascript
var HEART_COLORS   = ["#c25470", "#9e3a55", "#e58a64", "#d97a8e"];
var CONFETTI_COLORS = ["#f3e8d4", "#cba455", "#e58a64", "#c25470", "#e6b3bf", "#f3dca0"];
```

## Font Stack

**Google Fonts loaded, three families:**

1. **Cormorant Garamond** (serif, display/foil)
   - Used: cover title "Happy Birthday" (italic, 600 weight, gold gradient)
   - Used: "18" medallion (italic, 600 weight)
   - Weights: 500, 600 (italic variants)
   - Aesthetic: elegant, hand-drawn serifs, letterpress feel

2. **Caveat** (handwritten cursive)
   - Used: greeting, note, signoff, polaroid caption, "keep reading" cue, "read it again" button, seal hover state
   - Weights: 500, 600, 700
   - Aesthetic: loose, handwritten, personal (ragged-left in note)

3. **Outfit** (sans-serif, UI)
   - Used: eyebrow ("FOR YOU"), "PRESS TO OPEN" label, small caps
   - Weights: 400, 500
   - Aesthetic: modern, uppercase, small and restrained

**Fallback:** `system-ui, -apple-system, sans-serif` if fonts fail to load (visual regression risk).

## Viewport & Responsive

**Viewport meta:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

**Card sizing:**
```css
.card {
  width: min(84vw, 350px);
  height: min(72vh, 470px);
}
```
(responsive, but constrained max width for readability)

**Mobile layout (max-width: 580px):**
```css
@media (max-width: 580px) {
  .card.opened { transform: rotateX(2deg) translateX(0) translateY(-5%); }
}
```
(shifts on small screens, allows emoji pile overlap)

**Design assumption:** Portrait orientation, iPhone/mobile device. Landscape not tested.

---

*Conventions analysis: 2026-06-29*
