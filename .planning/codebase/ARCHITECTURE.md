<!-- refreshed: 2026-06-29 -->
# Architecture

**Analysis Date:** 2026-06-29

## System Overview

This is a single-file animated greeting card — a self-contained web app built entirely in vanilla HTML/CSS/JavaScript with no build step or external runtime dependencies. The entire application logic lives in `index.html` structured as a 3D card that opens to reveal a personalized handwritten note.

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Presentation Layer (CSS)                      │
│  .stage (3D perspective) → .card (3D transform) → 3 .face panels │
│  - .cover (front flap that rotates open)                         │
│  - .inside (handwritten note with scrollable content)            │
│  - .cover-back (back of the flap)                                │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
   Content Layer         Interaction Layer    Animation Layer
   (DOM nodes)           (Event handlers)     (Canvas + CSS)
   - Polaroid photo      - click/keyboard     - particle effects
   - Greeting text       - tap handlers       - emoji physics
   - Handwritten note    - open/reset flows   - foil text shimmer
   - Signoff             - scroll tracking    - card entrance/idle
   `index.html           `index.html          `index.html
   lines ~505-567        lines ~902-912       lines ~84-494 (CSS)
                                              lines ~569-915 (JS)
         │                    │                    │
         └────────────────────┼────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│              State & Lifecycle Management                         │
│  openCard() → burst() → dropEmojis() → startDrizzle()            │
│  resetCard() → clear canvas, remove classes, hide replay button   │
│  `index.html lines ~878-912                                      │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Rendering (Canvas Layer #fx)                        │
│  tick() requestAnimationFrame loop                               │
│  - Particle updates (hearts, confetti, petals, foil)             │
│  - Emoji physics (collision, gravity, resting)                   │
│  - Canvas draw calls                                              │
│  `index.html lines ~806-859                                      │
└─────────────────────────────────────────────────────────────────┘
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

**Overall:** Single-file web app with **Immediate-Mode Rendering** (canvas) + **Retained-Mode UI** (DOM).

The card is a 3D DOM object that transforms on interaction; celebration effects (particles, emoji) render to canvas via a requestAnimationFrame loop. All state changes flow through two lifecycle functions: `openCard()` (triggers a choreographed sequence of timeouts) and `resetCard()` (clears state and hides effects).

**Key Characteristics:**
- **No framework, no dependencies.** Pure vanilla HTML, CSS, and JavaScript in one file.
- **GPU-accelerated transforms.** 3D perspective, `transform: preserve-3d`, `will-change: transform` for 60fps motion.
- **Reduced-motion-first.** All animations degrade gracefully; CSS media query checks `prefers-reduced-motion: reduce`.
- **Prefers accessibility.** Card has `role="button"`, keyboard handlers (Enter/Space), scroll affordance for long messages, `aria-label` and `aria-hidden`.
- **Self-contained personalization.** Three clear search markers (HER NAME, PHOTO, MESSAGE GOES HERE) guide customization without touching code structure.

## Layers

**Presentation Layer (CSS):**
- Purpose: Render the 3D card, layout content, handle responsive design, define colors/fonts, coordinate animations.
- Location: `<style>` block in `index.html` (lines 31–495).
- Contains: CSS Grid/Flexbox layout, CSS Custom Properties (`:root` palette), keyframe animations (`settle`, `eager`, `foil`, `breathe`, `rise`, `drift`, `nudge`), media queries.
- Depends on: Nothing (pure CSS).
- Used by: The DOM (all `.card`, `.face`, `.inside`, `.cover` elements bind to these styles).

**Content Layer (DOM):**
- Purpose: Structure the card into logical sections (cover, inside, polaroid, greeting, note, signoff, controls).
- Location: HTML structure in `index.html` (lines 499–567).
- Contains: Semantic markup, personalization slots (`<!-- ✏️ HER NAME -->`), image, form elements (button), SVG (heart, bow).
- Depends on: CSS (styling); JS (event listeners, class toggling).
- Used by: The browser renderer; JS event handlers.

**Interaction Layer (JavaScript):**
- Purpose: Respond to user input (click, keyboard, scroll), orchestrate state transitions, invoke effects.
- Location: IIFE in `<script>` block (lines 569–915).
- Contains: Event listeners (`click`, `keydown`, `scroll`, `resize`, `visibilitychange`), open/close choreography (`openCard`, `resetCard`), scroll tracking (`refreshCue`, `atBottom`).
- Depends on: Presentation Layer (to read computed styles, apply/remove classes); Canvas Layer (to render).
- Used by: The browser's event loop.

**Rendering Layer (Canvas):**
- Purpose: Animate particle effects and emoji via immediate-mode rendering in the `#fx` canvas.
- Location: `<canvas id="fx">` (line 566) + JS rendering loop and particle systems (lines 569–915).
- Contains: Four particle types (hearts, confetti, petals, foil) each with motion physics; emoji balls with collision/gravity sim; `tick()` requestAnimationFrame loop.
- Depends on: Interaction Layer (to know when to start/stop drawing); Math (sin/cos for particle motion).
- Used by: User's visual perception of celebration effects.

## Data Flow

### Primary Request Path: Card Open

1. **User clicks/taps `.card`** (`index.html` line 902: `card.addEventListener("click", openCard)`)
   - Alternative: keyboard press Enter or Space (line 903-905: `keydown` listener)

2. **`openCard()` function enters** (line 879-890)
   - Sets `isOpen = true`
   - Adds `.opened` class to `.card` (triggers CSS animations: cover rotation, inside visibility, elements rise)
   - Resets scroll position to top

3. **Choreographed timeouts fire:**
   - **T+0.44s:** `burst()` (line 885) spawns 4 particle types (hearts, confetti, petals, foil) with random velocities into `particles[]`
   - **T+0.52s:** `dropEmojis()` (line 886) queues emoji balls to drop staggered every 55ms into `emojiBalls[]`
   - **T+1.3s:** `startDrizzle()` (line 887) begins `setInterval` loop spawning slow descending petals
   - **T+1.5s:** Replay button becomes visible (line 888: `.replay.classList.add("show")`)
   - **T+1.25s:** `refreshCue()` (line 889) checks if note overflows and shows scroll affordance

4. **Rendering loop starts:** `tick()` via `requestAnimationFrame` (line 804)
   - Clears canvas
   - Updates all particles (apply gravity, velocity, rotation, alpha decay)
   - Updates emoji balls (gravity, collision resolve with relaxation passes, settlement detection)
   - Draws hearts, confetti, petals, foil via context.fill()
   - Draws emoji glyphs via context.fillText()
   - Schedules next frame if anything is still alive

5. **User sees:**
   - Cover swings open (1.15s ease-out via CSS transition)
   - Inside content fades in and rises (staggered: polaroid 0.5s, greeting 0.66s, note 0.84s, signoff 1.04s)
   - Particle burst explodes outward and drifts down
   - Emoji balls drop and pile at the bottom
   - Soft petals drizzle from the top

### Secondary Flow: Scroll Tracking

1. **Note content scrolls** inside `.inside-scroll` (line 599: `scroll` event listener, passive)
2. **`atBottom()` fires** (line 589-593)
   - Checks if scrollTop + clientHeight >= scrollHeight - 8
   - Toggles `.read` class on `.inside`
3. **CSS hides cue** (line 205-206: `.inside.has-more.read .scroll-fade, .inside.has-more.read .scroll-cue { opacity: 0; }`)

### Tertiary Flow: Card Close (Replay)

1. **User clicks `.replay` button** (line 906-909: click listener, `stopPropagation` prevents card re-open)
2. **`resetCard()` function enters** (line 891-901)
   - Sets `isOpen = false`
   - Removes `.opened` class from `.card` (CSS reverses all animations)
   - Clears particles, emoji, drizzle interval
   - Clears canvas
   - Hides replay button
   - Resets scroll and scroll affordance classes
3. **Card returns to idle idle state** (`.eager` animation resumes)

**State Management:**
- `isOpen` boolean tracks card state (line 878)
- `particles[]` array holds active particle objects (line 618)
- `emojiBalls[]` array holds emoji ball objects with position/velocity/collision radius (line 673)
- `raf` holds requestAnimationFrame ID; used to cancel/restart loop (line 803)
- `drizzle` holds setInterval ID for ambient petal spawning (line 788)
- Classes (`.opened`, `.has-more`, `.read`, `.show`) toggle visibility and animation state in CSS

## Key Abstractions

**Particle Object:**
- Purpose: Represents a single animated element (heart, confetti, petal, or foil piece) with physics.
- Example: `{ kind: "heart", x, y, vx, vy, g (gravity), size, rot, vr (rotational velocity), color, life, decay }`
- Pattern: Simple object literal; position/velocity updated in `tick()` loop; life decays linearly; drawn via canvas.fill().

**Emoji Ball Object:**
- Purpose: Represents a single falling/colliding emoji with settlement detection.
- Example: `{ x, y, vx, vy, vR (visual radius), cR (collision radius), rot, vrot, char (emoji), still, asleep }`
- Pattern: Dropped in staggered timeouts; updated in physics loop with gravity, wall bounce, friction; collision pairs resolved via relaxation passes; transitions to `asleep` when velocity < threshold for >12 frames (becomes immovable).

**Canvas Rendering Pattern:**
- `tick()` runs each frame
- For each particle: translate, rotate, set alpha, call drawing function (`heartPath()`, ellipse, rect, diamond), restore context
- Cleanup: filter dead particles if array grows > 700

## Entry Points

**Primary (User-facing):**
- Location: `index.html` in browser
- Triggers: Page load (displays closed card in idle animation)
- Responsibilities: Render the 3D card, bind listeners, initialize canvas

**Click/Tap Entry:**
- Handler: `.card` click listener (line 902)
- Triggers: User clicks card or presses Enter/Space
- Responsibilities: Invoke `openCard()`, choreograph celebration effects

**Keyboard Entry:**
- Handler: `.card` keydown listener (line 903-905)
- Triggers: User presses Enter or Space with focus on card
- Responsibilities: Same as click (call `openCard()`)

**Replay Entry:**
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

**What happens:** The card could look like a template generated by an LLM (symmetric, too-polished, no character).

**Why it's wrong:** The user explicitly asked for a card that feels *handmade*, not AI-generic. This defeats the purpose.

**Do this instead:** Enforce constraints from `taste-skill`:
- **No em-dashes** anywhere (most obvious AI tell). Use periods, commas, hyphens, parentheses. Validate: `grep -c "$(printf '\xe2\x80\x94')" index.html` must print `0`.
- **Restrained palette:** CSS vars use warm cream paper, one rose accent, soft blush, gold foil. No neon. Saturation < 60%. (See `:root` lines 32-46.)
- **Careful fonts:** Cormorant Garamond (letterpress), Caveat (handwritten), Outfit (UI). No Comic Sans, no system fonts.
- **One corner radius:** `--radius: 14px` throughout. No variety.
- **Soft shadows:** Multiple layers with low opacity, not harsh contrasts.
- **Emoji exception:** Unlike the taste rules, emoji ARE allowed in this card's copy (user requested). Everything else still applies.

### Over-Personalization Breaking Layout

**What happens:** User pastes a very long name, a multi-page message, or a huge photo, and the card layout breaks: text overflows, polaroid distorts, scroll affordance miscalculates.

**Why it's wrong:** Personalization should gracefully degrade, not crash the design.

**Do this instead:**
- **Name:** Keep under ~20 chars (e.g., "Rachel" fits fine; "Supercalifragilisticexpialidocious" does not). Heading uses `clamp()` sizing.
- **Message:** Unlimited; scrolls inside `.inside-scroll` with scroll affordance. No hard limit, but test visually.
- **Photo:** Use portrait-oriented images (height > width). `object-fit: cover; object-position: center 40%` crops to face. Square or landscape images still work but may cut top/bottom.

### Uncontrolled Canvas Particle Accumulation

**What happens:** `particles[]` array grows unbounded on repeated card opens, eating memory and slowing render loop.

**Why it's wrong:** Each burst adds 138 particles (34 hearts + 78 confetti + 22 petals + 26 foil); after 5 opens, that's 690 in the array, growing linearly.

**Do this instead:** `tick()` prunes dead particles if array exceeds 700 (line 851). `resetCard()` clears the array entirely (line 897). Monitor in `dropEmojis()`: stagger spawns so they don't all exist at once; settles quickly.

## Error Handling

**Strategy:** Graceful degradation. No errors should break the card.

**Patterns:**
- **Missing photo:** `<img>` fails to load (404), polaroid renders with broken-image icon. User notices and fixes src.
- **Reduced motion:** All animations skip entirely; elements appear instantly. No JS errors, no fallback jank.
- **Canvas not available:** Unlikely on modern browsers, but if `#fx` fails, particle rendering skips; card still opens and note displays.
- **Photo.jpg missing:** Card still works; photo.jpg appears as broken image. Personalize step mentions replacing src with file path or URL.

## Cross-Cutting Concerns

**Logging:** None in production (no console output). For debugging: manually add `console.log(particles.length)` in `tick()` or `console.log("openCard")` in event handler.

**Validation:** Before push, run:
```bash
# Em-dash ban (must print 0)
grep -c "$(printf '\xe2\x80\x94')" index.html

# JS syntax check
node -e '
const fs=require("fs");const L=fs.readFileSync("index.html","utf8").split("\n");
let s=-1,e=-1;for(let i=0;i<L.length;i++){const t=L[i].trim();
if(s<0&&t==="<script>")s=i;else if(s>=0&&t==="</script>"){e=i;break;}}
try{new Function(L.slice(s+1,e).join("\n"));console.log("JS OK");}
catch(err){console.log("FAILED:",err.message);}
'
```

**Accessibility:** 
- Card has `role="button"`, `tabindex="0"`, `aria-label="Open your birthday card"`.
- Replay button is a native `<button>` element.
- Decorative elements use `aria-hidden="true"`.
- Scroll affordance and particle layers are `pointer-events: none` so they don't steal focus.
- Keyboard support: Enter/Space to open, Tab to navigate replay button.

**Performance:**
- **GPU acceleration:** `transform: preserve-3d`, `will-change: transform`, `transition` on `.card` and `.cover` move transforms to GPU.
- **Particle count:** Configurable via `CONFIG` object (line 574); default is conservative (34 hearts, 78 confetti, 22 petals, 26 foil).
- **Frame rate:** `requestAnimationFrame` targets 60fps; `tick()` stops scheduling when nothing is alive.
- **Page visibility:** `visibilitychange` listener stops `tick()` loop when tab is hidden to save CPU (line 910-912).

---

*Architecture analysis: 2026-06-29*
