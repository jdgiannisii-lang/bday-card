# 💖 Digital Birthday Card

A polished, 3D animated birthday card in a single HTML file. It starts as a
closed card with a beating heart, then **flips open on a click/tap** with an
explosion of hearts and pink glitter that reveals your message.

- ✨ Smooth GPU-accelerated 3D animation (targets 60fps)
- 💕 Hearts, bright colors, glitter & confetti on a `<canvas>`
- 📱 Works on phone (tap) and desktop (click), fully responsive
- ♻️ Respects `prefers-reduced-motion`
- 📦 No build step, no dependencies — just one `index.html`

## How to view it

Open `index.html` in any browser. Or, to serve it locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## How to personalize it

Everything is inside `index.html`. Search for these clearly-marked spots:

| What | Find this marker |
|------|------------------|
| Her name (on the cover) | `<!-- ✏️ HER NAME -->` |
| Photo inside the card   | `<!-- ✏️ PHOTO -->` |
| The birthday message    | `<!-- ✏️ MESSAGE GOES HERE -->` |

- **Name:** the cover shows a placeholder (`Beautiful`). Change that line, and
  optionally the heading inside the card.
- **Photo:** replace the `src` on the `<img>` with your own image — either a
  file next to `index.html` (e.g. `src="us.jpg"`) or any image URL. Square
  images look best.
- **Message:** replace the placeholder `<p>...</p>` paragraphs. Add or remove
  paragraphs freely.

Optional fine-tuning lives in the `CONFIG` block at the top of the `<script>`
(number of hearts/glitter in the burst, ambient floating hearts).

## How to share it

Send the file directly, or host it for a shareable link:

- **GitHub Pages:** push this repo and enable Pages.
- **Netlify / Vercel:** drag-and-drop the folder, or connect the repo.

Then send her the link. 💝
