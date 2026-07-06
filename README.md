# 💖 Handmade Cards

Hand-animated greeting cards that open right in a browser. A sender builds a
card in a couple of minutes (a name, a note, photos, a look, an effect), watches
it play, then gets a link and a QR code. The recipient just taps it. No app, no
sign-up, no account, ever. The cards run on a handmade `<canvas>` engine: warm
paper, gold foil, a wax seal, and a celebration when the cover swings open. It
is meant to feel like a real letterpress card, never like an AI template.

## How the flow works

1. **Make a card** in `maker.html`: pick an occasion, a look (theme), an effect,
   the emojis that rain down, write the note, add up to five photos. Tap **See
   it first** to watch the real card play before you commit.
2. **Get the link.** Saving stores the card in Supabase and returns a share link
   plus a QR code. Cards load as `card.html?c=<token>` (or the clean
   `/c/<token>/` form in production). The token is a long unguessable id;
   holding the link is what grants access.
3. **The recipient opens it** in any modern browser and the card plays: the
   cover swings, the effect bursts, photos roll out, emojis fall, and (if they
   turn it on) a quiet synthesized sound plays.
4. **They send love back and make their own.** After the card settles the
   recipient can tap a reaction, and an invitation drops them straight into the
   maker to make one of their own.

## What it does

- **Six occasions**: Just because, Thinking of you, Birthday, Congrats, Thank
  you, Miss you. Each swaps the cover title and the greeting.
- **Four looks (themes)**: Cream (the original warm rose), Sage (eucalyptus and
  gold), Dusk (navy night, gold letters), Sky (powder blue, silver shine). The
  theme drives every color: paper, ink, foil, the page background, and the
  canvas particle palettes. Each cover carries its own stationery texture.
- **Six effects**: Hearts, Confetti, Petals, Sparkles, Balloons, Fireflies
  (slow glowing motes that linger and pulse).
- **Photos**: up to five. One photo shows as a taped polaroid with an optional
  handwritten caption; two or more roll out as a photo-booth strip.
- **Sender-picked falling emojis** with themed presets (Love, Birthday, Cute,
  Hype), shown as Apple artwork on every platform.
- **An age medallion** on birthday covers when the sender fills one in.
- **Live preview** ("See it first") that embeds the real card view and plays the
  in-progress draft, no row created.
- **Recipient reactions**: a heart, tears, party, or hug sent back to the
  sender (needs migration `0004`, see below).
- **Recipient sound**: off by default, synthesized with Web Audio (no files), a
  soft paper whoosh on open and a shimmer with the burst.
- **Craft touches in the maker**: draft autosave (survives a refresh), per
  occasion message starters, a "Cards you've made" list saved in the browser,
  and a themed share-state preview.

The recipient's open is the sacred path: the cover paints on the first frame
with zero blocking network calls (fonts and emoji are self-hosted at deploy),
the card plays the identical celebration every time (seeded by its token), and
everything degrades gracefully. Reduced-motion visitors get a still, painted
celebration instead of animation.

## Pages and layout

| Page | What it is |
|------|------------|
| `index.html` | Marketing landing. The demo card is the hero; scroll for how-it-works, the four looks, and the call to action. |
| `maker.html` | The no-signup card maker (Supabase-backed). |
| `card.html` | The recipient view, loaded as `card.html?c=<token>`. Also runs `?preview=1` for the maker's live preview. |
| `404.html` | Generated at deploy as a copy of `card.html`, so GitHub Pages serves clean `/c/<token>/` links. Not committed. |
| `card-sage.html`, `card-dusk.html`, `card-sky.html` | Generated at deploy: copies of `card.html` whose `og:image` points at the themed link preview. Not committed. |
| `rachel.html` | The original hand-made card that started the project. Frozen, kept live. |
| `og-template.html` | Deploy-only. Screenshotted per theme into the link-preview images. |
| `preview.html` | Local dev harness for flipping through effects. Not deployed. |

`shared/` holds the ES modules:

- `supabase.js` (data layer: save a card, read by token, reactions),
- `engine-bridge.js` (fills the card DOM from a row; validates untrusted input),
- `analytics.js` (cookieless PostHog, optional),
- `photo.js` (client-side downscale to JPEG),
- `audio.js` (synthesized sound),
- `config.js` (gitignored; public keys, generated at deploy),
- `config.example.js` (the template to copy).

`supabase/migrations/` holds the schema. `assets/emoji/` holds the self-hosted
Apple emoji PNGs used by the presets.

## Local development

No build step; everything is static files. Serve the repo locally:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

To make the maker and card view actually save and load cards:

1. Copy `shared/config.example.js` to `shared/config.js` (it is gitignored) and
   fill in your Supabase project URL and anon key. Both are public client keys
   by design; never put the service_role key there.
2. In your Supabase project, run the SQL files in `supabase/migrations/` (see
   the order below) in the SQL Editor, and create a public Storage bucket named
   `card-photos` (directory listing off).

The PostHog values in the config are optional; analytics quietly turns off when
they are left as placeholders.

## Database migrations

The app is written so a missing migration never breaks the recipient's open. It
degrades a feature instead. Run these in the SQL Editor in this order (they are
cumulative where noted):

| File | What it does | Notes |
|------|--------------|-------|
| `0001_cards.sql` | The `cards` table, RLS, the storage upload policy. | Baseline. |
| `0002_secure_cards.sql` | Locks reads behind a `get_card(token)` function so the table cannot be enumerated with the public anon key; constrains anonymous inserts; caps the photo bucket. | Strongly recommended before real traffic. |
| `0003_more_occasions.sql` | Widens the insert allowlist to all six occasions. | Supersedes 0002's policy. |
| `0005_fireflies.sql` | Widens the effect allowlist to include Fireflies. | Supersedes 0003's policy. Run order: 0001, 0002, 0003, 0005. |
| `0004_reactions.sql` | Adds the `reactions` table and `get_reactions(token)`. | Independent of the others. The reaction pill stays hidden until this exists. |

Until `0002` runs, the client reads with a direct select (still works, just
enumerable). Until `0004` runs, the reactions feature is invisible. Until
`0003`/`0005` run, the insert policy rejects the newer occasions/effects, so run
them before letting senders pick those.

## Running the smoke test

`tests/ui-smoke.mjs` is a Playwright smoke test. It always checks that the maker
renders and that the closed card sits within about a pixel of the visible center
on the landing and the card view (a numeric guard, because headless browsers
hide the sub-pixel drift a real screen shows). With real `shared/config.js`
values it also runs the whole loop: a card saves, the share link opens, the card
plays, and the CTA routes back into the maker. It starts its own local server
and uses the globally installed Playwright.

```bash
node tests/ui-smoke.mjs
```

If `shared/config.js` still has placeholder values, the deep steps are skipped
with a clear message and only the render and centering checks run.

## Deployment

`.github/workflows/deploy-pages.yml` deploys to GitHub Pages on push to the
default branch. It:

- fails on purpose if the Supabase repository Variables are missing (a card site
  without them is silently broken),
- stages only the public files (internal docs, planning, and tests never ship),
- generates `shared/config.js` from repository Variables,
- self-hosts the fonts (downloads the woff2 faces and rewrites every page so the
  served site never contacts Google Fonts; fail-open, so a download hiccup keeps
  the committed async-fonts fallback),
- builds the per-theme link previews (screenshots `og-template.html` per theme
  into `og/og-<theme>.png` and generates the `card-<theme>.html` variants so a
  dusk card unfurls dark and gold in iMessage instead of cream),
- copies `card.html` to `404.html` so `/c/<token>/` links resolve.

Set these under Settings, then Secrets and variables, then Actions, under
**Variables** (not Secrets; all four are public client keys):

- `SUPABASE_URL` (required)
- `SUPABASE_ANON_KEY` (required)
- `POSTHOG_KEY` (optional)
- `POSTHOG_HOST` (optional)

Note: GitHub Pages rate-limits deployment bursts. Several deploys in a short
window can start returning "Deployment failed, try again later" on clean builds;
wait out the window and re-run. Prefer batching changes into fewer publishes.

## Taste rules

Two rules are load-bearing and validated:

- **No em-dashes** (U+2014) anywhere: the note, the copy, the comments, the docs.
  The em-dash is the number one tell of AI-generated text, and this product has
  to feel handmade. Use periods, commas, parentheses, or hyphens.
- **Restrained palette and type**: warm paper, one accent per theme, gold or
  silver foil, saturation held low, no neon, a fixed 14px corner radius. The
  four themes are the only palettes; do not invent new colors.

## Where it started

`rachel.html` is the original hand-made birthday card that started the whole
project. It stays live, frozen. Everything else grew out of it.
