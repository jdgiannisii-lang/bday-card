<!-- GSD:project-start source:PROJECT.md -->

## Project

**Birthday Card App**

A build-your-own animated greeting-card web app. A sender hand-crafts a tasteful,
non-templated animated card (a `<canvas>` particle/effect engine - not cheesy
template/AI slop) and shares it as a link/QR. The recipient opens it in any
browser with **zero friction** (no signup, no install, ever), and can become a
sender in the same session. Beachhead: long-distance couples **and** college
students sending to family. Today it is a small multi-page product:
`index.html` is the landing page / effects showcase, `maker.html` is the
no-signup card maker (Supabase-backed), `card.html` is the recipient view
(shared as `card.html?c=<token>`; `404.html` is generated at deploy as a copy
of `card.html` for clean `/c/<token>/` links), and `rachel.html` is the
original hand-made card that started the project (kept live).

**Core Value:** The recipient's open is sacred: a beautiful card that plays instantly in any
browser with zero friction, where every recipient can become a sender in the
same session (the viral loop). If everything else fails, that must work.

### Constraints

- **Team**: Solo founder - velocity is the scarcest resource; prefer the known stack (React + Supabase) and managed/free tiers.
- **Tech stack**: Web-first, one codebase, edge-served; recipient view must paint with zero blocking network calls and require no auth.
- **Budget**: Marginal cost per card ≈ $0 (deterministic canvas, free sends fuel the loop). Real pre-public infra floor ≈ $50–80/mo (Supabase Pro backups + Resend Pro + moderation), not $0.
- **Content rule**: ZERO em-dashes in card content (HANDOFF.md - the #1 AI tell; validated by grep). Hold the taste line: handcrafted, never cheesy.
- **Legal**: User-uploaded photos + anonymous sends → image moderation + CSAM reporting (18 USC 2258A) are mandatory before public traffic, not optional.
- **Sequencing**: Each stage is a gate, not a date. Don't build Stage 1 until Stage 0's K-factor clears a pre-committed threshold.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- HTML5 - Full application markup and structure (`index.html`)
- CSS3 - Styling, animations, 3D transforms, media queries (`index.html`)
- JavaScript (ES5+) - Interactive behaviors, canvas animation engine, particle physics (`index.html`)

## Runtime

- Browser (all modern browsers: Chrome, Safari, Firefox, Edge)
- No server-side runtime required
- None - zero external dependencies

## Frameworks

- Vanilla HTML/CSS/JavaScript (no framework)
- Browser DOM API for 3D transforms (CSS `preserve-3d`, `transform-style`, perspective)
- HTML5 Canvas API for particle effects and emoji-ball physics
- CSS3 Keyframes (`@keyframes`)
- requestAnimationFrame for 60fps canvas rendering
- GPU-accelerated transforms (3D perspective, rotations)
- None - static HTML pages served as-is, no build step (`404.html` is generated at deploy as a copy of `card.html`)

## Key Dependencies

- None (intentionally zero-dependency)
- Google Fonts API
- HTML5 Canvas 2D Context (`ctx.getContext("2d")`)
- Media Queries (`prefers-reduced-motion`)
- Document visibility API (`document.hidden`)
- requestAnimationFrame for animation loop
- Touch/Click events

## Configuration

- Client config lives in `shared/config.js` (gitignored). For local work, copy `shared/config.example.js` to `shared/config.js` and fill in the Supabase values. At deploy, the Pages workflow generates it from repo Variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `POSTHOG_KEY`, `POSTHOG_HOST`).
- Every key in that config is public by design (Supabase anon key, PostHog `phc_` key); RLS is the real access control. NEVER put the service_role key there.
- No secrets or credentials in the repo; client-side only.
- Files are served as-is (no build step); the only deploy-time artifacts are `shared/config.js` (generated from repo Variables) and `404.html` (a copy of `card.html`).
- Each page is self-contained HTML with inline CSS/JS, importing the ES modules in `shared/`
- Static assets: `photo.jpg` (couple's photo, ~353K), `og-card.png` (link preview image)

## Platform Requirements

- Text editor (any)
- Python 3.x for local HTTP server (optional): `python3 -m http.server 8000`
- Node.js (optional) for validation script only (see HANDOFF.md)
- Static file hosting only (GitHub Pages, Netlify, Vercel, or any CDN); Supabase (managed free tier) is the only backend
- No build pipeline; files deploy as-is (`404.html` and `shared/config.js` are generated at deploy by the Pages workflow)
- HTTPS recommended (GitHub Pages provides this by default)
- Modern browsers with CSS 3D Transforms support (Chrome, Safari, Firefox, Edge - all recent versions)
- Graceful degradation: reduced-motion media query respects accessibility preferences
- Responsive: works on desktop, tablet, mobile (iPhone portrait priority per design)

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Overview

## Critical Project Rules

### Em-Dash Ban (Absolute Rule)

- **Why**: Em-dash is the #1 tell of AI-generated text (all LLMs default to em-dashes). This card must feel handmade.
- **Where**: the note message, dedication, signoff, page title, comments, all text content in `index.html`
- **Validation**: Before every commit/push, run:
- **Use instead**: periods, commas, parentheses, or hyphens (U+002D)

### Personalization Markers

- `✏️ HER NAME` - greeting recipient name
- `✏️ PHOTO` - polaroid `<img src>` path
- `✏️ MESSAGE GOES HERE` - handwritten note body

## Naming Patterns

### Files & Directories

- **index.html**: single entry point, inline CSS + JS
- **photo.jpg**: recipient's photo for polaroid (~353K, portrait orientation)
- **README.md**: user-facing setup/deployment guide
- **.github/workflows/deploy-pages.yml**: GitHub Pages deploy (one-time setup required for visibility + branch config)

### CSS Classes & Custom Properties

- `.stage` - perspective viewport
- `.card` - 3D card container (preserve-3d)
- `.face` - individual 3D panel (inside, cover, cover-back)
- `.inside` - note side (hidden until opened)
- `.inside-scroll` - scrollable note area
- `.cover` - front flap (swings open on rotateY)
- `.cover-back` - back of cover (glimpsed during swing)
- `.polaroid` - taped photo
- `.greeting` - "Happy Birthday, Rachel!" heading
- `.note` - handwritten message (Caveat font, ragged-left)
- `.signoff` - "With immeasurable love, JD" + emoji
- `.seal` - wax seal button on cover (animated breathe)
- `.replay` - "read it again" button (hidden until card opens)
- `.scroll-fade` - bottom gradient fade (opacity 0 by default)
- `.scroll-cue` - "keep reading" affordance text + arrow
- Modifiers: `.opened`, `.has-more`, `.read`, `.show` (added/removed by JS)
- `.seal` has `.animation: breathe` idle; pauses on `.card:hover`
- `.cover` transitions on `rotateY` open
- `.inside-*` elements fade in via `.rise` keyframe with staggered delays

### JavaScript

- `reduceMotion` - boolean flag from `prefers-reduced-motion` media query
- `CONFIG` - object of particle counts: `{ hearts, petals, confetti, foil, ambientPetals }`
- `particles` - array of active burst/confetti objects
- `emojiBalls` - array of physics-simulated emoji glyphs
- `EMOJIS` - constant array of emoji chars: `["🥰", "🫰", "❤️", "🫶", "🖖", "💌"]`
- `isOpen` - card state
- `openCard()`, `resetCard()`, `startLoop()`, `tick()` - main event handlers + animation loop
- `var CONFIG = { hearts: 34, petals: 22, confetti: 78, foil: 26, ambientPetals: 9 }` (line ~574)
- `var count = 37` for emoji pile spawn (line ~689) - tuned by user for visual balance
- Emoji collision radius: `cR = vR * 1.18` (hitbox slightly larger than glyph visual radius, so they rest with a gap)
- Ball sleep threshold: `b.still > 12` (velocity drops below 0.25 for 12+ frames → immovable)
- `card.addEventListener("click", openCard)` - main interaction
- `card.addEventListener("keydown", ...)` - keyboard a11y (Enter/Space)
- `replay.addEventListener("click", resetCard)` - close + reset state
- `scroller.addEventListener("scroll", atBottom)` - scroll affordance tracking

## Code Style

### Formatting

### Linting

- Valid HTML5 (DOCTYPE, charset meta, viewport meta)
- Valid CSS (property names, gradient syntax)
- Valid JavaScript (ES5 compatible, no bleeding globals)

### HTML Structure

- `role="button"`, `tabindex="0"` on clickable divs (card, future gift)
- `aria-label` on card: "Open your birthday card"
- `aria-hidden="true"` on decorative elements (seal SVG, petals, canvas, cover-back)
- HTML comments used for section markers: `<!-- INSIDE: the handwritten note -->`, etc.
- Search labels in comments: `<!-- ✏️ HER NAME: greeting. -->` (with pencil emoji for uniqueness)
- No external script tags (fonts loaded via `<link>` from Google Fonts CDN)
- No image dependencies except `photo.jpg` (the couple's photo)
- No CSS frameworks or utility libraries
- No icon fonts - all graphics are CSS (gradients, SVG paths inline)

## Animations & Transitions

### Entrance (Closed Card Idle)

### Open Transition

### Content Fade-In (After Open)

### Reduced Motion

- Animations set to `none !important`
- Transitions shortened or removed
- Content shows immediately with `opacity: 1` and `transform: none`
- Petal layer hidden (`display: none`)
- Emoji pile and particle effects skip entirely (`if (reduceMotion) return`)

## Error Handling

- Photo `photo.jpg` exists and loads (no fallback)
- Google Fonts load (no fallback to system fonts)
- Canvas API is available (no graceful degradation)
- JavaScript execution succeeds
- Missing photo: broken image icon shown in polaroid
- Failed font load: system sans-serif used (visual regression, but functional)
- Canvas not supported: emoji pile doesn't render, but card still opens (rare on modern browsers)

## Logging

- Browser console (errors, if any, logged by browser)
- Visual inspection (animations, physics, pile stability)
- Section headers: `/* ---------- Stage ---------- */`
- Long algorithms (emoji physics): inline comments explain collision logic
- Config values: `var count = 37;` comment: `/* lots of emojis; the loose pile climbs up close to the bottom of the card (a little overlap is fine on phones) */`

## Comments

- Algorithm explanations (physics relaxation passes, collision detection)
- Non-obvious CSS (why visibility + transform is used instead of display, why translateZ creates new stacking context)
- Config rationale (why `count = 37`, why collision radius is `1.18x`)
- HTML search labels for personalization (✏️ markers)
- Self-evident CSS class names or properties
- Simple event listeners
- Variable declarations with clear names

## Function Design

### Size

- `updateEmoji()` (~65 lines) - physics simulation with nested collision loops
- `tick()` (~65 lines) - animation frame callback, updates all particles + emoji, draws

### Parameters

- `burst()` - no params, uses closure vars (W, H, ox, oy, CONFIG)
- `openCard()` - no params, manipulates DOM directly
- `atBottom()` - no params, checks `.inside-scroll` position

### Return Values

- `atBottom()` - implicit (side effect: adds/removes `.read` class)
- `updateEmoji()` - returns `awake` (bool, whether any emoji still moving)
- `rand(a, b)`, `pick(a)` - return number/element (utilities)

## Module Design

- No named exports or imports
- All state (card, particles, emojiBalls, etc.) in module scope
- Event listeners wired up in initialization block (`buildPetals()`, then listeners at bottom)
- `reduceMotion` flag initialized once
- DOM references cached: `var card = document.getElementById("card")`
- Particle/emoji arrays cleared on reset
- Animation loop (RAF) started on demand, stopped when idle

## Color Palette Constraints

- One warm cream background
- One restrained rose accent (low saturation, ~55% HSL)
- Soft blush secondary (desaturated pink)
- Warm gold foil tones
- No neon, no bright saturated colors
- All text in warm sepia ink, not black

## Font Stack

## Viewport & Responsive

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text

```

## Component Responsibilities

| Component | Responsibility | File | Lines |
|-----------|----------------|------|-------|
| **Card (3D object)** | Central interactive element; 3D perspective transforms, open/close flip, idle animation | `.card`, `.face`, `.cover`, `.inside` in `index.html` | 84–151, 287–438 (CSS) |
| **Inside (Note face)** | Displays personalized message, polaroid photo, greeting, signoff; handles scroll affordance | `.inside`, `.inside-scroll`, `.polaroid`, `.greeting`, `.note`, `.signoff` | 137–285 (CSS) |
| **Cover (Front flap)** | Displays cover title (gold foil), wax seal, "press to open" label, dedication, "18" medallion; rotates on open | `.cover`, `.cover-content`, `.seal`, `.milestone` | 287–438 (CSS) |
| **Canvas (#fx)** | Renders particle effects (hearts, confetti, petals, foil) and emoji balls via requestAnimationFrame | `#fx` canvas element + JS rendering loop | 441–447 (HTML), 806–859 (JS) |
| **Particle system** | Manages 4 particle types (hearts, confetti, petals, foil) with gravity, rotation, fade decay | `particles[]`, `burst()`, `tick()` | 614–666, 806–850 (JS) |
| **Emoji physics** | Drops emoji balls, applies gravity/collision/relaxation, detects settlement, renders as text on canvas | `emojiBalls[]`, `dropEmojis()`, `updateEmoji()`, `drawEmoji()` | 673–786 (JS) |
| **Scroll affordance** | Shows "keep reading" cue + fade only when note overflows; hides at end | `refreshCue()`, `atBottom()`, `.scroll-fade`, `.scroll-cue` | 153–206 (CSS), 587–600 (JS) |
| **Ambient petals (DOM)** | Soft, drifting petals in background (reduced-motion aware) | `.petals` layer, `buildPetals()` | 467–482 (CSS), 861–875 (JS) |
| **Replay button** | Resets card to closed state; only shown after card opens | `.replay` button, `resetCard()` | 449–465 (CSS), 891–901, 906–909 (JS) |

## Pattern Overview

- **No framework, no dependencies.** Pure vanilla HTML, CSS, and JavaScript in one file.
- **GPU-accelerated transforms.** 3D perspective, `transform: preserve-3d`, `will-change: transform` for 60fps motion.
- **Reduced-motion-first.** All animations degrade gracefully; CSS media query checks `prefers-reduced-motion: reduce`.
- **Prefers accessibility.** Card has `role="button"`, keyboard handlers (Enter/Space), scroll affordance for long messages, `aria-label` and `aria-hidden`.
- **Self-contained personalization.** Three clear search markers (HER NAME, PHOTO, MESSAGE GOES HERE) guide customization without touching code structure.

## Layers

- Purpose: Render the 3D card, layout content, handle responsive design, define colors/fonts, coordinate animations.
- Location: `<style>` block in `index.html` (lines 31–495).
- Contains: CSS Grid/Flexbox layout, CSS Custom Properties (`:root` palette), keyframe animations (`settle`, `eager`, `foil`, `breathe`, `rise`, `drift`, `nudge`), media queries.
- Depends on: Nothing (pure CSS).
- Used by: The DOM (all `.card`, `.face`, `.inside`, `.cover` elements bind to these styles).
- Purpose: Structure the card into logical sections (cover, inside, polaroid, greeting, note, signoff, controls).
- Location: HTML structure in `index.html` (lines 499–567).
- Contains: Semantic markup, personalization slots (`<!-- ✏️ HER NAME -->`), image, form elements (button), SVG (heart, bow).
- Depends on: CSS (styling); JS (event listeners, class toggling).
- Used by: The browser renderer; JS event handlers.
- Purpose: Respond to user input (click, keyboard, scroll), orchestrate state transitions, invoke effects.
- Location: IIFE in `<script>` block (lines 569–915).
- Contains: Event listeners (`click`, `keydown`, `scroll`, `resize`, `visibilitychange`), open/close choreography (`openCard`, `resetCard`), scroll tracking (`refreshCue`, `atBottom`).
- Depends on: Presentation Layer (to read computed styles, apply/remove classes); Canvas Layer (to render).
- Used by: The browser's event loop.
- Purpose: Animate particle effects and emoji via immediate-mode rendering in the `#fx` canvas.
- Location: `<canvas id="fx">` (line 566) + JS rendering loop and particle systems (lines 569–915).
- Contains: Four particle types (hearts, confetti, petals, foil) each with motion physics; emoji balls with collision/gravity sim; `tick()` requestAnimationFrame loop.
- Depends on: Interaction Layer (to know when to start/stop drawing); Math (sin/cos for particle motion).
- Used by: User's visual perception of celebration effects.

## Data Flow

### Primary Request Path: Card Open

### Secondary Flow: Scroll Tracking

### Tertiary Flow: Card Close (Replay)

- `isOpen` boolean tracks card state (line 878)
- `particles[]` array holds active particle objects (line 618)
- `emojiBalls[]` array holds emoji ball objects with position/velocity/collision radius (line 673)
- `raf` holds requestAnimationFrame ID; used to cancel/restart loop (line 803)
- `drizzle` holds setInterval ID for ambient petal spawning (line 788)
- Classes (`.opened`, `.has-more`, `.read`, `.show`) toggle visibility and animation state in CSS

## Key Abstractions

- Purpose: Represents a single animated element (heart, confetti, petal, or foil piece) with physics.
- Example: `{ kind: "heart", x, y, vx, vy, g (gravity), size, rot, vr (rotational velocity), color, life, decay }`
- Pattern: Simple object literal; position/velocity updated in `tick()` loop; life decays linearly; drawn via canvas.fill().
- Purpose: Represents a single falling/colliding emoji with settlement detection.
- Example: `{ x, y, vx, vy, vR (visual radius), cR (collision radius), rot, vrot, char (emoji), still, asleep }`
- Pattern: Dropped in staggered timeouts; updated in physics loop with gravity, wall bounce, friction; collision pairs resolved via relaxation passes; transitions to `asleep` when velocity < threshold for >12 frames (becomes immovable).
- `tick()` runs each frame
- For each particle: translate, rotate, set alpha, call drawing function (`heartPath()`, ellipse, rect, diamond), restore context
- Cleanup: filter dead particles if array grows > 700

## Entry Points

- Location: `index.html` in browser
- Triggers: Page load (displays closed card in idle animation)
- Responsibilities: Render the 3D card, bind listeners, initialize canvas
- Handler: `.card` click listener (line 902)
- Triggers: User clicks card or presses Enter/Space
- Responsibilities: Invoke `openCard()`, choreograph celebration effects
- Handler: `.card` keydown listener (line 903-905)
- Triggers: User presses Enter or Space with focus on card
- Responsibilities: Same as click (call `openCard()`)
- Handler: `.replay` button click listener (line 906-909)
- Triggers: User clicks "read it again" button
- Responsibilities: Call `resetCard()`, close card back to tappable state

## Architectural Constraints

- **Threading:** Single-threaded event loop. Rendering, interaction, and physics all run on the same thread via requestAnimationFrame.
- **Global state:** IIFE scope encapsulates all state (`card`, `inside`, `particles`, `emojiBalls`, `isOpen`, `raf`, `drizzle`); nothing leaks to `window` (KEEP THIS).
- **Reduced-motion handling:** All particle systems check `reduceMotion` variable (line 576-577) and skip if `true`. CSS media query (`prefers-reduced-motion: reduce`) also disables animations and shows elements instantly. **Any new animation MUST degrade under reduced motion.**
- **Canvas size:** Crisp on high-DPI displays via `dpr = Math.min(devicePixelRatio, 2)` and `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` (line 603-609).
- **Responsive:** Card width/height use `min()` with vw/vh + px fallbacks (line 86-87); fonts use `clamp()` for fluid scaling; mobile layout via media queries (line 116-118).
- **No circular imports:** Single file, IIFE scope, no modules.
- **Resource cleanup:** `stopDrizzle()` clears interval; `resetCard()` clears particles and canvas; `tick()` stops scheduling frames when nothing is alive (line 857-858).

## Anti-Patterns

### AI-Generated Aesthetic (Broken)

- **No em-dashes** anywhere (most obvious AI tell). Use periods, commas, hyphens, parentheses. Validate: `grep -c "$(printf '\xe2\x80\x94')" index.html` must print `0`.
- **Restrained palette:** CSS vars use warm cream paper, one rose accent, soft blush, gold foil. No neon. Saturation < 60%. (See `:root` lines 32-46.)
- **Careful fonts:** Cormorant Garamond (letterpress), Caveat (handwritten), Outfit (UI). No Comic Sans, no system fonts.
- **One corner radius:** `--radius: 14px` throughout. No variety.
- **Soft shadows:** Multiple layers with low opacity, not harsh contrasts.
- **Emoji exception:** Unlike the taste rules, emoji ARE allowed in this card's copy (user requested). Everything else still applies.

### Over-Personalization Breaking Layout

- **Name:** Keep under ~20 chars (e.g., "Rachel" fits fine; "Supercalifragilisticexpialidocious" does not). Heading uses `clamp()` sizing.
- **Message:** Unlimited; scrolls inside `.inside-scroll` with scroll affordance. No hard limit, but test visually.
- **Photo:** Use portrait-oriented images (height > width). `object-fit: cover; object-position: center 40%` crops to face. Square or landscape images still work but may cut top/bottom.

### Uncontrolled Canvas Particle Accumulation

## Error Handling

- **Missing photo:** `<img>` fails to load (404), polaroid renders with broken-image icon. User notices and fixes src.
- **Reduced motion:** All animations skip entirely; elements appear instantly. No JS errors, no fallback jank.
- **Canvas not available:** Unlikely on modern browsers, but if `#fx` fails, particle rendering skips; card still opens and note displays.
- **Photo.jpg missing:** Card still works; photo.jpg appears as broken image. Personalize step mentions replacing src with file path or URL.

## Cross-Cutting Concerns

```bash

```

- Card has `role="button"`, `tabindex="0"`, `aria-label="Open your birthday card"`.
- Replay button is a native `<button>` element.
- Decorative elements use `aria-hidden="true"`.
- Scroll affordance and particle layers are `pointer-events: none` so they don't steal focus.
- Keyboard support: Enter/Space to open, Tab to navigate replay button.
- **GPU acceleration:** `transform: preserve-3d`, `will-change: transform`, `transition` on `.card` and `.cover` move transforms to GPU.
- **Particle count:** Configurable via `CONFIG` object (line 574); default is conservative (34 hearts, 78 confetti, 22 petals, 26 foil).
- **Frame rate:** `requestAnimationFrame` targets 60fps; `tick()` stops scheduling when nothing is alive.
- **Page visibility:** `visibilitychange` listener stops `tick()` loop when tab is hidden to save CPU (line 910-912).

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

<!-- project-rule (manual, keep across GSD regen): UI verification -->

## UI Verification (project rule)

**Any UI/UX built or changed in this repo MUST be verified with Playwright before it's considered done** - render the page, screenshot each surface, and exercise the core flow (for Phase 1: create card → get link/QR → open `/c/<token>/` and watch it play → tap "Make one for someone you love" → land back in the maker). Fix anything that looks or behaves wrong. Do not rely on "the code looks right." The `claude-in-chrome` extension is not connected here - use the local/global Playwright install. This applies to every frontend phase (the maker form, the card view, the share state, the CTA reveal).
