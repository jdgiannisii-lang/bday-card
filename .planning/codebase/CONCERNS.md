# Codebase Concerns

**Analysis Date:** 2026-06-29

## Tech Debt

### 1. Animation Completion is Time-Based, Not Event-Driven

**Issue:** The "replay" button is shown via a blind `setTimeout(1500ms)` rather than a deterministic completion signal.

**Files:** `index.html` lines 888, 804-859

**Impact:** 
- The 1500ms timeout is disconnected from actual animation state. If any animation runs slower (network jitter, heavy device load, browser throttle), the replay button appears before all effects finish, creating a jarring UX.
- For planned analytics (event `onFinished`), this is not a reliable metric. Analytics should fire *after* the last particle settles or the last emoji stops moving, not after a fixed timer.
- On slower devices (older phones, low-end hardware), the burst particles and emoji physics simulation may still be running when the button appears.

**Fix approach:**
- Replace the 1500ms timeout with an event-driven completion model. The animation loop (`tick()` function, line 806) already knows when particles and emoji balls are settled (`alive === 0 && ballsAwake === false`, line 857).
- Add a `onAnimationComplete` callback that fires when the canvas loop naturally ends, then show the replay button and trigger analytics at that moment.
- This is a prerequisite for the planned analytics layer and for the app-level `onFinished` hook documented in HANDOFF.md.

---

### 2. Math.random() Non-Determinism Blocks Reproducible Rendering

**Issue:** The engine uses `Math.random()` throughout for particle spawn, colors, rotations, and emoji physics. This violates the architectural requirement for deterministic, seeded rendering.

**Files:** `index.html` lines 619-620, 637-664, 676-707, 867-872, 867-872

**Affected code:**
- `function rand(a, b) { return a + Math.random() * (b - a); }` (line 619)
- `function pick(a) { return a[(Math.random() * a.length) | 0]; }` (line 620)
- All particle spawning (`burst()`, `dropEmojis()`, `buildPetals()`) routes through these
- Ambient petal DOM generation (line 867-872) computes random `left`, `dur`, `delay`, `size`, `op` inline

**Impact:**
- **Each card open is unique** — the same card viewed twice on the same device produces different confetti/emoji trajectories. This breaks:
  - Share preview generation (OG image): needs a pixel-identical still frame
  - Re-opening a card from the library: should show the *same* celebration, not a random one
  - Server-side static frame rendering: requires reproducibility
  - The app-level architecture (documented in docs/obsidian/App-Architecture-and-Backend.md line 93-94) mandates `seed` pinned per card → `engine.play()` must be deterministic

**Fix approach:**
- Introduce a **seeded PRNG** (Mulberry32, xorshift, or a proven lightweight hash-based generator). This is the *first engine task* per the handoff (HANDOFF.md line 92-94).
- Seed it with `card.seed` (a 32-bit number baked into the card data). Every open uses the same seed → identical particle streams.
- Replace all `Math.random()` calls with `seededRng.next()`.
- This unblocks server-side OG preview rendering and the library re-open feature. Without it, the app cannot launch at scale.

---

### 3. Google Fonts Are Render-Blocking From Third-Party CDN

**Issue:** Google Fonts are loaded synchronously via `<link rel="stylesheet">` in the `<head>`, blocking first paint until all three font files (Caveat, Cormorant Garamond, Outfit) download from googleapis.com.

**Files:** `index.html` lines 27-29

**Current code:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Outfit:wght@400;500&display=swap" rel="stylesheet" />
```

**Impact:**
- On slow 3G or poor connectivity, the card stays blank until fonts arrive (can add 1–2s+).
- `display=swap` is set, which helps, but the initial request to googleapis.com *still blocks* if that server is slow or unreachable.
- Documented as a risk in App-Architecture-and-Backend.md line 405: *"Google Fonts render-block the craft"*.

**Fix approach:**
- Self-host the subset WOFF2 files locally (only the weights actually used: Caveat 500/600, Cormorant 500/600 italic, Outfit 400/500).
- Serve them from the same CDN/edge as the card (Cloudflare Pages in production).
- Use `font-display: fallback` with metric-matched fallbacks (system serif for Cormorant, system sans for Outfit/Caveat).
- This is a documented Stage-1 fix and is required before viral traffic.

---

### 4. Reduced-Motion Path Suppresses Celebration Rather Than Composing a Finished Still

**Issue:** When `prefers-reduced-motion: reduce` is active, all animations are disabled, but the "Keep this forever?" emotional payload is *incomplete* — the user sees no confetti, no emoji, and the message is shown in its initial opacity state without entrance animation.

**Files:** `index.html` lines 484-494 (CSS), 633-634, 678-679, 789-791, 862-863 (JS checks)

**Current behavior:**
```css
@media (prefers-reduced-motion: reduce) {
  .card, .seal, .cover-title, .petal, .scroll-cue svg { animation: none !important; }
  /* ... */
  .opened .polaroid, .opened .greeting, .opened .note, .opened .signoff {
    animation: none; opacity: 1; transform: none;
  }
}
```

**Impact:**
- Reduced-motion users see a static card open to show the note, but *no visual celebration*. The greeting, photo, and signoff appear instantly with `opacity: 1`, losing the emotional arc.
- The architecture (App-Architecture-and-Backend.md line 162-164) specifies: *"Required per effect — reduced-motion users must get the full emotional payload (photo + note + signoff settled), not a disabled animation."*
- This is a regression vs. the intended design: reduced motion should show a **composed, finished still**, not just turn off animations.

**Fix approach:**
- Add `engine.renderStaticFrame(cardDoc)` to the contract. This should compose a *finished* visual:
  - Card still fully open (no 3D rotation mid-swing).
  - Photo visible, greeting visible, note visible, signoff visible — all with full opacity and proper layout.
  - Confetti/emoji replaced with a static celebratory visual (a small still-frame of hearts or petals, or simply the composed page without motion).
- On reduced-motion, show this still immediately when the card opens.
- This is a craft regression to fix in the port (per HANDOFF.md line 163-164).

---

### 5. Photo Is a Single Relative Path With No Optimization or Versioning

**Issue:** The photo is hard-coded as a relative `src="photo.jpg"` with no size variants, format negotiation, or versioning strategy.

**Files:** `index.html` line 511

**Current code:**
```html
<img class="pic" src="photo.jpg" alt="Rachel and JD" />
```

**Impact:**
- **No lazy loading:** the image is in the fold (visible immediately after open), but there's no `loading="lazy"` attribute — not a major issue here since it's intended to be seen, but it's a missed optimization signal.
- **No format negotiation:** served as JPEG always. Users on fast networks get no WebP variant; older browsers with no WebP support get no fallback.
- **No responsive sizing:** the `.pic` is fixed `width: 146px; height: 172px` in the polaroid, but the actual `photo.jpg` file is likely much larger (~353KB per HANDOFF.md line 14). Full-resolution image is downloaded even on mobile.
- **No DPI optimization:** no `srcset` for 2x retina displays.
- **Versioning:** when the photo changes (e.g., user personalizes the card), the browser cache still serves the old `photo.jpg`. No cache-busting strategy.

**Fix approach:**
- In the app-level architecture, photos are stored in Cloudflare R2 with immutable URLs per photo ID (App-Architecture-and-Backend.md line 174-175).
- For now (single-file card): add a cache-busting query string `photo.jpg?v=<timestamp>` or a build-time hash.
- Document that when personalizing the card, replace `src="photo.jpg"` with the new file path.
- In Stage-1+ (the full app), wire photos through the image pipeline: client-side downscale to ≤1600px WebP before upload → R2 → Cloudflare Images for transforms.

---

### 6. Single ~33KB HTML File Mixes Card Content, Engine Code, and Styling

**Issue:** Everything lives in one `index.html` file: CSS, JS, card content (message, names, dedication), and markup. There is no separation of concerns.

**Files:** `index.html` (entire file, 920 lines)

**Impact:**
- **Error-prone personalization:** the handoff marks three spots (`HER NAME`, `PHOTO`, `MESSAGE GOES HERE`), but the entire file is hand-editable. A stray typo in the CSS breaks styling; a broken HTML string breaks the page.
- **No content versioning:** when the user personalizes for a new recipient, there is no way to version or archive the old card's content. Each edit overwrites the file.
- **Scalability blocker:** when the app launches, the engine must be factored into a reusable module (`/r/1.4.0/engine.js` per the architecture). Right now it's baked into the HTML.
- **No separation for server-side rendering:** in the app, card content must be inlined into SSR-rendered HTML (App-Architecture-and-Backend.md line 61). The current monolithic file is not a reusable engine.
- **Maintenance burden:** any fix to the animation engine, any new effect, any styling tweak requires touching the entire file.

**Fix approach:**
- **This is not a bug in the single-file card; it's intentional design.** The card is meant to be hand-personalized, self-contained, and shareable as one file.
- For the app-level feature (Stage 1+), the engine is factored out into a versioned module with a stable contract (`engine.play()`, `engine.edit()`, `engine.renderStaticFrame()`), and card content is stored separately as JSON (per App-Architecture-and-Backend.md §3).
- **For this card:** document the personalization spots clearly and warn against hand-editing outside the marked zones. Consider adding a build-time validator that checks for syntax errors before the card ships.

---

### 7. Hand-Editing Personalization Is Error-Prone (Em-Dash Rule)

**Issue:** The card is personalized by hand-editing HTML/CSS/copy. One mistake — a typo, a misplaced quote, a stray em-dash — breaks the page or violates the taste constraints.

**Files:** `index.html` (entire file; specific spots at lines 511, 516, 519, 533)

**Current guidance:** HANDOFF.md lines 88-92 mandate zero em-dashes; line 114 shows a grep to check.

**Impact:**
- **Em-dash contamination:** an em-dash (U+2014 `—`) is the #1 AI-generated-text tell (per taste-skill). The handoff bans it globally. If a user pastes copy from Word or Google Docs, it may contain em-dashes. No tooling catches this before push.
- **HTML breakage:** a quote in the greeting or message can break the HTML if not escaped. Example: `<h1 class="greeting">Happy Birthday, Rachel's 18th!</h1>` works, but `<h1 class="greeting">Happy Birthday, Rachel's "special day"!</h1>` breaks if the inner quotes are not HTML-entities.
- **CSS conflicts:** if the user adds a style override, there's no linter to catch specificity wars or invalid CSS.

**Fix approach:**
- **For this card:** add a pre-commit validation script (documented in HANDOFF.md lines 113-122). The script checks:
  - `grep -c "$(printf '\xe2\x80\x94')" index.html` must return 0 (no em-dashes).
  - Node.js parses the `<script>` block for syntax errors.
  - Add a basic HTML parse check (e.g., ensure all `<` and `>` are balanced; no unescaped quotes in text nodes).
- **For the app:** personalization is driven by a form-based UI, not hand-editing. The backend validates content server-side (content-policy, em-dash ban, HTML escaping).

---

## Known Issues

### Emoji Physics Simulation Can Pile Out of Frame on Very Tall Viewports

**Issue:** The emoji drop and stack logic uses a fixed `count = 37` and assumes a specific viewport height. On very tall screens (e.g., iPad landscape, 1440px+), the pile may climb above the card and become visible in an unintended way.

**Files:** `index.html` lines 689, 676

**Current logic:**
```javascript
var count = 37;  // fixed count
var size = 33;   // glyph font size
var cR = vR * 1.18;  // collision radius
var margin = cR + 6;

/* "keep the whole pile below the bottom of the card" comment suggests intent,
   but there's no dynamic calculation based on viewport height */
```

**Impact:**
- On iPad or wide desktop, the emoji pile may stack higher than intended and creep into the card or the background.
- The handoff (HANDOFF.md line 109) says "design for iPhone portrait" and accepts "the emoji pile to slightly overlap the card on short screens"; no guidance for very tall screens.

**Fix approach:**
- Calculate `count` dynamically based on viewport height and the emoji-stack height physics (how high does a pile of 37 emojis stack?).
- Or, cap the stack height at a percentage of viewport height (e.g., "never stack above 60% of H").
- This is a low-priority visual bug, not a blocker.

---

## Security Considerations

### No Input Sanitization on Personalization Text

**Issue:** When the card is personalized (greeting, message, signoff), the text is inserted directly into the HTML. If a user (or script) injects HTML or JavaScript, it will execute.

**Files:** `index.html` lines 516, 519, 533 (and the hidden `.cap`, dedication)

**Example vulnerability:**
```html
<!-- User edits and pastes this -->
<h1 class="greeting">Happy Birthday, <script>alert('xss')</script>Rachel!</h1>
```

**Impact:**
- **Low risk in practice** because this is a self-contained file the user owns and personalizes for their own use (not a shared template).
- **Higher risk if the card is ever auto-generated or templated** by a web service where user input drives the card.
- For the app (Stage 1+), the backend must HTML-escape all user-supplied content before inlining it into the SSR HTML.

**Mitigation (current):**
- The single-file card has no backend; users hand-edit. The risk is user error, not injection.
- User who personalizes the card is its author and recipient; they own the full file.

**Fix approach (for the app):**
- Validate and HTML-escape all user input server-side before inlining into the player HTML.
- Use a templating engine that escapes by default (e.g., Handlebars `{{}}` or React JSX, not raw string concatenation).

---

### Photo Upload Bypass (Future App Concern)

**Issue:** This single-file card uses a relative `photo.jpg`, so the photo is local. In the app (Stage 1+), users upload photos. No image moderation is currently in place.

**Files:** N/A for this card. Documented in App-Architecture-and-Backend.md §7.

**Impact:** Once users can upload photos, they can upload CSAM, NSFW, or other illegal content. Legal mandate (18 USC 2258A / the REPORT Act 2024) requires:
- CSAM detection (PhotoDNA, Thorn, or Hive; not AWS Rekognition).
- NSFW detection (OpenAI Moderation is free).
- A one-tap "Report this card" mechanism.
- An instant takedown kill-switch.

**Fix approach:** Not applicable to the single-file card. For the app, implement moderation before launch (documented in App-Architecture-and-Backend.md lines 336-339).

---

## Performance Bottlenecks

### Particle Garbage Collection Can Pause Frame Rendering

**Issue:** When the particle array grows beyond 700 items (line 851), the entire array is filtered in-place on the animation frame.

**Files:** `index.html` line 851

**Current code:**
```javascript
if (particles.length > 700) particles = particles.filter(function (q) { return q.life > 0; });
```

**Impact:**
- On slower devices, `filter()` can take 10–50ms, causing a jank spike and dropped frames during the celebration.
- The cleanup only happens when the array exceeds 700, so small devices (lower particle counts) won't trigger it; larger devices with more emojis + confetti will.

**Fix approach:**
- Use object pooling or a bitset to mark dead particles without filtering.
- Or, collect dead particles incrementally (mark dead as you iterate, compact every N frames).
- This is a low-priority optimization; the celebration is short-lived (< 2s), so jank is forgivable.

---

### Canvas Context State Management Could Leak Memory on Repeated Opens

**Issue:** The `tick()` loop calls `ctx.save()` and `ctx.restore()` for each particle, but does not explicitly reset global properties between draws.

**Files:** `index.html` lines 806–859 (especially 819, 849)

**Impact:**
- If `globalAlpha`, `fillStyle`, or other context state is accidentally left mid-restore, it carries over to the next frame or next open.
- Long-running celebrations with thousands of particles may leak canvas memory on some browsers.

**Fix approach:**
- Ensure `tick()` always ends with `ctx.clearRect()` and a full state reset (`ctx.globalAlpha = 1`, `ctx.fillStyle = 'black'`).
- Or, use a OffscreenCanvas if available to isolate state per draw cycle.
- This is a low-priority bug; canvas state is generally well-isolated in modern browsers.

---

## Fragile Areas

### Scroll Affordance Logic Depends on Exact Measurements

**Files:** `index.html` lines 589–598 (scroll detection), 170–206 (CSS for affordance)

**Why fragile:**
- The `atBottom()` check uses a magic number: `scroller.scrollHeight - scroller.clientHeight > 6` (line 596). If the card is resized or the note layout changes, this threshold may no longer work.
- The fade gradient (line 174) has a hard-coded `height: 58px`. If the font size changes, the fade may not cover the full scroll-cue.
- The scroll-cue SVG (line 539) is a hardcoded path; if the arrow design changes, the affordance may look misaligned.

**Safe modification:**
- Test the scroll affordance on multiple viewport sizes (iPhone SE, iPhone 14 Pro Max, iPad) before shipping any changes to font size or card dimensions.
- Use relative units (e.g., `em` instead of `px`) for the fade height and scroll-cue to scale with font changes.

---

### Emoji Ball Collision Physics Relies on Multiple Relaxation Passes

**Files:** `index.html` lines 726–758 (collision loop)

**Why fragile:**
- The collision relaxation uses 6 hardcoded passes (line 727). On very slow devices or with the full 37-emoji count, 6 passes may not be enough to stabilize the pile.
- If the gravity constant (line 712) or friction (line 712) changes without re-tuning, the pile may oscillate or climb out of frame.
- The asleep-ball logic (line 754–765) uses a `still > 12` threshold. If device frame rate varies, settled balls may wake up unexpectedly.

**Safe modification:**
- Before changing gravity, friction, or `count`, test on a low-end device (e.g., a 2020 iPhone) to ensure the pile doesn't clip or jitter.
- Consider making relaxation passes dynamic (e.g., `while (maxOverlap > 0.1)`) instead of fixed.

---

### Reduced-Motion Detection is One-Shot at Load Time

**Files:** `index.html` lines 576–577

**Current code:**
```javascript
var reduceMotion = window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
```

**Why fragile:**
- If the user changes their system preferences (Settings → Accessibility → Reduce Motion) *while the card is open in the browser*, the card does not respond. The detection is only checked once at script start.
- Modern browsers support media query change listeners; this code does not use them.

**Safe modification:**
- Listen for changes: `window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", ...)` and re-render / stop animations dynamically.
- This is a low-priority refinement; most users do not toggle reduced-motion mid-session.

---

## Test Coverage Gaps

### No Automated Tests for Animation Timing

**What's not tested:** The celebrate animation doesn't have tests to verify:
- All particles spawn and fade out correctly.
- Emoji balls settle within a predictable time frame.
- The replay button appears at the right moment.
- Reduced-motion paths compose the correct final visual.

**Files:** `index.html` (entire file; no test file exists)

**Risk:** Changes to gravity, friction, particle decay, or timeout values can break the visual feel without detection. A future contributor might tweak a constant and create jank or a broken animation without realizing.

**Priority:** Medium. Before the app launches with this engine, add Jest/Vitest tests for:
- Particle lifecycle (spawn, decay, removal).
- Emoji physics (collision, settling, sleep).
- Timing of the celebrate sequence.
- Reduced-motion static render.

---

### No Validation of Personalization Inputs

**What's not tested:** The three personalization spots (HER NAME, PHOTO, MESSAGE) have no schema validation:
- Photo `src` is not checked to exist or be a valid image format.
- Message text is not validated for length, em-dashes, or HTML safety.
- Name is not validated for length or special characters.

**Files:** `index.html` (personalization spots, lines 511, 516, 519, 533)

**Risk:** A user can break the card by providing invalid inputs:
- A missing photo path leaves a broken image placeholder.
- A very long message causes layout overflow on small screens.
- Special characters or quotes in the message can break HTML.

**Priority:** Low for the single-file card (user is author and bears the consequence). High for the app (backend must validate before inlining).

---

## Scaling Limits

### Single-File Distribution Cannot Be Archived or Versioned

**Current capacity:**
- One card per file.
- No server-side storage, no library, no sync across devices.

**Limit:** Once the user creates or personalizes a card, the only copy is the one file they're sharing. If they lose the file or want to recreate it, they must hand-edit `index.html` again.

**Scaling path (for the app):**
- Implement the received library (App-Architecture-and-Backend.md §5): cards stored as JSON in Supabase, indexed by unique token, synced to the user's library.
- Cards become *data*, not *files*, and can be re-opened, shared, archived, or deleted server-side.

---

### Ambient Petals DOM Generation Has No Limit

**Current capacity:**
- `CONFIG.ambientPetals = 9` (line 574).
- Each petal is a `<span>` created at runtime and added to the DOM.

**Limit:** If `CONFIG.ambientPetals` is set to a high value (e.g., 50), the DOM can grow large and cause jank on low-end devices.

**Scaling path:**
- Cap the ambient petals at a device-aware limit (e.g., 20 on retina, 9 on non-retina).
- Or, render petals on the canvas instead of the DOM for better performance on many particles.

---

## Dependencies at Risk

### No External Dependencies (Intentional)

**Current risk:** Zero.

**Card uses:** Vanilla HTML/CSS/JS only. No npm packages, no build step, no CDN JavaScript libraries (only Google Fonts for typography).

**Upside:** No security patches, no version conflicts, no build system to maintain.

**Downside:** If a future version of the app needs to embed this engine, it must be refactored from vanilla into a module (TypeScript, exported as ESM, bundled).

**Mitigation (for the app):** The engine module (`/r/1.4.0/engine.js` per the architecture) is written in vanilla ES5 or modern ES6 (no transpilation) and has zero npm dependencies. Dependencies are added at the *app level* (React, Supabase, PostHog), not the engine.

---

## Missing Critical Features

### No Seeded PRNG (Blocks Reproducible Rendering)

**Problem:** The entire celebrate sequence is non-deterministic. Share previews, re-opens from the library, and server-side still-frame rendering are impossible without seeded randomness.

**Blocks:** 
- App-level feature: OG preview (share preview on social media).
- App-level feature: Library re-open (same card, same seed → identical celebrate).
- Server-side rendering: composing a static "finished" frame for OG image.

**Priority:** CRITICAL for Stage 1. This is the first engine task (HANDOFF.md line 92-94).

---

### No `renderStaticFrame()` / Reduced-Motion Still Compose

**Problem:** The reduced-motion path disables animations but does not show a composed "finished" state. Users who prefer reduced motion see a static card open, but no visual celebration or emotional payoff.

**Blocks:** Accessible experience for reduced-motion users.

**Priority:** High. Documented as a craft regression (HANDOFF.md line 163-164, App-Architecture-and-Backend.md line 162-164).

---

### No Cache-Busting Strategy for Personalized Cards

**Problem:** When a user personalizes the card (changes photo, message), there is no way to force the recipient's browser to fetch the new version. Cached copies persist forever.

**Blocks:** Iterating on a card (if the user wants to fix a typo or update the photo after sending).

**Priority:** Low. Acceptable workaround: generate a new file for each iteration. Better: implement URL versioning (e.g., `card_v1.html`, `card_v2.html`).

---

## Summary Table

| Concern | Severity | File(s) | Fix Approach |
|---------|----------|---------|--------------|
| Animation completion is time-based, not event-driven | High | lines 888, 806–859 | Add `onAnimationComplete` callback when particles settle |
| Math.random() breaks determinism | **CRITICAL** | lines 619–620, 637–664, 867–872 | Implement seeded PRNG (Mulberry32 or xorshift) |
| Google Fonts render-block | High | lines 27–29 | Self-host WOFF2, serve from CDN edge |
| Reduced-motion suppresses celebration | High | lines 484–494, 633–634 | Add `renderStaticFrame()` for static composed state |
| Photo has no optimization | Medium | line 511 | Add cache-busting, plan image pipeline for app |
| Single 33KB file mixes concerns | Low | entire file | Intentional; factor engine into module for app |
| Hand-editing personalization is error-prone | Medium | lines 511, 516, 519, 533 | Add pre-commit validation script |
| Emoji pile can overflow on tall screens | Low | lines 689, 676 | Calculate count dynamically based on viewport |
| No input sanitization on text | Medium (low risk as-is) | lines 516, 519, 533 | HTML-escape on backend for app |
| Canvas memory management | Low | lines 806–859 | Ensure state reset between draws |
| Scroll affordance uses magic numbers | Medium | lines 589–598 | Use relative units, test on multiple viewports |
| Emoji collision tuning is fragile | Medium | lines 726–758 | Test on low-end devices before tweaking physics |
| Reduced-motion detection is one-shot | Low | lines 576–577 | Add media query change listener |

---

*Concerns audit: 2026-06-29*
