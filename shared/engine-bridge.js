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
  congrats: (name) => `Congratulations,\n${name}!`,
  thankYou: (name) => `Thank you,\n${name}.`,
  missYou: (name) => `I miss you,\n${name}.`,
};

const OCCASION_COVER_TITLE = {
  // Two lines each; the engine renders these as a stacked foil title.
  birthday: ["Happy", "Birthday"],
  thinkingOfYou: ["Thinking", "of you"],
  justBecause: ["Just", "because"],
  congrats: ["You", "did it"],
  thankYou: ["Thank", "you"],
  missYou: ["Miss", "you"],
};

function occasionKey(occasion) {
  if (occasion === "birthday") return "birthday";
  if (occasion === "thinkingOfYou") return "thinkingOfYou";
  if (occasion === "congrats") return "congrats";
  if (occasion === "thankYou") return "thankYou";
  if (occasion === "missYou") return "missYou";
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

// Anyone with the public anon key can insert a cards row, so nothing in it is
// trusted. Photo URLs must come from our own storage: an arbitrary src would let
// an attacker-inserted row show any external image (or leak the recipient's IP)
// under our domain. Callers pass the allowed prefixes (derived from SUPABASE_URL);
// with no prefixes we allow only same-origin relative paths.
function safePhotoUrl(url, prefixes) {
  if (typeof url !== "string" || !url) return null;
  if (Array.isArray(prefixes) && prefixes.length) {
    for (const p of prefixes) {
      if (p && url.indexOf(p) === 0) return url;
    }
    return null;
  }
  // No allowlist provided: reject absolute/protocol URLs, keep relative paths.
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.indexOf("//") === 0) return null;
  return url;
}

// The falling set must actually be emoji. Without this, "emojis" can be any
// string (a slur, a link) rained onto the recipient's screen via fillText.
const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|\u200d|\ufe0f)+$/u;
function safeEmojis(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((e) => typeof e === "string" && e.length > 0 && e.length <= 16 && EMOJI_ONLY.test(e))
    .slice(0, 8);
}

export function applyCardToEngine(row, opts) {
  if (!row) return;
  const doc = document;
  const occ = occasionKey(row.occasion);
  const content = row.content || {};
  const name = content.recipientName || "";
  const photoPrefixes = (opts && opts.photoPrefixes) || [];

  // Greeting: occasion plus recipient name (D-04). Built from newline lines so
  // no innerHTML touches user input.
  const greetingEl = doc.querySelector(".greeting");
  const greetingText = (OCCASION_GREETING[occ] || OCCASION_GREETING.justBecause)(name);
  setLines(greetingEl, greetingText.split("\n"));

  // Photos. 2 or more -> a photo-booth strip that rolls out on open; exactly 1 ->
  // the existing single tilted polaroid; 0 -> neither shows. content.photos (the
  // URL array) is preferred; row.photo_url is the back-compat single-photo path.
  const photos = (Array.isArray(content.photos) ? content.photos : [])
    .map((u) => safePhotoUrl(u, photoPrefixes))
    .filter(Boolean);
  const single = photos.length ? photos[0] : safePhotoUrl(row.photo_url, photoPrefixes);
  const polaroidEl = doc.querySelector(".polaroid");
  const stripEl = doc.querySelector("#photostrip");

  if (photos.length >= 2 && stripEl) {
    // Build the strip: one white-framed cell per photo, in order. Every src has
    // passed safePhotoUrl (set via setAttribute, no innerHTML on any value).
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
    // Single (or zero) photo: the existing polaroid path. The polaroid ships
    // hidden in the markup (a card opened before the fetch resolves must not
    // show an empty frame with a broken image); reveal it only with a real src.
    const picEl = doc.querySelector(".polaroid .pic");
    if (picEl) {
      if (single) picEl.setAttribute("src", single);
      picEl.setAttribute("alt", name ? `Photo for ${name}` : "Card photo");
    }
    if (polaroidEl) polaroidEl.style.display = single ? "" : "none";
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

  // Birthday medallion: shows the recipient's age in the gold ring, and only
  // when the sender gave one (content.age). It used to show unconditionally on
  // birthdays with the template's hardcoded "18", which put a stranger's age
  // on every card. Age is untrusted row data: accept only integers 1 to 120.
  const milestoneEl = doc.querySelector(".milestone");
  if (milestoneEl) {
    const age = Number.isInteger(content.age) && content.age >= 1 && content.age <= 120
      ? content.age
      : null;
    const span = milestoneEl.querySelector("span");
    if (span) span.textContent = age === null ? "" : String(age);
    milestoneEl.style.display = occ === "birthday" && age !== null ? "" : "none";
  }

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

  // Theme: retint the CSS custom properties and the canvas particle palettes.
  // The engine defines window.__applyTheme synchronously in its IIFE (before
  // this module can ever run), so the guard only covers Node structural
  // imports. The row is untrusted: anything off the allowlist plays as cream.
  const ALLOWED_THEMES = ["cream", "sage", "dusk", "sky"];
  const theme = ALLOWED_THEMES.indexOf(content.theme) !== -1 ? content.theme : "cream";
  try {
    if (typeof window !== "undefined") {
      window.CARD_THEME = theme;
      if (window.__applyTheme) window.__applyTheme(theme);
    }
  } catch (e) {
    // No window under Node structural import: nothing to set.
  }

  // Falling emojis: the sender's chosen set (content.emojis), else the engine
  // default. Validated to real emoji first (safeEmojis): the row is untrusted.
  // window.__applyEmojis swaps the set and preloads the Apple images.
  try {
    const emojis = safeEmojis(content.emojis);
    if (typeof window !== "undefined") {
      window.CARD_EMOJIS = emojis;
      if (emojis.length && window.__applyEmojis) window.__applyEmojis(emojis);
    }
  } catch (e) {
    // No window under Node structural import: nothing to set.
  }
}
