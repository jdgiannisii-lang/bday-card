# Status update (2026-07-05)

Read this first; then `README.md` for the full current picture. The original
handoff below the divider is kept for history but is almost entirely superseded.

## What the product is now

A live, multi-page card app deployed on GitHub Pages, backed by Supabase (free
tier). `index.html` is a scrollable marketing landing whose hero is a live demo,
`maker.html` is the no-signup maker, `card.html` is the recipient view (shared
as `card.html?c=<token>`, also runs `?preview=1` for the live preview), and
`rachel.html` is the frozen original card that started it all.

Shipped features: six occasions (Just because, Thinking of you, Birthday,
Congrats, Thank you, Miss you), four themes (Cream, Sage, Dusk, Sky) that retint
everything including canvas particles, six effects (Hearts, Confetti, Petals,
Sparkles, Balloons, Fireflies), up to five photos with a single-photo caption or
a photo-booth strip, sender-picked Apple emojis, an age medallion, a live "See
it first" preview, recipient reactions, recipient-controlled synthesized sound,
draft autosave, message starters, a "Cards you've made" list, deterministic
token-seeded playback, a reduced-motion still celebration, and self-hosted fonts
and emoji so the recipient's open makes zero blocking third-party calls.

## Working state (2026-07-05)

- Active branch: `claude/project-review-improvements-a10svp`. The default and
  deploy branch is `claude/birthday-card-animation-wr7nsu`; pushing to it
  publishes the live site. Both branches currently point at the same commit.
- The tree is clean. Everything is committed, pushed, and deployed live.
- The Stage 0 validation gate was retired by founder decision (2026-07-02):
  build the roadmap directly, metrics inform but no longer block.

## The one thing a fresh session must know

The app is written so a missing Supabase migration never breaks the open; it
hides or downgrades a feature instead. Migrations `0002` (security),
`0003`/`0005` (occasion/effect allowlists), and `0004` (reactions) are committed
but may not be applied to the live database yet. See the migrations table in
`README.md`. If reactions look "missing" or newer occasions/effects get
rejected on insert, that is the expected pre-migration state, not a bug.

## Original handoff corrections (still true)

- The "PENDING TASK: tap-to-open present" below was built and then intentionally
  removed (commit `67fe2ac`). Do not rebuild it.
- Hosting is configured via `.github/workflows/deploy-pages.yml`.
- The card this document describes now lives at `rachel.html`.

Everything below is the original handoff, untouched.

---

# HANDOFF: Rachel's Birthday Card

Context-compaction for the next session. Read this first.

## What this project is
A single-file, animated **digital birthday card** for JD's girlfriend **Rachel**
(turning **18**). It starts as a closed 3D card on cream cardstock, and on a
tap/click the cover swings open with a celebratory burst and reveals a
handwritten note, a taped polaroid, and a pile of falling emojis. It is meant to
feel like a real, handmade letterpress card, **not** an AI-generated template.

- **Everything lives in `index.html`** (inline CSS + JS, no build step, vanilla,
  no runtime dependencies). Keep it that way unless there is a strong reason.
- **`photo.jpg`**: the couple's photo shown in the polaroid (portrait, ~353K).
- **`README.md`**: user-facing notes on personalizing/hosting.
- **`.github/workflows/deploy-pages.yml`**: GitHub Pages deploy workflow.

## Repo / git facts
- Repo: `jdgiannisii-lang/bday-card` (currently **private**).
- **Work branch (develop + push here only):** `claude/birthday-card-animation-wr7nsu`
  (this is also the repo's default branch). Never push elsewhere without asking.
- **Push:** `git push -u origin claude/birthday-card-animation-wr7nsu`, retry on
  network errors with backoff (2s/4s/8s/16s).
- **Commit message footer (every commit):**
  `https://claude.ai/code/session_01XwFPh6JkxtUo8Hsgx4J7f6`
- Do **not** open a PR unless the user explicitly asks.
- Do **not** put any model identifier in commits/code/PRs (chat replies only).

## Hosting status (ACTION NEEDED, not done yet)
The user wants it on **GitHub Pages**. The deploy workflow exists but the last
run **failed**: Pages cannot be auto-enabled and free Pages does not serve
**private** repos. The user chose "make the repo public + use Pages," but
**changing repo visibility is not possible with the available MCP tools** (it is
an owner-only settings action). So the user must, one time:
1. Settings, then make the repo **public**.
2. Settings, then Pages, then Source = **Deploy from a branch**:
   `claude/birthday-card-animation-wr7nsu` / `(root)` (or Source = GitHub Actions
   to use the existing workflow).
Resulting URL: `https://jdgiannisii-lang.github.io/bday-card/`.
Caveat the user already accepted: public means the card + message are publicly
visible/indexable. (Alternative if they change their mind: deploy to Vercel and
the repo stays private.)

## Preview locally
`python3 -m http.server` in the repo, open the printed URL. No browser/headless
tool is available in this environment, so **you cannot screenshot/see it**; the
user verifies visually. Validate what you can (see "Validation" below).

## Current state: what is already built (in `index.html`)
- **3D card**: `.stage` (perspective), then `.card` (preserve-3d) with three
  `.face` panels: `.inside` (the note), `.cover` (front flap that swings open),
  and `.cover-back`.
- **Closed-card idle**: `settle` entrance + `eager` keyframes (slow breathe, then
  a small periodic shimmy, "eager to be opened").
- **Cover**: foil "Happy Birthday" (Cormorant Garamond italic, gold-gradient text
  with a slow shine), a pressable **wax seal** with a symmetric heart, a
  "press to open" label, a handwritten **dedication** ("To my favorite person,
  my best friend, my snuggle buddy, my princess, and my everything."), and a
  small gold-foil **"18" medallion** in the top-right corner.
- **Inside**: a taped **polaroid** (`photo.jpg`, caption "us and daisy"), greeting
  "Happy Birthday, Rachel!", the **handwritten note** (Caveat font, ragged-left),
  and the sign-off "With immeasurable love, JD" with a heart-hands emoji.
- **Scroll affordance**: the note scrolls inside `.inside-scroll`; a pinned bottom
  fade + handwritten "keep reading" cue appear only when it overflows and fade
  out at the end (`.has-more` / `.read` classes, JS `refreshCue`/`atBottom`).
- **On open**: paper-confetti burst (hearts/petals/foil) on the `#fx` canvas via
  `burst()`, plus a custom **emoji-ball pile** that drops in and stacks.
- **Replay**: "read it again" button closes the card back to its tappable state
  (it does NOT auto-reopen).
- Bottom corners stay rounded through the open (scroll-fade has bottom radius).

### Emoji-ball pile (custom physics on the `#fx` canvas)
- Replaced canvas-confetti entirely (that dependency was **removed**).
- `var EMOJIS = ["heart-eyes","finger-heart","red-heart","heart-hands","vulcan","love-letter"];`
  in code these are the actual emoji glyphs (line ~674).
- `var count = 37;` in `dropEmojis()` (line ~689): fixed count the user tuned.
- Physics: gravity, wall/floor + ball-ball collision with relaxation passes;
  collision radius ~1.18x the glyph so they rest with a gap; balls **sleep**
  when settled and become **immovable** (no settled-pile jitter).
- Other knobs: `var CONFIG = { hearts, petals, confetti, foil, ambientPetals }`
  (line ~574) for the paper confetti.
- Lifecycle: spawned in `openCard()`; cleared in `resetCard()`. Skipped under
  reduced motion.

## Design constraints: KEEP THESE (the "anti-slop" taste rules)
This card was deliberately redesigned to avoid an AI-generated look, applying the
`taste-skill` framework (github.com/leonxlnx/taste-skill). Hold the line on:
- **ZERO em-dashes** anywhere in the card (the #1 AI tell). Validate with the grep
  below. Use periods, commas, parentheses, or hyphens instead.
- **Palette** (CSS vars in `:root`): warm cream paper, one restrained rose accent
  (`--rose`, `--rose-deep`), soft blush, gold foil. No neon. Keep saturation low.
- **Fonts**: Cormorant Garamond (display/foil), Caveat (handwriting), Outfit
  (small UI). Loaded from Google Fonts.
- **One corner-radius system**, layered soft shadows, paper-grain texture.
- **Reduced motion**: there is a `@media (prefers-reduced-motion: reduce)` block;
  any new animation must degrade there.
- Emoji ARE allowed in this project's copy (the user explicitly asked for them);
  that is an intentional exception to the taste rules, which otherwise ban emoji.

## Personalization spots (search markers in `index.html`)
- `HER NAME`: greeting. `PHOTO`: polaroid `<img src>`. `MESSAGE GOES HERE`: the
  note. Plus the cover dedication, the polaroid `.cap`, and the `.signoff`.
- Page `<title>` is "Happy Birthday, Rachel".

## Conventions for changes
- Make the change in `index.html`, then **validate**, commit, push (see above).
- The user iterates **one fix per prompt** and verifies on their phone
  (**iPhone 17**, so it is fine for the emoji pile to slightly overlap the card on
  short screens; design for iPhone portrait).

## Validation (do this before every push; no browser here)
```bash
# 1) em-dash ban (must print 0). Uses a printf escape so this file stays clean.
grep -c "$(printf '\xe2\x80\x94')" index.html
# 2) JS must parse: extract the inline <script> and check
node -e '
const fs=require("fs");const L=fs.readFileSync("index.html","utf8").split("\n");
let s=-1,e=-1;for(let i=0;i<L.length;i++){const t=L[i].trim();
if(s<0&&t==="<script>")s=i;else if(s>=0&&t==="</script>"){e=i;break;}}
try{new Function(L.slice(s+1,e).join("\n"));console.log("JS OK");}
catch(err){console.log("FAILED:",err.message);}'
```

---

# PENDING TASK: Tap-to-open Present + Higgsfield

The user's next feature (was being planned when this handoff was requested):

> Add a small wrapped **present** at the **bottom-left of the letter**. It takes
> **a couple of taps to open** (wobble/anticipation, then bursts open). When
> opened it reveals a **link out to Google Drive** where Rachel can save a
> photo/wallpaper to her camera roll. The user wants the opening **animated with
> Higgsfield**.

### Decisions already made with the user
- Reveal = **a link to a Google Drive file** (placeholder for now; the user will
  paste the share link, set to "anyone with the link"). No in-page collage.
- Photos = **just the existing one** for now.
- Animation = the user **wants Higgsfield** and says they connected the MCP.

### Build plan (hand-built base + Higgsfield hook)
All in `index.html`, reusing existing systems:
- Add a `.gift` button as the **last child of `.inside-scroll`** (after
  `.signoff`), `align-self: flex-start` (bottom-left of the letter),
  `role="button"`, `tabindex="0"`, keyboard (Enter/Space).
- Build a wrapped box from divs/SVG in the existing palette: `.gift-box`,
  `.gift-lid`, ribbon, SVG bow. Include a hidden `<video class="gift-clip"
  muted playsinline>` **hook** for a future Higgsfield clip, and a hidden
  `.gift-reveal` holding the outbound `<a target="_blank" rel="noopener">`.
- JS in the existing IIFE: `const GIFT_URL = "#";` (clearly commented for the
  Drive link) and `const GIFT_TAPS = 3;`. Tap handler uses `stopPropagation`
  (so it never re-triggers card open), adds `.tap-1`/`.tap-2` wobble classes, and
  on the final tap adds `.opened`, fires a sparkle via the existing **`burst()`**
  (`#fx` canvas), then shows `.gift-reveal`. If `.gift-clip` has a src, play it on
  open instead of the CSS burst.
- Extend **`resetCard()`** to re-wrap the present (clear counter + classes) so
  "read it again" resets it. Add a reduced-motion path (reveal link, no shake).

### What to do about Higgsfield (the main reason for this handoff)
The Higgsfield MCP was **NOT visible** in the previous session even after the
user connected it. In Claude Code on the web, **MCP servers load at session
start**, so a mid-session connection does not expose tools until a **new
session**. This is a fresh session, so:

1. **Check if it is available now.** Use `ToolSearch` with query `higgsfield`
   (and `+higgsfield`, and `select:<tool_name>` if you see a likely name). Look
   for tools named `mcp__<server>__*` related to image/video generation. The
   previously-present MCP servers were: GitHub, Vercel, Slack, Google Drive,
   Supabase, Gmail. A new Higgsfield one would appear alongside these.
2. **If Higgsfield tools ARE available:** generate a short **present-opening
   clip** (a wrapped gift that bursts open; transparent or on a cream background
   to match; about 1 to 2 seconds). Save it into the repo (e.g.
   `assets/gift.webm` or `.mp4`), set it as the `.gift-clip` `src`, and call
   `.play()` on the final tap. Keep the CSS animation as the fallback if the clip
   fails to load. Then commit/push.
3. **If Higgsfield tools are still NOT available:** tell the user that the MCP
   loads at session start and may need another restart, or that it did not
   register; offer the **iPad fallback** (the user generates a clip in the
   Higgsfield app and uploads it, and you wire it into `.gift-clip` the same way).
   Meanwhile ship the hand-built CSS/SVG animation so the feature works
   regardless.
4. Remind the user to provide the **Google Drive link** for `GIFT_URL`.

### Verify the present end-to-end
Serve locally; scroll to bottom-left of the letter; tap the present a few times
(wobble, then burst + sparkle); confirm the reveal link opens `GIFT_URL` in a new
tab; confirm "read it again" re-wraps it; check reduced-motion; run the
Validation block; commit + push.
