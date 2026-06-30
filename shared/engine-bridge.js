// shared/engine-bridge.js
//
// The data to engine bridge. applyCardToEngine(row) takes a cards row and fills
// the existing engine DOM slots that card.html (and 404.html) host. It is pure
// DOM fill: no network, no new effect code. It only selects among the engine's
// existing hand coded effect variants (D-04) by setting window.CARD_EFFECT,
// which the hosted engine reads to bias its CONFIG.
//
// All user text is set with textContent / createElement, never innerHTML, to
// prevent stored XSS (research V5, threat T-01-01).

const OCCASION_GREETING = {
  birthday: (name) => `Happy Birthday,\n${name}!`,
  thinkingOfYou: (name) => `Thinking of you,\n${name}.`,
  justBecause: (name) => `Hi ${name},\njust because.`,
};

const OCCASION_COVER_TITLE = {
  // Two lines each; the engine renders these as a stacked foil title.
  birthday: ["Happy", "Birthday"],
  thinkingOfYou: ["Thinking", "of you"],
  justBecause: ["Just", "because"],
};

function occasionKey(occasion) {
  if (occasion === "birthday") return "birthday";
  if (occasion === "thinkingOfYou") return "thinkingOfYou";
  return "justBecause";
}

// Set a multi line value (newline separated) on an element as text plus <br>,
// without using innerHTML on user content. We create text nodes and <br> nodes.
function setLines(el, lines) {
  if (!el) return;
  while (el.firstChild) el.removeChild(el.firstChild);
  lines.forEach((line, i) => {
    if (i > 0) el.appendChild(document.createElement("br"));
    el.appendChild(document.createTextNode(line));
  });
}

export function applyCardToEngine(row) {
  if (!row) return;
  const doc = document;
  const occ = occasionKey(row.occasion);
  const content = row.content || {};
  const name = content.recipientName || "";

  // Greeting: occasion plus recipient name (D-04). Built from newline lines so
  // no innerHTML touches user input.
  const greetingEl = doc.querySelector(".greeting");
  const greetingText = (OCCASION_GREETING[occ] || OCCASION_GREETING.justBecause)(name);
  setLines(greetingEl, greetingText.split("\n"));

  // Photos. 2 or more -> a photo-booth strip that rolls out on open; exactly 1 ->
  // the existing single tilted polaroid; 0 -> neither shows. content.photos (the
  // URL array) is preferred; row.photo_url is the back-compat single-photo path.
  const photos = Array.isArray(content.photos) ? content.photos.filter(Boolean) : [];
  const single = photos.length ? photos[0] : (row.photo_url || null);
  const polaroidEl = doc.querySelector(".polaroid");
  const stripEl = doc.querySelector("#photostrip");

  if (photos.length >= 2 && stripEl) {
    // Build the strip: one white-framed cell per photo, in order. src is one of
    // our own storage URLs (set via setAttribute, no innerHTML on any value).
    if (polaroidEl) polaroidEl.style.display = "none";
    while (stripEl.firstChild) stripEl.removeChild(stripEl.firstChild);
    photos.forEach((url, i) => {
      const cell = doc.createElement("div");
      cell.className = "strip-cell";
      const img = doc.createElement("img");
      img.setAttribute("src", url);
      img.setAttribute("alt", name ? `Photo ${i + 1} for ${name}` : `Photo ${i + 1}`);
      img.setAttribute("loading", "eager");
      cell.appendChild(img);
      stripEl.appendChild(cell);
    });
    const reveal = doc.querySelector("#photostripReveal");
    if (reveal) reveal.setAttribute("aria-hidden", "false");
    // If the recipient flipped the card open before this row arrived, roll the
    // strip out now; otherwise openCard() triggers it on open.
    try {
      if (doc.querySelector(".card.opened") && typeof window !== "undefined" && window.__openStrip) {
        window.__openStrip();
      }
    } catch (e) {}
  } else {
    // Single (or zero) photo: the existing polaroid path.
    const picEl = doc.querySelector(".polaroid .pic");
    if (picEl) {
      if (single) picEl.setAttribute("src", single);
      picEl.setAttribute("alt", name ? `Photo for ${name}` : "Card photo");
    }
    if (polaroidEl && !single) polaroidEl.style.display = "none";
  }

  const capEl = doc.querySelector(".polaroid .cap");
  if (capEl) capEl.textContent = content.caption || "";

  // Message: one <p> per paragraph via createElement + textContent.
  const noteEl = doc.querySelector(".note");
  if (noteEl) {
    while (noteEl.firstChild) noteEl.removeChild(noteEl.firstChild);
    const paras = Array.isArray(content.message)
      ? content.message
      : String(content.message || "")
          .split(/\n\s*\n/)
          .map((s) => s.trim())
          .filter(Boolean);
    paras.forEach((p) => {
      const node = doc.createElement("p");
      node.textContent = p;
      noteEl.appendChild(node);
    });
  }

  // Signoff: plain text (may carry an explicit newline before a name).
  const signoffEl = doc.querySelector(".signoff");
  if (signoffEl) setLines(signoffEl, String(content.signoff || "").split("\n"));

  // Cover title: swaps per occasion (D-04, same template).
  const coverEl = doc.querySelector(".cover-title");
  if (coverEl) setLines(coverEl, OCCASION_COVER_TITLE[occ] || OCCASION_COVER_TITLE.justBecause);

  // Birthday medallion: visible only for the birthday occasion (D-04).
  const milestoneEl = doc.querySelector(".milestone");
  if (milestoneEl) milestoneEl.style.display = occ === "birthday" ? "" : "none";

  // Effect: select among the engine's hand coded canvas variants only. The hosted
  // engine reads window.CARD_EFFECT to bias its CONFIG; the bridge never paints,
  // it only picks a name (D-04: hand coded canvas effects, no premade video).
  // Allowed values: hearts, confetti, petals, sparkles, balloons.
  const ALLOWED_EFFECTS = ["hearts", "confetti", "petals", "sparkles", "balloons"];
  const effect = ALLOWED_EFFECTS.indexOf(row.effect) !== -1 ? row.effect : "hearts";
  try {
    window.CARD_EFFECT = effect;
  } catch (e) {
    // No window (e.g. structural import under Node): nothing to set.
  }
}
