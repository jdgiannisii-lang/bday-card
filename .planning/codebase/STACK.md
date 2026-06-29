# Technology Stack

**Analysis Date:** 2026-06-29

## Languages

**Primary:**
- HTML5 - Full application markup and structure (`index.html`)
- CSS3 - Styling, animations, 3D transforms, media queries (`index.html`)
- JavaScript (ES5+) - Interactive behaviors, canvas animation engine, particle physics (`index.html`)

## Runtime

**Environment:**
- Browser (all modern browsers: Chrome, Safari, Firefox, Edge)
- No server-side runtime required

**Package Manager:**
- None — zero external dependencies

## Frameworks

**Core:**
- Vanilla HTML/CSS/JavaScript (no framework)

**Rendering:**
- Browser DOM API for 3D transforms (CSS `preserve-3d`, `transform-style`, perspective)
- HTML5 Canvas API for particle effects and emoji-ball physics

**Animation:**
- CSS3 Keyframes (`@keyframes`)
- requestAnimationFrame for 60fps canvas rendering
- GPU-accelerated transforms (3D perspective, rotations)

**Build/Dev:**
- None — single-file deployment, no build step required

## Key Dependencies

**External Libraries:**
- None (intentionally zero-dependency)

**Fonts (CDN):**
- Google Fonts API
  - Caveat (cursive, handwriting style) — weights 500-700
  - Cormorant Garamond (serif, elegant display) — weights 500-600, italic variants
  - Outfit (sans-serif, UI) — weights 400-500
  - Preconnect: `https://fonts.googleapis.com`, `https://fonts.gstatic.com`

**Browser APIs:**
- HTML5 Canvas 2D Context (`ctx.getContext("2d")`)
- Media Queries (`prefers-reduced-motion`)
- Document visibility API (`document.hidden`)
- requestAnimationFrame for animation loop
- Touch/Click events

## Configuration

**Environment:**
- No environment variables required
- No config files needed
- Client-side only, no secrets or credentials

**Build:**
- None — file is served as-is
- Single `index.html` contains all HTML, CSS (inline `<style>`), and JS (inline `<script>`)
- Static assets: `photo.jpg` (couple's photo, ~353K)

## Platform Requirements

**Development:**
- Text editor (any)
- Python 3.x for local HTTP server (optional): `python3 -m http.server 8000`
- Node.js (optional) for validation script only (see HANDOFF.md)

**Production:**
- Static file hosting only (GitHub Pages, Netlify, Vercel, or any CDN)
- No server, database, or build pipeline required
- HTTPS recommended (GitHub Pages provides this by default)

**Browser Support:**
- Modern browsers with CSS 3D Transforms support (Chrome, Safari, Firefox, Edge — all recent versions)
- Graceful degradation: reduced-motion media query respects accessibility preferences
- Responsive: works on desktop, tablet, mobile (iPhone portrait priority per design)

---

*Stack analysis: 2026-06-29*
