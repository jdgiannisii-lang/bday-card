# 💖 Birthday Card

Hand-animated greeting cards that open right in a browser. A sender builds a
card in a couple of minutes (a name, a note, photos, an effect), gets a link
and a QR code, and the recipient just taps it. No app, no sign-up, no account,
ever. The cards run on the same handmade canvas engine that started this
project: cream paper, gold foil, a wax seal, and a burst of confetti when the
cover swings open.

## How the flow works

1. **Make a card** in `maker.html`: pick an occasion and an effect, write the
   note, add photos if you like. Saving stores the card in Supabase and gives
   you a share link plus a QR code.
2. **Share the link.** Cards load as `card.html?c=<token>` (or the clean
   `/c/<token>/` form in production). The token is a long unguessable id;
   holding the link is what grants access.
3. **The recipient opens it** in any modern browser and the card plays:
   cover, seal, confetti, photo strip, falling emoji.
4. **They can make their own.** After the card settles, an invitation appears
   and drops them straight back into the maker.

Pages in this repo:

| Page | What it is |
|------|------------|
| `index.html` | Landing page and interactive effects showcase |
| `maker.html` | The no-signup card maker (Supabase-backed) |
| `card.html` | The recipient view, loaded as `card.html?c=<token>` |
| `404.html` | Generated at deploy as a copy of `card.html`, so GitHub Pages serves clean `/c/<token>/` links |
| `rachel.html` | The original hand-made card (see below) |

The `shared/` folder holds the ES modules (Supabase data access, analytics,
photo handling, engine bridge); `supabase/migrations/` holds the schema.

## Local development

No build step; everything is static files. Serve the repo locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

To make the maker and card view actually save and load cards:

1. Copy `shared/config.example.js` to `shared/config.js` (it is gitignored)
   and fill in your Supabase project URL and anon key. Both are public client
   keys by design; never put the service_role key there.
2. In your Supabase project, run the SQL files in `supabase/migrations/` in
   order in the SQL Editor, and create a public Storage bucket named
   `card-photos` (directory listing off).

The PostHog values in the config are optional; analytics quietly turns off
when they are left as placeholders.

## Running the smoke test

`tests/ui-smoke.mjs` is a Playwright smoke test of the whole loop: the maker
renders, a card saves, the share link opens, the card plays, and the CTA
routes back into the maker. It starts its own local server and uses the
globally installed Playwright. Run it with a real `shared/config.js` in place:

```bash
node tests/ui-smoke.mjs
```

If `shared/config.js` still has placeholder values, the deep steps are skipped
with a clear message and only the maker render is checked.

## Deployment

`.github/workflows/deploy-pages.yml` deploys to GitHub Pages on push. It
stages only the public files, generates `shared/config.js` at deploy time from
repository Variables, and copies `card.html` to `404.html` so `/c/<token>/`
links resolve.

Set these under Settings, then Secrets and variables, then Actions, under
**Variables** (not Secrets; all four are public client keys):

- `SUPABASE_URL` (required)
- `SUPABASE_ANON_KEY` (required)
- `POSTHOG_KEY` (optional)
- `POSTHOG_HOST` (optional)

The workflow fails on purpose if the Supabase variables are missing, since a
card site without them is silently broken.

## Where it started

`rachel.html` is the original hand-made birthday card that started the whole
project. It stays live, unchanged. Everything else grew out of it.
