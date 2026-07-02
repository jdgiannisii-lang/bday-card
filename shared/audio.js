// shared/audio.js
//
// Sound for the card view, synthesized with the Web Audio API alone: no
// assets, no fetches, nothing that could ever block the open. Two moments
// only: a paper whoosh when the cover swings, and a quiet shimmer that lands
// with the burst. Volumes are deliberately small; the card is the show, the
// sound is the paper.
//
// Everything here is defensive. initAudio() must be called from a user
// gesture (browsers gate AudioContext creation and resume on one), and every
// export swallows its own errors, so a platform with no audio device, a
// blocked autoplay policy, or a hidden tab can never break the card. When the
// context is absent or the document is hidden, each call is a silent no-op.

let ctx = null;

// Can we actually make a sound right now? A closed context, a missing
// context, or a hidden tab all answer no.
function ready() {
  return !!(ctx && ctx.state !== "closed" &&
    typeof document !== "undefined" && !document.hidden);
}

// Create (or resume) the lazily held AudioContext. Call this from inside a
// real user gesture; calling it anywhere else just leaves the context
// suspended, and every play call stays a no-op until a gesture arrives.
export function initAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
  } catch (e) { /* no audio here; the card plays on in silence */ }
}

export function isReady() {
  try { return ready(); } catch (e) { return false; }
}

// The open: a soft paper whoosh. 0.45s of white noise breathed through a
// lowpass that sweeps 400 to 2400 Hz (the cover fanning air as it swings),
// with a barely-there warm thump underneath (the spine settling).
export function playOpen() {
  try {
    if (!ready()) return;
    const t = ctx.currentTime;

    const dur = 0.45;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(400, t);
    lp.frequency.linearRampToValueAtTime(2400, t + dur);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0, t);
    ng.gain.linearRampToValueAtTime(0.12, t + dur * 0.35);
    ng.gain.linearRampToValueAtTime(0, t + dur);
    noise.connect(lp); lp.connect(ng); ng.connect(ctx.destination);
    noise.start(t); noise.stop(t + dur);

    const thump = ctx.createOscillator();
    thump.type = "sine";
    thump.frequency.setValueAtTime(140, t);
    const tg = ctx.createGain();
    tg.gain.setValueAtTime(0.08, t);
    tg.gain.linearRampToValueAtTime(0, t + 0.18);
    thump.connect(tg); tg.connect(ctx.destination);
    thump.start(t); thump.stop(t + 0.18);
  } catch (e) { /* sound must never break the open */ }
}

// The celebration: a quiet shimmer. Six sine pings picked from a small
// pentatonic-ish set, one every ~90ms, each dying away over .9s, all held
// under a master gain so the moment glitters without ringing.
export function playCelebrate() {
  try {
    if (!ready()) return;
    const t = ctx.currentTime;
    const NOTES = [880, 1174.66, 1318.51, 1760];
    const master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    for (let i = 0; i < 6; i++) {
      const start = t + i * 0.09;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(NOTES[(Math.random() * NOTES.length) | 0], start);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.06, start);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.9);
      osc.connect(g); g.connect(master);
      osc.start(start); osc.stop(start + 0.9);
    }
  } catch (e) { /* sound must never break the celebration */ }
}
