# Testing Patterns

**Analysis Date:** 2026-06-29

## Overview

This project has **no automated test framework** (no Jest, Vitest, Playwright). It is a single-file, vanilla HTML/CSS/JS app. Validation is manual + two scripted checks that **MUST run before every commit/push**. The user verifies visually on their iPhone 17.

## Validation (Pre-Commit Checks)

Before **every push**, run these commands in the repo root:

### 1. Em-Dash Ban Validation

**Command:**
```bash
grep -c "$(printf '\xe2\x80\x94')" index.html
```

**Expected output:** `0` (zero)

**Why:** Em-dash (U+2014) is the #1 tell of AI-generated text. The card must feel handmade. This grep counts any occurrence in `index.html` and **must return exactly 0**.

**If it fails:** Edit `index.html` to replace all em-dashes with periods, commas, parentheses, or hyphens. Search `index.html` for the character using:
```bash
grep "$(printf '\xe2\x80\x94')" index.html
```
to find exact lines.

**Why this pattern?** Using `printf '\xe2\x80\x94'` ensures the validation script itself stays clean (no em-dashes in the codebase, including this file).

---

### 2. JavaScript Parsing Check

**Command:**
```bash
node -e '
const fs=require("fs");const L=fs.readFileSync("index.html","utf8").split("\n");
let s=-1,e=-1;for(let i=0;i<L.length;i++){const t=L[i].trim();
if(s<0&&t==="<script>")s=i;else if(s>=0&&t==="</script>"){e=i;break;}}
try{new Function(L.slice(s+1,e).join("\n"));console.log("JS OK");}
catch(err){console.log("FAILED:",err.message);}'
```

**Expected output:** `JS OK`

**Why:** The JavaScript is embedded in `index.html`. This script extracts the `<script>` block, then validates it by passing it to `new Function()`. If there are syntax errors (missing commas, unmatched braces, undefined variables), it will throw and print the error.

**If it fails:** The error message will show what's wrong. Fix the syntax error in `index.html` `<script>` block and re-run.

---

## Local Preview

**Command:**
```bash
python3 -m http.server
```

**Then:** Open the printed URL (usually `http://localhost:8000/`) in your browser.

**Test flow:**
1. Page loads; card appears in closed state with idle animation (settle + eager keyframes)
2. Click/tap card to open
3. Cover swings open (rotateY to -164deg); inside content fades in with staggered rises
4. Polaroid, greeting, note, signoff appear in sequence
5. Burst of hearts/confetti/petals on canvas
6. Emoji pile drops in and stacks at bottom
7. Scroll the note — "keep reading" affordance appears if content overflows
8. Scroll to bottom — affordance fades
9. "read it again" button appears at bottom; click to reset

**Design constraint:** Tested on **iPhone 17** (portrait). Desktop scaling works but is not a priority. Landscape not tested.

---

## Manual QA Checklist

The user verifies these before shipping (no automated browser test):

- [ ] Card opens on tap/click
- [ ] Cover swings smoothly
- [ ] Content fades in at correct stagger times
- [ ] Polaroid caption visible ("us and daisy 🥺")
- [ ] Greeting shows correct name (search `✏️ HER NAME`)
- [ ] Note message displays (search `✏️ MESSAGE GOES HERE`)
- [ ] Signoff shows (search `✏️ Sign it. Add your name.`)
- [ ] Burst animation (hearts/confetti) fires on open
- [ ] Emoji pile drops and stacks (37 emoji total)
- [ ] Scroll affordance ("keep reading") appears when note overflows
- [ ] Scroll affordance fades when scrolled to end
- [ ] "read it again" button closes card and resets all state
- [ ] Tapping card after reset opens it again
- [ ] Reduced motion respected (macOS: System Preferences > Accessibility > Display > Reduce Motion; mobile: Settings > Accessibility > Motion)
- [ ] No em-dashes in visible text (grep check passes)
- [ ] Phone portrait mode only tested

---

## Reduced Motion Testing

**On macOS:**
1. System Preferences → Accessibility → Display → Enable "Reduce motion"
2. Reload page
3. Verify: card has no animation (appears immediately), enter/exit animations skipped, emoji pile does not spawn, scroll affordance hidden
4. Expected: Content visible but static

**On iOS:**
1. Settings → Accessibility → Motion → Enable "Reduce Motion"
2. Open card in Safari or Chrome
3. Verify: same as macOS

**Code path (in `index.html`):**
```javascript
var reduceMotion = window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// ... then:
if (reduceMotion) return;  // in burst(), dropEmojis(), startDrizzle()
```

---

## No Automated Tests

**Why none exist:**
- Single-file app, no build system, no test runner
- Animations are visual (hard to assert in code)
- Physics simulation (emoji pile) is complex to mock
- User is the QA — they verify on their phone
- Two validation checks (em-dash, JS parse) cover the only automatable concerns

**Future if needed:**
- Playwright for pixel-perfect snapshot tests (requires headless browser setup)
- Accessibility audit (axe-core) if accessibility becomes a priority
- Visual regression tests on emoji pile physics (slow, flaky, low ROI)

---

## Asset Validation

**Photo (`photo.jpg`):**
- No automated check
- User ensures: portrait orientation, ~353K size, path correctly set in `✏️ PHOTO` marker

**Fonts (Google Fonts):**
- No check for availability (CDN is assumed up)
- Fallback: system sans-serif if Google Fonts CDN fails (visual regression, but functional)

---

## Accessibility Testing

**No automated a11y framework.** Manual checks:
- `role="button"`, `tabindex="0"` on `.card` — can it be opened with keyboard (Enter/Space)?
- `aria-label` on card
- `aria-hidden="true"` on decorative elements (seal, petals, canvas)
- Color contrast: text color `var(--ink)` (#46362d) on `var(--paper)` (#f8f1e3) — sufficient contrast verified visually
- Screen reader: can the message be read by VoiceOver (iOS) or NVDA (Windows)?

**No automated WCAG audit.**

---

## Commit Validation Workflow

**Before `git push`:**

1. **Make changes to `index.html`** (personalization, content, styling)
2. **Run validation checks:**
   ```bash
   # Check 1: Em-dash ban
   grep -c "$(printf '\xe2\x80\x94')" index.html
   # Must print: 0
   
   # Check 2: JS parsing
   node -e '
   const fs=require("fs");const L=fs.readFileSync("index.html","utf8").split("\n");
   let s=-1,e=-1;for(let i=0;i<L.length;i++){const t=L[i].trim();
   if(s<0&&t==="<script>")s=i;else if(s>=0&&t==="</script>"){e=i;break;}}
   try{new Function(L.slice(s+1,e).join("\n"));console.log("JS OK");}
   catch(err){console.log("FAILED:",err.message);}'
   ```
3. **If either fails:** Fix the issue, re-run checks until both pass
4. **Preview locally:** `python3 -m http.server`, open browser, test manually
5. **Commit:**
   ```bash
   git add index.html  # (or other changed files)
   git commit -m "Your message

   https://claude.ai/code/session_01XwFPh6JkxtUo8Hsgx4J7f6"
   ```
   (Commit footer is mandatory per HANDOFF.md)
6. **Push:**
   ```bash
   git push -u origin claude/birthday-card-animation-wr7nsu
   ```

---

## Test Coverage

**What's tested:**
- Em-dash count (0)
- JavaScript syntax validity

**What's NOT tested (manual only):**
- Visual appearance (animations, colors, layout)
- Emoji physics behavior
- Scroll affordance logic
- Cross-browser compatibility (iOS Safari assumed)
- Audio/video (not applicable)
- API integrations (none)

---

## Known Fragile Areas

### Emoji Physics Simulation

**File:** `index.html` lines ~709–770 (`updateEmoji()` function)

**Why fragile:**
- Nested collision detection loops (O(n²), 6 relaxation passes per frame)
- Float precision sensitivity (positions, velocities)
- Hard-coded magic numbers (gravity: 0.42, drag: 0.999, friction: 0.84, sleep threshold: 12 frames)

**Risk:** Adding/removing emoji, tweaking physics constants, or running on very high-DPI displays can cause instability (pile doesn't settle, emoji jitter, clipping).

**Safe modification:**
- Only adjust `CONFIG.ambientPetals` and `count` in `dropEmojis()` (particle counts)
- Do NOT change collision radius multiplier, gravity, or sleep threshold without re-testing heavily
- Test on phone (iPhone 17) to verify pile stacks cleanly

### Scroll Affordance Logic

**File:** `index.html` lines ~589–600 (`atBottom()`, `refreshCue()`)

**Why fragile:**
- Hardcoded pixel thresholds: `scroller.scrollHeight - scroller.clientHeight > 6` (overflow detection), `scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 8` (end detection)
- Relies on layout having `flex: 1 1 auto` for `.inside-scroll` to overflow
- CSS transition timing must match JS logic

**Risk:** Changing note font size, padding, or modal height can break affordance (never shows, or never hides).

**Safe modification:**
- Keep `.inside-scroll` flex layout unchanged
- If note content changes, test the scroll cue on a real phone
- If resize happens, `refreshCue()` is called (safe, re-reads DOM)

### 3D Transforms

**File:** `index.html` lines ~84–115 (`.card`, `.face`, transform-style)

**Why fragile:**
- `perspective: 1800px`, `perspective-origin: 50% 42%`, `preserve-3d` stack
- Cover rotates -164deg (not -180) to rest slightly open
- Inside has `translateZ(-1px)`, cover has `translateZ(1px)` (z-fighting if changed)
- Mobile scaling (`max-width: 580px`) changes transform on open

**Risk:** Adjusting perspective, z-indexes, or card dimensions can break 3D illusion.

**Safe modification:**
- Keep `.card { transform-style: preserve-3d; }` and all `.face { backface-visibility: hidden; }`
- Do not change `rotateY(-164deg)` or `translateZ` values
- If resizing card, test on iPhone 17 portrait

---

## Deployment Testing

**GitHub Pages (when enabled):**
- Repo must be made public (one-time manual step via GitHub Settings, not available via MCP)
- Deploy workflow: `.github/workflows/deploy-pages.yml`
- After Pages is enabled, push to `claude/birthday-card-animation-wr7nsu` branch
- Visit `https://jdgiannisii-lang.github.io/bday-card/`
- Verify card works in mobile browser (same as local test)

---

*Testing analysis: 2026-06-29*
